# Web deploy — Netlify only

Habiganize **web** (`artifacts/habit-tracker`) is hosted on **Netlify**. Do not create or reconnect a Vercel Git integration for this repository.

| Piece | Host |
|-------|------|
| Web SPA | **Netlify** (`habiganizer` → `https://habitganizer.tech`) |
| API | **Render** (`https://habiganize-api.onrender.com`) |
| Mobile | Expo / EAS (not Netlify) |

Netlify proxies `/api`, `/privacy`, `/support`, and `/terms` to Render (see `netlify.toml`).

## Why PRs show a red Vercel check

The GitHub repo is still linked to a leftover Vercel project (`habiganizer/habitganizer`). Every PR triggers a Vercel Preview that fails (wrong/outdated build settings). **Netlify Preview is the real web deploy** and succeeds.

Root `vercel.json` sets `git.deploymentEnabled: false` and an `ignoreCommand` so Vercel should stop building from Git once this lands on the branch/main.

## Fully remove Vercel (one-time, in dashboard)

I cannot disconnect Vercel from this cloud environment. Please:

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project **habitganizer**.
2. **Settings → Git → Disconnect** the GitHub repo (or delete the Vercel project).
3. Optional: on GitHub → repo **About** → clear homepage if it still points at `*.vercel.app`; use `https://habitganizer.tech`.

## Preview

- **Local:** `pnpm --filter @workspace/habit-tracker run dev` → `http://localhost:5173`
- **Netlify:** deploy previews from the Netlify ↔ GitHub site connection (not Vercel).
