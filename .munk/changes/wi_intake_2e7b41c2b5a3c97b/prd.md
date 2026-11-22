# 修正 self-media 导入后项目读写路径、跨项目 reads 声明与雷达守卫错误退出码

## 目标

消除 companies/self-media 在 Munk 实例导入落盘后的三处真实运行期缺陷（失效越权的 ../../code 与 ../../../skills 相对路径、缺失的跨项目 reads.projects 只读授权声明、以及雷达哨兵异常静默返回 1 的红线违例），确保导入 17891 后零弹窗真跑闭环。

## 验收

- ac-1: companies/self-media 导入 Munk 实例落盘后，各产品级项目（radar、studio、growth）的所有产出路径均落在各自项目可写工作目录内（不引用导入后不存在且越权的 ../../code/... 路径），且技能引用统一采用宿主按名称加载约定（不引用导入后失效的 ../../../skills/... 相对文件路径）。
- ac-2: companies/self-media 中跨项目读取上游产物的任务均通过 frontmatter reads.projects 显式声明依赖（studio 读取同产品 radar，growth 读取同产品 radar 与 studio，顶层 matrix-hq 读取 flagship-channel/radar、flagship-channel/studio 与 flagship-channel/growth），导入后跨项目只读访问零权限弹窗阻塞。
- ac-3: radar 哨兵守卫严格遵循 0 唤醒 / 1 跳过 / 2 报错协议：当配置缺失损坏、未捕获异常或全部外部源抓取失败时向 stderr 输出明确错误原因并以退出码 2 退出（不静默伪装为 1 跳过）；仅当至少一个外部源成功返回且无新条目时返回 1，发现新热点条目时落盘信号摘要并返回 0。
