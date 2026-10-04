# Clerk production test-admin runbook

Use this runbook when a team member needs a shared account for production smoke
tests, portfolio walkthrough recordings, or support debugging on
`https://habitganizer.tech`.

## Important hosting/auth facts

- The web app is deployed on **Netlify** (`habiganizer`).
- The API is deployed on **Render** (`https://habiganize-api.onrender.com`).
- The web app authenticates with Clerk through `@clerk/react`.
- API requests are accepted only when Clerk can verify the session JWT.

Both Netlify and Render must point to the **same Clerk production application**:

| Host | Required variables |
| --- | --- |
| Netlify web | `VITE_CLERK_PUBLISHABLE_KEY` |
| Render API | `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |

`VITE_CLERK_PUBLISHABLE_KEY` is baked into the static web bundle at build time.
Changing the Netlify environment variable does not affect the already-published
site until Netlify builds and publishes a new deploy.

## Why a Clerk user can exist but live login says "Couldn't find your account"

This usually means the live web bundle is using a different Clerk application
than the dashboard where the user was created.

Common causes:

1. The user was created in Clerk **Development** instead of **Production**.
2. Netlify production has an old or wrong `VITE_CLERK_PUBLISHABLE_KEY`.
3. Netlify auto deploys are paused/stopped, so an env-var fix was never rebuilt.
4. Render has `CLERK_SECRET_KEY` from a different Clerk app than Netlify.
5. The Clerk user was created with a username but no verified email identifier.

## Verify the live web app's Clerk application

The Clerk publishable key is not secret. You can compare it against Clerk
Dashboard -> API Keys.

From a terminal:

```bash
python3 - <<'PY'
import base64, re, urllib.request

html = urllib.request.urlopen("https://habitganizer.tech", timeout=20).read().decode()
asset = re.search(r'assets/[^"\']+\.js', html).group(0)
js = urllib.request.urlopen("https://habitganizer.tech/" + asset, timeout=20).read().decode()

for key in sorted(set(re.findall(r"pk_(?:test|live)_[A-Za-z0-9_-]+", js))):
    b64 = key.split("_", 2)[2]
    b64 += "=" * ((4 - len(b64) % 4) % 4)
    print(key[:18] + "...", "=>", base64.urlsafe_b64decode(b64).decode())
PY
```

The decoded value should match the Clerk production app that contains the test
user. For this project, the expected frontend API host is currently:

```text
clerk.habitganizer.tech
```

If the decoded value does not match the Clerk app you are viewing, update
Netlify's `VITE_CLERK_PUBLISHABLE_KEY` from the correct Clerk Production app and
trigger a fresh Netlify deploy.

## Verify Render uses the same Clerk app

In Render -> API service -> Environment:

```env
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

Both values must come from the same Clerk Production app as the Netlify
`VITE_CLERK_PUBLISHABLE_KEY`.

If Netlify and Render are mismatched, login may succeed but API calls can fail
with `401 Unauthorized`.

## Netlify redeploy checklist after Clerk env changes

1. Netlify -> `habiganizer` -> Site configuration -> Environment variables.
2. Update `VITE_CLERK_PUBLISHABLE_KEY`.
3. Go to Deploys.
4. Trigger **Clear cache and deploy site** or push a new commit to `main`.
5. Confirm a deploy occurred after the environment variable change.
6. Re-run the live-key verification command above.

If auto deploys are paused, environment changes will sit unused until a manual
deploy is triggered.

## Create a safe production test-admin user

In Clerk Dashboard -> Production -> Users:

1. Create a dedicated user, for example:

   ```text
   portfolio-test@yourdomain.com
   ```

2. Mark the email address as verified.
3. Set a temporary password.
4. Disable MFA for this test user unless the tester has access to the factor.
5. If the app later adds role checks, add Clerk public metadata:

   ```json
   {
     "role": "admin",
     "purpose": "production-smoke-test"
   }
   ```

6. Store the credential in the team's password manager, not in Git.
7. Rotate or delete the user after the recording/support task if it is no longer
   needed.

Prefer one named test user per environment:

| Environment | Example user |
| --- | --- |
| Clerk Development | `dev-smoke-test@yourdomain.com` |
| Clerk Production | `portfolio-test@yourdomain.com` |

Do not use a real owner/admin personal account for recordings.

## Recommended team workflow

1. Keep `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, and
   `CLERK_SECRET_KEY` documented as coming from the same Clerk Production app.
2. When keys are rotated, update both Netlify and Render.
3. Trigger a new Netlify deploy after changing web env vars.
4. Verify the live bundle decodes to the expected Clerk frontend API host.
5. Sign in with the dedicated test-admin account.
6. Smoke-test:
   - login
   - `/api/healthz`
   - habit list/create/complete
   - wallet/rewards
   - stats/history
   - pups
   - health
   - friends/leaderboard

## Avoid production auth bypasses

Do not add a secret "bypass login" account or query parameter to production.
For demos and testing, use Clerk's production test user plus role metadata. If a
non-Clerk demo mode is ever needed, keep it on a separate preview domain or
behind a deploy context that cannot access production user data.
