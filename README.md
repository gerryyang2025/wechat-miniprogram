# WeChat Mini Program Workspace

This repository is the root workspace for maintaining multiple WeChat Mini Program projects.

Each mini program lives in its own subdirectory and is expected to keep its own:

- `app.js`, `app.json`, and `app.wxss`
- page-level source code and assets
- project-specific documentation
- local validation or project tooling when needed

## Current Mini Programs

| Project | Description | Status |
| --- | --- | --- |
| [`the-book-of-answers`](./the-book-of-answers/README.md) | A quote-based answer mini program with classic and sunrise interaction flows. | Active |

## Working with a Project

1. Choose the target mini program directory.
2. Open that directory in WeChat DevTools as the project root.
3. Use the project-specific `README.md` for setup, validation, and contribution details.
4. Keep private DevTools overrides local to that project, such as `project.private.config.json`.

## Repository Conventions

- Root-level documentation is written in English.
- Each mini program should be independently runnable and documented.
- Shared conventions may live at the repository root, but product implementation stays inside each project folder.
- Do not commit private configuration, secrets, or machine-specific files.

## Adding a New Mini Program

When adding a new project to this workspace:

1. Create a dedicated subdirectory for the mini program.
2. Add a project-level `README.md`.
3. Add the standard WeChat Mini Program entry files.
4. Keep assets, pages, and scripts scoped to that project.
5. Update this root `README.md` to register the new app.

## Notes

- This root repository does not currently provide a single global build entry.
- Validation, CI, and release rules may differ by mini program and should be defined inside each project directory.
