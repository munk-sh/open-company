# 🛡️ 个人财富宪章与配置纪律 (`wealth-policy.md`)

> 本文件是一人公司老板在「真金白银」上的最高行动准则。`scripts/wealth-ctl.mjs` 与 `wealth` 部门的所有任务均以本文件中的参数作为硬性算账与预警基准。

---

## 一、 现金流安全垫与税务预留纪律（Runway & Tax Reserve）

```json
{
  "baseCurrency": "CNY",
  "monthlyFixedBurnCNY": 12500,
  "minRunwayMonths": 24,
  "warningRunwayMonths": 18,
  "taxProvisionRate": 0.12,
  "minHourlyRateCNY": 800
}
```

1. **月度刚性支出基准（`monthlyFixedBurnCNY`）**：`¥12,500 / 月`（涵盖个人/家庭基础生活开销、固定保险与核心生产力底座）。
2. **安全跑道红线（`minRunwayMonths`）**：高流动性防守资金（扣除待缴税务预留后）必须至少覆盖 **24 个月** 刚性支出（即 `¥300,000`）。低于 18 个月触发红色警报，冻结一切高风险进攻投资与非必要采购。
3. **税务与社保隔离池（`taxProvisionRate`）**：每笔主动经营净流入自动计提 **12%** 进入税务预留池，严禁将税前毛收入当作可自由支配净利。
4. **个人接单最低有效时薪（`minHourlyRateCNY`）**：**`¥800 / 小时`**。把售前拉扯、修改返工、售后维护全部按 $1.5\times$ 计入分母后，低于此红线且无复利资产沉淀的活一律拒接。

---

## 二、 四层反脆弱资产配置矩阵（Target Asset Allocation）

拒绝凭感觉追涨杀跌，采用**「目标权重 + 容忍带触发再平衡（Tolerance Band Rebalancing）」**：只有当某大类资产的实际占比偏离目标权重超过 `tolerancePct` 时，才启动再平衡调仓。

```json
{
  "buckets": [
    {
      "id": "cash_and_fixed",
      "name": "🛡️ 现金与固收防守层",
      "targetPct": 30,
      "tolerancePct": 5,
      "description": "活期安全垫、货币基金、同业存单、国债逆回购与短债基金（保障 24 个月随时有子弹）"
    },
    {
      "id": "core_equity",
      "name": "📈 全球核心权益复利层",
      "targetPct": 50,
      "tolerancePct": 5,
      "description": "标普500 / 纳指100 ETF、沪深300 / 红利低波 ETF、高自由现金流科技与消费龙头"
    },
    {
      "id": "gold_and_hedge",
      "name": "🪙 黄金与抗通胀压舱层",
      "targetPct": 10,
      "tolerancePct": 3,
      "description": "黄金 ETF / 积存金，对冲法币购买力稀释与地缘尾部风险"
    },
    {
      "id": "alpha_and_arbitrage",
      "name": "⚡ 高赔率进攻与业务套利层",
      "targetPct": 10,
      "tolerancePct": 4,
      "description": "高确定性事件套利、加密核心资产（BTC/ETH）、新业务烟雾测试风险金（亏光不伤底座）"
    }
  ]
}
```

---

## 三、 商业立项与接单「三做三不做」硬约束

1. **做「1 份投入、N 次售卖」的数字资产与标品**，不做纯堆人头、低毛利、无沉淀的定制苦力外包。
2. **做「先收预付款 / 48 小时小成本验真需求」的买卖**，不做需要重资金压货、垫资采购或账期超过 30 天的生意。
3. **做「哪怕失败也能沉淀认知卡片或内容素材」的实验**，不做游离于个人核心复利飞轮之外的盲目折腾。
