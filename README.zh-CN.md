# Open Company 官方模板库（`munk-sh/open-company`）

[English](./README.md) · [opencompany.run](https://opencompany.run) · [Munk AI](https://munk.sh)

本仓库维护可直接 Fork、审阅并在 [Munk AI](https://munk.sh) 中一键导入运行的 **Open Company（`open-company/v0`）** 标准公司模板。

一家开放公司就是一套写在盘上的目录契约：根目录 `Companyfile.yaml`、全公司工程与经营宪章 `AGENTS.md`、每个产品的 `products/<id>/Productfile.yaml`，以及 `projects/<id>/tasks/*.md` 常驻运营任务。

---

## 现已开放的公司模板

### 1. [`companies/open-source-software`](./companies/open-source-software) — 开源软件公司（Open Source Software Company）

孵化、研发、验收并持续运营高品质开源桌面与开发者工具的 AI 软件公司模板（内含 `OpenCompare` 标杆案例）。

- **公司级工程宪章（`AGENTS.md`）**：
  - 真实生产级 I/O 闭环（严禁以内置样本充数）
  - L1（每版公开包必验）/ L2（条件触发大目录负载）/ L3（CDP 渲染层与原生窗口）三级验收金字塔
  - 研发（`git worktree` 并发）、验证与每日 `07:00` 批次发版三流解耦
- **公司级运营项目（`projects/`）**：
  - `daily-patrol`：每日 21:00 跨产品推进对账与通用工程经验提炼
  - `computer`：原生桌面操作通道（`computer: true`）
- **内含标杆产品案例**：
  - **[OpenCompare](https://github.com/chaxiu/OpenCompare)**（`products/open-compare/`）：对标 Beyond Compare 的跨平台文件 / 目录树 / CSV 主键表格 / JSON 语义对比与三向合并桌面工具，内附 7 条标准常驻运营任务（GitHub 高频应急哨兵、每日 07:00 批次发版、L1–L3 实机复验、以及 `munk-agent` 身份 Issue 收口）。

---

## 如何在 Munk AI 中运行

1. 下载并安装 **Munk AI** 桌面端（[munk.sh/install](https://munk.sh/install)）。
2. 访问 **[opencompany.run](https://opencompany.run)** 点击 **「用 Munk AI 运行」**，或在桌面端「导入公司」粘贴子目录地址：
   ```text
   https://github.com/munk-sh/open-company/tree/main/companies/open-source-software
   ```
3. 也可直接通过 Deep Link 唤起：
   ```text
   munk://company/import?url=https%3A%2F%2Fgithub.com%2Fmunk-sh%2Fopen-company%2Ftree%2Fmain%2Fcompanies%2Fopen-source-software
   ```

---

## 目录索引生成

新增或修改 `companies/<slug>/` 下的模板后，运行以下脚本更新 [`catalog.json`](./catalog.json)：

```bash
node scripts/build-catalog.mjs
```
