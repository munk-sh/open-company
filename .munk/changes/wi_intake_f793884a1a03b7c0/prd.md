# 移除 self-media 模板冗余 reads 声明并对齐确定性 ../<slug> 目录契约

## 目标

配合宿主 REQ-0277（产品级项目统一落盘为 projects/<slug> 且自动注入同作用域兄弟项目只读索引），清除 companies/self-media 全部任务 frontmatter 中的历史 reads 字段及对应旧断言，统一按确定性 ../<slug> 与启动索引寻址。

## 验收

- ac-1: companies/self-media 下所有任务文件 frontmatter 均不再包含手动 reads 字段，产品内跨项目协作直接引用确定性兄弟目录（如 ../radar、../studio），顶层 matrix-hq 引用启动上下文自动注入的各频道 growth/retros/ 路径。
- ac-2: 仓库公司模板校验与目录构建全部通过，保持零虚构数据、雷达守卫错误退出码 2 与四态赛马量化口径不变。
