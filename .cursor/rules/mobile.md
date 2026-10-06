# HabitPup mobile (Expo) — handoff notes

Read this when picking up **Play Store / EAS** or **habit-mobile** work again.

## Where things live

| What | Path |
|------|------|
| Expo app | `artifacts/habit-mobile/` |
| Development + Play plan | `artifacts/habit-mobile/DEVELOPMENT_PLAN.md` |
| EAS profiles + submit | `artifacts/habit-mobile/eas.json` |
| Store runbook (Apple + Google, secrets, checklists) | `artifacts/habit-mobile/STORE_SUBMISSION.md` |
| Production env guard (fails build if API/web/AdMob missing) | `artifacts/habit-mobile/app.config.js` |
| Android package / versioning | `artifacts/habit-mobile/app.json` |

## Google Play (high level)

- Production Android build is an **AAB** via `eas build --profile production --platform android`.
- `eas submit --profile production --platform android` uses `secrets/play-service-account.json` (gitignored) and defaults to **internal** track + **draft** in `eas.json`.
- **Package name must match Play app:** `com.habitpup.app` (see `app.json` → `android.package`).
- Production secrets: API = Render (`https://habiganize-api.onrender.com`), web origin = Netlify (`https://habitganizer.tech`), Clerk `pk_live_…`, real AdMob IDs.

## Implemented in repo

- Privacy / support / terms live on API; Netlify proxies them at `https://habitganizer.tech/{privacy,support,terms}`.
- Mobile auth opens legal URLs via `WEB_ORIGIN` then `API_URL` (`AuthScreen.tsx`).
- Production EAS builds **reject** Google sample AdMob IDs.
- Health Connect MainActivity plugin hardened (v1.0.2); offline transform check: `node scripts/verify-health-connect-plugin.cjs`.
- Friend code share uses native `Share` (not web clipboard).
- Expo SDK 54 package alignment for notifications / datetimepicker / build-properties / store-review.
- Dead local username/password auth removed (`AuthContext` / `lib/auth.ts`).
- `expo-doctor` directory check excludes known Health Connect / Clerk-transitive noise.

## Still manual / verify next time

1. **Expo:** `eas login` + `eas init` until `extra.eas.projectId` exists in `app.json`.
2. **EAS project secrets:** see `STORE_SUBMISSION.md` / `DEVELOPMENT_PLAN.md` (API, web, Clerk live, AdMob).
3. **Play upload key:** GCP service account JSON → `artifacts/habit-mobile/secrets/play-service-account.json`.
4. **Prebuild:** `pnpm exec expo prebuild --platform android --clean` and confirm `MainActivity.kt` has the Health Connect delegate.
5. **`eas build` / `eas submit`:** Require logged-in Expo account + network.

## Quick commands (from `artifacts/habit-mobile`)

```bash
pnpm --filter @workspace/habit-mobile run typecheck
node scripts/verify-health-connect-plugin.cjs
pnpm dlx expo-doctor@latest
pnpm exec eas build --profile production --platform android
pnpm exec eas submit --profile production --platform android
```

## Related Cursor rule

Broad monorepo status (web/API/mobile): `.cursor/rules/progress.md`.
