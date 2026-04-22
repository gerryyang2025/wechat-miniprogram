# Design Notes

This document captures product and interaction observations for `the-book-of-answers`, with a focus on feature completeness, usability, and future iteration priorities.

Last updated: April 22, 2026

## Scope

The current Mini Program contains two interaction models:

- `pages/sun_rise`: a cinematic sunrise scene with long-press interaction and poster export
- `pages/answers`: a classic answer board with rotating table interaction

The notes below are based on a static code review of the current implementation as of April 22, 2026. They are intended to guide future product and UX improvements.

## Current Strengths

- The project already offers two distinct answer experiences instead of a single static flow.
- The sunrise page has a strong visual identity and a clear emotional tone.
- Poster export is implemented locally with Canvas 2D and does not depend on backend services.
- The app has already been updated for modern WeChat base library requirements, including lazy component injection and HarmonyOS-safe layout handling.

## Functional And UX Gaps

### 1. The classic answer page is likely unreachable

Status: Implemented

`pages/answers` is registered in `app.json`, but there is no visible in-app routing path that takes the user there from the active sunrise experience.

Impact:

- One of the two core product modes is effectively hidden from users.
- The app experience feels smaller than the codebase suggests.

Recommendation:

- Add an explicit mode switch on the first screen.
- Add a secondary entry such as `Try the classic board` from the sunrise page.
- Consider a lightweight landing page that lets users choose between the two answer experiences.

Implementation note:

- Both pages now expose a visible mode switch so users can move between the classic board and the sunrise experience.

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
- Add `Draw again`, `Copy result`, or `Save this answer` actions.

Implementation note:

- The app now stores local history and favorites.
- Both pages now support copy, reroll, and revisit through history/favorite panels.
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
- [x] Add result actions such as copy, reroll, and revisit.

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
