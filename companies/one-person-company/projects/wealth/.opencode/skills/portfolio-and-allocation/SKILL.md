---
name: portfolio-and-allocation
description: 个人/家庭资产配置体检、再平衡测算与持仓标的异动审计 SOP。当执行净值盘点、股债金加密配置偏离度计算、安全跑道评估或观察池标的（Watchlist）基本面/估值巡检时加载本技能。
---

# 资产配置体检与再平衡审计 SOP (`portfolio-and-allocation`)

本技能为超级个体提供机构级的**「个人资产负债表管理与反脆弱配置」**方法论。一人公司没有企业财团兜底，个人与公司的抗风险底座完全取决于**高流动性安全跑道（Runway）**与**严格受控的资产配置纪律（Asset Allocation Mandate）**。

---

## 一、 核心理念：用「配置纪律与再平衡」取代「情绪化预测」

1. **现金流跑道优先于一切高收益幻想**：
   - 在 `wealth-policy.md` 规定的安全垫（如 18–24 个月刚性生活与经营支出）未填满、或税务预留金未隔离前，严禁将短期经营周转金投入高波动权益或加密资产。
2. **四层反脆弱金字塔结构**：
   - **🛡️ 防守与流动性层（`cash_and_fixed`）**：活期、货币基金、短债、大额存单。职责是保证任何时候业务断流 2 年不用贱卖核心资产。
   - **📈 核心权益复利层（`core_equity`）**：低费率全球宽基指数 ETF（如标普 500、纳指 100、沪深 300/红利低波）、现金流强劲的优质龙头。职责是吃透长期时代复利。
   - **🪙 抗通胀与对冲层（`gold_and_hedge`）**：黄金 ETF / 实物金、抗通胀商品。职责是在法币信用波动与地缘黑天鹅时充当压舱石。
   - **⚡ 高赔率进攻与套利层（`alpha_and_arbitrage`）**：高确定性事件套利、期权策略、加密核心资产（BTC/ETH）或新业务风险实验本金。严格锁死上限（如总净值的 $\le 10\%$），亏光不伤筋动骨，赢了反哺防守层与核心层。

---

## 二、 标准化体检与再平衡工作流

### Step 1：运行确定性配置计算引擎
禁止心算百分比与调仓金额！第一步先运行：
```bash
node scripts/wealth-ctl.mjs portfolio
```
脚本会基于 `portfolio/net-worth.json` 与 `wealth-policy.md` 输出：
- **总资产（Total Assets）**、**总负债（Total Liabilities）**、**净资产（Net Worth）**、**资产负债率**；
- **安全跑道月数（Runway Months）** = $\frac{\text{防守层高流动性资金} - \text{待缴税务预留}}{\text{月均刚性固定支出}}$；
- **四大资产层级的当前占比 vs 目标占比**、**绝对偏离度（Drift %）**、**是否突破阈值（Drift Breach）** 以及 **恢复目标比例所需的精确买入/卖出金额（Rebalance Action CNY）**。

### Step 2：持仓与观察池标的巡检（`portfolio/watchlist.json`）
对照 `portfolio/watchlist.json` 中的核心标的：
1. 若任务需要获取最新公开市价、估值分位（PE/PB 百分位）、无风险利率（10Y 国债收益率）或持仓公司重大财报摘要，优先用 `webfetch` 抓取公开财经页面；若需查看登录态组合（如雪球组合/TradingView），派 `browse` 只读摘录。
2. 检查是否触发 `watchlist.json` 中预设的纪律规则：
   - **定投/击球区触发（Buy Zone）**：标的跌入低估区间且该资产大类当前处于低配（Negative Drift）；
   - **过热止盈触发（Trim Zone）**：标的估值处于历史极高位且该资产大类超配突破上限（Positive Drift Breach）；
   - **基本面证伪/回撤警报（Thesis Broken）**：核心投资逻辑发生质变（绝不仅因短期价格波动恐慌，只看基本面锚点是否破坏）。

### Step 3：输出《资产配置与再平衡决策卡》
在刷新 `dashboard.html`（`node scripts/wealth-ctl.mjs refresh`）并撰写本场 `digest.md` 时，必须遵守以下纪律：
1. **无突破不折腾**：若四大类资产偏离度均在 `wealth-policy.md` 允许的容忍带（Tolerance Band，如 $\pm 5\%$）以内，且无标的触发阈值，结论明确写**「配置健康，维持不动（Hold & Do Nothing）」**，且 `needsOwner: false`。
2. **突破阈值或跑道告急必唤醒**：一旦出现以下任一情形，必须将 `needsOwner: true`，并在 `digest.md` 中给出一页式调仓指令单：
   - 任一资产大类偏离度突破容忍带（例如权益大涨导致超配 $+6.5\%$，或大跌导致低配 $-5.8\%$），列出**「从哪类账户卖出/转出多少金额 $\rightarrow$ 分几批买入哪个具体标的」**；
   - 安全跑道跌破警戒水位（如 `< 12 个月`）；
   - 某只核心持仓触发止盈线或基本面暴雷。
