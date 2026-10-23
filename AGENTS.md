# AGENTS.md

Read first: the cross-repo agent rules in `arch/information-technology/agent-operations.md` of anudeep-bonagiri/cruze-arch (local clone `~/dev/cruze-arch`; arch.cruzemaps.com needs a Vercel login, so read the repo). Architecture and commands are in CLAUDE.md.

- This repo is public, so GitHub Actions runs free: ci, Test, Secret Scan (gitleaks) and Lighthouse CI run on every PR and gate the merge. Never disable "Deploy to GitHub Pages". `scripts/ci-local.sh --comment <N>` runs the same jobs on this Mac when you want a local record.
- Before a PR: `npm run lint`, `npm test`, `npm run build` (Vite build, prerender, then the production-bundle check).
- A merge to main goes live on cruzemaps.com (Cloudflare Workers Builds) and on the GitHub Pages copy. The four Workers in `workers/` deploy by hand from their own folders (each has its own package.json, and no wrangler.jsonc pins the account): `cd workers/<name> && npm ci && CLOUDFLARE_ACCOUNT_ID=685ebf4e47ace278e464b92e6cb2e25c npx wrangler deploy`.
- Copy: every figure cites a public source, and nothing claims customers or savings Cruze has not earned (`public/llms-full.txt`, #120). Never add a DOT image or stream source outside the `VITE_LIVE_DOT_CAMERAS` flag, which is off by default.
- Open PRs and leave them open; the controller or Anudeep merges. Turn on the gitleaks hook: `git config core.hooksPath .githooks`. No AI attribution lines, no em dashes.
