# Release Test Checklist

Use this checklist before submitting a new build of `the-book-of-answers`.

The goal is to validate the real-device sunrise experience, especially the opt-in background-audio behavior, the poster export path, the hidden-classic-mode fallback redirect, and the responsive layout changes added in the recent iterations.

## Recommended Device Coverage

- `iPhone full-screen device`: e.g. iPhone 13, 14, or 15
- `Small-screen phone`: e.g. iPhone SE class or a compact Android device
- `HarmonyOS / Android device`: when available, to verify safe-area and compatibility behavior

## Test Rules

- Run all scenarios on a real device inside WeChat, not only in DevTools.
- Test at least one clean-install path with no prior local storage.
- Test at least one upgrade path with existing history and favorites already stored.
- Revoke photo album permission once before testing the poster permission recovery flow.

## Scenario Checklist

### 1. Cold Launch And First Render

- [ ] Open the Mini Program from a cold start on a full-screen device.
- [ ] Confirm the app opens without white screen, timeout, or stuck loading state.
- [ ] Confirm the initial page layout is complete and no hidden legacy navigation appears.
- [ ] Confirm there is no obvious overlap between content, bottom controls, and the safe area.

### 2. Legacy Classic Mode Redirect

- [ ] Open `pages/answers` manually through DevTools or an old internal path.
- [ ] Confirm the Mini Program immediately redirects to `pages/sun_rise`.
- [ ] Confirm the redirect does not flash a long white screen or leave the app in a broken state.

### 3. Sunrise Mode First-Time Experience

- [ ] Enter `pages/sun_rise` from a normal app launch.
- [ ] Confirm the tutorial text and visual guidance appear correctly on first entry.
- [ ] Confirm the sunrise page stays silent on first entry by default.
- [ ] Open `More` and confirm the ambient audio toggle is visible and defaults to `Off`.
- [ ] Enable ambient audio from `More` and confirm background music starts on the sunrise page.
- [ ] Keep the page idle briefly, then generate an answer and open `More` again to confirm background music stays stable during normal use.
- [ ] Disable ambient audio from `More` and confirm the background music stops promptly.
- [ ] Long-press the mountain and confirm the answer reveal finishes normally.
- [ ] Confirm the result action chips, `More` menu, `WeChat Share`, explanation bubble, and `Detailed Reading` panel can all be discovered and used.

### 4. Sunrise Poster Save Happy Path

- [ ] Generate a sunrise answer, open `More`, and tap `Save Poster`.
- [ ] Grant photo album permission if prompted.
- [ ] Confirm poster export completes and the image is written to the system album.
- [ ] Open the saved image from the album and confirm the poster text is centered, wrapped correctly, and not clipped.

### 5. Sunrise Poster Permission Recovery

- [ ] Revoke album permission from system settings or WeChat settings.
- [ ] Return to the Mini Program, open `More`, and tap `Save Poster` again.
- [ ] Confirm the permission guidance flow appears.
- [ ] Re-authorize permission through settings and confirm the save flow can complete afterward.

### 6. Sunrise Poster Failure Retry UX

- [ ] Trigger or simulate a failed poster save flow if possible.
- [ ] Confirm the error dialog shows a stage-specific title and recovery message.
- [ ] Confirm the retry button re-enters the correct flow for the failed stage.
- [ ] Confirm `Copy Current Answer` works from the failure dialog and does not dismiss the current answer state unexpectedly.

### 7. History And Favorites Persistence

- [ ] Generate several sunrise answers and add at least one favorite.
- [ ] Open `History` and `Favorites` and confirm recent items are listed correctly.
- [ ] Tap a stored item and confirm it restores correctly into the sunrise page.
- [ ] After restoring a stored item, open `Detailed Reading` and confirm the detail copy matches the restored answer.
- [ ] Fully close and reopen the Mini Program, then confirm history and favorites still exist.

### 8. Copy And Result Continuity

- [ ] Use `Copy` and confirm the clipboard contains both the short answer and the richer interpretation text.
- [ ] After copying and after continuing to use the long-press draw interaction again, confirm the rest of the page state remains stable and interactive.

### 9. Share Behavior

- [ ] Trigger `Share to Chat` from the sunrise flow after generating an answer.
- [ ] Open `More` and tap `WeChat Share`, then confirm the native WeChat share panel opens.
- [ ] Confirm the share title reflects the current answer when applicable.
- [ ] Confirm the share card thumbnail reflects the current answer instead of only using a static fallback image.
- [ ] Open the shared chat card from the sunrise mode and confirm the Mini Program re-enters `pages/sun_rise`.
- [ ] Trigger `Share to Timeline` on a device that supports it.
- [ ] Open the shared timeline entry from the sunrise mode and confirm the Mini Program re-enters `pages/sun_rise`.
- [ ] Confirm the Mini Program still opens to the sunrise flow after returning from share.
- [ ] If testing an older classic-mode share, confirm it falls back into `pages/sun_rise` instead of exposing the hidden classic page.

### 10. Background And Foreground Lifecycle

- [ ] While the sunrise mode is idle, background and foreground the Mini Program.
- [ ] With ambient audio enabled, background and foreground the Mini Program and confirm the music state remains consistent after return.
- [ ] While the sunrise poster flow is active, background the app and return.
- [ ] Confirm there are no duplicate animations, missing controls, broken save states, or unexpected/duplicated audio playback after resume.

### 11. Responsive Layout Sweep

- [ ] Repeat the key flows on a small-screen phone and a tall full-screen phone.
- [ ] Confirm the sunrise decorative elements, content text, tutorial ring, and bottom actions remain readable and tappable.
- [ ] Confirm bottom sheets and the sunrise action area respect the device safe area on each tested device.

## Release Sign-Off

- [ ] Validation script passes: `node scripts/validate.js`
- [ ] No blocker found in the 11 scenarios above
- [ ] Poster save flow verified on at least one real device
- [ ] Layout verified on at least two different device classes
