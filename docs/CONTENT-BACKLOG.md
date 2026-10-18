# Content backlog — triage & merge order

_Last audited: 2026-10-06 by autopilot._

This repo's `/insights` articles all live in a **single append-only store,
`src/content/insights.ts`**. Every open content PR edits that one file, so they
**mutually conflict**: merging any one requires the rest to rebase and resolve the
append. They cannot be batch-merged blindly — they must go in one at a time, newest
rebased on top of the last.

Autopilot runs cannot publish these itself. The `/cruze-article` skill the content
mission mandates has **never been installed on this machine** (confirmed in PR #80's
body, 2026-08-21). Since then each content run has hand-followed
`docs/CONTENT-SEO-STRATEGY.md` and correctly stopped at an open PR (guardrail: code →
branch + PR, no merge/deploy). The result is an unmerged pile with duplicates. This
file is the triage so a human can drain it quickly.

## Open content PRs (all touch `src/content/insights.ts`)

| PR | State | Slug | Topic |
|----|-------|------|-------|
| #103 | DRAFT | `phantom-jam-vs-bottleneck` | phantom jam vs. real bottleneck |
| #93 | OPEN | `phantom-jam-vs-bottleneck` | phantom jam vs. real bottleneck |
| #101 | DRAFT | `how-do-traffic-cameras-measure-traffic` | how cameras measure traffic |
| #95 | OPEN | `how-traffic-cameras-measure-flow` | how cameras measure traffic flow |
| #90 | OPEN | `do-navigation-apps-cause-traffic` | do nav apps cause traffic |
| #80 | OPEN | `how-much-fuel-does-an-idling-truck-burn` | idling-truck fuel economics |

## Duplicates to resolve before merging

1. **Hard collision — same slug.** #103 (DRAFT) and #93 (OPEN) both add slug
   `phantom-jam-vs-bottleneck`. They cannot both merge. **Recommend: keep the better
   draft, close the other.** #93 is the older non-draft; #103 is a later rewrite —
   skim both, keep one, close the loser.
2. **Topical duplicate — different slugs, one subject.** #101 (DRAFT,
   `how-do-traffic-cameras-measure-traffic`) and #95 (OPEN,
   `how-traffic-cameras-measure-flow`) are two articles on the same topic. **Recommend:
   pick one, close the other** (two near-identical pages compete for the same query and
   dilute each other).

## Suggested merge order (after closing dups)

Unique, no-overlap articles first, then one of each dup pair:

1. #80 — idling-truck fuel (Cluster 2 / fleet, under-served per strategy doc)
2. #90 — do nav apps cause traffic
3. #95 **or** #101 — camera measurement (one only)
4. #93 **or** #103 — phantom jam vs. bottleneck (one only)

Rebase each on the previous before merge to resolve the `insights.ts` append.

## Root cause & prevention

- **No `gh pr list` check before content runs.** Both dup pairs are a later run
  re-creating an article an earlier open PR already added — the same signature as the
  `cruze-builder` "same fix duped 4×" blind spot, now in the content lane. Any future
  content run must `gh pr list --state open` and diff against `src/content/insights.ts`
  before writing.
- **No working publish path.** `/cruze-article` is absent here, so nothing auto-ships;
  articles only accumulate as PRs a human must merge. Until the skill is restored (or
  the content mission retired), every scheduled content run produces an unmergeable
  addition to this pile.
