---
name: second-brain
description: 第二大脑（projects/brain）的捕获、常青认知卡合并、核心判断演化与跨部门检索协议（供 company-owner、brain、studio、wealth 共用）。
---

# 第二大脑操作手艺（`second-brain`）

本技能定义了「一人公司 · 超级个体」如何将零散输入（随口碎念、文章链接、会议转写、外部高优情报）转化为结构化、可复利的个人认知资产，并为 `studio`（内容工坊）和 `wealth`（财富与搞钱）提供弹药。

---

## 一、 核心文件地图（`projects/brain/`）

| 路径 | 角色定位 | 谁来写 | 谁来读 |
| :--- | :--- | :--- | :--- |
| `inbox/` | **碎片投喂箱**：尚未内化的随手笔记、链接、语音转写与想法碎片 | 老板直接丢文件 / `company-owner` 实时落盘 | `brain/inbox-digest` 任务 |
| `inbox/archive/` | **已归档原件**：消化完毕的 `inbox/` 原文件自动移入此处，保持 `inbox/` 永远清空（Inbox Zero） | `brain/inbox-digest` 任务 | 按需回溯 |
| `principles.md` | **个人认知底座**：老板当下的核心商业判断、选品/创作铁律、反共识信条与踩坑教训 | `company-owner` / `brain` 任务更新 | 全公司（`studio` / `wealth` / `daily-patrol`） |
| `topics/_index.md` | **主题常青卡总索引**：列出所有已建立的主题卡文件名、一句话核心结论与最后更新日期 | `brain` 任务同步维护 | 全公司检索入口 |
| `topics/*.md` | **主题常青认知卡（Evergreen Notes）**：按领域命题持续生长的活文档（非按日期堆砌的死摘要） | `brain` 任务增量合并 | `studio`（找论据案例）/ `wealth`（找行业规律） |
| `sparks.md` | **待引爆火花池**：从「外部信号 × 个人思考」碰撞出的高价值**原创选题**与**搞钱点子** | `brain` 任务提炼写入 | `company-owner` / `studio` / `wealth` |
| `digests/YYYY-MM-DD.md` | **认知消化日志**：按日记录当天吸收了什么新知、更新了哪几张主题卡 | `brain` 任务 | `daily-patrol` 晨夕复盘 |

---

## 二、 场景 1：公司负责人（`company-owner`）的实时捕获与调度协议

当人类老板在主页对话框向你（公司负责人）发来一段感悟、一条链接、一段语音转写或一个新判断时，**严禁只嘴上回复「记下了」却不落盘**：

1. **若老板修改了核心原则/偏好**（例如：*“我决定了，今年只做高客单价的小切口服务，不碰低价走量”*）：
   - 直接读取并更新 `projects/brain/principles.md` 对应章节，向老板确认已写入认知底座。
2. **若老板随手投喂了一条碎念、长文或链接**：
   - **第一步（必做落盘）**：在 `projects/brain/inbox/` 下新建 `YYYYMMDD-HHMM-<简短英文或拼音slug>.md`，完整保留老板的**原话点评（极其珍贵的人格视角）**与原始链接/正文：
     ```markdown
     ---
     capturedAt: 2026-11-04T09:00:00+08:00
     source: owner-chat
     urls:
       - https://example.com/post
     ---
     ## 老板原话与直觉判断
     （一字不改保留老板聊天时的原话、吐槽或切入角度）

     ## 原始素材 / 链接
     https://example.com/post
     ```
   - **第二步（按紧急度决定是否立即点跑）**：
     - 若老板只是随手备忘：告知已放入 `brain/inbox/`，将在下个巡检窗口自动内化；
     - 若老板要求**「现在扒下来看 / 存进第二大脑并聊聊」**：立即调用本地 API `POST /tasks/<inbox-digest-taskId>/runs`（传入 `brief: "立即抓取并内化刚投喂的 inbox/<文件名>，完成后汇报核心洞察"`），由 `inbox-digest` 任务动用 `webfetch` / `browse` 完成提取与卡片合并。

---

## 三、 场景 2：`brain` 任务的「去碎片化」内化铁律（拒绝收藏夹吃灰）

`brain` 在消化任何素材（无论是 `inbox/` 投喂还是 `../radar/signals/` 外部信号）时，**严禁生成一篇篇孤立的「文章摘要（TL;DR）」**，必须执行以下四步合成法：

### 第一步：原文提取（加载 `web-recon` 技能）
- 若输入包含未展开的 URL，按 `web-recon` 规范（公开静态页调 `webfetch`，公众号/小红书/X/反爬页派 `browse` 子专员）拿到完整正文与关键数据。

### 第二步：三问碰撞（Fact × Angle × Ammo）
对每一份素材强制提炼三要素：
1. **硬核事实与反直觉数据（Hard Facts）**：剥离修辞水分，这里面有哪些具体的数字、定价、转化率、时间线或真金白银的案例？
2. **与我何干（Collision with My Principles）**：对照 `principles.md` 和已有 `topics/_index.md`，这条信息是**印证**了老板的既有判断，提供了**新证据**，还是**打脸/修正**了过去的假设？
3. **可复用弹药（Reusable Ammo）**：提炼出 1～2 条可以直接贴进文章或用于商业决策的「金句/暴论/对比案例」。

### 第三步：合并入「主题常青卡」（`topics/<topic-slug>.md`）
- **优先合并，克制新建**：先查 `topics/_index.md`。若已有相关主题卡（如 `solo-monetization-models.md`、`ai-agent-workflows.md`），直接用 `edit` 将新论据、新案例和演进结论合入该卡，并更新卡片顶部的 `updatedAt` 与核心结论；只有开启全新领域时才新建主题卡。
- **每张常青卡的标准结构**：
  ```markdown
  ---
  topic: 主题名称
  updatedAt: YYYY-MM-DD
  coreThesis: 一句话写出你在这个命题下当前最犀利的核心判断
  ---
  # {主题名称}

  ## 1. 核心判断（Core Thesis）
  - （提纲挈领的独立观点，随新证据持续迭代）

  ## 2. 硬核事实与案例弹药库（Facts & Cases）
  - **[YYYY-MM-DD] {案例/数据标题}**：具体事实、数字与结论（来源：[原文链接](url)）

  ## 3. 反面教材与避坑指南（Anti-Patterns）
  - （踩过的坑、被证伪的做法、评论区高频差评）

  ## 4. 个人原话与金句切片（Voice & Quotes）
  - > “（保留老板自己说过的犀利原话或碰撞出的金句，供 studio 原味调用）”
  ```
- 每次更新卡片后，必须同步刷新 `topics/_index.md`。

### 第四步：点燃火花池（`sparks.md`）与清空投喂箱（Inbox Zero）
- 若本次内化擦出了极具价值的**原创内容选题**（有独立观点 + 有真实案例支撑）或**可验证的搞钱切口**，追加进 `sparks.md` 的 `## 待引爆火花（Active Sparks）`，并在当次任务简报中置 `needsOwner: true`。
- 将已处理的 `inbox/<file>` 移动至 `inbox/archive/<file>`，确保 `inbox/` 目录下不再残留已处理文件。

---

## 四、 场景 3：下游部门（`studio` / `wealth`）如何从第二大脑取弹药？

1. **先读 `projects/brain/principles.md`**：确保写出的观点或算出的商业方案不违背老板的底层原则。
2. **再查 `projects/brain/topics/_index.md` 和 `projects/brain/sparks.md`**：
   - 找到与当前选题或商业机会最相关的 1～2 张 `topics/*.md` 卡片点读；
   - 直接调用卡片里的**「2. 硬核事实与案例弹药库」**和**「4. 个人原话与金句切片」**，消灭空洞的 AI 套话。
