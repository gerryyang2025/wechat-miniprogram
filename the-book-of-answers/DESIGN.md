# Design Notes

This document captures the current product shape of `the-book-of-answers` and the main UX priorities for future iterations.

Last updated: May 1, 2026

## Current Product Scope

- `pages/sun_rise` is the only user-facing flow.
- The app centers on one interaction: long-press the mountain, watch the sunrise, then receive an answer with a richer second-layer interpretation.
- Poster export, WeChat sharing, history, favorites, and detailed reading all belong to the same sunrise flow.
- The local answer dataset is shared from `pages/answers/answer_data.js`, but there is no longer a standalone classic answer page.

## Current Strengths

- The product now has one clear emotional and visual identity instead of splitting attention across multiple answer modes.
- The sunrise interaction is memorable and pairs well with the reflective theme.
- The detailed interpretation layer makes each answer feel more complete and easier to revisit.
- Poster export happens locally with Canvas 2D and no backend dependency.
- History and favorites make the experience less disposable.
- The page already accounts for safe area and modern WeChat runtime differences on tall screens and HarmonyOS devices.

## Active UX Priorities

### 1. Keep the first-use interaction obvious

The sunrise flow depends on a long press, so onboarding clarity matters more than in a tap-first interface.

Focus:

- Keep the tutorial copy, mountain hit area, and feedback cues easy to notice on first entry.
- Preserve a visible idle state that does not feel broken or empty.
- Avoid decorative motion that competes with the “press and hold” cue.

### 2. Keep the post-answer experience structured

The answer view now carries several information layers: the quote, the source/meaning panel, the detailed-reading card, and result actions.

Focus:

- Maintain strong hierarchy between the main answer and supporting context.
- Keep poster layout and in-page layout visually aligned so the exported image feels like the same product.
- Continue simplifying any labels or helper copy that do not add meaning.

### 3. Keep poster save resilient on real devices

Poster save is still the most failure-prone path because it crosses canvas rendering, asset loading, temporary files, and album permissions.

Focus:

- Preserve clear failure recovery for render, export, and save stages.
- Keep permission guidance honest to the real failure cause.
- Prefer retry paths that regenerate the poster instead of reusing stale temporary files.

### 4. Keep audio behavior intentional

The bundled audio is now an event cue tied to the sunrise moment, not a persistent background soundtrack.

Focus:

- Start the audio at a stable moment in the sunrise animation.
- Avoid duplicate playback on repeated interactions or app resume.
- Keep interruption handling graceful when WeChat or the OS pauses audio.

### 5. Keep stored-answer flows lightweight

History and favorites are useful because they help users revisit meaningful answers, but they should not overpower the main reflective interaction.

Focus:

- Keep labels short and obvious.
- Make restored answers behave exactly like freshly generated ones.
- Ensure copied text and saved posters use the same enriched answer model as the on-page detail view.

## Engineering Notes

- The public app route list should stay sunrise-only unless a new public flow is intentionally introduced.
- Stored answer records should default to the `sun_rise` source to avoid carrying removed mode semantics forward.
- Share paths should re-enter `pages/sun_rise` directly without legacy mode parameters.
- Documentation and release checklists should stay aligned with the live product behavior, especially for poster save and audio.

## Near-Term Review Areas

- Real-device poster save on iPhone and Android after permission changes.
- Layout density of long detailed-reading cards on smaller phones.
- Share-image and saved-poster consistency after future layout iterations.
- Recovery behavior after backgrounding during sunrise animation or poster export.
