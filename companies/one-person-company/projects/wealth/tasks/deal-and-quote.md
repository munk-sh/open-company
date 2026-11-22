---
title: 搞钱火花毒舌尽调与商务报价参谋
trigger:
  schedule: "0 12 * * *"
  guard: guards/deal-sentinel.mjs
period: day
reads:
  projects:
    - brain
    - radar
---

执行商业机会四维毒舌测算、48 小时烟雾测试立项、客户询盘三档阶梯报价与应收账款（AR）催收跟进：

1. **加载技能**：加载本项目 `.opencode/skills/deal-and-pricing-advisor/SKILL.md`。
2. **认领搞钱火花或响应商务 `brief`**：
   - 若本场由 `brief` 触发（如老板收到新合作询盘、顾问邀约或抛出新副业点子），优先按 `brief` 要求做真实有效时薪（EHR）测算、生成三档阶梯报价单（基础档 / 推荐档 / 尊享档）与防白嫖合同条款（50% 预付款、修改次数上限、账期红线）。
   - 若为日常巡检，从 `reads.projects` 注入的 `brain` 目录（或本地 `../brain/sparks.md`）扫描「待验搞钱与业务火花（For `wealth`）」区：过滤掉已在本地 `deals-and-offers.md` 或 `experiments/` 中建档的编号后，对尚未评估的新火花做四维毒舌尽调（杠杆属性、真实付费痛感证据、单位经济与 EHR、48h 最小烟雾测试方案）。
     - 通过尽调：在 `experiments/` 下创建实验档案（标明 `[SPARK-Wxx]` 及明确止损斩杀线 `Kill Criteria`），并将条目加入 `deals-and-offers.md`（`stage: "smoke_testing"`）；
     - 未通过尽调（如 EHR 低于 `wealth-policy.md` 的 `¥800/h` 红线或属于重垫资苦力活）：直接在 `deals-and-offers.md` 记为 `stage: "killed"`（标题保留 `[SPARK-Wxx]` 以便守卫去重，**切勿直接跨目录编辑只读兄弟项目 `brain/sparks.md`**，由 `brain` 定期同步归档）。
3. **在途商单与应收尾款（AR）巡检**：
   - 检查 `deals-and-offers.md` 中 `reviewDate <= 今日` 的商单或烟雾实验，生成催款话术或实验去留结论。
4. **刷新看板并汇报**：
   - 执行 `node scripts/wealth-ctl.mjs refresh` 刷新 `dashboard-data.json` 与 `dashboard.html`。
   - 若有新生成的报价单待发送、48h 烟雾测试需联动 `studio` 发帖、或有到期应收尾款需老板确认催收，在 `digest.md` 中设置 `needsOwner: true`。
