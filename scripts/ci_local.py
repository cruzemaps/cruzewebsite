#!/usr/bin/env python3
"""Run this repo's GitHub Actions pull request checks on this Mac.

Start it with scripts/ci-local.sh, which builds the tools venv (PyYAML and
shellcheck 0.9.0) and passes the repo settings in CI_LOCAL_CONFIG_JSON.
The same file lives in CruzePlatform and cruzewebsite. Keep them identical
and put repo differences in each repo's scripts/ci-local.sh.

What it does:
- Checks the ref out into a temporary git worktree in a scratch folder and
  deletes both at the end, also on failure or Ctrl-C.
- Reads .github/workflows/*.yml from that ref, so a PR that edits a
  workflow is tested with its own edits.
- Works out which workflows a pull request into main would start (branch
  and path filters), expands matrices, evaluates `if:` conditions and runs
  every `run:` step with bash, the way the Actions runner does.
- Maps `uses:` steps to local equivalents: setup-python makes a venv from
  Homebrew python3.12, setup-node and flutter-action use versions kept in
  the cache, gitleaks-action runs the same gitleaks version, and
  lighthouse-ci-action runs lhci collect and assert with the local Chrome.
  Steps that only upload to GitHub are skipped with a reason. An action
  with no mapping fails its job, so nothing is dropped silently.
- `services: postgres` becomes a throwaway container bound to 127.0.0.1 on
  a random port. psql runs inside that container. Only containers this
  run started are removed.
- Every step runs with a clean environment (nothing from your shell, so no
  real keys) and a fresh HOME per job, at lower CPU priority, under a macOS sandbox profile that
  blocks connections to anything already listening on this Mac (the
  production services) and blocks writes to the repo checkout and other
  protected folders.
"""

import argparse
import datetime as dt
import glob
import hashlib
import itertools
import json
import os
import platform
import random
import re
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
from collections import deque

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("PyYAML is missing. Run scripts/ci-local.sh, not this file directly.")

HOME = os.path.expanduser("~")
ARCH = "arm64" if platform.machine() == "arm64" else "x64"
CHROME_DEFAULT = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_PATH = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"]
ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


class Interrupted(Exception):
    pass


def die(msg, code=2):
    print(f"ci-local: {msg}", file=sys.stderr, flush=True)
    sys.exit(code)


def run(cmd, cwd=None, check=True, env=None, input=None):
    p = subprocess.run(cmd, cwd=cwd, env=env, input=input, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and p.returncode != 0:
        raise RuntimeError(f"command failed ({p.returncode}): {' '.join(cmd)}\n{p.stderr.strip()}")
    return p.stdout.strip()


def fmt_secs(s):
    s = int(round(s))
    if s < 60:
        return f"{s}s"
    if s < 3600:
        return f"{s // 60}m {s % 60:02d}s"
    return f"{s // 3600}h {(s % 3600) // 60:02d}m"


def slug(text):
    return re.sub(r"[^A-Za-z0-9]+", "-", text).strip("-").lower()[:60] or "job"


def sbpl_str(path):
    return '"' + path.replace("\\", "\\\\").replace('"', '\\"') + '"'


# --------------------------------------------------------------------------
# GitHub expressions: enough of the language for if:, ${{ }} and format().
# --------------------------------------------------------------------------

TOKEN_RE = re.compile(r"""\s*(?:
    (?P<str>'(?:[^']|'')*')|
    (?P<num>\d+(?:\.\d+)?)|
    (?P<op>==|!=|<=|>=|&&|\|\||[<>!(),\[\]])|
    (?P<id>[A-Za-z_][A-Za-z0-9_-]*(?:\.(?:[A-Za-z_][A-Za-z0-9_-]*|\*))*)
)""", re.X)


class Expr:
    """Evaluates GitHub expressions against a context dict.

    secrets.* and vars.* evaluate to '' (CI has them, this Mac does not) and
    every name read is recorded so the summary can say what was missing.
    """

    def __init__(self, ctx, status=lambda: "success"):
        self.ctx = ctx
        self.status = status
        self.secrets_used = set()
        self.vars_used = set()

    def _get(self, path):
        parts = path.split(".")
        if parts[0] == "secrets":
            if len(parts) > 1 and parts[1] != "GITHUB_TOKEN":
                self.secrets_used.add(parts[1])
            return ""
        if parts[0] == "vars":
            if len(parts) > 1:
                self.vars_used.add(parts[1])
            return ""
        cur = self.ctx
        for p in parts:
            if isinstance(cur, dict):
                cur = cur.get(p)
            else:
                return None
        return cur

    def evaluate(self, text):
        text = str(text).strip()
        m = re.fullmatch(r"\$\{\{(.*)\}\}", text, re.S)
        if m:
            text = m.group(1)
        tokens, pos = [], 0
        while pos < len(text):
            if not text[pos:].strip():
                break
            m = TOKEN_RE.match(text, pos)
            if not m or m.end() == pos:
                raise ValueError(f"cannot parse expression: {text!r}")
            pos = m.end()
            tokens.append((m.lastgroup, m.group(m.lastgroup)))
        out = []
        for i, (kind, val) in enumerate(tokens):
            nxt = tokens[i + 1] if i + 1 < len(tokens) else None
            if kind == "str":
                out.append(repr(val[1:-1].replace("''", "'")))
            elif kind == "num":
                out.append(val)
            elif kind == "op":
                out.append({"&&": " and ", "||": " or ", "!": " not "}.get(val, val))
            else:
                low = val.lower()
                if nxt == ("op", "("):
                    out.append("_fn_" + low)
                elif low == "true":
                    out.append("True")
                elif low == "false":
                    out.append("False")
                elif low == "null":
                    out.append("None")
                else:
                    out.append(f"_get({val!r})")
        st = self.status

        def fmt(f, *a):
            return re.sub(r"\{(\d+)\}", lambda mm: to_str(a[int(mm.group(1))]), f)

        ns = {
            "_get": self._get,
            "_fn_success": lambda: st() == "success",
            "_fn_failure": lambda: st() == "failure",
            "_fn_always": lambda: True,
            "_fn_cancelled": lambda: False,
            "_fn_contains": lambda a, b: (str(b).lower() in str(a).lower()) if not isinstance(a, list) else (b in a),
            "_fn_startswith": lambda a, b: str(a).lower().startswith(str(b).lower()),
            "_fn_endswith": lambda a, b: str(a).lower().endswith(str(b).lower()),
            "_fn_format": fmt,
            "_fn_join": lambda a, sep=",": sep.join(map(str, a)) if isinstance(a, list) else str(a),
            "_fn_tojson": lambda a: json.dumps(a),
            "_fn_fromjson": lambda a: json.loads(a),
            "_fn_hashfiles": lambda *a: "",
        }
        return eval("".join(out), {"__builtins__": {}}, ns)  # noqa: S307 (own tokenizer, no builtins)

    def interp(self, value):
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        return re.sub(r"\$\{\{(.*?)\}\}", lambda m: to_str(self.evaluate(m.group(1))), value, flags=re.S)


def to_str(v):
    if v is None:
        return ""
    if v is True:
        return "true"
    if v is False:
        return "false"
    if isinstance(v, (dict, list)):
        return json.dumps(v)
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def truthy(v):
    return bool(v) and v != "false"


# --------------------------------------------------------------------------
# Workflow triggers: pull_request branch and path filters.
# --------------------------------------------------------------------------

def glob_re(pattern):
    out, i = "", 0
    while i < len(pattern):
        if pattern.startswith("**/", i):
            out += "(?:.*/)?"
            i += 3
        elif pattern.startswith("**", i):
            out += ".*"
            i += 2
        elif pattern[i] == "*":
            out += "[^/]*"
            i += 1
        elif pattern[i] == "?":
            out += "[^/]"
            i += 1
        else:
            out += re.escape(pattern[i])
            i += 1
    return re.compile("^" + out + "$")


def filter_match(value, patterns):
    """GitHub filter semantics: the last matching pattern decides; ! negates."""
    hit = False
    for p in patterns:
        p = str(p)
        neg = p.startswith("!")
        if glob_re(p[1:] if neg else p).match(value):
            hit = not neg
    return hit


def triggers(wf):
    on = wf.get("on", wf.get(True))
    if isinstance(on, str):
        return {on: {}}
    if isinstance(on, list):
        return {k: {} for k in on}
    return {k: (v or {}) for k, v in (on or {}).items()}


# --------------------------------------------------------------------------
# The run.
# --------------------------------------------------------------------------

class Job:
    def __init__(self, wf_file, wf_name, job_id, job, matrix, display):
        self.wf_file, self.wf_name, self.job_id, self.job = wf_file, wf_name, job_id, job
        self.matrix, self.display = matrix, display
        self.result, self.reason, self.duration = None, "", 0.0
        self.notes, self.steps, self.tail = [], [], deque(maxlen=40)
        self.failed_step = None
        self.log = None

    @property
    def title(self):
        return f"{self.wf_name} / {self.display}"

    def note(self, text):
        if text and text not in self.notes:
            self.notes.append(text)


NOTE_PATTERNS = [
    (re.compile(r"^=+ (.*\d+ (?:passed|failed|error).* in [\d.]+s.*?) =+$"), "pytest: {0}"),
    (re.compile(r"^(\d+ (?:passed|failed)(?:, \d+ \w+)* in [\d.]+s.*)$"), "pytest: {0}"),
    (re.compile(r"^Found (\d+) errors?\.?"), "ruff: {0} findings"),
    (re.compile(r"\+(\d+)(?: ~(\d+))?(?: -(\d+))?: (All tests passed!|Some tests failed\.)"), "flutter test: {0} passed, {3}"),
    (re.compile(r"^(\d+ issues? found\..*|No issues found!.*)$"), "flutter analyze: {0}"),
    (re.compile(r"^\s*Tests\s+(\d+ (?:passed|failed).*)$"), "vitest: {0}"),
    (re.compile(r"^(?:ok|FAILED) \| (\d+ passed.*)$"), "deno test: {0}"),
    (re.compile(r"^✖ (\d+ problems?.*)$"), "eslint: {0}"),
    (re.compile(r"(\d+ commits? scanned)"), "gitleaks: {0}"),
    (re.compile(r"(leaks found: \d+)"), "gitleaks: {0}"),
    (re.compile(r"(mAP50=[\d.]+, required>=[\d.]+)"), "eval: {0}"),
    (re.compile(r"(Checking assertions against .*)$"), "lighthouse: {0}"),
    (re.compile(r"^([A-Za-z0-9_]+: all checks passed)"), "sql: {0}"),
    (re.compile(r"^::warning::(.*)$"), "warning: {0}"),
    (re.compile(r"^::error::(.*)$"), "error: {0}"),
]


class Runner:
    def __init__(self, args, cfg):
        self.args, self.cfg = args, cfg
        self.repo = cfg["repo"]
        self.base_branch = cfg.get("base_branch", "main")
        self.cache = os.path.realpath(os.environ.get("CI_LOCAL_CACHE") or os.path.join(HOME, ".cache", "cruze-ci-local"))
        self.tmp_parent = os.path.realpath(os.environ.get("CI_LOCAL_TMPDIR") or os.environ.get("TMPDIR") or "/tmp")
        self.python312 = os.environ.get("CI_LOCAL_PYTHON") or cfg.get("python312") or "/opt/homebrew/bin/python3.12"
        self.tools_bin = os.path.dirname(sys.executable)
        self.containers = []
        self.scratch = None
        self.wt = None
        self.jobs = []
        self.versions = {}
        self.global_notes = []
        self.env_diffs = []
        here = os.path.dirname(os.path.realpath(__file__))
        self.repo_root = run(["git", "rev-parse", "--show-toplevel"], cwd=here)
        self.common_dir = os.path.realpath(os.path.join(self.repo_root, run(["git", "rev-parse", "--git-common-dir"], cwd=self.repo_root)))
        os.makedirs(self.cache, exist_ok=True)

    # ---------------------------------------------------------------- git
    def git(self, *a, check=True):
        return run(["git", *a], cwd=self.repo_root, check=check)

    def resolve(self):
        a = self.args
        try:
            self.git("fetch", "--quiet", "origin", f"+refs/heads/{self.base_branch}:refs/remotes/origin/{self.base_branch}")
        except RuntimeError as e:
            self.global_notes.append(f"Could not fetch origin ({e.args[0].splitlines()[0]}). Used the local copy of origin/{self.base_branch}.")
        self.pr_info = None
        pr = a.pr or (a.comment if not a.ref else None)
        if pr:
            info = json.loads(run(["gh", "pr", "view", str(pr), "--repo", self.repo, "--json",
                                   "number,headRefOid,headRefName,baseRefName,state,title"]))
            self.pr_info = info
            self.base_branch = info["baseRefName"] or self.base_branch
            self.git("fetch", "--quiet", "origin", f"pull/{pr}/head")
            self.git("cat-file", "-e", info["headRefOid"] + "^{commit}")
            self.ref_label = f"PR #{pr} head ({info['headRefName']})"
            self.sha = info["headRefOid"]
        else:
            ref = a.ref or "HEAD"
            self.sha = self.git("rev-parse", "--verify", ref + "^{commit}")
            self.ref_label = ref
        if a.comment:
            info = self.pr_info if (self.pr_info and int(self.pr_info["number"]) == int(a.comment)) else json.loads(
                run(["gh", "pr", "view", str(a.comment), "--repo", self.repo, "--json", "number,headRefOid,state"]))
            if info["headRefOid"] != self.sha:
                die(f"--comment {a.comment}: PR head is {info['headRefOid'][:10]} but this run tests {self.sha[:10]}. "
                    "Refusing, because the comment would record CI for the wrong commit.")
        self.base_sha = self.git("rev-parse", f"origin/{self.base_branch}")
        on_base = subprocess.run(["git", "merge-base", "--is-ancestor", self.sha, self.base_sha], cwd=self.repo_root).returncode == 0
        if on_base:
            self.mode = "main"
            self.merge_base = self.sha
            self.changed = None
        else:
            self.mode = "pr"
            self.merge_base = self.git("merge-base", self.base_sha, self.sha)
            self.changed = [x for x in self.git("diff", "--name-only", self.merge_base, self.sha).splitlines() if x]
        self.ignore_paths = a.all or self.mode == "main"

    def make_worktree(self):
        os.makedirs(self.tmp_parent, exist_ok=True)
        self.scratch = os.path.realpath(tempfile.mkdtemp(prefix="ci-local-", dir=self.tmp_parent))
        self.wt = os.path.join(self.scratch, "src")
        self.git("worktree", "add", "--quiet", "--detach", self.wt, self.sha)
        gitfile = open(os.path.join(self.wt, ".git")).read().strip()
        self.wt_admin = os.path.realpath(os.path.join(self.wt, gitfile.split(":", 1)[1].strip()))
        shims = os.path.join(self.scratch, "shims")
        os.makedirs(shims)
        for name in ("python3", "python"):
            os.symlink(self.python312, os.path.join(shims, name))
        sc = os.path.join(self.tools_bin, "shellcheck")
        if os.path.exists(sc):
            os.symlink(sc, os.path.join(shims, "shellcheck"))
        self.shims = shims

    def cleanup(self):
        for c in self.containers:
            subprocess.run(["docker", "rm", "-f", c], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.containers = []
        if self.scratch and not self.args.keep:
            if self.wt and os.path.isdir(self.wt):
                subprocess.run(["git", "worktree", "remove", "--force", self.wt], cwd=self.repo_root,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            shutil.rmtree(self.scratch, ignore_errors=True)
            self.scratch = None

    # ------------------------------------------------------------ planning
    def plan(self):
        wf_dir = os.path.join(self.wt, ".github", "workflows")
        files = sorted(f for f in os.listdir(wf_dir) if f.endswith((".yml", ".yaml"))) if os.path.isdir(wf_dir) else []
        skip_notes = self.cfg.get("workflow_notes", {})
        for f in files:
            with open(os.path.join(wf_dir, f)) as fh:
                wf = yaml.safe_load(fh) or {}
            wf_name = wf.get("name", f)
            trig = triggers(wf)
            skip = None
            pr = trig.get("pull_request")
            if "pull_request" not in trig:
                skip = "not a pull request workflow (triggers: " + ", ".join(map(str, trig)) + ")"
            else:
                pr = pr or {}
                if "branches" in pr and not filter_match(self.base_branch, pr["branches"]):
                    skip = f"pull_request branch filter does not include {self.base_branch}"
                elif "branches-ignore" in pr and filter_match(self.base_branch, pr["branches-ignore"]):
                    skip = f"pull_request branches-ignore covers {self.base_branch}"
                elif not self.ignore_paths and "paths" in pr:
                    if not any(filter_match(p, pr["paths"]) for p in self.changed):
                        skip = "path filter: nothing changed under " + ", ".join(map(str, pr["paths"]))
                elif not self.ignore_paths and "paths-ignore" in pr:
                    if all(filter_match(p, pr["paths-ignore"]) for p in self.changed):
                        skip = "paths-ignore: every changed file is ignored"
            if skip and f in skip_notes:
                skip += ". " + skip_notes[f]
            for job_id, job in (wf.get("jobs") or {}).items():
                for matrix in self.expand_matrix(((job or {}).get("strategy") or {}).get("matrix")):
                    ex = Expr(self.base_ctx(wf_name, matrix))
                    raw = job.get("name", job_id)
                    display = to_str(ex.interp(raw))
                    if matrix and "${{" not in str(raw):
                        display += " (" + ", ".join(to_str(v) for v in matrix.values()) + ")"
                    j = Job(f, wf_name, job_id, job or {}, matrix, display)
                    j.wf = wf
                    if skip:
                        j.result, j.reason = "SKIPPED", skip
                    self.jobs.append(j)
        if self.args.only:
            pats = [p.strip().lower() for p in self.args.only.split(",") if p.strip()]
            for j in self.jobs:
                hay = f"{j.wf_file} {j.title} {j.job_id}".lower()
                if j.result is None and not any(p in hay for p in pats):
                    j.result, j.reason = "SKIPPED", "not selected with --only"

    @staticmethod
    def expand_matrix(m):
        if not m or not isinstance(m, dict):
            return [{}]
        keys = [k for k in m if k not in ("include", "exclude")]
        combos = [dict(zip(keys, vals)) for vals in itertools.product(*[m[k] for k in keys])] if keys else []
        for ex in m.get("exclude") or []:
            combos = [c for c in combos if not all(c.get(k) == v for k, v in ex.items())]
        for inc in m.get("include") or []:
            hit = False
            for c in combos:
                if all(c.get(k) == v for k, v in inc.items() if k in keys):
                    c.update({k: v for k, v in inc.items() if k not in keys})
                    hit = True
            if not hit:
                combos.append(dict(inc))
        return combos or [{}]

    def base_ctx(self, wf_name, matrix, env=None, steps=None, needs=None):
        number = int(self.pr_info["number"]) if self.pr_info else 0
        return {
            "github": {
                "event_name": "pull_request",
                "event": {"schedule": "", "pull_request": {"number": number, "head": {"sha": self.sha}, "base": {"ref": self.base_branch}}},
                "ref": f"refs/pull/{number}/merge" if number else f"refs/heads/{self.base_branch}",
                "sha": self.sha, "repository": self.repo, "repository_owner": self.repo.split("/")[0],
                "server_url": "https://github.com", "run_id": "local", "run_number": "0", "workflow": wf_name,
                "workspace": self.wt, "base_ref": self.base_branch, "head_ref": "", "actor": os.environ.get("USER", ""),
                "token": "",
            },
            "runner": {"os": "macOS", "arch": "ARM64" if ARCH == "arm64" else "X64", "temp": "", "name": "this Mac"},
            "matrix": matrix or {}, "env": env or {}, "steps": steps or {}, "needs": needs or {},
            "inputs": {}, "strategy": {}, "job": {},
        }

    # ---------------------------------------------------------- sandboxing
    def listening_ports(self):
        """TCP ports listening on this Mac right now, plus the configured ones.

        lsof sees every listener this user owns, which covers the Colima port
        forwards for the production containers. netstat adds other users'
        listeners when it prints anything (on some macOS versions it prints
        nothing to a pipe).
        """
        ports = {int(p) for p in self.cfg.get("protect_ports", [])}
        out = subprocess.run(["lsof", "-nP", "-iTCP", "-sTCP:LISTEN", "-Fn"], text=True,
                             stdout=subprocess.PIPE, stderr=subprocess.DEVNULL).stdout
        for line in out.splitlines():
            if line.startswith("n"):
                p = line.rsplit(":", 1)[-1]
                if p.isdigit():
                    ports.add(int(p))
        out = subprocess.run(["netstat", "-an", "-p", "tcp"], text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL).stdout
        for line in out.splitlines():
            cols = line.split()
            if len(cols) >= 6 and cols[-1] == "LISTEN" and "." in cols[3]:
                p = cols[3].rsplit(".", 1)[1]
                if p.isdigit():
                    ports.add(int(p))
        return ports

    def write_profile(self, path, allow_docker, own_ports):
        lines = ["(version 1)", "(allow default)",
                 ";; Nothing that was already listening on this Mac (production services) is reachable."]
        ports = self.listening_ports() - set(own_ports)
        if not ports:
            raise RuntimeError("found no listening ports to block; refusing to run steps without the port guard")
        for p in sorted(ports):
            lines.append(f'(deny network-outbound (remote ip "localhost:{p}"))')
        if not allow_docker:
            socks = glob.glob(os.path.join(HOME, ".colima", "*", "docker.sock")) + glob.glob(os.path.join(HOME, ".docker", "run", "docker.sock"))
            socks += [s for s in ("/var/run/docker.sock",) if os.path.exists(s)]
            for s in socks:
                lines.append(f"(deny network-outbound (remote unix-socket (path-literal {sbpl_str(os.path.realpath(s))})))")
        protect = [self.repo_root, self.common_dir] + [os.path.expanduser(p) for p in self.cfg.get("protect_paths", [])]
        protect = sorted({os.path.realpath(p) for p in protect})
        lines.append("(deny file-write* " + " ".join(f"(subpath {sbpl_str(p)})" for p in protect) + ")")
        allow = sorted({self.scratch, self.cache, self.out_dir, self.wt_admin})
        lines.append("(allow file-write* " + " ".join(f"(subpath {sbpl_str(p)})" for p in allow) + ")")
        with open(path, "w") as fh:
            fh.write("\n".join(lines) + "\n")

    # --------------------------------------------------------------- tools
    def fetch(self, url, dest):
        tmp = dest + ".part"
        r = subprocess.run(["curl", "-fsSL", "--retry", "2", "-o", tmp, url])
        if r.returncode != 0:
            raise RuntimeError(f"download failed: {url}")
        os.replace(tmp, dest)

    @staticmethod
    def sha256(path):
        h = hashlib.sha256()
        with open(path, "rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                h.update(chunk)
        return h.hexdigest()

    def cached_json(self, url, name, max_age=6 * 3600):
        path = os.path.join(self.cache, "meta", name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if not os.path.exists(path) or time.time() - os.path.getmtime(path) > max_age:
            try:
                self.fetch(url, path)
            except RuntimeError:
                if not os.path.exists(path):
                    raise
        with open(path) as fh:
            return json.load(fh)

    def ensure_node(self, spec):
        spec = str(spec).strip().lstrip("v").replace(".x", "")
        index = self.cached_json("https://nodejs.org/dist/index.json", "node-index.json")
        ver = next((r["version"] for r in index if r["version"].lstrip("v") == spec or r["version"].lstrip("v").startswith(spec + ".")), None)
        if not ver:
            raise RuntimeError(f"no Node release matches {spec}")
        base = f"node-{ver}-darwin-{ARCH}"
        d = os.path.join(self.cache, "node", base)
        if not os.path.exists(os.path.join(d, "bin", "node")):
            os.makedirs(os.path.join(self.cache, "node"), exist_ok=True)
            tgz = d + ".tar.gz"
            sums = os.path.join(self.cache, "node", f"SHASUMS256-{ver}.txt")
            self.fetch(f"https://nodejs.org/dist/{ver}/{base}.tar.gz", tgz)
            self.fetch(f"https://nodejs.org/dist/{ver}/SHASUMS256.txt", sums)
            want = next((ln.split()[0] for ln in open(sums) if ln.strip().endswith(f"{base}.tar.gz")), None)
            if want != self.sha256(tgz):
                os.remove(tgz)
                raise RuntimeError(f"checksum mismatch for {base}.tar.gz")
            run(["tar", "-xzf", tgz, "-C", os.path.join(self.cache, "node")])
            os.remove(tgz)
        self.versions["node"] = ver
        return os.path.join(d, "bin")

    def ensure_flutter(self, channel, version=None):
        rel = self.cached_json("https://storage.googleapis.com/flutter_infra_release/releases/releases_macos.json", "flutter-releases.json")
        if version:
            cands = [r for r in rel["releases"] if r["version"] == version and r["channel"] == channel]
        else:
            h = rel["current_release"][channel]
            cands = [r for r in rel["releases"] if r["hash"] == h]
        r = next((c for c in cands if c.get("dart_sdk_arch") == ARCH), cands[0] if cands else None)
        if not r:
            raise RuntimeError(f"no Flutter release for channel {channel} {version or ''}")
        d = os.path.join(self.cache, "flutter", f"{r['version']}-{r.get('dart_sdk_arch', ARCH)}")
        if not os.path.exists(os.path.join(d, "flutter", "bin", "flutter")):
            os.makedirs(os.path.dirname(d), exist_ok=True)
            z = d + ".zip"
            self.fetch(rel["base_url"] + "/" + r["archive"], z)
            if self.sha256(z) != r["sha256"]:
                os.remove(z)
                raise RuntimeError("checksum mismatch for the Flutter archive")
            tmp = d + ".tmp"
            shutil.rmtree(tmp, ignore_errors=True)
            os.makedirs(tmp)
            run(["unzip", "-q", z, "-d", tmp])
            os.replace(tmp, d)
            os.remove(z)
        self.versions["flutter"] = r["version"]
        return os.path.join(d, "flutter")

    def ensure_gitleaks(self, ver):
        d = os.path.join(self.cache, "gitleaks", ver)
        b = os.path.join(d, "gitleaks")
        if not os.path.exists(b):
            os.makedirs(d, exist_ok=True)
            name = f"gitleaks_{ver}_darwin_{ARCH}.tar.gz"
            url = f"https://github.com/gitleaks/gitleaks/releases/download/v{ver}/"
            tgz, sums = os.path.join(d, name), os.path.join(d, "checksums.txt")
            self.fetch(url + name, tgz)
            self.fetch(url + f"gitleaks_{ver}_checksums.txt", sums)
            want = next((ln.split()[0] for ln in open(sums) if ln.strip().endswith(name)), None)
            if want != self.sha256(tgz):
                os.remove(tgz)
                raise RuntimeError(f"checksum mismatch for {name}")
            run(["tar", "-xzf", tgz, "-C", d, "gitleaks"])
            os.remove(tgz)
        self.versions["gitleaks"] = ver
        return b

    # ------------------------------------------------------------ services
    def start_services(self, job, ex):
        services = job.job.get("services") or {}
        info = {}
        for sname, svc in services.items():
            image = to_str(ex.interp(svc["image"]))
            name = f"ci-local-{slug(self.repo.split('/')[1])}-{slug(job.job_id)[:20]}-{os.getpid()}-{random.randint(1000, 9999)}"
            cmd = ["docker", "run", "-d", "--name", name, "--label", "ci-local=1"]
            for k, v in (svc.get("env") or {}).items():
                cmd += ["-e", f"{k}={to_str(ex.interp(v))}"]
            cports = [str(p).split(":")[-1].split("/")[0] for p in (svc.get("ports") or [])]
            for cp in cports:
                cmd += ["-p", f"127.0.0.1::{cp}"]
            cmd.append(image)
            self.containers.append(name)
            run(cmd)
            opts = shlex.split(to_str(ex.interp(svc.get("options", ""))))
            health = opts[opts.index("--health-cmd") + 1] if "--health-cmd" in opts else None
            checks = ([health] if health else []) + (["pg_isready -h 127.0.0.1"] if "postgres" in image else [])
            deadline = time.time() + 120
            while True:
                if all(subprocess.run(["docker", "exec", name, "sh", "-c", c], stdout=subprocess.DEVNULL,
                                      stderr=subprocess.DEVNULL).returncode == 0 for c in checks):
                    break
                if time.time() > deadline:
                    raise RuntimeError(f"service {sname} ({image}) did not become healthy")
                time.sleep(1)
            ports = {}
            for cp in cports:
                hp = run(["docker", "port", name, f"{cp}/tcp"]).splitlines()[0].rsplit(":", 1)[1]
                ports[cp] = hp
            copy = self.cfg.get("service_copy_paths", [])
            run(["docker", "exec", name, "mkdir", "-p", "/work"])
            if copy:
                arch = subprocess.run(["git", "archive", "--format=tar", self.sha, *copy], cwd=self.repo_root,
                                      stdout=subprocess.PIPE, check=True).stdout
                subprocess.run(["docker", "exec", "-i", name, "tar", "-x", "-C", "/work"], input=arch, check=True,
                               stdout=subprocess.DEVNULL)
            info[sname] = {"name": name, "image": image, "ports": ports}
            job.note(f"service {sname}: throwaway {image} container on 127.0.0.1:{', '.join(ports.values()) or '-'}")
        return info

    def docker_host(self):
        # Jobs get a fresh HOME, so the docker CLI cannot read the current
        # context from ~/.docker. Pass the endpoint explicitly.
        if not getattr(self, "_docker_host", None):
            self._docker_host = os.environ.get("DOCKER_HOST") or run(
                ["docker", "context", "inspect", "--format", "{{.Endpoints.docker.Host}}"])
        return self._docker_host

    def stop_services(self, info):
        for s in info.values():
            subprocess.run(["docker", "rm", "-f", s["name"]], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if s["name"] in self.containers:
                self.containers.remove(s["name"])

    # ---------------------------------------------------------- processes
    def exec_logged(self, job, argv, cwd, env, timeout, profile, label):
        full = (["sandbox-exec", "-f", profile] if profile else []) + ["nice", "-n", "10"] + argv
        job.log.write(f"\n##[step] {label}\n$ {' '.join(shlex.quote(a) for a in argv)}\n")
        job.log.flush()
        p = subprocess.Popen(full, cwd=cwd, env=env, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, start_new_session=True)
        notes = []

        def pump():
            for raw in iter(p.stdout.readline, b""):
                line = ANSI.sub("", raw.decode("utf-8", "replace")).rstrip("\n")
                job.log.write(line + "\n")
                job.log.flush()
                job.tail.append(line)
                for rx, tmpl in NOTE_PATTERNS:
                    m = rx.search(line.strip())
                    if m:
                        notes.append((tmpl, m.groups()))
            p.stdout.close()

        t = threading.Thread(target=pump, daemon=True)
        t.start()
        try:
            rc = p.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            self.kill(p)
            rc = 124
            job.log.write(f"##[error] step timed out after {fmt_secs(timeout)}\n")
        except BaseException:
            self.kill(p)
            raise
        t.join(timeout=10)
        job.log.flush()
        for tmpl, groups in notes[-6:]:
            g = [x if x is not None else "0" for x in groups]
            job.note(tmpl.format(*g))
        return rc

    @staticmethod
    def kill(p):
        for sig in (signal.SIGTERM, signal.SIGKILL):
            try:
                os.killpg(p.pid, sig)
            except ProcessLookupError:
                return
            try:
                p.wait(timeout=5)
                return
            except subprocess.TimeoutExpired:
                continue

    # ----------------------------------------------------------- job run
    def run_job(self, job):
        start = time.time()
        jdir = os.path.join(self.scratch, "jobs", f"{len(os.listdir(os.path.join(self.scratch, 'jobs')))+1:02d}-{slug(job.title)}")
        rt = os.path.join(jdir, "runner_temp")
        os.makedirs(os.path.join(rt, "tmp"))
        os.makedirs(os.path.join(rt, "home"))
        job.logpath = os.path.join(self.logs_dir, f"{slug(job.title)}.log")
        job.log = open(job.logpath, "w")
        job.log.write(f"# {job.title}\n# workflow {job.wf_file}, job {job.job_id}, matrix {json.dumps(job.matrix)}\n# commit {self.sha}\n")
        status = {"v": "success"}
        wf, j = job.wf, job.job
        wf_env = wf.get("env") or {}
        steps_ctx = {}
        ctx = self.base_ctx(job.wf_name, job.matrix, steps=steps_ctx)
        ctx["runner"]["temp"] = rt
        ex = Expr(ctx, status=lambda: status["v"])
        services = {}
        try:
            needs = j.get("needs") or []
            needs = [needs] if isinstance(needs, str) else needs
            bad = [n for n in needs if any(o.wf_file == job.wf_file and o.job_id == n and o.result != "PASS" for o in self.jobs)]
            if bad:
                job.result, job.reason = "SKIPPED", f"needs {', '.join(bad)}, which did not pass"
                return
            cond = j.get("if")
            if cond is not None and not truthy(ex.evaluate(cond if any(f in str(cond) for f in ("success()", "failure()", "always()", "cancelled()")) else f"success() && ({cond})")):
                job.result, job.reason = "SKIPPED", f"job condition is false for a pull request: if: {str(cond).strip()}"
                return
            if j.get("uses"):
                job.result, job.reason = "FAIL", f"reusable workflow {j['uses']} has no local runner support"
                return
            job_timeout = float(j.get("timeout-minutes") or 360) * 60
            services = self.start_services(job, ex)
            own_ports = [int(p) for s in services.values() for p in s["ports"].values()]
            profile = os.path.join(jdir, "sandbox.sb")
            self.write_profile(profile, allow_docker=bool(services), own_ports=own_ports)
            pg = next((s for s in services.values() if "postgres" in s["image"]), None)
            prelude = os.path.join(jdir, "prelude.sh")
            with open(prelude, "w") as fh:
                if pg:
                    fh.write(PSQL_PRELUDE)
            env_extra = {}
            path_extra = []
            defaults = dict(((wf.get("defaults") or {}).get("run") or {}), **((j.get("defaults") or {}).get("run") or {}))
            job_env_raw = dict(wf_env, **(j.get("env") or {}))
            if j.get("continue-on-error"):
                job.note("job has continue-on-error")
            for idx, step in enumerate(j.get("steps") or [], 1):
                name = step.get("name") or (("Run " + str(step["run"]).strip().splitlines()[0]) if step.get("run") else f"Run {step.get('uses')}")
                name = to_str(ex.interp(name))
                cond = step.get("if")
                expr = "success()" if cond is None else (str(cond) if any(f in str(cond) for f in ("success()", "failure()", "always()", "cancelled()")) else f"success() && ({cond})")
                if not truthy(ex.evaluate(expr)):
                    job.steps.append((name, "skipped", 0.0, f"if: {str(cond).strip() if cond is not None else 'success()'}"))
                    job.log.write(f"\n##[step] {name}: skipped (if: {cond if cond is not None else 'success()'})\n")
                    continue
                remaining = job_timeout - (time.time() - start)
                step_timeout = min(remaining, float(step.get("timeout-minutes") or 360) * 60)
                t0 = time.time()
                ex.secrets_used.clear()
                ex.vars_used.clear()
                env = self.step_env(job, rt, idx, env_extra, path_extra, ex, job_env_raw, step, services)
                wd_raw = step.get("working-directory") or defaults.get("working-directory") or "."
                wd = os.path.normpath(os.path.join(self.wt, to_str(ex.interp(wd_raw))))
                coe = truthy(ex.evaluate(step["continue-on-error"])) if isinstance(step.get("continue-on-error"), str) else bool(step.get("continue-on-error"))
                ov = self.override(job, name)
                if ov and ov.get("note"):
                    job.note(f"{name}: {ov['note']}")
                if step.get("uses"):
                    rc, outcome_note = self.run_action(job, step, name, ex, env, wd, rt, profile, step_timeout, path_extra, env_extra)
                else:
                    script = to_str(ex.interp(step["run"]))
                    for old, new in (ov or {}).get("replace", []):
                        script = script.replace(old, new)
                    for cp, hp in {cp: hp for s in services.values() for cp, hp in s["ports"].items()}.items():
                        script = script.replace(f"localhost:{cp}", f"127.0.0.1:{hp}")
                    sfile = os.path.join(rt, f"step-{idx:02d}.sh")
                    with open(sfile, "w") as fh:
                        fh.write(f". {shlex.quote(prelude)}\n{script}\n")
                    job.log.write(f"\n##[script] {name}\n" + "".join(f"| {ln}\n" for ln in script.strip().splitlines()))
                    shell = step.get("shell") or defaults.get("shell")
                    argv = self.shell_argv(shell, sfile)
                    am = self.absent_module_check(job, name, env, wd, profile)
                    if am:
                        env["PYTEST_ADDOPTS"] = (env.get("PYTEST_ADDOPTS", "") + f" --deselect {am}").strip()
                    rc = self.exec_logged(job, argv, wd, env, step_timeout, profile, name)
                    if am:
                        self.run_known_test(job, am, env, wd, profile)
                    outcome_note = None
                    self.read_step_files(rt, idx, env_extra, path_extra, steps_ctx, step.get("id"))
                if ex.secrets_used:
                    job.note(f"{name}: CI secret(s) {', '.join(sorted(ex.secrets_used))} were empty here")
                if ex.vars_used:
                    job.note(f"{name}: repo variable(s) {', '.join(sorted(ex.vars_used))} were unset here")
                dur = time.time() - t0
                if rc is None:
                    job.steps.append((name, "skipped", dur, outcome_note or ""))
                elif rc == 0:
                    job.steps.append((name, "ok", dur, outcome_note or ""))
                elif coe:
                    job.steps.append((name, "failed, continue-on-error", dur, outcome_note or ""))
                    job.note(f"{name}: failed with continue-on-error (non-blocking, as in CI)")
                else:
                    job.steps.append((name, "failed", dur, outcome_note or ""))
                    status["v"] = "failure"
                    if not job.failed_step:
                        job.failed_step = name
            if status["v"] == "failure" and not j.get("continue-on-error"):
                job.result, job.reason = "FAIL", f"step failed: {job.failed_step}"
            else:
                job.result = "PASS"
        except Interrupted:
            job.result, job.reason = "FAIL", "interrupted"
            raise
        except Exception as e:  # noqa: BLE001
            job.result, job.reason = "FAIL", f"runner error: {e}"
            job.log.write(f"##[error] runner error: {e}\n")
        finally:
            self.stop_services(services)
            job.duration = time.time() - start
            job.log.close()

    def shell_argv(self, shell, sfile):
        if not shell:
            return ["bash", "-e", sfile]
        if shell == "bash":
            return ["bash", "--noprofile", "--norc", "-eo", "pipefail", sfile]
        if shell == "sh":
            return ["sh", "-e", sfile]
        if shell == "python":
            return ["python", sfile]
        if "{0}" in shell:
            return [a.replace("{0}", sfile) for a in shlex.split(shell)]
        return shlex.split(shell) + [sfile]

    def override(self, job, step_name):
        for o in self.cfg.get("step_overrides", []):
            if o["workflow"] == job.wf_file and o["job"] == job.job_id and o["step"] == step_name:
                return o
        return None

    def step_env(self, job, rt, idx, env_extra, path_extra, ex, job_env_raw, step, services):
        files = {k: os.path.join(rt, f"_{k.lower()}_{idx:02d}") for k in ("GITHUB_ENV", "GITHUB_PATH", "GITHUB_OUTPUT", "GITHUB_STEP_SUMMARY")}
        for f in files.values():
            open(f, "w").close()
        env = {
            # A fresh home per job, like a hosted runner: no dotfiles, pip or
            # npm config, Python user site or tool settings from this Mac (the
            # Ultralytics settings here point its runs dir at the production
            # checkout, for example).
            "HOME": os.path.join(rt, "home"), "USER": os.environ.get("USER", ""), "LOGNAME": os.environ.get("LOGNAME", os.environ.get("USER", "")),
            "LANG": "en_US.UTF-8", "LC_ALL": "en_US.UTF-8", "TERM": "dumb", "SHELL": "/bin/bash",
            "PATH": ":".join(list(reversed(path_extra)) + [self.shims] + BASE_PATH),
            "TMPDIR": os.path.join(rt, "tmp"), "CI": "true",
            "RUNNER_OS": "macOS", "RUNNER_ARCH": "ARM64" if ARCH == "arm64" else "X64", "RUNNER_TEMP": rt,
            "GITHUB_WORKSPACE": self.wt, "GITHUB_EVENT_NAME": "pull_request", "GITHUB_REPOSITORY": self.repo,
            "GITHUB_SHA": self.sha, "GITHUB_BASE_REF": self.base_branch,
            "PIP_CACHE_DIR": os.path.join(self.cache, "pip"), "PIP_DISABLE_PIP_VERSION_CHECK": "1",
            "PUB_CACHE": os.path.join(self.cache, "pub-cache"), "npm_config_cache": os.path.join(self.cache, "npm"),
            "DENO_DIR": os.path.join(self.cache, "deno"), "FLUTTER_SUPPRESS_ANALYTICS": "true",
            "DART_SUPPRESS_ANALYTICS": "true", "NEXT_TELEMETRY_DISABLED": "1",
        }
        if services:
            env["DOCKER_HOST"] = self.docker_host()
        env.update(files)
        for s in services.values():
            env["CIL_PG_CTR"] = s["name"]
            for cp, hp in s["ports"].items():
                env[f"CIL_PORT_{cp}"] = hp
        env.update(env_extra)
        merged = dict(job_env_raw, **(step.get("env") or {}))
        ex.ctx["env"] = {}
        for k, v in merged.items():
            val = to_str(ex.interp(v))
            for s in services.values():
                for cp, hp in s["ports"].items():
                    val = val.replace(f"localhost:{cp}", f"127.0.0.1:{hp}")
            env[k] = val
            ex.ctx["env"][k] = val
        return env

    def read_step_files(self, rt, idx, env_extra, path_extra, steps_ctx, step_id):
        def kv(path):
            out, lines, i = {}, open(path).read().splitlines(), 0
            while i < len(lines):
                ln = lines[i]
                m = re.match(r"^([^=<]+)<<(.+)$", ln)
                if m:
                    key, delim, buf = m.group(1), m.group(2), []
                    i += 1
                    while i < len(lines) and lines[i] != delim:
                        buf.append(lines[i])
                        i += 1
                    out[key] = "\n".join(buf)
                elif "=" in ln:
                    k, v = ln.split("=", 1)
                    out[k] = v
                i += 1
            return out
        env_extra.update(kv(os.path.join(rt, f"_github_env_{idx:02d}")))
        for ln in open(os.path.join(rt, f"_github_path_{idx:02d}")).read().splitlines():
            if ln.strip():
                path_extra.append(ln.strip())
        if step_id:
            steps_ctx[step_id] = {"outputs": kv(os.path.join(rt, f"_github_output_{idx:02d}")), "outcome": "success", "conclusion": "success"}

    def absent_module_check(self, job, step_name, env, wd, profile):
        for a in self.cfg.get("absent_modules", []):
            if a["workflow"] == job.wf_file and a["job"] == job.job_id and a["step"] == step_name:
                py = shutil.which("python", path=env["PATH"]) or "python"
                r = subprocess.run(["sandbox-exec", "-f", profile, py, "-c", f"import {a['module']}"], env=env, cwd=wd,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if r.returncode == 0:
                    job.note(f"known environment difference: {a['module']} is importable here but not in CI, so "
                             f"{a['test']} is reported separately")
                    return a["test"]
                job.note(f"{a['module']} is not installed, same as CI, so {a['test'].split('::')[-1]} ran in the normal suite")
        return None

    def run_known_test(self, job, test, env, wd, profile):
        e = dict(env)
        e.pop("PYTEST_ADDOPTS", None)
        rc = self.exec_logged(job, ["python", "-m", "pytest", "-q", test], wd, e, 600, profile, f"known environment difference: {test}")
        job.note(f"known environment difference, not counted as a pass or a fail: {test} {'passed' if rc == 0 else 'failed'} here")

    # ------------------------------------------------------------- actions
    def run_action(self, job, step, name, ex, env, wd, rt, profile, timeout, path_extra, env_extra):
        uses = str(step["uses"])
        action = uses.split("@")[0]
        w = {k: to_str(ex.interp(v)) for k, v in (step.get("with") or {}).items()}
        if action == "actions/checkout":
            return 0, f"worktree at {self.sha[:10]} (full history)"
        if action == "actions/setup-python":
            want = w.get("python-version", "")
            have = run([self.python312, "-c", "import sys; print('%d.%d.%d' % sys.version_info[:3])"])
            if want and not have.startswith(want.rstrip(".x")):
                job.log.write(f"python-version {want} requested, only {have} is set up here\n")
                return 1, f"python-version {want} is not available locally"
            venv = os.path.join(rt, f"setup-python-{len(path_extra)}")
            rc = self.exec_logged(job, [self.python312, "-m", "venv", venv], wd, env, timeout, profile, name)
            if rc == 0:
                path_extra.append(os.path.join(venv, "bin"))
                env_extra["pythonLocation"] = venv
            return rc, f"venv from {self.python312} ({have})"
        if action == "actions/setup-node":
            bindir = self.ensure_node(w.get("node-version") or "20")
            path_extra.append(bindir)
            return 0, f"Node {self.versions['node']}"
        if action == "subosito/flutter-action":
            sdk = self.ensure_flutter(w.get("channel") or "stable", w.get("flutter-version") or None)
            path_extra.append(os.path.join(sdk, "bin"))
            env_extra["FLUTTER_ROOT"] = sdk
            env = dict(env, PATH=os.path.join(sdk, "bin") + ":" + env["PATH"], FLUTTER_ROOT=sdk)
            rc = self.exec_logged(job, ["flutter", "--version"], wd, env, timeout, profile, name)
            return rc, f"Flutter {self.versions['flutter']} ({w.get('channel') or 'stable'})"
        if action == "denoland/setup-deno":
            want = (w.get("deno-version") or "v2.x").lstrip("v").split(".")[0]
            deno = shutil.which("deno", path=":".join(BASE_PATH))
            if not deno:
                return 1, "deno is not installed on this Mac (brew install deno)"
            ver = run([deno, "--version"]).splitlines()[0].split()[1]
            self.versions["deno"] = ver
            if not ver.startswith(want + "."):
                return 1, f"deno {ver} does not match {w.get('deno-version')}"
            path_extra.append(os.path.dirname(deno))
            return 0, f"deno {ver}"
        if action == "gitleaks/gitleaks-action":
            return self.action_gitleaks(job, name, env, rt, profile, timeout)
        if action == "treosh/lighthouse-ci-action":
            return self.action_lighthouse(job, name, w, env, timeout)
        if action in ("actions/upload-artifact", "actions/upload-pages-artifact", "actions/deploy-pages",
                      "github/codeql-action/upload-sarif"):
            job.note(f"{name}: skipped, it only uploads to GitHub")
            return None, "uploads to GitHub, not run locally"
        job.log.write(f"##[error] no local equivalent for action {uses}\n")
        return 1, f"no local equivalent for action {uses}; add one to scripts/ci_local.py"

    def action_gitleaks(self, job, name, env, rt, profile, timeout):
        ver = env.get("GITLEAKS_VERSION") or self.cfg.get("gitleaks_version", "8.24.3")
        b = self.ensure_gitleaks(ver)
        argv = [b, "detect", "--redact", "-v", "--exit-code=2", "--report-format=sarif",
                f"--report-path={os.path.join(rt, 'results.sarif')}", "--log-level=info"]
        if self.args.gitleaks_all_branches:
            # The weekly scheduled run: CI checks out every branch and tag with
            # full history, and gitleaks scans all of them.
            argv.append(f"--log-opts=--remotes=origin --tags {self.sha}")
            what = "every origin branch and tag (like the weekly scheduled scan)"
        elif self.mode == "pr":
            # Same range gitleaks-action scans on a pull_request event.
            argv.append(f"--log-opts=--no-merges --first-parent {self.merge_base}..{self.sha}")
            what = f"the PR's commits ({self.merge_base[:7]}..{self.sha[:7]})"
        else:
            # On main: every commit reachable from it, a superset of each
            # push-to-main scan. Without --log-opts gitleaks would use --all,
            # which here means every local branch of this clone, not CI's view.
            argv.append(f"--log-opts={self.sha}")
            what = f"all of {self.base_branch}'s history up to {self.sha[:7]}"
        job.note(f"gitleaks {ver} on {what}")
        rc = self.exec_logged(job, argv, self.wt, env, timeout, profile, name)
        if rc == 2:
            job.note("gitleaks found leaks (values redacted in the log)")
        return rc, f"gitleaks {ver} on {what}"

    def action_lighthouse(self, job, name, w, env, timeout):
        chrome = os.environ.get("CHROME_PATH") or CHROME_DEFAULT
        if not os.path.exists(chrome):
            job.note(f"{name}: SKIPPED, no Chrome at {chrome}")
            return None, "needs Chrome, none found"
        if not shutil.which("npx", path=env["PATH"]):
            return 1, "npx not on PATH (setup-node missing?)"
        cfg = w.get("configPath")
        if not cfg:
            return 1, "lighthouse-ci-action without configPath is not mapped"
        lhci = ["npx", "--yes", f"@lhci/cli@{self.cfg.get('lhci_version', '0.13.0')}"]
        e = dict(env, CHROME_PATH=chrome)
        # Chrome cannot start inside sandbox-exec (it sets up its own sandbox),
        # so this step runs without the profile: clean env and nice only.
        rc = self.exec_logged(job, lhci + ["collect", f"--config={cfg}"], self.wt, e, timeout, None, name + " (lhci collect)")
        if rc == 0:
            rc = self.exec_logged(job, lhci + ["assert", f"--config={cfg}"], self.wt, e, timeout, None, name + " (lhci assert)")
        warns = sum(1 for ln in open(job.logpath) if "warning for" in ln and "assertion" in ln)
        if warns:
            job.note(f"lighthouse: {warns} warn-level assertion result(s), non-blocking as in CI")
        if truthy(w.get("temporaryPublicStorage", "")):
            job.note("lighthouse: temporaryPublicStorage upload skipped, it would publish the reports on a public server")
        if truthy(w.get("uploadArtifacts", "")):
            job.note("lighthouse: artifact upload skipped, it only uploads to GitHub")
        job.note(f"lighthouse: lhci {self.cfg.get('lhci_version', '0.13.0')} with local Chrome, outside the sandbox profile (Chrome cannot start inside one)")
        return rc, "lhci collect + assert with local Chrome"

    # ------------------------------------------------------------- output
    def write_summary(self, total):
        fails = [j for j in self.jobs if j.result == "FAIL"]
        passes = [j for j in self.jobs if j.result == "PASS"]
        verdict = "FAIL" if fails else "PASS"
        short = self.sha[:10]
        L = []
        L.append(f"## Local CI: {verdict}")
        L.append("")
        L.append(f"{self.repo} at `{short}` ({self.ref_label}), run on this Mac with `scripts/ci-local.sh` "
                 f"on {dt.datetime.now().astimezone().strftime('%Y-%m-%d %H:%M %Z')}. GitHub Actions is paused, so this is the CI record.")
        L.append("")
        if self.mode == "pr":
            L.append(f"Pull request mode: path filters use the {len(self.changed)} file(s) changed since the merge base "
                     f"`{self.merge_base[:10]}` with {self.base_branch} (`{self.base_sha[:10]}`)."
                     + (" Path filters were ignored (--all)." if self.args.all else ""))
        else:
            L.append(f"Main mode: the commit is on {self.base_branch}, so every pull request workflow ran with path filters ignored.")
        L.append("")
        L.append(f"{len(passes)} passed, {len(fails)} failed, {sum(1 for j in self.jobs if j.result == 'SKIPPED')} skipped. Total time {fmt_secs(total)}.")
        L.append("")
        L.append("| Result | Job | Time | Notes |")
        L.append("|---|---|---|---|")
        for j in self.jobs:
            notes = list(j.notes)
            if j.reason:
                notes.insert(0, j.reason)
            cell = "<br>".join(n.replace("|", "\\|") for n in notes[:12])
            L.append(f"| {j.result} | {j.title.replace('|', '/')} | {fmt_secs(j.duration) if j.duration else ''} | {cell} |")
        L.append("")
        skipped_steps = [(j, s) for j in self.jobs for s in j.steps if s[1] == "skipped" and s[3] and not s[3].startswith("if:")]
        L.append("Differences from GitHub CI:")
        L.append("- Runs natively on macOS on this Mac, not on ubuntu-latest. Each step gets a clean environment with no keys from the shell, "
                 "runs at lower CPU priority, and runs under a sandbox profile that blocks the production ports on this Mac.")
        for n in self.cfg.get("known_differences", []):
            L.append(f"- {n}")
        for j, s in skipped_steps:
            L.append(f"- {j.title}: step \"{s[0]}\" skipped, {s[3]}.")
        for n in self.global_notes:
            L.append(f"- {n}")
        vers = ", ".join(f"{k} {v}" for k, v in sorted(self.versions.items()))
        if vers:
            L.append(f"- Tool versions: {vers}.")
        for j in fails:
            L.append("")
            L.append(f"<details><summary>{j.title}: {j.reason}</summary>")
            L.append("")
            L.append("```")
            L.extend(list(j.tail)[-30:])
            L.append("```")
            L.append("</details>")
        L.append("")
        L.append(f"Logs on the Mac that ran it: `{self.out_dir}`")
        # House style for PR comments: no em dashes, even when quoting tool output.
        text = ("\n".join(L) + "\n").replace(" \u2014 ", ", ").replace("\u2014", "-")
        self.summary_path = os.path.join(self.out_dir, "summary.md")
        with open(self.summary_path, "w") as fh:
            fh.write(text)
        return verdict, text

    # ---------------------------------------------------------------- main
    def main(self):
        t0 = time.time()
        self.resolve()
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        self.out_dir = os.path.realpath(os.path.join(os.environ.get("CI_LOCAL_OUT") or os.path.join(self.cache, "runs"),
                                                     f"{self.repo.split('/')[1]}-{stamp}-{self.sha[:8]}"))
        self.logs_dir = os.path.join(self.out_dir, "logs")
        os.makedirs(self.logs_dir)
        self.versions["python3.12"] = run([self.python312, "-c", "import platform; print(platform.python_version())"])
        self.versions["macOS"] = platform.mac_ver()[0]
        print(f"ci-local: {self.repo} at {self.sha[:10]} ({self.ref_label}), mode {self.mode}", flush=True)
        self.make_worktree()
        os.makedirs(os.path.join(self.scratch, "jobs"))
        self.plan()
        if self.args.list:
            for j in self.jobs:
                print(f"{j.result or 'RUN':8} {j.title}  [{j.wf_file}:{j.job_id}]" + (f"  {j.reason}" if j.reason else ""))
            return 0
        for j in self.jobs:
            if j.result is None:
                print(f"  ...      {j.title}", flush=True)
                self.run_job(j)
            line = f"{j.result:8} {fmt_secs(j.duration) if j.duration else '-':>8}  {j.title}"
            if j.reason:
                line += f"  ({j.reason})"
            print(line, flush=True)
        total = time.time() - t0
        verdict, text = self.write_summary(total)
        print(f"ci-local: {verdict} in {fmt_secs(total)}. Summary: {self.summary_path}", flush=True)
        if self.args.comment:
            body = text if len(text) < 60000 else text[:60000] + "\n\n(truncated, full summary is in the log folder)\n"
            subprocess.run(["gh", "pr", "comment", str(self.args.comment), "--repo", self.repo, "--body", body], check=True)
            print(f"ci-local: posted the summary on PR #{self.args.comment}", flush=True)
        return 1 if verdict == "FAIL" else 0


PSQL_PRELUDE = r'''
# psql runs inside this job's throwaway postgres container (see ci_local.py).
# Host-port rewrites are mapped back to the container's own port.
psql() {
  local a out=()
  for a in "$@"; do
    out+=("${a//127.0.0.1:${CIL_PORT_5432:-x}/localhost:5432}")
  done
  docker exec -i -w /work \
    ${PGPASSWORD:+-e PGPASSWORD="$PGPASSWORD"} ${PGUSER:+-e PGUSER="$PGUSER"} \
    ${PGDATABASE:+-e PGDATABASE="$PGDATABASE"} \
    "$CIL_PG_CTR" psql "${out[@]}"
}
'''


def main():
    ap = argparse.ArgumentParser(prog="scripts/ci-local.sh", description="Run this repo's GitHub Actions checks on this Mac.")
    ap.add_argument("ref", nargs="?", help="git ref or commit to test (default HEAD)")
    ap.add_argument("--pr", type=int, help="test the current head of this pull request")
    ap.add_argument("--comment", type=int, metavar="PR", help="post the summary as a comment on this PR (the tested commit must be its head)")
    ap.add_argument("--all", action="store_true", help="ignore path filters and run every pull request workflow")
    ap.add_argument("--only", help="comma-separated substrings; run only matching jobs (others are reported as skipped)")
    ap.add_argument("--list", action="store_true", help="show the plan without running anything")
    ap.add_argument("--keep", action="store_true", help="keep the scratch folder for debugging")
    ap.add_argument("--gitleaks-all-branches", action="store_true",
                    help="scan every origin branch and tag, like the weekly scheduled gitleaks run")
    args = ap.parse_args()
    if args.pr and args.ref:
        die("pass a ref or --pr, not both")
    if sys.platform != "darwin":
        die("this runner is for macOS")
    cfg = json.loads(os.environ.get("CI_LOCAL_CONFIG_JSON") or "{}")
    if not cfg.get("repo"):
        die("no repo settings. Run scripts/ci-local.sh, not this file directly.")
    r = Runner(args, cfg)

    def on_signal(signum, frame):
        raise Interrupted()

    for s in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(s, on_signal)
    try:
        rc = r.main()
    except Interrupted:
        print("ci-local: interrupted, cleaning up", file=sys.stderr, flush=True)
        rc = 130
    except RuntimeError as e:
        print(f"ci-local: {e}", file=sys.stderr, flush=True)
        rc = 2
    finally:
        r.cleanup()
    sys.exit(rc)


if __name__ == "__main__":
    main()
