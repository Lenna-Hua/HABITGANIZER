# HabitPup — context sync (`progress.md`)

Read this file at the start of a **new chat** before doing major work.

## Workspace location

- **Canonical repo path (from 2026-05-28)**: `H:\habiganize-source` (Lexar `H:` drive).
- **All future work** — edits, terminals, installs, and agent sessions — should use this folder, not `C:\Users\Admin\Downloads\habiganize-source`.
- Open in Cursor: **File → Open Folder** → `H:\habiganize-source`.

## Current Status

- **Monorepo (pnpm workspaces)**: `artifacts/*` apps + shared `lib/*`. Install requires **pnpm**; root `preinstall` expects POSIX `sh` (use **Git Bash** on Windows if install fails).
- **Production hosting**: **Netlify** web (`habiganizer` → `https://habitganizer.tech`, GitHub `main` auto-build) + **Render** API (`https://habiganize-api.onrender.com`). Not Vercel.
- **Web (`@workspace/habit-tracker`)**: Vite + React + Clerk + TanStack Query + Wouter + Tailwind v4. Root **`envDir`** loads `.env`. **Canonical local ports**: **`PORT=3001`** (API only), **`VITE_DEV_PORT=5173`** (Vite — must differ from **`PORT`**), **`API_URL=http://localhost:3001`** in root `.env` so the **`/api` proxy** never targets the wrong origin (fixes “couldn’t load habits” / port mismatch symptoms). **`vite.config.ts`** also **falls back proxy to port 3001** if **`PORT`** mistakenly equals the web dev port (e.g. stale shell **`export PORT=5173`**). **`strictPort: true`**: if **5173 is already in use**, Vite exits — stop the other process or set **`VITE_DEV_PORT`** to a free port. **`Instructions.md`** previously suggested **`export PORT=5173`** before Vite; that **must not be used** — it overrides **`PORT`** and broke proxy routing (**fixed in repo**).
- **API (`@workspace/api-server`)**: Express 5 + Clerk + Drizzle/pg; mounts **`/api`**, optional static SPA when `habit-tracker/dist/public` exists. **`cross-env`** on `dev` / `dev:local` scripts for Windows. Local **`dev`** / **`dev:local`** runs Node with **`--env-file=../../.env`** so **`PORT`**, **`DATABASE_URL`**, and Clerk keys from the repo root `.env` load without manual exports (**`start`** unchanged for deploy). Production bundle: **`artifacts/api-server/dist/index.mjs`**.
- **Database (`@workspace/db`)**: Drizzle + PostgreSQL. **`pnpm --filter @workspace/db run push`** loads repo-root `.env` (finds workspace via `pnpm-workspace.yaml`).
- **`pnpm run typecheck`**: Currently **fails** on `@workspace/api-server` (project-reference / implicit-`any` issues). **`pnpm --filter`** builds for habit-tracker and api-server **succeed**.
- **Mobile (`@workspace/habit-mobile`)**: Expo 54; EAS profiles in `eas.json`; store checklist in `STORE_SUBMISSION.md` (see **Mobile deploy** below).
- **Android Health Connect (WIP — pick up tomorrow)**: Wired **read** sync from **Health Connect** into existing health APIs (steps, active kcal, sleep, HR). **Stand-ups** stay manual (not modeled in HC). Dependencies: **`react-native-health-connect`**, **`expo-health-connect`**, **`expo-build-properties`** (`minSdkVersion` 26). **UI**: Android-only **“Sync from Health Connect”** on **`app/(tabs)/health.tsx`** (`testID="health-sync-phone"`). **`pnpm install`** on bare Windows may need **`--ignore-scripts`** if root **`preinstall`** fails (missing **`sh`**). **`android/` is gitignored** — EAS/local prebuild regenerates natives.

## Tech Stack

- **Package manager**: pnpm (`pnpm-workspace.yaml`, catalogs, `minimumReleaseAge`)
- **Web**: Vite 7, React 19 (catalog-pinned where required), Clerk (`@clerk/react`), `@tanstack/react-query`, `wouter`, Tailwind `@tailwindcss/vite`, Radix-heavy UI under `artifacts/habit-tracker/src/components/ui`
- **API**: Node, Express 5, `@clerk/express`, `drizzle-orm`, `pg`, `pino`, `esbuild` bundle (`build.mjs`)
- **DB**: Drizzle Kit push, Postgres (e.g. Neon)
- **API client**: Generated Orval hooks in `@workspace/api-client-react` (`custom-fetch`, relative **`/api/...`** paths in browser)
- **Mobile (Android health)**: `react-native-health-connect` + **`expo-health-connect`** config plugin (manifest intents); local plugin patches **MainActivity** (see Pending).

## Critical Files

| Area | Files |
|------|--------|
| Root env template | [.env.example](.env.example) (`PORT`, `VITE_DEV_PORT`, `API_URL` documented for local web + API) |
| Workspace layout | [pnpm-workspace.yaml](pnpm-workspace.yaml), [package.json](package.json) |
| Web Vite env + proxy | [artifacts/habit-tracker/vite.config.ts](artifacts/habit-tracker/vite.config.ts) (`loadEnv`, `VITE_DEV_PORT`, `API_URL` / `PORT` for proxy target) |
| Clerk (web SPA) | [artifacts/habit-tracker/src/App.tsx](artifacts/habit-tracker/src/App.tsx) (`VITE_CLERK_PUBLISHABLE_KEY`, `ClerkApiSessionTokenBridge`, optional `VITE_CLERK_PROXY_URL`) |
| API entry + static SPA | [artifacts/api-server/src/index.ts](artifacts/api-server/src/index.ts), [artifacts/api-server/src/app.ts](artifacts/api-server/src/app.ts) |
| Clerk proxy (production) | [artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts](artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts) (`/api/__clerk`) |
| Auth scope / DB wallet | [artifacts/api-server/src/middlewares/user-scope.ts](artifacts/api-server/src/middlewares/user-scope.ts) |
| Drizzle push + repo `.env` | [lib/db/drizzle.config.ts](lib/db/drizzle.config.ts) |
| DB schema | [lib/db/src/schema/](lib/db/src/schema/) |
| Fetch layer + generated API | [lib/api-client-react/src/custom-fetch.ts](lib/api-client-react/src/custom-fetch.ts), [lib/api-client-react/src/generated/api.ts](lib/api-client-react/src/generated/api.ts) |
| Mobile env example | [artifacts/habit-mobile/.env.example](artifacts/habit-mobile/.env.example) |
| Android Health Connect | [artifacts/habit-mobile/app.json](artifacts/habit-mobile/app.json) (plugins + `android.permission.health.READ_*`), [artifacts/habit-mobile/plugins/withHealthConnectMainActivity.js](artifacts/habit-mobile/plugins/withHealthConnectMainActivity.js), [artifacts/habit-mobile/lib/healthConnectPhoneSync.android.ts](artifacts/habit-mobile/lib/healthConnectPhoneSync.android.ts), [artifacts/habit-mobile/lib/healthConnectPhoneSync.ts](artifacts/habit-mobile/lib/healthConnectPhoneSync.ts) (iOS/Web stub), [artifacts/habit-mobile/app/(tabs)/health.tsx](artifacts/habit-mobile/app/(tabs)/health.tsx) |

## Local dev checklist (web + API)

1. Copy `.env.example` → `.env`; set **`DATABASE_URL`**, Clerk keys (**`CLERK_*`**, **`VITE_CLERK_PUBLISHABLE_KEY`** match).
2. Set **`PORT=3001`** (API listen), **`VITE_DEV_PORT=5173`** (Vite), **`API_URL=http://localhost:3001`** (proxy target — **recommended**, not optional for reliable local **`/api`**).
3. **Do not** `export PORT=5173` in the terminal before Vite; use **`VITE_DEV_PORT`** for the web port.
4. Terminal A: **`pnpm --filter @workspace/api-server run dev:local`**
5. Terminal B: **`pnpm --filter @workspace/habit-tracker run dev`** → open **`http://localhost:5173`** (or whatever Vite prints). **SPA in dev is Vite**, not **`http://localhost:3001`** unless the built **`habit-tracker/dist/public`** is present and served by the API.

## Recent progress (sessions)

- **2026-05-28** — **Moved monorepo to `H:\habiganize-source`** (full robocopy from Downloads). **From now on, treat `H:\habiganize-source` as the only workspace**; the old `C:\Users\Admin\Downloads\habiganize-source` copy can be removed after verification.
- **2026-05-15** — **Web (`habit-tracker`) landing + theme**: Refined signed-out **`WelcomePage`** in [`App.tsx`](artifacts/habit-tracker/src/App.tsx) (gradient background, soft glow, gradient header, theme-aware shadows). Global palette + brutal utilities in [`index.css`](artifacts/habit-tracker/src/index.css) now use **`hsl(var(--foreground))`** for offset shadows/borders (was hardcoded black). [`layout.tsx`](artifacts/habit-tracker/src/components/layout.tsx) sidebar/mobile nav shadows aligned. [`clerk-appearance.ts`](artifacts/habit-tracker/src/lib/clerk-appearance.ts) colors matched to the SPA. **Follow-up tweak (same theme pass)**: Restored **original golden accent** (`--accent: 48 92% 56%`, `--accent-foreground: near black`). Replaced purple-brown ink with **cocoa brown** text/borders and **warm cream** page background; **destructive** → terracotta (`8 72% 48%`); Clerk neutrals/danger hexes updated to match (`#3a2f26`, `#faf6f0`, `#c75038`, etc.).
- **2026-05-09**: Aligned root **`.env`** with **`PORT=3001`**, **`VITE_DEV_PORT=5173`**, **`API_URL=http://localhost:3001`**; preserved **`DATABASE_URL`** / Clerk secrets. Repo updates: **`vite.config.ts`** proxy guard when **`PORT`** == web port; **`api-server`** **`dev`** / **`dev:local`** load **`../../.env`** via **`--env-file`**; **`.env.example`** + **`Instructions.md`** clarified to avoid **`PORT`** / Vite collisions; **`strictPort`** / port-in-use called out above.
- **2026-05-10**: **Android Health Connect** — deps + **`app.json`** plugins/perms/sync UI/sync module (aggregate today UTC-aligned with backend **`todayStr`**). **Blocked for next agent**: **`withHealthConnectMainActivity.js`** did **not** leave **`HealthConnectPermissionDelegate.setPermissionDelegate(this)`** in generated **`MainActivity.kt`** after **`expo prebuild --clean`** — must fix plugin (Expo 54 **`withMainActivity`** / **`modResults`** shape or injection anchor after **`super.onCreate(...)`**) and re-verify prebuild; then device test **`requestPermission`** + sync. **`pnpm exec tsc -p artifacts/habit-mobile/tsconfig.json`** still reports existing errors in **`app/(tabs)/pups.tsx`** (not introduced by HC).
- **2026-05-13**: Implemented **no-cost friends + leaderboard backend** (keep everything in your own Postgres + Express; no extra social/leaderboard vendor). Added DB schema in **`lib/db/src/schema/social.ts`** (`user_social_profiles`, `friend_requests`, `friendships`), added API routes in **`artifacts/api-server/src/routes/social.ts`** (friend code profile + update, send/accept/decline/cancel requests, list friends, leaderboard by `coins` or completion counts with `scope=friends|global`), registered the router in **`artifacts/api-server/src/routes/index.ts`**, updated **`lib/api-spec/openapi.yaml`**, and regenerated client types via **`pnpm --filter @workspace/api-spec run codegen`**.
- **2026-06-01**: **Typecheck + build fixes**: Built lib `.d.ts` files (`tsc --build --force`), fixed `pups.tsx` (TanStack Query v5 `queryKey` type), `calendar.tsx` (ref cast), `spinner.tsx` (`forwardRef`). All shippable packages pass typecheck. **Social DB migrations**: Drizzle push created social tables. **API verification**: All social endpoints verified (proper auth protection). API server + web frontend both build successfully.

## Pending Tasks

1. **Android Health Connect — device QA**: ✅ Prebuild injection verified (`MainActivity.kt` contains `setPermissionDelegate`). Offline transform check: `scripts/verify-health-connect-plugin.cjs`. Still need on-device sync QA on a physical Android device.
2. **Google Play publish path**: Follow `artifacts/habit-mobile/DEVELOPMENT_PLAN.md` + `STORE_SUBMISSION.md` — `eas init`, EAS secrets (API/web/Clerk live/AdMob), Play Console listing, Data safety, Health Connect declaration, internal → closed → production.
3. **Operational**: Prefer `pnpm --filter @workspace/api-server run dev:local` for API during web dev; root `.env` must stay out of commits.
4. **End-to-end testing**: Authenticated mobile smoke on a physical Android device (internal track) still needed.
5. **Product backlog (post–internal)**: Streak freeze, ad-reward server integrity, i18n parity — see DEVELOPMENT_PLAN.md Phase 1.

## Mobile deploy — progress and remaining work

**In place**

- Expo app under `artifacts/habit-mobile` with `eas.json` (development / preview / production store profiles).
- `DEVELOPMENT_PLAN.md` + `STORE_SUBMISSION.md` for Play/App Store (Netlify + Render URLs, AdMob secrets, Data safety).
- `app.config.js` production guards for API/web origin **and** real AdMob IDs.
- Clerk + API wiring with `useLayoutEffect` token bridge; legal links via `WEB_ORIGIN` / `API_URL`.
- Health Connect read sync UI + hardened MainActivity plugin; permission_denied when grants empty.
- Privacy HTML discloses Clerk, Health Connect reads, and AdMob.

**To do before store release**

1. `eas login` / `eas init` → `extra.eas.projectId`.
2. EAS secrets: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_ORIGIN`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`), AdMob Android + rewarded unit IDs.
3. `secrets/play-service-account.json` + Play Console app `com.habitpup.app`.
4. Listing assets, Data safety, ads + Health Connect declarations.
5. `eas build --profile production --platform android` then `eas submit` (internal draft).
6. IAP / subscriptions only if product requires Play Billing.
