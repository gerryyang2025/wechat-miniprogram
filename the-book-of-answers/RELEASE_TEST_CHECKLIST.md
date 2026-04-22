# Release Test Checklist

Use this checklist before submitting a new build of `the-book-of-answers`.

The goal is to validate the real-device experience for the two main answer flows, especially the sunrise poster export path and the responsive layout changes added in the recent iterations.

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
- [ ] Confirm the initial page layout is complete and the mode switch is visible.
- [ ] Confirm there is no obvious overlap between content, bottom controls, and the safe area.

### 2. Classic Mode First-Time Experience

- [ ] Enter `pages/answers` through the mode switch.
- [ ] Confirm the default prompt and onboarding copy are visible before any interaction.
- [ ] Long-press the table once and confirm the answer appears within the expected hold duration.
- [ ] Confirm haptic feedback, result actions, and explanation toggle all work after the answer appears.

### 3. Classic Mode Interrupt And Recovery

- [ ] Start a long press on the table and release before completion.
- [ ] Confirm the page returns to the previous answer or the default placeholder state.
- [ ] Start a long press, background WeChat, then return to the Mini Program.
- [ ] Confirm there is no frozen animation, broken layout, or duplicated audio playback.

### 4. Sunrise Mode First-Time Experience

- [ ] Enter `pages/sun_rise` through the mode switch.
- [ ] Confirm the tutorial text and visual guidance appear correctly on first entry.
- [ ] Long-press the mountain and confirm the answer reveal finishes normally.
- [ ] Confirm the save button, result action chips, and explanation bubble can all be discovered and used.

### 5. Sunrise Poster Save Happy Path

- [ ] Generate a sunrise answer and tap `Save Poster`.
- [ ] Grant photo album permission if prompted.
- [ ] Confirm poster export completes and the image is written to the system album.
- [ ] Open the saved image from the album and confirm the poster text is centered, wrapped correctly, and not clipped.

### 6. Sunrise Poster Permission Recovery

- [ ] Revoke album permission from system settings or WeChat settings.
- [ ] Return to the Mini Program and tap `Save Poster` again.
- [ ] Confirm the permission guidance flow appears.
- [ ] Re-authorize permission through settings and confirm the save flow can complete afterward.

### 7. Sunrise Poster Failure Retry UX

- [ ] Trigger or simulate a failed poster save flow if possible.
- [ ] Confirm the error dialog shows a stage-specific title and recovery message.
- [ ] Confirm the retry button re-enters the correct flow for the failed stage.
- [ ] Confirm `Copy Current Answer` works from the failure dialog and does not dismiss the current answer state unexpectedly.

### 8. History And Favorites Persistence

- [ ] Generate answers in both modes and add at least one favorite from each mode.
- [ ] Open `History` and `Favorites` in both pages and confirm recent items are listed with source labels.
- [ ] Tap a stored item and confirm it restores correctly into the current page.
- [ ] Fully close and reopen the Mini Program, then confirm history and favorites still exist.

### 9. Reroll, Copy, And Result Continuity

- [ ] Use `Draw Again / Reroll` in both modes and confirm a fresh result appears.
- [ ] Use `Copy` in both modes and confirm the clipboard contains the expected text.
- [ ] After copying or rerolling, confirm the rest of the page state remains stable and interactive.

### 10. Share Behavior

- [ ] Trigger `Share to Chat` from both modes after generating an answer.
- [ ] Confirm the share title reflects the current answer when applicable.
- [ ] Confirm the share card thumbnail reflects the current answer instead of only using a static fallback image.
- [ ] Open the shared chat card from the classic mode and confirm the Mini Program re-enters `pages/answers`.
- [ ] Open the shared chat card from the sunrise mode and confirm the Mini Program re-enters `pages/sun_rise`.
- [ ] Trigger `Share to Timeline` on a device that supports it.
- [ ] Open the shared timeline entry from the classic mode and confirm the Mini Program re-enters `pages/answers`.
- [ ] Open the shared timeline entry from the sunrise mode and confirm the Mini Program re-enters `pages/sun_rise`.
- [ ] Confirm the Mini Program still opens to the correct mode after returning from share.
- [ ] Confirm shared re-entry still resolves to the correct mode when the share payload contains `mode` and `shareScene` query parameters.

### 11. Background And Foreground Lifecycle

- [ ] While the classic mode is idle, background and foreground the Mini Program.
- [ ] While the sunrise mode is idle, background and foreground the Mini Program.
- [ ] While the sunrise poster flow is active, background the app and return.
- [ ] Confirm there are no duplicate animations, missing controls, or broken save states after resume.

### 12. Responsive Layout Sweep

- [ ] Repeat the key flows on a small-screen phone and a tall full-screen phone.
- [ ] Confirm the classic mode card, prompt, table, and action chips do not overlap.
- [ ] Confirm the sunrise decorative elements, content text, tutorial ring, and bottom actions remain readable and tappable.
- [ ] Confirm bottom sheets and save controls respect the device safe area on each tested device.

## Release Sign-Off

- [ ] Validation script passes: `node scripts/validate.js`
- [ ] No blocker found in the 12 scenarios above
- [ ] Poster save flow verified on at least one real device
- [ ] Layout verified on at least two different device classes
