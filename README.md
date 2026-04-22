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
| [`the-book-of-answers`](./the-book-of-answers/README.md) | A quote-based answer mini program with classic and sunrise interaction flows, dynamic share images, and poster export. | Active |

## Working with a Project

1. Choose the target mini program directory.
2. Open that directory in WeChat DevTools as the project root.
3. Use the project-specific `README.md` for setup, validation, and contribution details.
4. Keep private DevTools overrides local to that project, such as `project.private.config.json`.

## Repository Conventions

- Each mini program should be independently runnable and documented.
- Shared conventions may live at the repository root, but product implementation stays inside each project folder.
- Do not commit private configuration, secrets, or machine-specific files.

## License

This workspace is licensed under the MIT License. See [LICENSE](./LICENSE).
