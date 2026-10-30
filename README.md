<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./brand/wordmark-dark.svg">
    <img src="./brand/wordmark.svg" alt="Open Company" width="320">
  </picture>
</p>

<h3 align="center">An open standard for multi-agent collaboration.</h3>

<p align="center">
  Define goals, roles, and schedules in plain files—so agents from any provider can work together like a company.<br>
  <a href="./README.zh-CN.md">简体中文</a> · <a href="https://opencompany.run">opencompany.run</a> · <a href="https://open-company.org">Specification (open-company.org)</a> · <a href="https://munk.sh">Munk AI</a>
</p>

---

## Why Open Company?

Individual AI agents (Claude Code, Codex, Gemini CLI, OpenCode, etc.) are already capable at single tasks, but they lack a shared structure to **work together on an ongoing operation**. Prompting agents one by one in chat windows leaves them with no role boundaries, no handoff rules, and no shared memory.

**Open Company (`open-company/v0`)** puts the structure of an agent team into a standard folder on disk:

```text
open-source-software/
├── Companyfile.yaml          # Declares the team identity
├── AGENTS.md                 # Shared goals, role boundaries, and operating rules
├── projects/
│   └── daily-patrol/         # Team-wide routines (e.g., 21:00 nightly review)
└── products/
    └── open-compare/
        ├── Productfile.yaml  # Binds the product and git repository
        ├── AGENTS.md         # Product scope, priorities, and QA bar
        └── projects/github/
            ├── guards/       # Zero-token preflight scripts (wake agents only on new events)
            └── tasks/        # Standing shifts (triage, QA, 07:00 release, issue replies)
```

Each task is a plain Markdown file combining a cron/guard trigger with clear responsibilities:

```markdown
---
title: GitHub Issue & CI Triage
trigger:
  schedule: "*/5 * * * *"
  guard: guards/github-sentinel.mjs
period: day
---

Run as Shift A for issue triage:
1. Classify new issues, reply with an acknowledgment, and file a structured case.
2. Do not modify product source code in this shift—escalate confirmed bugs to a coding work item.
```

Because everything lives in plain files, agents from different providers can coordinate off the exact same directory—whether they are maintaining open-source software, running a media channel, or operating an online store. Any working setup can be forked and imported in one click.

---

## Ready-to-Run Templates

### 1. [`companies/open-source-software`](./companies/open-source-software) — Open-Source Software Team

An AI team template that builds, tests, releases, and maintains open-source desktop & developer tools (featuring **[OpenCompare](https://github.com/chaxiu/OpenCompare)** as a live project).

**How the agents divide and coordinate the work:**

1. **GitHub Watch & Triage (Every 5 min)**: A lightweight script (`guards/github-sentinel.mjs`) checks for new GitHub issues, PR comments, or broken builds at zero LLM cost—waking an agent only when action is needed.
2. **Isolated Coding**: Agents write and review code in isolated git worktrees so active development never blocks a release.
3. **Three-Stage Real QA**:
   - Installer download & launch smoke check
   - Large-folder stress & performance test
   - Real UI interaction & native desktop window check
4. **Daily Scheduled Release & Replies (07:00)**: Cuts a release when new fixes land, then automatically replies to linked GitHub issues and closes them out.
5. **Nightly Review (21:00)**: Audits daily progress across the team and writes newly learned lessons back into shared guidelines.

---

## How to Run in Munk AI

1. Install and open **[Munk AI](https://munk.sh)**.
2. Visit **[opencompany.run](https://opencompany.run)** and click **Import into Munk AI**, or paste the template URL in the desktop app:
   ```text
   https://github.com/munk-sh/open-company/tree/main/companies/open-source-software
   ```
3. Or launch directly via deep link:
   ```text
   munk://company/import?url=https%3A%2F%2Fgithub.com%2Fmunk-sh%2Fopen-company%2Ftree%2Fmain%2Fcompanies%2Fopen-source-software
   ```

---

## Regenerating the Catalog Index

After adding or updating a template under `companies/<slug>/`, update [`catalog.json`](./catalog.json):

```bash
node scripts/build-catalog.mjs
```
