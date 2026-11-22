---
title: 晚间进度盘点与规则进化
trigger:
  schedule: 0 21 * * *
  guard: guards/cadence-sentinel.mjs
period: day
reads:
  projects:
    - radar
    - brain
    - studio
    - wealth
---

执行全公司每日经营对账、MIT 履约审计与个人偏好进化提炼：

1. **跨部门进度对账**：
   - 通过运行上下文注入的 `reads.projects` 兄弟项目目录（本地预览环境下回退 `../*/`）检查五大部门今日运行结果，核实今日 3 项 MIT 的实际完成情况；
   - 识别卡住、报错或偏离公司 `goal.md` 主线目标的环节。
2. **人类决策与偏好提炼**：
   - 复盘今日人类在主页对话与「要你」队列中的真实取舍（例如：人类批准/驳回了哪类选题、对哪笔报价提出了修改）；
   - 提炼出明确的负向约束与推荐范式，写入 `rules-evolution.md`。
3. **生成晚报与刷新看板**：
   - 生成 `reviews/YYYY-MM-DD.md`；
   - 运行复盘刷新脚本：
     ```bash
     node scripts/patrol-ctl.mjs review
     ```
4. **规则固化呈批**：
   - 在 `digest.md` 与今日 `journal/YYYY-MM-DD.md` 中汇总今日得失；
   - 若有经过验证适合立即合并入公司 `../../AGENTS.md` 的成熟规则，设置 `needsOwner: true` 唤醒公司负责人落地。
