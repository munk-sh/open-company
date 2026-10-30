# 开源软件团队 (Open-Source Software Team)

这是一套遵循 **`open-company/v0`** 标准的开源软件团队模板。它定义了多个 AI Agent 如何围绕一个或多个开源仓库分工协作：从 **GitHub Issue 盯盘分诊 → 独立分支写代码 → 三道真实桌面验收 → 每日 07:00 定时发版 → 自动回帖关单 → 晚间复盘总结**，形成完整闭环。

模板内预置了实战项目 **[OpenCompare](https://github.com/chaxiu/OpenCompare)**（一款跨平台文件、目录树、CSV 与 JSON 对比合并桌面工具）。

---

## 目录结构说明

```text
open-source-software/
├── Companyfile.yaml                 # 团队基础信息与名称
├── AGENTS.md                        # 团队级工作准则（质量底线、对外承诺、研发/测试/发版解耦规则）
├── projects/
│   ├── daily-patrol/                # 团队级日常巡检（每晚 21:00 盘点进度、提炼跨产品通用经验）
│   └── computer/                    # 团队级通用桌面操作班次（按指令执行系统级 GUI 交互）
└── products/
    └── open-compare/
        ├── Productfile.yaml         # 绑定 OpenCompare 代码仓库与运营项目分组
        ├── AGENTS.md                # OpenCompare 产品定位、功能优先级（P0/P1）与桌面验收标准
        └── projects/
            └── github/
                ├── README.md        # GitHub 开源发布与社区运营说明
                ├── guards/
                │   ├── github-sentinel.mjs  # 每 5 分钟零 Token 预检脚本（有新事件才唤醒 Agent）
                │   └── gh.mjs               # GitHub 专用身份调用封装
                └── tasks/
                    ├── github-issue-pr-actions.md  # 1. GitHub Issue 与构建报错盯盘（每 5 分钟）
                    ├── release-batch.md            # 2. 每日 07:00 定时发版
                    ├── l1-package-smoke.md         # 3. 安装包下载与启动自检
                    ├── l2-large-dir-load.md        # 4. 大文件夹加载性能测试
                    ├── l3-cdp-ui.md                # 5. 软件界面交互实测
                    ├── l3-computer-native.md       # 6. 桌面系统窗口实测
                    └── issue-closeout.md           # 7. 新版本发布后自动回帖关单
```

---

## 如何改成维护你自己的开源项目？（只需 3 步）

你可以直接 Fork 本目录，按以下 3 步替换成你自己的开源仓库：

1. **换绑代码仓库**：修改 `products/open-compare/Productfile.yaml`（或新建 `products/<your-app>/Productfile.yaml`），将 `source.git` 指向你的 GitHub 仓库地址。
2. **改写产品目标与验收标准**：修改 `products/<your-app>/AGENTS.md`，写清楚你的软件核心功能、不做什么、以及发版前要验证哪几条核心路径。
3. **按需调整值班任务**：在 `projects/github/tasks/` 下保留或删改你需要的定时班次（例如保留 `github-issue-pr-actions.md` 盯盘和 `release-batch.md` 定时发版，把实测任务改成符合你产品的测试步骤）。
