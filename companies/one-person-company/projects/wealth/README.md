# 💰 财富与搞钱 (Wealth & Portfolio)

本部门是一人公司的**商业精算师 + 个人/家庭首席财务官（CFO）**，采用「**主动搞钱（Active Deals） + 通用资产配置（Portfolio & Cashflow Defense）**」双轮驱动架构，并内置交互式指挥看板 [`dashboard.html`](./dashboard.html)。

---

## 一、 核心能力与目录结构

```text
projects/wealth/
├── dashboard.html                          # [交互式指挥看板] Bento 核心指标、四层资产配置环图与偏离条、商单漏斗、订阅雷达与 EHR/调仓沙盘
├── dashboard-data.json                     # [结构化快照] 由 scripts/wealth-ctl.mjs refresh 自动生成并内联注入 dashboard.html
├── wealth-policy.md                        # [财富宪章] 刚性月支、24个月安全跑道红线、12%税务隔离率、¥800/h 最低有效时薪、四层资产目标比例
├── deals-and-offers.md                     # [商业变现管线] L1-L3 产品阶梯、在途商单、应收账款(AR)催收与 48h 烟雾实验表
├── experiments/                            # [搞钱火花尽调书] 认领自 ../brain/sparks.md 的四维毒舌测算与 48h 烟雾验证档案
│   └── EXP-2026-11-config-pack.md
├── portfolio/                              # [通用财富管理]
│   ├── net-worth.json                      # 脱敏全口径资产负债表（现金固收 / 全球宽基权益 / 黄金抗通胀 / 高赔率进攻 / 负债）
│   └── watchlist.json                      # 核心持仓与标的观察池（估值分位、利差、定投补仓与过热止盈纪律）
├── ledger/                                 # [现金流与自动对账]
│   ├── billing-sources.json                # 三级敏感度对账源配置（Tier 1 浏览器只读抓取 vs Tier 2 本地投递）
│   ├── subscriptions.json                  # 周期性扣费与吸血鬼订阅追踪雷达
│   ├── 2026-11.csv                         # 月度标准化收支流水台账
│   └── inbox/                              # 原始账单 CSV/截图投递箱（丢入新文件自动触发守卫唤醒）
├── scripts/
│   └── wealth-ctl.mjs                      # [零依赖精算引擎] 精确核算净值、跑道、配置偏离度、现金流并自动刷新 dashboard.html
├── .opencode/skills/                       # [部门级专业技能]
│   ├── browser-billing-recon/SKILL.md      # 浏览器自动只读对账与多源账单清洗 SOP（含严格安全红线）
│   ├── portfolio-and-allocation/SKILL.md   # 四层反脆弱资产配置体检与容忍带再平衡 SOP
│   └── deal-and-pricing-advisor/SKILL.md   # 四维毒舌商业尽调、EHR 算账与三档阶梯报价 SOP
├── guards/
│   └── deal-sentinel.mjs                   # [零 Token 守卫] 监控未评估火花、inbox 新账单、5天内临期吸血鬼订阅与到期催收项
└── tasks/
    ├── deal-and-quote.md                   # [日常/按需] 搞钱火花毒舌尽调、48h 烟雾实验立项、三档报价与 AR 催收
    ├── cashflow-and-billing.md             # [日常/按需] 浏览器自动对账、inbox 账单入库与吸血鬼订阅排查
    └── wealth-allocation-review.md         # [每周/按需] 全口径净值盘点、股债金配置再平衡与观察池标的体检
```

---

## 二、 常用命令（确定性算账与看板刷新）

绝不让大模型心算财务报表与百分比，一切计算交由 `scripts/wealth-ctl.mjs`：

```bash
# 一键重算所有资产配置、现金流、订阅与商单指标，并同步刷新 dashboard-data.json 与 dashboard.html
node scripts/wealth-ctl.mjs refresh

# 单独查看资产配置偏离度与再平衡调仓金额
node scripts/wealth-ctl.mjs portfolio

# 单独查看当月收支汇总与分类占比
node scripts/wealth-ctl.mjs cashflow --month 2026-11

# 追加一笔标准化收支流水并自动刷新看板
node scripts/wealth-ctl.mjs add-ledger --date 2026-11-04 --type income --category revenue:advisory --amount 12500 --account "招行储蓄(8812)" --title "某顾问项目尾款"
```

---

## 三、 敏感金融数据三大安全铁律

1. **100% 浏览器只读对账（Read-Only Recon）**：`browse` 子专员在 Stripe、创作者后台或云账单页仅允许查看与下载报表，**严禁点击任何提现、转账、买入、卖出或修改收款卡按钮**。
2. **严禁直连高风控网银 Web**：个人网银与微信/支付宝流水一律走账单邮箱只读提取或手动将导出的 CSV/截图丢入 `ledger/inbox/`，避免自动化指纹触发银行冻卡。
3. **本地台账脱敏存储**：所有本地 `.json` / `.csv` 仅记录账户简称（如 `招行储蓄(8812)`），严禁保存完整卡号、密码、私钥或助记词。
