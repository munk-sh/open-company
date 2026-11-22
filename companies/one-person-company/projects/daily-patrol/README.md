# 晨夕复盘与经营驾驶舱 (Daily Patrol & Executive Cockpit)

本部门是「一人公司 · 超级个体」的中枢神经与节律控制塔，负责统筹五大常驻部门的跨域协同、掌控全天双时钟节律（08:00 晨会拍板 + 21:00 复盘进化），并将人类决策偏好持续蒸馏回 `AGENTS.md`。

---

## 一、双时钟经营节律（Cadence）

```
08:00 🌅 晨会拍板简报 (Morning Brief)
  │   ├── 读取 radar (外部情报) + brain (认知积累) + studio (内容漏斗) + wealth (搞钱与账本)
  │   ├── 锁定今日「3 大必赢战役 (MITs)」
  │   └── 3 分钟一页纸读完，呈批给人类：拍板决策、安排精力、或一键确认
  ▼
白天 🚀 静默协同作战 (Silent Execution)
  │   ├── 各部门按任务钟/守卫自主推进，无重要突发事件不制造噪音
  │   └── 遇关键审批/交付（如发布稿件、发商单方案）通过「要你」队列轻量唤醒
  ▼
21:00 🌙 晚间复盘与进化 (Nightly Review)
  │   ├── 盘点 3 大 MIT 完成度与各部门产出
  │   ├── 盘点人类在主页对话与「要你」队列中的真实取舍（赞同/驳回/修改）
  │   └── 将踩坑教训与最新偏好沉淀至 rules-evolution.md，提炼合并至 AGENTS.md
```

---

## 二、目录结构与核心资产

```
projects/daily-patrol/
├── README.md                          # 本说明文档
├── dashboard.html                     # 交互式经营驾驶舱看板（默认落地页）
├── dashboard-data.json                # 看板结构化数据快照（跨部门聚合）
├── daily-mits.json                    # 今日 3 大必赢战役清单（含完成状态与耗时）
├── rules-evolution.md                 # 规则自进化库（PROPOSED 观察期 / MERGED 固化期）
├── briefs/                            # 每日 08:00 晨会简报归档
│   └── 2026-11-04.md
├── reviews/                           # 每日 21:00 晚间复盘归档
│   ├── 2026-11-03.md
│   └── 2026-11-04.md
├── guards/
│   └── cadence-sentinel.mjs           # 零 Token 节律守卫（未按时生成简报或有 MIT 阻塞时唤醒）
├── scripts/
│   └── patrol-ctl.mjs                 # 节律控制脚本（refresh | brief | review | mit）
├── tasks/
│   ├── morning-brief.md               # 早 08:00 晨会一页纸简报任务
│   ├── nightly-review.md              # 晚 21:00 晚间复盘与规则进化任务
│   └── mit-tracker.md                 # 日间重点战役履约盯盘任务
└── .opencode/skills/
    ├── executive-briefing/            # 跨部门扫描与高管简报生成技能
    └── rule-evolution/                # 偏好蒸馏与规则进化技能
```

---

## 三、快速指令（CLI）

```bash
# 1. 刷新驾驶舱数据与 dashboard.html
node scripts/patrol-ctl.mjs refresh

# 2. 生成今日晨会简报（跨部门提取情报）
node scripts/patrol-ctl.mjs brief

# 3. 执行夜间复盘对账与偏好提炼
node scripts/patrol-ctl.mjs review

# 4. 更新今日某项 MIT 状态
node scripts/patrol-ctl.mjs mit --id=MIT-20261104-03 --status=done
```
