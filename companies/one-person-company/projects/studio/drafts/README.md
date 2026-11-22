# 待审多平台稿件仓 (`drafts/`)

本目录存放由 `content-forge` 任务精铸的多平台待审稿件包（文件命名：`YYYY-MM-DD-<slug>.md`）。

## 稿件生命周期与语感进化闭环

1. **生成初稿（`status: review`）**：
   - `content-forge` 按你指定的选题与目标渠道，调用 `.opencode/skills/` 下对应的平台工艺技能，并经 `voice/anti-slop-rewrites.md` 10 项红线自检后写入本目录。
2. **你亲自审校与发布**：
   - 你可以直接在编辑器里修改本目录下的稿件，或复制出去发布。
3. **归档与语感进化（移入 `../published/`）**：
   - 当你改完定稿后，将最终版本移入（或另存到）`../published/YYYY-MM-DD-<slug>.md`，或直接跟公司负责人说：*「这篇我改好了，归档并学习一下我的改法」*；
   - `voice-evolver` 任务会自动对比 `drafts/` 原稿与你手改后的定稿，把你删掉的 AI 腔加进 `voice/anti-slop-rewrites.md`，把你的精彩改写收进 `voice/golden-samples/`。
