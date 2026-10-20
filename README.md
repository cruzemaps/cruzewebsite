# Cruze: Dissolve Traffic, Not Just Avoid It

**Cruze transforms every smartphone into an active traffic actuator.**

While traditional navigation apps simply route you around traffic, Cruze uses swarm intelligence and physics-informed AI to actively coordinate driver speeds and eliminate phantom jams before they form.

## The Mission
Phantom traffic jams—stop-and-go waves caused by minor braking events—account for huge amounts of wasted fuel, lost time, and accidents. Cruze tackles this problem at the source.

## How It Works
Cruze isn't just a map; it's a co-pilot for the collective road.
- **Swarm Intelligence**: Coordinates subtle speed adjustments across multiple drivers to smooth out traffic flow.
- **Physics-Informed AI**: Predicts and neutralizes traffic waves using advanced fluid dynamics models.
- **Eco-Driving**: Optimizing flow means less braking and acceleration, significantly reducing fuel consumption and emissions.

## Key Benefits
- **Save Time**: Reach your destination faster by preventing the jam capabilities.
- **Save Fuel**: Smoother driving means better mileage and lower costs.
- **Save Lives**: Reducing sudden stops decreases the risk of rear-end collisions.

## Secret scanning

CI runs gitleaks on every pull request and weekly (`.github/workflows/gitleaks.yml`). To stop a leak before it leaves your machine, turn on the pre-commit hook once per clone with `git config core.hooksPath .githooks` (needs `brew install gitleaks`).

## CI runs locally while GitHub Actions is paused

GitHub Actions minutes for the cruzemaps account ran out, so the `ci`,
`Test`, `Secret Scan (gitleaks)` and `Lighthouse CI` workflows are disabled
on GitHub (since 2026-10-18). `Deploy to GitHub Pages` stays on. The
workflow files are unchanged so they can be turned back on later. Until
then, CI is `scripts/ci-local.sh`, run on the Mac:

```bash
scripts/ci-local.sh --comment <PR number>
```

It checks out the PR's current head in a temporary worktree, runs every job
the workflows would start for that PR (lint and type-check, unit tests, the
production bundle check, the SQL tests on a throwaway Postgres container,
the edge-function Deno tests, gitleaks and Lighthouse with the local
Chrome), prints PASS, FAIL or SKIPPED with the reason and time for each job,
and posts the summary as a PR comment. That comment is the record that CI
passed: merge only when the newest one is for the PR's current head and
says PASS. `scripts/ci-local.sh` alone tests HEAD, and `--list` shows the
plan. A full run takes about 4 minutes once the caches are warm. The header
of the script lists what it needs and the differences from GitHub's runners.

---
*Cruze - Driving the Future of Traffic Management.*
