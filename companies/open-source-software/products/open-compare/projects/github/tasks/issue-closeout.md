---
title: 版本发布对外回帖与 Issue 收口（按版本手动触发）
period: day
followUp:
  maxPerDay: 3
---

先 skill({ name: "github-issue-triage" })。这是发版后的对外收口任务，只做 brief 点名的那一版/那几条 Issue，不巡检、不立项、不改产品源码、不做发布。

【必须做的】
1) 对 brief 点名的 Issue：把 brief 给的正文原样写入临时文件（不要改写事实、不要加承诺时间），用 `node guards/gh.mjs issue comment <n> --repo chaxiu/OpenCompare --body-file <file>` 回帖；回帖成功后按 brief 指示用 `node guards/gh.mjs issue close <n> --repo chaxiu/OpenCompare --reason completed|not_planned` 关闭。记录评论 URL、评论作者登录名与关闭状态。
   回帖后必须复核作者：`node guards/gh.mjs api repos/chaxiu/OpenCompare/issues/<n>/comments`，末条 `author.login` 必须是 `munk-agent`；不是则记「身份错误」失败项并 needsOwner: true。
2) 原始读者帖（社区/论坛）：本任务没有人工登录通道，不要尝试，把需要人代发的正文写进 digest 并在 digest 设 needsOwner: true，标明平台与帖子定位（若 brief 给了）。
3) digest.md 写：Issue 号、评论 URL、评论作者（必须 `munk-agent`）、关闭状态（completed/not_planned）、原帖待办正文、失败项。全部完成设 needsOwner: false。

【硬约束】
- GitHub 写操作一律走 `node guards/gh.mjs`：它读运营项目 `config.toml` 的 `[github].munk_agent_token`，对外身份是 `munk-agent`。**禁止用裸 `gh` 或本机个人登录回帖 / 打标签 / 关单**。
- `gh.mjs` 输出 `github auth missing`、403 或 `Resource not accessible` 时：把报错原文写进 digest，设 needsOwner: true，不要回退到裸 `gh`，不要改用浏览器手点或伪造成功。
- 回帖正文只允许使用 brief 给的版本号、修复范围、验证口径与链接；brief 没给的事实不要补、不要推测用户环境。
- 只关闭 brief 明确指定要关的 Issue；其它 open Issue 一律不动。
- 不推代码、不打 tag、不改版本号、不发版、不动 Release 资产。
