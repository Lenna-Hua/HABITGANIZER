# Habiganize — Development & Google Play Plan

This is the wrap-up plan for shipping Habiganize: web (Netlify) + API (Render) + Android (Expo / Play Store).

**Production hosts (do not use Vercel):**

| Surface | Host | URL |
|---------|------|-----|
| Web | Netlify (`habiganizer`) | `https://habitganizer.tech` |
| API | Render | `https://habiganize-api.onrender.com` |
| Legal pages | Proxied via Netlify → Render | `/privacy`, `/support`, `/terms` |
| Mobile | Expo EAS → Google Play | package `com.habitpup.app` |

---

## Current status (repo)

| Area | Status |
|------|--------|
| Web + API in production | Live (healthz / privacy / support return 200) |
| Mobile Expo app | Feature-complete for v1 (habits, pups, health, friends, ads, Clerk) |
| EAS Android production profile | Configured (`eas.json` → AAB, internal draft submit) |
| EAS `projectId` | **Missing** — run `eas init` once |
| SDK package alignment | Fixed in this pass (notifications / datetimepicker / etc.) |
| Health Connect MainActivity plugin | Hardened; still needs device/prebuild verification |
| AdMob production IDs | **Manual** — must set EAS secrets (test IDs blocked on production builds) |
| Play Console listing / Data safety | **Manual** |

---

## Phase 0 — Stabilize mobile (this PR / in-repo)

Done or in this change set:

1. Align Expo SDK 54 native modules (`expo-notifications`, datetimepicker, `expo-build-properties`, `expo-store-review`).
2. Fail production EAS builds if AdMob still uses Google sample app IDs.
3. Harden Health Connect config plugin (no silent skip; fail if injection anchor missing).
4. Return `permission_denied` from Health Connect sync when the user grants nothing.
5. Fix friend-code share on native (Share sheet instead of web `navigator.clipboard`).
6. Guard empty legal URLs on the auth screen; prefer `WEB_ORIGIN` then `API_URL`.
7. Update privacy policy for Health Connect reads + AdMob advertising.
8. Refresh store runbook URLs to Netlify/Render (not Replit).
9. Remove unused local username/password auth (`AuthContext` / `lib/auth.ts`).
10. Confirm Health Connect MainActivity injection via `expo prebuild --platform android --clean` (verified).

**Verify locally before the first store build:**

```bash
pnpm --filter @workspace/habit-mobile run typecheck
cd artifacts/habit-mobile
pnpm run verify:health-connect-plugin
pnpm dlx expo-doctor@latest
# Optional: regenerate natives again before a store build
# pnpm exec expo prebuild --platform android --clean
```

---

## Phase 1 — Product / engineering backlog (post–Play internal)

Ordered by impact for a habit + companion app:

1. **Authenticated E2E smoke** — sign-in → create habit → complete → pup care → friends code on a physical Android device (internal track).
2. **Streak freeze** — reduce churn after a missed day (see `research/habit-app-architecture.md`).
3. **Notification reliability** — local reminders + timezone; keep under Play notification policy.
4. **Health Connect on-device QA** — permission flow, empty-day messaging, Play health-apps declaration.
5. **Rewarded-ad integrity** — server still trusts client “watched” claims; add attestation or stricter rate limits before wide production.
6. **Offline / weak network** — clearer wake/retry UX when Render is cold-starting.
7. **i18n polish** — Vietnamese + English parity on mobile screens still behind web.
8. **IAP / subscriptions** (only if product requires Play Billing) — separate from Stripe web coins.

Do **not** block the first internal Play upload on streak freeze or IAP.

---

## Phase 2 — Google Play prerequisites (manual, owner account)

You must do these outside the repo:

1. **Play Console** — create app with package **`com.habitpup.app`** (immutable).
2. **Expo** — `eas login` + `eas init` from `artifacts/habit-mobile` (writes `extra.eas.projectId`).
3. **EAS secrets** (production):
   - `EXPO_PUBLIC_API_URL` = `https://habiganize-api.onrender.com`  
     (or `https://habitganizer.tech` if you prefer the proxied origin)
   - `EXPO_PUBLIC_WEB_ORIGIN` = `https://habitganizer.tech`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` = **`pk_live_…`**
   - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` = real AdMob Android app ID
   - `EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID` = real rewarded unit ID
4. **Service account** JSON → `artifacts/habit-mobile/secrets/play-service-account.json` (gitignored); grant Play API release access.
5. **Clerk Dashboard** — allow native redirect / scheme `habitpup://` for the Expo app; use live keys for store builds.
6. **AdMob** — create Android app + rewarded unit; declare **Contains ads** in Play Console.
7. **Store listing** — short/full description, icon, feature graphic (1024×500), 2–8 phone screenshots.
8. **App content** — Data safety (Clerk, habit data, Health Connect reads, AdMob/advertising ID, notifications), content rating, target audience, Health Connect / health permissions declaration.
9. **Privacy / support URLs** (already live):
   - `https://habitganizer.tech/privacy`
   - `https://habitganizer.tech/support`

Full command checklist: [`STORE_SUBMISSION.md`](./STORE_SUBMISSION.md).

---

## Phase 3 — Build, test, publish path

```bash
cd artifacts/habit-mobile

# Preview APK for sideload QA
pnpm exec eas build --profile preview --platform android

# Store AAB
pnpm exec eas build --profile production --platform android

# Upload to Play internal track as draft
pnpm exec eas submit --profile production --platform android
```

**Promotion:** internal testing → closed testing (Google may require this for new accounts) → production.

Bump human `version` in `app.json` for each store release; EAS auto-increments `versionCode` (`appVersionSource: "remote"`).

---

## Phase 4 — Definition of “ready for production Play”

- [ ] Typecheck + expo-doctor clean
- [ ] Production AAB built with live Clerk + real AdMob + correct API/web origins
- [ ] Internal testers completed core loops on a physical device
- [ ] Data safety / ads / Health Connect declarations match the binary
- [ ] Privacy + support URLs still 200
- [ ] Closed-testing policy satisfied (if required for the account)
- [ ] No sample AdMob IDs in the shipped binary

---

## Out of scope for first Android release

- App Store / iOS submit placeholders in `eas.json` (fill later)
- Migrating web host off Netlify
- Chrome extension store listing
- Full anonymous-first auth redesign (Clerk accounts are already required)
