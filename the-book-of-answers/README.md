# The Book of Answers

`The Book of Answers` is a WeChat Mini Program that turns reflective questions into short quote-based responses plus a richer second-layer interpretation. The current public product experience is the sunrise scene with poster export.

This repository is prepared as a lightweight GitHub-friendly project:

- English documentation for onboarding and collaboration
- A minimal validation script and GitHub Actions workflow
- Contribution, security, and pull request guidelines
- Repository templates for issues and reviews

## Features

- One public user flow: `pages/sun_rise`
- Local answer dataset with no backend dependency
- A structured detailed-interpretation layer used by the public sunrise flow
- Manually written detailed readings for all 156 bundled answers
- Answer-aware sharing with dynamic share images for chat and timeline
- A `More` menu with WeChat share, poster save, revisit actions, and an ambient audio toggle
- Mode-preserving share re-entry through share path and query parameters
- Canvas 2D poster generation and save-to-album flow
- Optional sunrise background audio using the bundled `audio_001.mp3`, muted by default and controlled through an ambient audio toggle in `More`
- Compatibility handling for modern WeChat base libraries
- Safe-area layout adjustments for HarmonyOS and full-screen devices

## Repository Layout

```text
.
├── app.js
├── app.json
├── app.wxss
├── assets/
├── pages/
│   ├── answers/
│   └── sun_rise/
├── scripts/
│   └── validate.js
├── utils/
├── .github/
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── project.config.json
```

## Requirements

- WeChat DevTools
- A valid Mini Program AppID or a local test AppID
- A recent base library version

## Getting Started

1. Clone or download the repository.
2. Open WeChat DevTools.
3. Import the repository root in WeChat DevTools. In this workspace, that root is the `the-book-of-answers/` directory.
4. Keep local-only overrides in `project.private.config.json`.
5. Build, preview, and test in DevTools.

## Validation

Run the repository validation script before opening a pull request:

```bash
node scripts/validate.js
```

The script checks:

- JavaScript syntax for all `.js` files
- JSON integrity for all `.json` files

The same validation is executed by GitHub Actions on pushes and pull requests.

## Platform Notes

- `project.config.json` uses the latest WeChat base library setting.
- The app collects runtime device and window information through `wx.getDeviceInfo()` and `wx.getWindowInfo()`.
- HarmonyOS layout compatibility is handled through safe-area aware spacing.
- Poster export on the sunrise page uses Canvas 2D APIs instead of the legacy canvas flow.
- Sunrise ambient audio is opt-in through the `More` menu, defaults to muted, and behaves as page-level background audio after the user enables it.
- Share behavior follows the current WeChat `Page` API contract:
  - an in-page `button open-type="share"` entry is exposed through the `More` menu
  - `onShareAppMessage` uses `path` plus dynamic `imageUrl`
  - `onShareTimeline` uses `query` plus dynamic `imageUrl`
  - the public sunrise flow preserves its re-entry state through share parameters
  - older classic-mode entry paths are redirected back into the sunrise flow during the transition period

## Data and Privacy

- The project does not depend on a custom backend service.
- Answer content is bundled locally in the app package.
- The save feature requests photo album permission only when the user explicitly exports a poster.
- The legacy classic-mode page is still kept in the codebase temporarily for rollback safety, but it is no longer exposed in the active user flow.

## Collaboration Files

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)
- [DESIGN.md](DESIGN.md)
- [RELEASE_TEST_CHECKLIST.md](RELEASE_TEST_CHECKLIST.md)

## Development Notes

- Repository documentation is written in English.
- In-app answer content remains Chinese because it is part of the product experience.
- Bundled answers now use stable answer IDs, and manual detailed readings are keyed by those IDs instead of by answer text.
- `project.private.config.json` should stay local and should not be committed.

## Recommended Next Steps

- Add product screenshots or preview GIFs for the README
- Keep expanding real-device regression coverage for share re-entry and poster save flows

## License

This project is covered by the repository-level MIT License. See [../LICENSE](../LICENSE).
