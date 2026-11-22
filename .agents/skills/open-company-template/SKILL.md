---
name: open-company-template
description: Maintain open-company/v0 template packages in this repo: Companyfile/Productfile contracts, task frontmatter, catalog generation, and Node contract tests.
---

# Open Company Template

Use this skill before adding, editing, or reviewing a template under `companies/<slug>/`.

## Repository facts

- No application framework or runtime dependencies. Tooling is plain Node.js ESM.
- `catalog.json` is generated, never hand-edited.
- Each company template must be importable as an `open-company/v0` package.

## Required template shape

```text
companies/<slug>/
├── Companyfile.yaml      # spec: open-company/v0, UUID id, name, description, homepage
├── goal.md
├── AGENTS.md
├── skills/
├── projects/<ops-project>/
│   ├── README.md
│   └── tasks/<task>.md
└── products/<product-id>/
    ├── Productfile.yaml  # spec, id, title, lifecycle, source, groups, projects
    ├── goal.md
    ├── AGENTS.md
    ├── code/             # content/source skeleton; start empty, no fake artifacts
    └── projects/<product-project>/
        ├── guards/       # zero-token preflight scripts when needed
        └── tasks/<task>.md
```

## Task frontmatter contract

- Required: `title`, `period` (`hour` / `day` / `week`).
- Scheduled tasks also require `trigger.schedule` as a five-field cron string.
- Any schedule interval at or below 60 minutes **must** include `trigger.guard` pointing at an existing script.
- Manual on-demand slots may omit `trigger` but still declare `period`.
- Cross-project reads use `reads.projects: ["<product-id>/<project-id>"]`.

## Build and validate

```bash
node scripts/build-catalog.mjs
node --test scripts/validate-company.test.mjs
```

`build-catalog.mjs` scans `companies/` and writes `catalog.json`; a second run must produce a byte-identical file. Bilingual catalog metadata lives in `BILINGUAL_METADATA` inside that script.

## Review checklist

1. No fabricated business data, fake metrics, obsolete timestamps, or references to retired templates.
2. Every required file exists; every guard path resolves.
3. `Productfile.yaml` source is accurate (`git` or local `path` plus `commit` and `branch`).
4. `node scripts/build-catalog.mjs` exits 0 and `catalog.json` matches a fresh build.
5. `node --test scripts/validate-company.test.mjs` passes.
