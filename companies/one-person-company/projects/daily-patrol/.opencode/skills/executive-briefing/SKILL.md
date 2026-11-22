---
name: executive-briefing
description: 早间 08:00 CEO 一页纸拍板简报生成指南。扫描雷达、大脑、内容工坊与财富部门数据，提炼核心结论与今日 3 大必赢战役（MITs）。
---

# 早间 CEO 一页纸简报指南（Executive Briefing）

本技能指导 `daily-patrol` 部门执行每日 08:00 早间简报生成任务。

---

## 一、输入数据源与扫描清单

简报生成器必须从各部门的 `dashboard-data.json` 与最新文件中提取结构化事实：

1. **`projects/radar/dashboard-data.json` & `signals/`**：
   - 提取最新 24 小时内的高优信号（`confidence >= 0.85` 或重点竞品动态）；
   - 过滤掉低价值常规资讯，提炼 **最多 2 条** 最具信息差的情报。
2. **`projects/brain/dashboard-data.json` & `sparks/`**：
   - 提取最新收录的火花条数；
   - 提取当前正在推进的深度综合主题（如正在撰写的复盘/心法）。
3. **`projects/studio/dashboard-data.json` & `drafts/` / `pitches/`**：
   - 检查已就绪（Status: ready）待发布的稿件；
   - 检查是否有 HyperFrames 渲染完成的视频。
4. **`projects/wealth/dashboard-data.json` & `deals-and-offers.md`**：
   - 当前安全跑道月数（Runway Months）；
   - 待收回的应收账款（Pending AR）；
   - 处于推进状态中的高优商单（Active Deals）。

---

## 二、输出格式标准（一页纸、3 分钟读完）

输出保存于 `briefs/YYYY-MM-DD.md`，并同步更新 `journal/YYYY-MM-DD.md`。

```markdown
# 🌅 晨会拍板简报 · 2026-11-04

> **核心基调**：现金流稳健（Runway 28.5m），主战场锁定本地 Agent 基础设施与高时薪技术咨询。

## 🎯 今日 3 大必赢战役 (MITs)
- [ ] **MIT 1 (搞钱/财富)**：推进并发送 Cloudflare Workers 迁移咨询方案 (¥15,000)
- [ ] **MIT 2 (影响力/工坊)**：审阅并一键发布《为什么本地浏览器 Agent 正在替代 80% 的套壳 SaaS》
- [ ] **MIT 3 (认知/雷达)**：完成 DeepSeek-V3 本地量化服务线索的第二轮竞品拆解

## 📡 外部情报速递 (Radar)
- **DeepSeek-V3 本地量化生态**：开发者社区突破低显存实机部署，中小团队私有化交付需求激增。

## 🎨 今日待发内容 (Studio)
- **成稿就绪**：《为什么本地浏览器 Agent 正在替代 80% 的套壳 SaaS》（公众号+X），预计带来 5~10 位高质量咨询潜在客户。

## 💰 财富与安全边际 (Wealth)
- **安全边际**：Runway **28.5 个月**（高于 24m 安全线），本月净现金流 **+¥23,246**。
- **商单推进**：1 笔 ¥15,000 待签方案，1 笔 ¥12,000 待回款 AR（账龄 4 天）。

## 🚨 今日待拍板决策 (Decisions Needed)
1. 是否批准上述 Studio 成稿发布？
2. 是否同意按 ¥1,200/h 等效费率发出咨询方案？
```

---

## 三、执行脚本标准

简报任务完成后，必须调用：
```bash
node scripts/patrol-ctl.mjs brief --date=YYYY-MM-DD
```
该命令会自动将简报内容结构化解析，并刷新 `dashboard-data.json` 与 `dashboard.html`。
