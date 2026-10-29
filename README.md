# Open Company Templates (`munk-sh/open-company`)

[简体中文](./README.zh-CN.md) · [opencompany.run](https://opencompany.run) · [Munk AI](https://munk.sh)

Official collection of **Open Company (`open-company/v0`)** templates that can be forked, inspected, and run directly inside [Munk AI](https://munk.sh).

An Open Company is a company on disk: `Companyfile.yaml` at the root, `AGENTS.md` for company-wide engineering & operations constitution, `products/<id>/Productfile.yaml` for each product, and `projects/<id>/tasks/*.md` for autonomous scheduled or brief-driven operations.

---

## Available Company Templates

### 1. [`companies/open-source-software`](./companies/open-source-software) — Open Source Software Company

An AI software company template for incubating, building, verifying, and operating production-grade open-source desktop & developer tools.

- **Company Constitution (`AGENTS.md`)**:
  - Zero-sample production I/O closed-loop standard
  - L1 (per-release package smoke) / L2 (conditional large-scale load) / L3 (CDP & native window) verification pyramid
  - Decoupled R&D (`git worktree`), verification, and daily `07:00` batch release workflow
- **Company Ops Projects (`projects/`)**:
  - `daily-patrol`: Daily 21:00 cross-product progress reconciliation & experience extraction
  - `computer`: Native desktop operator channel (`computer: true`)
- **Included Case Study Product**:
  - **[OpenCompare](https://github.com/chaxiu/OpenCompare)** (`products/open-compare/`): A modern cross-platform file, directory tree, keyed CSV, and JSON comparison & 3-way merge desktop tool, complete with 7 standing GitHub & QA operations tasks (`github-sentinel` guard, `07:00` batch release, L1–L3 verification, and `munk-agent` issue closeout).

---

## Running a Template in Munk AI

1. Install and open **Munk AI** ([munk.sh/install](https://munk.sh/install)).
2. Visit **[opencompany.run](https://opencompany.run)** and click **Open in Munk AI**, or import directly via URL:
   ```text
   https://github.com/munk-sh/open-company/tree/main/companies/open-source-software
   ```
3. Or trigger the desktop deep link from your browser/terminal:
   ```text
   munk://company/import?url=https%3A%2F%2Fgithub.com%2Fmunk-sh%2Fopen-company%2Ftree%2Fmain%2Fcompanies%2Fopen-source-software
   ```

---

## Repository Structure & Catalog

- `companies/<slug>/`: Self-contained `open-company/v0` packages.
- `scripts/build-catalog.mjs`: Scans `companies/*` and generates [`catalog.json`](./catalog.json) consumed by `opencompany.run`.

After adding or updating a company template, regenerate the catalog:

```bash
node scripts/build-catalog.mjs
```
