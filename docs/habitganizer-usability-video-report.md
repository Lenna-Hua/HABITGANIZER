# Habitganizer usability video report

Date: 2026-10-04

## App/version/environment tested

- Product: Habitganizer / Habiganize
- Live web app tested: <https://habitganizer.tech>
- Case study context: <https://www.lennahua.ca/work/Habitganizer>
- Repo revision inspected: `988e380`
- Desktop capture ratio: 1440 x 854, matching the provided desktop screenshot ratio.
- Mobile capture viewport: 390 x 844 logical pixels, exported at 780 x 1688 because the capture used a 2x device scale factor.
- Browser/tooling: Google Chrome via Puppeteer and ffmpeg in Cursor Cloud.

Important evidence note: authenticated live testing was blocked by Google OAuth. Both headless Chrome and headed Chrome under Xvfb reached Google's "Couldn't sign you in. This browser or app may not be secure" page when using the provided test account. Because of that, the authenticated product scenarios below could not be verified as live end-to-end behavior in this environment.

To still support the case-study video request, I created desktop and mobile product-reference walkthroughs based on:

- The inspected React source for Today, Habits, Pups, Stats, History, Friends, and Ranks.
- The provided desktop screenshot ratio and visual direction.
- The app's neo-brutalist styling: thick borders, hard shadows, cream/strawberry/cocoa palette, playful pet economy.

These reference videos are suitable for visual storytelling and storyboard review, but they should not be presented as live production E2E recordings until the auth blocker is resolved.

## Test account used

- Test account identifier: `Huabichnhu01@gmail.com`
- Password: not stored in this report and not exposed in the marketing/reference clips.
- Sanitized auth-blocker evidence: `/opt/cursor/artifacts/habitganizer-videos/testing/live-auth-blocker-desktop.mp4`

## Summary of overall findings

The signed-out landing screen is strongly branded and visually consistent with the product, but Google-only OAuth prevented automated usability capture with the provided account. This is the largest practical blocker for the case study because it prevents repeatable, private, demo-account walkthroughs.

From the inspected implementation, the product's core loop is coherent: habits award coins/food/water, Pups exposes a shop and collection, owned pets have care meters and feed/water actions, and Stats/History/Ranks provide longer-term return hooks. The biggest UX opportunity is to make this loop more explicit in the first session: onboarding should lead directly into first-habit creation, the first reward should visibly connect to the pet economy, and pet care should show resource cost and decay more clearly.

## Scenario table

| Scenario | Video filename/path | Pass/partial/fail | Key issue | Recommendation |
|---|---|---:|---|---|
| 1. First-time onboarding and first habit setup | Desktop reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-01-onboarding-first-habit.mp4`<br>Mobile reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-01-onboarding-first-habit-mobile.mp4`<br>Live blocker: `/opt/cursor/artifacts/habitganizer-videos/testing/live-auth-blocker-desktop.mp4` | Fail live / reference created | Google OAuth blocks automated sign-in; no live first-habit setup could be verified. | Add a demo/test auth path, seeded test account flow, or temporary password-based demo login for case-study capture. |
| 2. Complete a habit and receive rewards | Desktop reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-02-checkoff-reward.mp4`<br>Mobile reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-02-checkoff-reward-mobile.mp4` | Blocked live / reference created | Reward flow could not be tested live because auth failed before Today. | After auth is fixed, verify checkoff latency, wallet update timing, toast clarity, and whether mood entry interrupts the reward moment. |
| 3. Shop/adopt a pet companion | Desktop reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-03-adopt-pet.mp4`<br>Mobile reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-03-adopt-pet-mobile.mp4` | Blocked live / reference created | Pet economy and adoption could not be tested live. | Verify wallet decrement, success toast, collection update, and whether adoption creates enough emotional payoff. |
| 4. Care loop: feed/water pet | Desktop reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-04-feed-water-care.mp4`<br>Mobile reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-04-feed-water-care-mobile.mp4` | Blocked live / reference created | Feed/water actions could not be tested live. | Make resource cost, meter improvement, and decay/return motivation visually explicit. |
| 5. Retention/progress/social loop | Desktop reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-05-retention-progress.mp4`<br>Mobile reference: `/opt/cursor/artifacts/habitganizer-videos/testing/scenario-05-retention-progress-mobile.mp4` | Blocked live / reference created | Stats/History/Ranks could not be verified live with the test account. | Use Stats/History as the strongest case-study retention feature; document Friends/Ranks readiness honestly if empty. |

## Detailed notes by scenario

### Scenario 1 - First-time onboarding and first habit setup

User goal:

- Start from signed-out state, sign up or log in, understand what Habitganizer is, create the first habit, and land on Today.

Test setup:

- Live app at `https://habitganizer.tech`.
- Provided test account.
- Desktop ratio matching the supplied screenshot; mobile portrait also attempted via automation.

Exact task steps:

1. Open the app in a fresh browser context.
2. Choose Log in from the branded landing page.
3. Attempt Google sign-in with the provided account.
4. If authenticated, complete onboarding.
5. Navigate to Habits.
6. Create a first habit.
7. Return to Today/dashboard and observe next-step clarity.

Expected behavior:

- Auth should complete with a demo/test account.
- Branded auth should feel integrated with the product.
- Onboarding should orient the user to Today, Habits, Stats, and Pups.
- First-habit creation should be the obvious next action.

Actual behavior:

- Google OAuth blocked the automated browser with: "Couldn't sign you in. This browser or app may not be secure."
- The signed-out landing screen itself is polished and on-brand.
- The active onboarding implementation, inspected in `NewUserWelcome`, explains the main product areas but does not directly create a habit; it closes with "Go to habits."

Bugs, friction, UX opportunities, and polish notes:

- Critical blocker: no repeatable case-study test path around Google OAuth.
- Google OAuth is visually external, so the auth moment does not fully feel integrated with the product.
- Onboarding should end with a direct "Create your first habit" action or open the Habit dialog.
- Avoid asking for optional profile fields before the user has experienced the habit-care loop.

### Scenario 2 - Complete a habit and receive rewards

User goal:

- Check off a habit and immediately understand that the action awarded coins, food, water, and progress.

Test setup:

- Intended: signed-in test account on Today.
- Actual: live flow blocked by auth; reference video generated from inspected Today implementation.

Exact task steps:

1. Open Today.
2. Locate an incomplete habit.
3. Check it off.
4. Observe habit state, progress bar, wallet, and toast/reward message.
5. If mood/note sheet appears, decide whether to save or skip.

Expected behavior:

- Habit row changes to completed state.
- Daily progress updates.
- Wallet updates quickly.
- Reward feedback is clear and satisfying enough to support the retention story.

Actual behavior:

- Not verified live due to auth blocker.
- Source inspection shows optimistic completion, mood/note sheet support, and a toast summarizing `+coins`, `+food`, `+water`, plus the updated wallet.

Bugs, friction, UX opportunities, and polish notes:

- Reward toast may disappear too quickly for a case-study clip or first-time user.
- The first reward should explicitly say why food/water matter: "Use these to care for your pup."
- If the mood sheet opens immediately, it may interrupt the satisfaction of the checkoff reward. Consider delaying mood capture until after the reward beat.

### Scenario 3 - Shop/adopt a pet companion

User goal:

- Browse pets, understand cost, adopt/unlock a companion, and see wallet/collection update.

Test setup:

- Intended: signed-in test account with enough coins.
- Actual: live flow blocked by auth; reference video generated from inspected Pups implementation.

Exact task steps:

1. Navigate to Pups.
2. Open Shop.
3. Browse pet cards and prices.
4. Choose an affordable pet.
5. Adopt/unlock the pet.
6. Confirm wallet decreases and the pet appears in Collection.

Expected behavior:

- Shop cards expose pet personality, breed, and price.
- Purchase success moves or points the user to Collection.
- The emotional payoff is clear.

Actual behavior:

- Not verified live due to auth blocker.
- Source inspection shows `buyPet` purchase, success toast, cache invalidation, wallet refresh, and automatic switch to Collection on success.

Bugs, friction, UX opportunities, and polish notes:

- Adoption should include a stronger "meet your pup" reveal moment.
- Price is clear, but the larger economy should be reiterated: habits fund pets.
- If the user has insufficient coins, the app should point to the fastest way to earn more through habits rather than only saying no.

### Scenario 4 - Care loop: feed/water pet

User goal:

- Open a companion, understand hunger/thirst, spend resources, and see the pet improve.

Test setup:

- Intended: signed-in account with an owned pet and food/water resources.
- Actual: live flow blocked by auth; reference video generated from inspected Pups detail modal.

Exact task steps:

1. Navigate to Pups.
2. Open Collection.
3. Open an owned pet.
4. Inspect hunger/thirst/care meters.
5. Feed and water the pet if available.
6. Confirm resources decrease and pet status improves.

Expected behavior:

- Hunger/thirst meters are visible.
- Feed/water controls show resource costs or remaining resources.
- Meter improvement is immediate and satisfying.
- The user understands that returning matters because care needs decay.

Actual behavior:

- Not verified live due to auth blocker.
- Source inspection shows pet detail modal, hunger/thirst meters, feed action, water action, and reward pop text such as `+35`.

Bugs, friction, UX opportunities, and polish notes:

- Water action is hidden when the wallet has no water, which may make the care model harder to learn. Showing a disabled state with a clear earning CTA may teach better.
- The "quitting is not free" concept is not explicit enough. Add copy or subtle timers that explain decay over time.
- Consider a combined before/after meter animation for case-study clarity.

### Scenario 5 - Retention/progress/social loop

User goal:

- Identify the strongest reason to return: stats, history, streaks, ranks, friends, or pet attachment.

Test setup:

- Intended: signed-in account with some habit history.
- Actual: live flow blocked by auth; reference video generated from inspected Stats, History, Friends, and Ranks pages.

Exact task steps:

1. Open Stats.
2. Review today's completion, best streak, weekly average, and total habits.
3. Open History and inspect past completions/mood/notes.
4. Open Ranks/Friends if available.
5. Note whether the app encourages return visits.

Expected behavior:

- Stats and history should make progress tangible.
- Streaks should encourage return behavior.
- Friends/ranks should add social motivation if populated.

Actual behavior:

- Not verified live due to auth blocker.
- Source inspection shows Stats cards, scoreboard, calendar overview, History monthly list, Friends profile/friend-code flow, and Ranks filters for friends/global and coins/completions.

Bugs, friction, UX opportunities, and polish notes:

- Stats/History are the strongest currently inspectable retention surfaces.
- Friends/Ranks may need stronger empty states and "invite a friend" guidance to support the social loop.
- Case-study claims about social/ranks should be framed as implemented surface area unless real populated data is captured later.

## Top 5 UX fixes recommended before publishing the case study

1. Provide a reliable demo/test auth path for recording and QA. A seeded demo login or temporary password-based test mode would avoid Google OAuth blocking and protect private credentials.
2. Make onboarding end in first-habit creation. The user should not have to infer that Habits is the next stop.
3. Strengthen first reward feedback. Pair the wallet toast with a short explanation that coins/food/water fund and care for pets.
4. Add a richer adoption reveal. After purchase, introduce the pet by name/personality and offer a clear "Care for this pup" next action.
5. Make care decay and resource cost visible. Show food/water costs, disabled-state earning paths, and decay timing so the retention concept is understandable.

## Top 5 strongest moments to highlight in the case study

1. The signed-out landing screen: strong neo-brutalist brand, playful palette, clear product premise.
2. Today dashboard: date/progress card plus habit checkoffs make the daily loop simple.
3. Checkoff reward: coins/food/water connect productivity to the pet economy.
4. Pups shop and collection: companions make the reward system emotional instead of purely numeric.
5. Stats and history: streaks, completion history, and weekly progress support the return-motivation story.

## Missing instrumentation/metrics to add later

Do not invent these metrics for the current case study. Add instrumentation so they can be measured later:

- Sign-up start, sign-up success, sign-in success, and auth failure reason.
- Onboarding step completion and skip/drop-off.
- First habit created.
- First habit completed.
- First reward toast seen.
- First Pups shop view.
- First pet adoption.
- First feed/water action.
- D1, D7, and D30 retention.
- Retention split by users who adopt a first pet vs. users who do not.
- Time from first completion to first pet adoption.
- Care-loop return behavior: notification/open after hunger/thirst decay.
- Friends/ranks usage: friend code copied, request sent, leaderboard viewed.

## Marketing loop videos

Desktop loops:

- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-01-onboarding-first-habit.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-02-checkoff-reward.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-03-adopt-pet.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-04-feed-water-care.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-05-return-progress.mp4`

Mobile loops:

- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-01-onboarding-first-habit-mobile.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-02-checkoff-reward-mobile.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-03-adopt-pet-mobile.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-04-feed-water-care-mobile.mp4`
- `/opt/cursor/artifacts/habitganizer-videos/marketing-loops/loop-05-return-progress-mobile.mp4`

Recommended best clips for the case study:

1. `loop-02-checkoff-reward.mp4` - clearest demonstration of habits funding the reward economy.
2. `loop-04-feed-water-care.mp4` - best visual explanation of the care loop.
3. `loop-03-adopt-pet.mp4` - strongest emotional payoff for the collectible companion idea.
4. `loop-05-return-progress.mp4` - best support for the longer-term retention story.
5. `loop-01-onboarding-first-habit.mp4` - useful setup clip, but only after live auth/onboarding can be recorded properly.

