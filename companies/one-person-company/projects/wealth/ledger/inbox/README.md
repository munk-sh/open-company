# 📥 原始账单投递箱 (`ledger/inbox/`)

把微信支付、支付宝、银行信用卡、Stripe 或电商后台导出的原始 `.csv` / `.tsv` / `.json` 账单文件（或截图识别文本）直接拖入本目录。

- **零 Token 自动感知**：`guards/deal-sentinel.mjs` 检测到本目录出现非 `.processed` 的新账单文件时，会自动唤醒 `cashflow-and-billing` 任务。
- **自动去重与归档**：Agent 加载 `browser-billing-recon` 技能清洗并入库到 `ledger/YYYY-MM.csv` 后，会将原始文件移入 `processed/` 或加上 `.processed` 后缀，随后自动调用 `node scripts/wealth-ctl.mjs refresh` 刷新 `dashboard.html` 看板。
