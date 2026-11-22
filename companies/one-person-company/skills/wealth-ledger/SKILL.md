---
name: wealth-ledger
description: 一人公司「财富与搞钱（Wealth & Deals）」主会话与跨部门协议。当老板在主会话询问“这笔生意/合作接不接（算有效时薪 EHR）”、随手记一笔大额收支或净值变动、投递账单截图/CSV、查询当前安全跑道与资产配置偏离度，或需要派发 wealth 部门任务时加载本技能。
---

# 财富与搞钱总管协议 (`wealth-ledger`)

本技能定义了 `company-owner`（一人公司总管）在日常对话中如何处理老板关于**商业尽调、报价谈判、收支记账、资产配置与跑道安全垫**的即时请求，以及如何与 `projects/wealth`（财富与搞钱参谋部）协同。

---

## 一、 核心文件地图（Single Source of Truth）

所有财富、收支与商业管线的事实文件均位于 `projects/wealth/` 下：

| 路径 | 角色与用途 | 更新方式 |
| :--- | :--- | :--- |
| `projects/wealth/wealth-policy.md` | **个人财富宪章与配置纪律**：安全垫月数、税务预留比例、四大类资产目标配置比例与再平衡偏离阈值、接单最低有效时薪（EHR）红线 | 老板拍板后修订 |
| `projects/wealth/portfolio/net-worth.json` | **全口径脱敏资产负债表**：现金活期、固收防守、核心权益（ETF/股票）、黄金抗通胀、高赔率进攻、负债端 | 脚本 / 任务更新 |
| `projects/wealth/portfolio/watchlist.json` | **持仓与标的观察池**：核心持仓 ETF/个股/汇率/套利品种的估值锚点、定投触发线与止盈/回撤警戒线 | 脚本 / 任务更新 |
| `projects/wealth/deals-and-offers.md` | **通用商业变现阶梯与在途商机管线**：服务/产品/分销报价体系、在途合作询盘、应收账款（AR）催收、48h 变现微实验看板 | 脚本 / 任务更新 |
| `projects/wealth/ledger/billing-sources.json` | **对账数据源清单**：区分哪些后台由 `browse` 自动只读抓取、哪些走邮箱/本地 `ledger/inbox/` 投递 | 按需配置 |
| `projects/wealth/ledger/YYYY-MM.csv` | **月度标准化收支流水**：所有已入库的经营收入、投资现金流、AI/SaaS 成本、固定生活支出 | `wealth-ctl.mjs` |
| `projects/wealth/ledger/subscriptions.json` | **周期性扣费与订阅雷达**：SaaS、AI 算力、会员、保险、云服务等自动续费项及其使用率评级 | 脚本 / 任务更新 |
| `projects/wealth/dashboard.html` | **交互式财富与搞钱看板**：Bento 布局核心指标、资产配置环形图与偏离条、收支趋势、商单漏斗与交互式调仓/时薪速算器 | `node scripts/wealth-ctl.mjs refresh` 自动注入最新数据 |

---

## 二、 主会话三大高频即时响应（无需开重型任务即可秒回）

### 场景 1：老板随口问“这个活/合作/副业接不接？”（30 秒毒舌 EHR 速算）
当老板在聊天里抛出一个新询盘或新点子（例如：“有个客户想让我做个定制咨询/开发/代运营，给 1.5 万，周期两周，接吗？”）：
1. 先读 `projects/wealth/wealth-policy.md` 与 `projects/brain/principles.md` 中的商业红线。
2. 当场用 **真实有效时薪公式（Effective Hourly Rate, EHR）** 帮老板算清账：
   $$\text{EHR} = \frac{\text{合同毛收入} \times (1 - \text{预留税率}) - \text{直接外采/算力成本}}{\text{核心交付工时} + \text{沟通扯皮与改稿工时} \times 1.5}$$
3. 给出冷酷直接的判断：
   - **红牌拒单（Kill）**：若 $\text{EHR} < \text{基准时薪底线}$，或属于「高垫资、长账期、一次性卖苦力且无法沉淀任何可复用资产」，直接劝退，并给出「如何砍掉定制部分、改成标准化标品报价」的反提案。
   - **黄牌改造（Counter-Offer）**：利润尚可但存在范围蔓延（Scope Creep）风险，立即按 `deals-and-offers.md` 拟定「50% 预付款 + 明确交付边界 + 超出按次计费」的三档报价话术。
   - **绿牌推进（Go）**：高杠杆或高毛利机会，询问老板是否登记进 `deals-and-offers.md` 或唤醒 `wealth` 的 `deal-and-quote` 任务出具完整尽调与报价书。

### 场景 2：老板随口记一笔账 / 更新某项资产净值
当老板说“刚收到某项目尾款 12,500 元”、“把美股账户净值更新到 420,000 元”或发来一张账单截图：
- 若在 `wealth` 项目会话内，直接调用：
  ```bash
  node scripts/wealth-ctl.mjs add-ledger --date YYYY-MM-DD --type income --category revenue:advisory --amount 12500 --account "招行主卡(8812)" --title "某项目尾款"
  node scripts/wealth-ctl.mjs refresh
  ```
- 若在 `company-owner` 主会话内（受限于主会话对子项目目录的直接写隔离），通过 Host Local API 携带 `brief` 唤醒 `wealth` 的 `cashflow-and-billing` 任务完成入库并刷新 `dashboard.html`。

### 场景 3：老板询问“我现在能躺平几个月？资产配置歪了吗？”
直接读取 `projects/wealth/dashboard-data.json`（或 `portfolio/net-worth.json` + `wealth-policy.md`），用三句话精准汇报：
1. **净值与安全跑道**：当前总净值、高流动性安全垫可覆盖多少个月刚性支出（Runway Months）；
2. **配置偏离度（Drift）**：哪类资产超配/低配超过了阈值，具体需要调仓多少金额；
3. **近期现金流漏点**：未来 7 天有哪些即将自动扣费的订阅，以及有哪些逾期或临期应收账款（AR）待催收。

---

## 三、 向 `projects/wealth` 派单路由表（Task Dispatch Routing）

当需要执行多步浏览器对账、深度商业尽调或全盘资产复盘时，`company-owner` 使用 `POST /tasks/:taskId/runs` 携带结构化 `brief` 唤醒对应任务：

| 业务意图 | 目标任务 (`projects/wealth/tasks/`) | `brief` 必填要素 |
| :--- | :--- | :--- |
| **自动拉取各后台待结算收入、云/SaaS 账单、清洗 `ledger/inbox/` 并刷新看板** | `cashflow-and-billing` | 指明本次重点核对的后台源（或 `ledger/inbox/` 下的新文件名）、账期月份 |
| **对某个搞钱火花 (`SPARK-W*`) 做毒舌商业尽调，或为客户询盘生成正式报价单与防坑条款** | `deal-and-quote` | 商机/客户背景、对方预算或目标定价、老板可投入工时上限、是否需要联动 `studio` 做 48h 烟雾测试 |
| **全口径净值盘点、股债金加密配置再平衡测算、持仓标的估值与基本面异动体检** | `wealth-allocation-review` | 是否有最新账户净值变动、重点关注的持仓标的或宏观汇率/利率信号 |

---

## 四、 敏感金融数据安全铁律（Hard Security Red Lines）

1. **严禁明文保存凭证与完整卡号**：任何文件（含 `net-worth.json`、`YYYY-MM.csv`、`digest.md`）严禁出现完整银行卡号、身份证号、网银密码、交易密码、助记词（Seed Phrase）、私钥或 API Secret。账户一律使用脱敏代号（如 `招行储蓄(8812)`、`IBKR美股主账户`）。
2. **浏览器 100% 只读对账**：`browse` 子专员在金融、结算与云服务后台**仅允许查看余额、摘录报表与下载账单文件**，严禁点击任何「转账、提现、买入、卖出、解绑、修改收款信息、退订扣款」按钮。一切涉及资金划转与真实交易的动作，必须生成清晰的执行清单交由老板本人亲自动手。
