# Design Notes

This document captures product and interaction observations for `the-book-of-answers`, with a focus on feature completeness, usability, and future iteration priorities.

## Current Product Scope

- `pages/sun_rise` is now the only public user-facing flow.
- `pages/answers` is temporarily retained in the codebase as a rollback-safe legacy page, but it is no longer exposed through in-app navigation.
- Older classic-mode entry paths should redirect back into the sunrise flow during this transition period.

Last updated: April 22, 2026

## Scope

The current public Mini Program experience is centered on one interaction model:

- `pages/sun_rise`: a cinematic sunrise scene with long-press interaction, optional ambient background audio, and poster export

The legacy classic board still exists in the repository as a temporary rollback-safe page:

- `pages/answers`: a classic answer board with rotating table interaction

The notes below are based on a static code review of the current implementation as of April 22, 2026. They are intended to guide future product and UX improvements.

## Current Strengths

- The project has already converged toward one stronger public answer flow instead of splitting user attention across two competing entry points.
- The sunrise page has a strong visual identity and a clear emotional tone.
- Ambient audio is now opt-in and muted by default, which avoids forcing background music on first entry while still letting users enable a continuous sunrise atmosphere when they want it.
- Poster export is implemented locally with Canvas 2D and does not depend on backend services.
- The answer dataset now supports richer interpretation output instead of only returning a short quote and one-line explanation.
- All 156 bundled answers now have manually written detailed readings, with the previous rule-based interpretation layer kept only as a fallback.
- The app has already been updated for modern WeChat base library requirements, including lazy component injection and HarmonyOS-safe layout handling.

## Functional And UX Gaps

### 1. The legacy classic answer page needs a clear sunset plan

Status: Implemented

`pages/answers` is still registered in `app.json`, but it is now intentionally hidden from in-app navigation and treated as a temporary legacy page.

Impact:

- Product scope and public behavior are now more focused.
- The remaining risk is engineering drift if the hidden legacy page stays too long without a removal plan.

Recommendation:

- Keep the sunrise flow as the only public entry point for now.
- Leave the classic page in place only as a short-term rollback path.
- Remove the classic page from the codebase after the public sunrise-only release is stable.

Implementation note:

- The public sunrise flow no longer exposes a classic-mode entry, and the legacy classic page should redirect users back into the sunrise flow.

### 2. First-run onboarding is weak on the classic answer page

Status: Implemented

The classic answer page starts with empty default text and relies on a long press interaction that lasts about 4.5 seconds.

Impact:

- New users may think the page is blank or broken.
- The interaction cost is high for a first action.

Recommendation:

- Add visible onboarding copy such as `Think of a question and long press the table`.
- Show a default placeholder state before the first answer is generated.
- Reduce the long-press threshold to a shorter and more forgiving duration.

Implementation note:

- The classic page now shows onboarding copy, a default placeholder state, and a shorter long-press duration.

### 3. Lifecycle cleanup is incomplete

Status: Implemented

The app creates timers for answer generation, tutorial flow, and floating cloud animation, but page hide handling does not fully clear them.

Impact:

- Background timers may continue running after the page is hidden.
- This increases the chance of wasted work, animation glitches, or runtime timeout issues in DevTools.

Recommendation:

- Clear all pending timeouts and intervals in both `onHide` and `onUnload`.
- Reset interaction state when a page is interrupted mid-animation.
- Treat hide events as a first-class lifecycle state, not just unload.

Implementation note:

- Both pages now clear pending timers more aggressively, and the sunrise page restores or reinitializes animation state more safely when returning from background.

### 4. Sharing is not productized yet

Status: Implemented

Both main pages define `onShareAppMessage`, but neither page returns share metadata.

Impact:

- The app misses its most natural organic growth channel.
- Users cannot share a meaningful answer result or experience hook.

Recommendation:

- Add custom share title, path, and image behavior.
- Tailor share copy to the current answer when possible.
- Consider adding `onShareTimeline` for platforms that support it.

Implementation note:

- Both pages now return share metadata, answer-aware share copy, answer-specific share images generated at share time with static fallbacks, and mode-preserving share query parameters for shared re-entry.

### 5. Poster generation needs more resilience

Status: Implemented

The sunrise poster flow works, but it still assumes smooth canvas rendering and short text lengths.

Impact:

- Long answer text may overflow in the poster.
- Asset loading or export stalls may feel like silent failure to the user.

Recommendation:

- Add text wrapping and overflow handling in poster rendering.
- Add timeout protection and clearer retry behavior for image loading and export.
- Provide a retry action when poster generation fails.

Implementation note:

- Poster rendering now has text wrapping and asset-load timeout protection.
- Export and save failures now surface stage-specific retry actions.
- The poster failure dialog now gives clearer recovery guidance and offers a direct copy fallback so users do not lose the current answer when poster save fails.

### 6. Result consumption is too shallow

Status: Implemented

After a user gets an answer, the follow-up actions are limited. The sunrise page offers poster save, but the overall experience still lacks retention features.

Impact:

- Users can complete the product in a single short session and leave.
- There is little support for revisit, comparison, or personal attachment.

Recommendation:

- Add local history storage for recent answers.
- Add favorites or bookmarking.
- Add `Copy result`, `History`, `Favorites`, or `Save this answer` actions.

Implementation note:

- The app now stores local history and favorites.
- Both pages now support copy and revisit through history/favorite panels.
- The sunrise page still retains poster save as a dedicated result action.

### 7. Interaction cues are too subtle

Status: Implemented

Some important actions are image-only or hidden behind gesture knowledge, especially on the classic answer page and the sunrise save flow.

Impact:

- Users have to guess how the app works.
- Good visual design is doing too much of the product communication work by itself.

Recommendation:

- Add lightweight labels for key actions.
- Add haptic feedback or toast feedback on successful answer generation.
- Make save and explanation actions more explicit.

Implementation note:

- Action labels, save text, copy/favorite/history entry points, and lightweight completion feedback have been added.
- The sunrise `More` menu now also exposes an ambient audio toggle, and enabled audio is treated as background music rather than being tied only to the sunrise reveal moment.

### 8. Responsive consistency can be improved

Status: Implemented

The classic answer page still uses several fixed `px` sizes, while the sunrise page is more aligned with Mini Program responsive conventions.

Impact:

- The experience may feel uneven across device sizes.
- Typography and touch target scale may be inconsistent.

Recommendation:

- Replace remaining fixed `px` values with `rpx` or layout values derived from runtime window size.
- Review touch targets and spacing for small-screen devices.

Implementation note:

- Both pages now derive key spacing, typography, control placement, and bottom-sheet padding from runtime window and safe-area data.
- Decorative sunrise elements and interaction affordances now adapt more consistently across smaller and taller screens, and both pages recompute layout on resize.

### 9. Answer interpretation was too short to feel satisfying

Status: Implemented

The previous answer format mostly stopped at a short quote and a compact `exp` line, which made the interaction feel lightweight but sometimes emotionally thin.

Impact:

- Users could get a beautiful answer but still feel under-served when they wanted help understanding it.
- History, favorites, copy, and sharing had less emotional value because the interpretation layer was too shallow.

Recommendation:

- Keep the short quote as the first reveal so the pacing stays poetic.
- Add a second-layer detail panel with a fuller reading, a practical prompt, and a reflective question.
- Reuse the same enriched answer model across the active sunrise flow and any temporary legacy fallback so the interaction stays consistent during the transition.

Implementation note:

- Answers are now enriched through a shared interpretation utility, and all 156 bundled answers currently resolve to manually written structured detail fields.
- Both pages now expose a `Detailed Reading` action that opens a multi-section explanation panel.
- Saved history, favorites, and copy behavior now preserve the richer interpretation content instead of only keeping the short answer text.

## Priority Roadmap

### Priority 1

- [x] Make both answer modes reachable in the user flow.
- [x] Improve first-run onboarding on the classic answer page.
- [x] Reduce friction in the long-press interaction.

### Priority 2

- [x] Fix lifecycle cleanup for timers, animations, and pending answer actions.
- [x] Strengthen poster generation reliability.
- [x] Add better completion feedback after answer generation.

### Priority 3

- [x] Add real sharing behavior and answer-aware share copy.
- [x] Add local history and favorites.
- [x] Add result actions such as copy and revisit.
- [x] Add a richer second-layer interpretation model for each answer.

Legend:

- `[x]` completed
- `[~]` partially completed
- `[ ]` not started

## Suggested Product Direction

The best near-term improvement is not adding more animation. It is making the existing interactions easier to discover, easier to complete, and more rewarding after the result appears.

If the project continues to evolve, a good direction would be:

- a clear mode-selection entry
- stronger onboarding for first-time users
- better result retention through history and favorites
- more reliable sharing and poster export

## Maintenance Note

This file should be updated whenever major interaction changes are made, especially if the routing model, answer-generation mechanics, or poster experience changes.
The bundled answer set now uses stable answer IDs, so future content edits should preserve the existing IDs instead of recreating them from answer text.
