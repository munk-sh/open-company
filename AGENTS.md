# AGENTS.md

## Tech stack

- Plain **Node.js ESM** (Node >= 20, no runtime dependencies) for repository tooling.
- Content is static `open-company/v0` templates: Markdown, YAML, JSON, and read-only HTML.
- There is no application bundle and no `node_modules` requirement.

## Directory conventions

- `companies/<slug>/` — one runnable company template.
  - `Companyfile.yaml`, `goal.md`, `AGENTS.md`, `skills/`, `projects/`.
  - `products/<product-id>/` — isolated product with `Productfile.yaml`, `code/`, `projects/`.
- `scripts/build-catalog.mjs` — scans `companies/` and regenerates `catalog.json`.
- `scripts/*.test.mjs` — Node built-in test suites.
- `.agents/skills/` — repo-local agent skills.

## Skills routing

- `.agents/skills/open-company-template/SKILL.md` — template contract, catalog build, and validation workflow. Read it before adding or changing a company template.

## Test pyramid

- **L1 unit / contract tests**: `scripts/validate-company.test.mjs` with `node:test`, covering template layout, YAML frontmatter contracts, deleted assets, and catalog output. No external IO.
- **Build check**: `node scripts/build-catalog.mjs` must exit 0 and leave `catalog.json` idempotent.
- Run a single suite: `node --test scripts/validate-company.test.mjs`.
- Run gates: see `.munk/code-gates.json` (`build`, `test`). Every gate command is a single argv.

## Change rules

- Keep templates free of fabricated business data, fake metrics, and obsolete timestamps.
- Every task file needs `title`, `trigger.schedule` + `period`; any schedule at or below 60 minutes needs a `guard`.
- Never hand-edit `catalog.json`; regenerate it with `node scripts/build-catalog.mjs`.
