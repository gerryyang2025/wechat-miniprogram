# Contributing

Thanks for helping improve `The Book of Answers`.

## Before You Start

- Use English for repository documentation, issues, and pull requests.
- Keep product copy and answer content unchanged unless the change is intentional and reviewed.
- Do not commit private configuration files, App secrets, or personal DevTools settings.

## Local Setup

1. Open the `the-book-of-answers/` folder in WeChat DevTools.
2. Use `project.private.config.json` for local-only settings.
3. Run `node scripts/validate.js` before submitting changes.

## Development Expectations

- Keep changes focused and easy to review.
- Prefer small pull requests over large mixed changes.
- Test behavior in WeChat DevTools.
- If you touch permissions, layout, audio, or poster export, test on a real device when possible.
- Preserve compatibility with current WeChat Mini Program APIs.

## Pull Request Checklist

- The change has a clear purpose.
- Documentation is updated when behavior changes.
- JavaScript and JSON validation passes.
- Manual testing notes are included in the pull request description.
- No private or machine-specific files are added.

## Commit Guidance

- Use clear commit messages in English.
- Describe the user-facing or engineering outcome, not just the file name.

Examples:

- `docs: add GitHub contribution and security guidance`
- `fix: migrate poster export to Canvas 2D`
- `chore: validate JavaScript and JSON in CI`

## Reporting Problems

- Use the bug report template for reproducible defects.
- Use the feature request template for product or engineering proposals.
- Use private reporting for security-sensitive issues. See `SECURITY.md`.
