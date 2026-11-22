---
name: browser-billing-recon
description: 浏览器自动对账与多源账单采集 SOP。当 wealth 部门需要派发 browse 子专员巡检各经营结算后台（Stripe/小报童/流量主/电商后台）、AI 与云服务账单页（OpenAI/OpenRouter/Vercel/Cloudflare），或清洗 ledger/inbox/ 中的导入账单时加载本技能。
---

# 浏览器自动对账与多源账单采集 SOP (`browser-billing-recon`)

本技能指导 `projects/wealth` 的任务如何安全、高效地结合 **本地浏览器自动化（`browse` 子专员）** 与 **本地投递箱（`ledger/inbox/`）**，把分散在各个平台的营收结算单、SaaS 扣费账单和账户余额归集到统一台账中，并刷新 `dashboard.html`。

---

## 一、 三级敏感度与采集通道分层（Risk & Channel Tiering）

在采集任何财务数据前，必须严格对照 `ledger/billing-sources.json` 中的分级策略执行，**绝不盲目用自动化浏览器去闯高风控的个人网银或移动支付后台**：

### 🟢 Tier 1：全自动浏览器巡检（`mode: "browser_auto"`）
- **适用对象**：
  - **经营与创作者结算台**：Stripe Dashboard、Gumroad、LemonSqueezy、小报童、知识星球、微信公众号流量主、小红书蒲公英、YouTube Studio、联盟营销（Affiliate）面板、电商卖家中心。
  - **AI 算力与云服务账单页**：OpenAI / Anthropic / OpenRouter Billing、AWS / Cloudflare / Vercel / Supabase Billing、各类 SaaS 的 Invoices 页面。
  - **只读行情与公开组合页**：雪球组合、TradingView、Yahoo Finance、天天基金估值页、CoinGecko。
- **执行方式**：
  1. 派发 `browse` 子专员，在 `brief` 中明确指定目标 URL（取自 `ledger/billing-sources.json`）、需要读取的核心指标（**当月累计净收入、待提现余额、本月已扣费用、剩余 Credit 额度、下次自动扣费日期与金额**）。
  2. **遇到登录墙（Login Wall / 2FA）**：若页面处于未登录或 Session 过期状态，`browse` 子专员立即停手并在返回结果中写明需登录的站点与网址；父会话随即调用 `munk_request_human` 提请老板在「公司 Agent 浏览器」中完成扫码或登录验证，切勿自行瞎猜或反复重试触发风控。

### 🟡 Tier 2：半自动账单邮箱拉取 / 本地 `ledger/inbox/` 投递（`mode: "inbox_drop"`）
- **适用对象**：个人网银（招行/工行等）、微信支付、支付宝、国内券商交割单、信用卡月结单。
- **为什么禁止直连网银 Web？**
  - 国内网银与移动支付强依赖手机端支付密码、短信盾与反自动化风控，Playwright 直接操作极易触发银行锁卡或冻结账户。
- **执行方式**：
  1. 优先扫描 `ledger/inbox/` 目录，处理老板随手拖入的 `.csv` / `.tsv` / `.json` / `.md` 账单文件或截图文本。
  2. 若 `ledger/billing-sources.json` 配置了已登录的「专用账单接收邮箱 Web 端」，可派 `browse` 只读搜索标题含 `电子账单 / Statement / Invoice / 微信支付账单` 的摘要信息。

### 🔴 Tier 3：绝对安全红线（Hard Red Lines）
1. **100% Read-Only（严禁资金写操作）**：在给 `browse` 的 `brief` 中必须包含硬性禁令——**「严禁点击任何提现（Payout/Withdraw）、转账（Transfer）、买入/卖出（Buy/Sell）、修改收款银行卡、充值（Top-up）或取消订阅按钮」**。
2. **落盘前脱敏（Data Masking）**：入库到 `ledger/YYYY-MM.csv` 或 `portfolio/net-worth.json` 时，自动剥离完整银行卡号、身份证号、客户私人手机号与邮箱，仅保留脱敏标识（如 `Stripe主号`、`招行(8812)`、`客户A-顾问尾款`）。

---

## 二、 标准化账单入库四步法

### Step 1：读取待处理源与去重校验
1. 读取 `ledger/billing-sources.json` 与 `ledger/inbox/` 下的待处理文件（忽略 `README.md` 与已带 `.processed` 后缀的文件）。
2. 读取当月台账 `ledger/YYYY-MM.csv`，记录已入库条目的 `id` 或 `(date, amount, title)` 组合，**严防同一笔账单重复入库**。

### Step 2：统一收支分类映射（Category Taxonomy）
所有收支条目必须归入以下标准一级/二级分类，以便 `scripts/wealth-ctl.mjs` 精确核算利润率与分类占比：

- **收入类（`type: "income"`）**：
  - `revenue:advisory` — 顾问咨询、企业内训、高客单陪跑、独立定制服务
  - `revenue:digital_product` — 数字标品、专栏订阅、软件/SaaS 会员、模板与配置包
  - `revenue:sponsorship` — 品牌合作、商业植入、推广佣金（Affiliate）、流量主分成
  - `revenue:commerce` — 电商选品、贸易差价、套利变现
  - `revenue:investment` — 股息分红、国债/货基利息、网格/波段已实现收益
- **支出类（`type: "expense"`）**：
  - `cost:ai_infra` — LLM API（OpenAI/Anthropic/OpenRouter）、GPU 算力、语音/视频合成额度
  - `cost:saas_sub` — 生产力软件、设计工具、域名服务器、云主机订阅
  - `cost:fulfillment` — 业务交付直接成本（外包协作、样品采购、平台抽成与手续费）
  - `cost:living_fixed` — 个人/家庭刚性固定生活支出（房租房贷、水电网、基础生活费、保险）
  - `cost:tax_social` — 税费缴纳、社保公积金支出

### Step 3：调用 `wealth-ctl.mjs` 入库与更新订阅状态
1. 使用 `node scripts/wealth-ctl.mjs add-ledger ...`（或按标准 CSV 列表头 `id,date,type,category,amount,currency,account,title,notes` 写入 `ledger/YYYY-MM.csv`）。
2. 若在账单中发现周期性扣费金额变动、新出现的隐蔽自动续费，或某项 AI API 余额低于预警线（如 `< $15`），同步更新 `ledger/subscriptions.json`。
3. 处理完 `ledger/inbox/` 中的导入文件后，将其移入 `ledger/inbox/processed/`（或删除临时敏感原始表），保持 `ledger/inbox/` 干净，避免 `guards/deal-sentinel.mjs` 重复误唤醒。

### Step 4：重算指标并刷新 `dashboard.html`
每次账单入库或订阅更新完毕后，**必须**执行：
```bash
node scripts/wealth-ctl.mjs refresh
```
该命令会自动重算当月净现金流、储蓄率、税务预留池、年化订阅燃烧额，并将最新数据写入 `dashboard-data.json` 与 `dashboard.html`。
