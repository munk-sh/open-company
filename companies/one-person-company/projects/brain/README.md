# 🧠 第二大脑（`brain`）

`brain` 是「一人公司 · 超级个体」的认知复利引擎与护城河。

普通 AI 写稿像水文、做决策像套话，根本原因在于它们只有外部通稿，没有**你的真实经历、你的商业判断、你攒下的硬核案例与你的原话锋芒**。`brain` 负责把你随手丢进来的碎片输入与 `radar` 捕回的高优情报对撞，炼成全公司随时调用的「带有人格钢印的弹药库」。

---

## 核心架构：零摩擦投喂 + 常青认知卡 + 周度复利

| 任务 (`tasks/`) | 0 Token 守卫 (`guards/`) | 触发机制 | 核心职责 |
| :--- | :--- | :--- | :--- |
| **`inbox-digest.md`**<br>*(碎片内化与常青认知卡合成)* | `guards/brain-inbox-guard.mjs` | 每 2 小时 (`20 */2 * * *`)<br>*或负责人带 `brief` 即时点跑* | 守卫脚本以 **0 Token** 检查 `inbox/` 是否有新投喂、`../radar/signals/` 是否有标给 `brain` 的新情报。唤醒后加载 `web-recon`（`webfetch` + `browse`）扒出链接正文，经「三问碰撞」合入 `topics/*.md` 常青卡，提炼灵感写入 `sparks.md`，并将原件归档至 `inbox/archive/`（保持 **Inbox Zero**）。 |
| **`weekly-synthesis.md`**<br>*(周度认知串联与思维底座进化)* | 无（每周固定复盘） | 每周日 20:30 (`30 20 * * 0`) | 跨主题串联过去 7 天的新增卡片与情报，检视有哪些旧假设被证伪、哪些判断得到强化，提出 `principles.md` 进化建议并清理 `sparks.md` 火花池。 |

---

## 目录与数据流契约

```text
projects/brain/
├── README.md                     # 本说明书
├── dashboard.html                # 🖥️ 交互式看板（火花池、常青卡片墙、认知宪法、Inbox 水位），由 scripts/brain-ctl.mjs refresh 注入数据
├── dashboard-data.json           # 看板数据快照（自动生成）
├── scripts/
│   └── brain-ctl.mjs             # 解析 sparks.md / topics/ / principles.md / inbox/，刷新看板
├── principles.md                 # 🧭 个人核心判断与认知底座（全公司选题与算账的最高宪法）
├── sparks.md                     # ⚡ 待引爆火花池（碰撞出的「原创选题」与「搞钱点子」待办队列）
├── inbox/                        # 📥 零负担投喂箱（你随手丢文件，或跟公司负责人聊天自动落盘）
│   ├── README.md                 # 投喂指南
│   └── archive/                  # 已消化原件自动归档于此，保持 inbox/ 永远清空
├── topics/                       # 🗂️ 主题常青认知卡（按领域命题持续生长，拒绝按日期堆砌死摘要）
│   ├── _index.md                 # 主题目录总索引（带一句话核心判断，供 studio / wealth 秒级检索）
│   └── one-person-company-leverage.md
├── digests/                      # 📅 消化日志与周度认知复利报告（YYYY-MM-DD.md / weekly-YYYY-MM-DD.md）
├── .state/                       # 守卫脚本状态（自动维护已检查的信号哈希与待消化清单）
├── guards/
│   └── brain-inbox-guard.mjs     # 0 Token 投喂箱与跨部门信号预检脚本
└── tasks/
    ├── inbox-digest.md           # 碎片内化与常青认知卡合成（支持定时守卫 + 即时点跑）
    └── weekly-synthesis.md       # 周度认知串联与思维底座进化
```

---

## 怎么用最爽？（三种日常姿势）

1. **随口聊天投喂（最常用）**：
   在主页右栏对 **公司负责人** 甩一句感悟或链接：
   - *“把这篇公众号/X 链接 `https://...` 收进第二大脑，我觉得里面讲的冷启动获客很实在。”*
   - 如果你想马上看拆解，直接加一句 *“现在扒下来跟我聊聊”*，负责人会当场带 `brief` 点跑 `inbox-digest`。
2. **文件夹随手拖入**：
   把录音转写稿、读书笔记、长文 Markdown 直接拖进 `projects/brain/inbox/`，最多 2 小时内自动消化归档。
3. **一句话迭代你的商业原则**：
   对公司负责人说：*“在我的 `principles.md` 里加一条：以后凡是需要人工一对一交付超过 2 小时的业务一律不接。”* 全公司的 `studio` 和 `wealth` 会立即按新原则行事。
