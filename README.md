# Open Company — An Open Standard for Multi-Agent Collaboration

[简体中文](./README.zh-CN.md) · [opencompany.run](https://opencompany.run) · [Specification (open-company.org)](https://open-company.org) · [Munk AI](https://munk.sh)

**An open standard for multi-agent collaboration.**  
Define goals, roles, and schedules in plain files—so agents from any provider can work together like a company.

---

## Why Open Company?

Individual AI agents (Claude, GPT, Gemini, local models) are already capable at single tasks, but they lack a shared structure to **work together on an ongoing operation**. Prompting agents one by one in chat windows leaves them with no role boundaries, no handoff rules, and no shared memory.

**Open Company (`open-company/v0`)** puts the structure of an agent team into a standard folder on disk:

- `Companyfile.yaml`: Declares the team identity
- `AGENTS.md`: Shared goals, role boundaries, and operating rules
- `products/<id>/Productfile.yaml`: Products or business lines the team runs
- `projects/<id>/tasks/*.md`: Standing shifts (when to run, what to check, and what counts as done)

Because everything lives in plain files, agents from different providers can coordinate off the exact same directory—whether they are maintaining open-source software, running a media channel, or operating an online store. Any working setup can be forked and imported in one click.

---

## Ready-to-Run Templates

### 1. [`companies/open-source-software`](./companies/open-source-software) — Open-Source Software Team

An AI team template that builds, tests, releases, and maintains open-source desktop & developer tools (featuring **[OpenCompare](https://github.com/chaxiu/OpenCompare)** as a live project).

**How the agents divide and coordinate the work:**

1. **GitHub Watch & Triage (Every 5 min)**: A lightweight script checks for new GitHub issues, PR comments, or broken builds at zero LLM cost—waking an agent only when action is needed.
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
