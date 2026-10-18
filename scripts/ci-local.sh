#!/usr/bin/env bash
# ci-local.sh: run cruzewebsite's GitHub Actions checks on this Mac.
#
# GitHub Actions is paused for the cruzemaps account (out of minutes), so CI
# runs locally. This runs every job a pull request into main would start,
# from a clean checkout of the ref, and prints PASS, FAIL or SKIPPED (with the
# reason) and the time for each job. The workflows in .github/workflows/ are
# the source of truth: scripts/ci_local.py reads them from the ref under test
# and runs their steps, so they stay unchanged and can be re-enabled later.
#
# Usage:
#   scripts/ci-local.sh                     # test HEAD
#   scripts/ci-local.sh origin/main         # test any ref or commit
#   scripts/ci-local.sh --comment 118       # test PR 118's head, post the summary on it
#   scripts/ci-local.sh --pr 118            # test PR 118's head, no comment
#   scripts/ci-local.sh --list              # show which jobs would run, and why
#   scripts/ci-local.sh --only db,gitleaks  # run only matching jobs
#   scripts/ci-local.sh --all               # ignore path filters
#   scripts/ci-local.sh --gitleaks-all-branches   # scan every branch, like the weekly run
#
# On a commit that is already on main, every pull request workflow runs and
# gitleaks scans all of main's history. On any other commit, gitleaks scans
# the PR's commits, the way gitleaks-action does on a pull request.
# Deploy to GitHub Pages is not run here: it stays enabled on GitHub.
#
# Exit code: 0 when every job passed or was skipped, 1 when a job failed,
# 2 on a usage or setup error. The markdown summary and one log per job are
# written to $CI_LOCAL_CACHE/runs/<repo>-<time>-<sha>/.
#
# Needs: macOS, Homebrew python3.12, git, docker (Colima running) for the
# db job, deno 2 for the edge-function tests, Google Chrome for Lighthouse,
# gh (logged in) for --comment and --pr. Node 20 and gitleaks are downloaded
# on first use into the cache and checked against their published sha256 sums.
#
# Environment:
#   CI_LOCAL_CACHE   cache for tools, pip/pub/npm caches, run logs
#                    (default ~/.cache/cruze-ci-local)
#   CI_LOCAL_TMPDIR  parent of the per-run scratch folder (default $TMPDIR)
#   CI_LOCAL_OUT     where run summaries and logs go (default $CI_LOCAL_CACHE/runs)
#   CI_LOCAL_PYTHON  Python 3.12 used for venvs (default /opt/homebrew/bin/python3.12)
#
# Safety: the run never touches the existing containers. The db job gets
# their own throwaway container (127.0.0.1, random port) that is removed at
# the end, also on failure. Steps run with a clean environment (no keys from
# your shell) and a fresh home folder per job, at lower CPU priority, and
# under a sandbox profile that blocks connections to anything already
# listening on this Mac and writes to the repo checkout, ~/dev, ~/.colima,
# cloudflared and LaunchAgents folders.
set -euo pipefail

[ "$(uname -s)" = Darwin ] || { echo "ci-local.sh runs on macOS only" >&2; exit 2; }
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
CACHE="${CI_LOCAL_CACHE:-$HOME/.cache/cruze-ci-local}"
PY312="${CI_LOCAL_PYTHON:-/opt/homebrew/bin/python3.12}"
[ -x "$PY312" ] || { echo "Python 3.12 not found at $PY312 (brew install python@3.12, or set CI_LOCAL_PYTHON)" >&2; exit 2; }

# Tools for the runner itself: PyYAML to read the workflows, and shellcheck
# 0.9.0, the version on GitHub's ubuntu-24.04 image (shellcheck-py ships it).
PINS="PyYAML==6.0.3 shellcheck-py==0.9.0.6"
TOOLS="$CACHE/tools-venv"
STAMP="$TOOLS/.ok-$(printf '%s' "$PINS" | shasum -a 256 | cut -c1-12)"
if [ ! -f "$STAMP" ]; then
  echo "ci-local: setting up the tools venv in $TOOLS" >&2
  rm -rf "$TOOLS"
  "$PY312" -m venv "$TOOLS"
  # shellcheck disable=SC2086  # word-split the pins on purpose
  "$TOOLS/bin/python" -m pip install --quiet --disable-pip-version-check $PINS
  touch "$STAMP"
fi

# Repo settings for the runner. Paths starting with ~ are expanded.
CI_LOCAL_CONFIG_JSON="$(cat <<'JSON'
{
  "repo": "cruzemaps/cruzewebsite",
  "base_branch": "main",
  "gitleaks_version": "8.24.3",
  "lhci_version": "0.13.0",
  "protect_ports": [3000, 6379, 7071, 8000, 8001, 9090, 20241],
  "protect_paths": ["~/dev", "~/.colima", "~/.cloudflared",
                    "~/Library/Application Support/com.cloudflare.cloudflared",
                    "~/Library/LaunchAgents"],
  "service_copy_paths": ["supabase"],
  "workflow_notes": {
    "deploy.yml": "It stays enabled on GitHub and builds and deploys the site on push to main"
  },
  "known_differences": [
    "Linux-only details are adapted: the Postgres service is a local container and psql runs inside it with the repo's supabase folder copied in. Node 20 comes from nodejs.org and Deno 2 is the local install.",
    "Lighthouse runs lhci collect and assert with the local Chrome, outside the sandbox profile because Chrome cannot start inside one. Scores, mostly performance, move with the load on this Mac. The temporary-public-storage upload is skipped.",
    "The production bundle check uses the same placeholder VITE_* values as CI. No real keys are used anywhere."
  ]
}
JSON
)"
export CI_LOCAL_CONFIG_JSON

exec "$TOOLS/bin/python" -I "$SCRIPT_DIR/ci_local.py" "$@"
