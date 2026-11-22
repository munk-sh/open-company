# 修复 catalog 丢失 Productfile source.path

## 范围
- 仓库根 `/Users/zhutao/Cursor/ai-monkey/open-company`。`scripts/build-catalog.mjs` 的 `parseProductYaml` 只抓 `git:` 键，导致 `companies/self-media/products/flagship-channel/Productfile.yaml` 的 `source.path: "./code"` 被丢弃，catalog.json 里该 product 输出 `git: ""`；而 `companies/open-source-software/products/open-compare/Productfile.yaml` 用 `source.git:` 则正常。
- 改造 `parseProductYaml`：读取 `source` 块下的 `git` / `path` / `commit` / `branch`（缩进两空格，允许引号），在 catalog product 上输出可判别的 source 信息——保留 `git` 字段（source.git 优先，缺失时用 source.path），并新增 `source` 对象承载 `type: "git"|"path"`、`ref`（URL 或路径）、`commit`、`branch`；不得出现空字符串冒充。
- 重新生成 `catalog.json`（`node scripts/build-catalog.mjs`），并在 `scripts/validate-company.test.mjs` 增加断言钉住 self-media 的 source.path 与 open-compare 的 git URL。

## 验收
- ac-catalog-source-path: catalog.json 中 self-media 的 flagship-channel 携带 `"./code"`（`source.ref` 或等价字段非空、`source.type === "path"`），不再出现 `git: ""`。
- ac-catalog-git-compat: open-source-software 的 open-compare 仍输出 `https://github.com/chaxiu/OpenCompare`、`commit: e86980ff2742bff5f28c5eb368e5d82ebfbab0ac`、`branch: main`，`source.type === "git"`。
- ac-test-guard: 上面两条由 `node --test scripts/validate-company.test.mjs` 中的用例断言，命令退出码 0。
- ac-build-idempotent: 连续两次执行 `node scripts/build-catalog.mjs` 后 `git diff --stat catalog.json` 为空（输出稳定不抖动）。

## 非目标
- 不改 Productfile.yaml 的既有 schema 与任何 companies/ 内容（source.path 写法保持现状）。
- 不改根 README.md / README.zh-CN.md 文案。
- 不引入第三方依赖（不装 yaml 库），Node 原生实现即可。

## 实现约束
- 改动面仅限 `scripts/build-catalog.mjs`、`catalog.json`、`scripts/validate-company.test.mjs`。
- 不得在 catalog 中写入任何虚构数字、死日期或样例数据，只做真实解析。

## 本单执行约束（不 fold）
- 交棒前本地执行 `node scripts/build-catalog.mjs && node --test scripts/validate-company.test.mjs`，两者均需通过；不使用浏览器，不需要 product-qa。
