# Open Company — 多 Agent 协作的开放标准

[English](./README.md) · [opencompany.run](https://opencompany.run) · [协作规范 (open-company.org)](https://open-company.org) · [Munk AI](https://munk.sh)

**多 Agent 协作的开放标准。**  
用一套纯文本目录定义目标、分工与排班，让来自不同服务商的 Agent 像一家公司一样协同运转。

---

## 为什么需要 Open Company？

今天我们不缺强大的单点 Agent（Claude、GPT、Gemini、本地模型……），缺的是让它们**配合起来长期干一件事**的标准。靠聊天窗口临时派活时，Agent 之间没有分工边界、没有交接标准、也没有共同记忆。

**Open Company（`open-company/v0`）** 把一套多 Agent 团队的编制写进普通文件夹里：

- `Companyfile.yaml`：声明这是哪支团队
- `AGENTS.md`：全员共享的目标、分工边界与做事红线
- `products/<id>/Productfile.yaml`：团队负责的产品或业务线
- `projects/<id>/tasks/*.md`：每项日常值班任务（几点运行、由谁负责、怎么算干完）

只要遵循同一套目录结构，无论底层接的是哪家模型或 Agent，都能看着同一份文件各司其职——不管是维护开源软件、运营自媒体，还是打理一家网店。任何跑通的团队配置，都可以像开源代码一样被一键复制（Fork）并运行。

---

## 可直接运行的团队模板

### 1. [`companies/open-source-software`](./companies/open-source-software) — 开源软件团队

一支 7×24 小时维护开源桌面软件与开发者工具的 AI 团队模板（内含实战项目 **[OpenCompare](https://github.com/chaxiu/OpenCompare)**）。

**这支团队每天怎么配合运转？**

1. **盯盘与分诊（每 5 分钟）**：先用零成本脚本检查 GitHub 有没有新 Issue、PR 评论或构建报错，有动静才唤醒 Agent 处理。
2. **独立分支开发**：写代码一律在独立分支目录里进行，不弄脏正在发版的主分支。
3. **发版前三道实测**：
   - 安装包下载与启动自检（确认用户下载的安装包能正常打开）
   - 大文件夹加载性能测试（确认大体积目录对比不卡死）
   - 软件界面与系统窗口实测（真实点开桌面窗口验证功能）
4. **每日定时发版与回帖（07:00）**：有新修复才打包发版；正式发布后自动去对应 Issue 下礼貌回帖并关单。
5. **晚间复盘（21:00）**：每晚盘点团队进度，把当天踩坑总结出的新经验写回共享规则文件。

---

## 如何导入运行

1. 下载并打开 **[Munk AI](https://munk.sh)** 桌面端。
2. 访问 **[opencompany.run](https://opencompany.run)** 点击 **「用 Munk AI 导入运行」**，或在桌面端「导入公司」粘贴模板地址：
   ```text
   https://github.com/munk-sh/open-company/tree/main/companies/open-source-software
   ```
3. 也可以直接在浏览器或终端唤起：
   ```text
   munk://company/import?url=https%3A%2F%2Fgithub.com%2Fmunk-sh%2Fopen-company%2Ftree%2Fmain%2Fcompanies%2Fopen-source-software
   ```

---

## 维护与更新目录索引

新增或修改 `companies/<slug>/` 下的模板后，运行以下命令更新 [`catalog.json`](./catalog.json)：

```bash
node scripts/build-catalog.mjs
```
