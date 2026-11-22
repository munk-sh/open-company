import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const companyDir = join(repoRoot, "companies", "self-media");
const productDir = join(companyDir, "products", "flagship-channel");
const oldCompanyDir = join(repoRoot, "companies", "one-person-company");

function read(relPath) {
  return readFileSync(join(repoRoot, relPath), "utf8");
}

function listFiles(dirPath) {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath, { recursive: true })
    .filter((name) => {
      try {
        return statSync(join(dirPath, String(name))).isFile();
      } catch {
        return false;
      }
    })
    .map(String);
}

function frontmatter(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  assert.ok(match, "task must start with YAML frontmatter");
  return match[1];
}

function cronIntervalMinutes(schedule) {
  const fields = schedule.trim().split(/\s+/);
  assert.equal(fields.length, 5, `invalid cron schedule: ${schedule}`);
  const [minute, hour] = fields;
  if (minute === "*") return 1;
  if (minute.startsWith("*/")) return Number(minute.slice(2));
  if (hour === "*") return 60;
  if (hour.startsWith("*/")) return Number(hour.slice(2)) * 60;
  return 1440;
}

test("旧模板与跟踪的 macOS 杂项文件已移除", () => {
  assert.equal(existsSync(oldCompanyDir), false, "companies/one-person-company must be deleted");
  assert.equal(existsSync(join(repoRoot, ".DS_Store")), false, "tracked .DS_Store must be deleted");
});

test("self-media 顶层公司配置完整", () => {
  for (const relPath of [
    "companies/self-media/Companyfile.yaml",
    "companies/self-media/goal.md",
    "companies/self-media/AGENTS.md",
    "companies/self-media/skills/web-recon/SKILL.md",
    "companies/self-media/skills/brand-voice/SKILL.md",
    "companies/self-media/projects/matrix-hq/README.md",
    "companies/self-media/projects/matrix-hq/dashboard.html",
    "companies/self-media/projects/matrix-hq/tasks/weekly-matrix-review.md",
  ]) {
    assert.equal(existsSync(join(repoRoot, relPath)), true, `missing ${relPath}`);
  }

  const companyfile = read("companies/self-media/Companyfile.yaml");
  assert.match(companyfile, /^spec: open-company\/v0$/m);
  assert.match(companyfile, /^id: [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/m);
  assert.match(companyfile, /^name: /m);
  assert.match(companyfile, /^description: /m);
  assert.match(companyfile, /^homepage: /m);
  for (const platform of ["xiaohongshu", "x", "wechat-mp"]) {
    assert.match(companyfile, new RegExp(`^\\s+- ${platform}$`, "m"), `missing login ${platform}`);
  }
});

test("首发频道 Productfile 与产品目录契约正确", () => {
  const productfile = read("companies/self-media/products/flagship-channel/Productfile.yaml");
  assert.match(productfile, /^spec: open-company\/v0$/m);
  assert.match(productfile, /^id: flagship-channel$/m);
  assert.match(productfile, /^title: 首发样板频道$/m);
  assert.match(productfile, /^lifecycle: live$/m);
  assert.match(productfile, /^source:\n {2}path: "\.\/code"\n {2}commit: "0000000"\n {2}branch: "main"$/m);
  assert.match(productfile, /^requires:\n {2}browser: true\n {2}logins:\n {4}- xiaohongshu\n {4}- x$/m);
  assert.match(productfile, /groups:\n {2}- id: channel-ops\n {4}title: 频道运营/);
  for (const projectId of ["radar", "studio", "growth"]) {
    assert.match(productfile, new RegExp(`^ {2}- id: ${projectId}$`, "m"), `missing project ${projectId}`);
  }

  for (const relPath of [
    "companies/self-media/products/flagship-channel/goal.md",
    "companies/self-media/products/flagship-channel/AGENTS.md",
    "companies/self-media/products/flagship-channel/code/README.md",
    "companies/self-media/products/flagship-channel/projects/studio/pitches/.gitkeep",
    "companies/self-media/products/flagship-channel/projects/studio/drafts/.gitkeep",
    "companies/self-media/products/flagship-channel/projects/studio/published/.gitkeep",
    "companies/self-media/products/flagship-channel/projects/radar/guards/radar-sentinel.mjs",
    "companies/self-media/products/flagship-channel/projects/radar/watchlist.json",
    "companies/self-media/products/flagship-channel/projects/studio/tasks/daily-topic-pitch.md",
    "companies/self-media/products/flagship-channel/projects/studio/tasks/multi-platform-draft.md",
    "companies/self-media/products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md",
  ]) {
    assert.equal(existsSync(join(repoRoot, relPath)), true, `missing ${relPath}`);
  }

  const contentFiles = listFiles(join(productDir, "code")).filter((name) => !name.endsWith(".gitkeep"));
  assert.deepEqual(contentFiles, ["README.md"], "product source repo must start empty (only README.md)");
});

test("所有任务 frontmatter 满足 title / schedule+period / guard 契约", () => {
  const taskFiles = listFiles(companyDir).filter((name) => name.includes("/tasks/") && name.endsWith(".md"));
  assert.ok(taskFiles.length >= 6, "expected all standing shifts to be present");

  for (const name of taskFiles) {
    const relPath = `companies/self-media/${name}`;
    const fm = frontmatter(read(relPath));
    assert.match(fm, /^title:\s*\S.+$/m, `${relPath}: missing title`);
    assert.match(fm, /^period:\s*(hour|day|week)$/m, `${relPath}: missing valid period`);

    const scheduleMatch = /^trigger:\n(?: {2}.+\n)*? {2}schedule:\s*["']?([^"'\n]+)["']?$/m.exec(fm);
    if (!scheduleMatch) continue;

    const schedule = scheduleMatch[1].trim();
    const interval = cronIntervalMinutes(schedule);
    if (interval <= 60) {
      assert.match(fm, /^ {2}guard:\s*\S+$/m, `${relPath}: <=60m schedule requires a guard`);
      const guardPath = /^ {2}guard:\s*(\S+)$/m.exec(fm)[1];
      const projectDir = dirname(dirname(join(companyDir, name)));
      assert.equal(existsSync(join(projectDir, guardPath)), true, `${relPath}: guard file missing`);
    }
  }

  const signalScan = read("companies/self-media/products/flagship-channel/projects/radar/tasks/public-signal-scan.md");
  assert.match(signalScan, /^ {2}schedule: "0 \* \* \* \*"$/m);
  assert.match(signalScan, /^period: hour$/m);
  assert.match(signalScan, /^ {2}guard: guards\/radar-sentinel\.mjs$/m);

  const dailyPitch = read("companies/self-media/products/flagship-channel/projects/studio/tasks/daily-topic-pitch.md");
  assert.match(dailyPitch, /^ {2}schedule: "0 10 \* \* \*"$/m);
  assert.match(dailyPitch, /\.\.\/radar\/signals\//);

  const matrixReview = read("companies/self-media/projects/matrix-hq/tasks/weekly-matrix-review.md");
  assert.match(matrixReview, /^ {2}schedule: "0 20 \* \* 0"$/m);
  assert.match(matrixReview, /^period: week$/m);
  assert.match(matrixReview, /growth\/retros\//);
  assert.match(matrixReview, /启动上下文/);

  const retro = read("companies/self-media/products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md");
  assert.match(retro, /^ {2}schedule: "0 19 \* \* 0"$/m);
  assert.match(retro, /^period: week$/m);
  assert.match(retro, /\.\.\/studio\/published\//);
  assert.match(retro, /\.\.\/radar\/signals\//);
});

test("全目录无历史虚构数据或旧脚本引用残留", () => {
  const forbidden = ["2026-11-04", "2026-11-03", "one-person-company", "-ctl.mjs", "6200 行"];
  for (const relPath of listFiles(companyDir)) {
    const absPath = join(companyDir, relPath);
    if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$/i.test(relPath)) continue;
    const text = readFileSync(absPath, "utf8");
    for (const marker of forbidden) {
      assert.equal(text.includes(marker), false, `${relPath} still contains ${marker}`);
    }
  }

  const dashboard = read("companies/self-media/projects/matrix-hq/dashboard.html");
  assert.doesNotMatch(dashboard, /<button|<input|<form|onclick=|location\.reload/i);
  assert.doesNotMatch(dashboard, /(阅读量|粉丝数|转化率|点赞数)\s*[:：]?\s*\d/);
});

test("catalog.json 由构建脚本生成且包含 self-media 双语元数据", () => {
  execFileSync(process.execPath, ["scripts/build-catalog.mjs"], { cwd: repoRoot, stdio: "pipe" });

  const catalog = JSON.parse(read("catalog.json"));
  const slugs = catalog.companies.map((company) => company.slug);
  assert.ok(slugs.includes("self-media"), "catalog missing self-media");
  assert.equal(slugs.includes("one-person-company"), false, "catalog still lists one-person-company");

  const selfMedia = catalog.companies.find((company) => company.slug === "self-media");
  assert.equal(selfMedia.name.zh, "自媒体矩阵");
  assert.ok(selfMedia.description.zh.length > 20);
  assert.ok(selfMedia.description.en.length > 20);
  assert.ok(selfMedia.opsHighlights.zh.length >= 4);
  assert.equal(selfMedia.products[0].id, "flagship-channel");
  assert.equal(selfMedia.products[0].branch, "main");
  assert.equal(selfMedia.products[0].projectsCount, 3);
});

test("catalog.json 忠实保留 Productfile 的 source.path 与 source.git", () => {
  execFileSync(process.execPath, ["scripts/build-catalog.mjs"], { cwd: repoRoot, stdio: "pipe" });
  const catalog = JSON.parse(read("catalog.json"));

  const selfMedia = catalog.companies.find((company) => company.slug === "self-media");
  const flagship = selfMedia.products.find((product) => product.id === "flagship-channel");
  assert.equal(flagship.git, "./code");
  assert.notEqual(flagship.git, "", "source.path must not degrade into an empty git field");
  assert.equal(flagship.source.type, "path");
  assert.equal(flagship.source.ref, "./code");
  assert.equal(flagship.branch, "main");

  const oss = catalog.companies.find((company) => company.slug === "open-source-software");
  const openCompare = oss.products.find((product) => product.id === "open-compare");
  assert.equal(openCompare.git, "https://github.com/chaxiu/OpenCompare");
  assert.equal(openCompare.commit, "e86980ff2742bff5f28c5eb368e5d82ebfbab0ac");
  assert.equal(openCompare.branch, "main");
  assert.equal(openCompare.source.type, "git");
  assert.equal(openCompare.source.ref, "https://github.com/chaxiu/OpenCompare");
  assert.equal(openCompare.source.commit, "e86980ff2742bff5f28c5eb368e5d82ebfbab0ac");
});

test("catalog.json 连续两次构建输出稳定", () => {
  execFileSync(process.execPath, ["scripts/build-catalog.mjs"], { cwd: repoRoot, stdio: "pipe" });
  const first = read("catalog.json");
  execFileSync(process.execPath, ["scripts/build-catalog.mjs"], { cwd: repoRoot, stdio: "pipe" });
  assert.equal(read("catalog.json"), first, "catalog.json must be byte-stable across builds");
});

test("ac-1 项目产物路径落在各自项目工作目录，技能按名称加载", () => {
  for (const name of listFiles(companyDir)) {
    if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$/i.test(name)) continue;
    const text = readFileSync(join(companyDir, name), "utf8");
    assert.equal(text.includes("../../code"), false, `${name}: 不得引用导入后越权的 ../../code 路径`);
    assert.equal(text.includes("../../../skills"), false, `${name}: 技能必须按名称加载，不得引用 ../../../skills 相对路径`);
  }

  for (const name of listFiles(join(productDir, "projects"))) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(join(productDir, "projects", name), "utf8");
    assert.equal(/SKILL\.md/.test(text), false, `projects/${name}: 技能不得以文件路径引用`);
  }

  for (const dirName of ["pitches", "drafts", "published"]) {
    assert.equal(
      existsSync(join(productDir, "projects", "studio", dirName)),
      true,
      `missing studio/${dirName} writable directory`
    );
  }

  const dailyPitch = read("companies/self-media/products/flagship-channel/projects/studio/tasks/daily-topic-pitch.md");
  assert.match(dailyPitch, /pitches\/YYYY-MM-DD\.md/);
  assert.match(dailyPitch, /\.\.\/radar\/signals\//);

  const draft = read("companies/self-media/products/flagship-channel/projects/studio/tasks/multi-platform-draft.md");
  assert.match(draft, /drafts\/YYYY-MM-DD-<slug>\//);

  const retro = read("companies/self-media/products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md");
  assert.match(retro, /\.\.\/studio\/published\//);
  assert.match(retro, /\.\.\/radar\/signals\//);
  for (const name of ["daily-topic-pitch.md", "multi-platform-draft.md"]) {
    const text = read(`companies/self-media/products/flagship-channel/projects/studio/tasks/${name}`);
    assert.equal(text.includes("code/"), false, `studio/${name}: 产出不得写产品 code/ 目录`);
  }
  assert.equal(retro.includes("code/"), false, "growth 复盘不得引用失效的 code/ 目录");
});

test("ac-2 self-media 全部任务 frontmatter 不再包含历史 reads 字段", () => {
  const taskFiles = listFiles(companyDir).filter((name) => name.includes("/tasks/") && name.endsWith(".md"));
  assert.ok(taskFiles.length >= 6, "expected all standing shifts to be present");

  for (const name of taskFiles) {
    const relPath = `companies/self-media/${name}`;
    const fm = frontmatter(read(relPath));
    assert.doesNotMatch(fm, /^reads:\s*$/m, `${relPath}: 历史 reads 字段必须移除`);
    assert.doesNotMatch(fm, /^ {2}projects:\s*$/m, `${relPath}: 历史 reads.projects 块必须移除`);
  }
});

test("ac-2 产品内跨项目协作按确定性 ../<slug> 与启动只读索引寻址", () => {
  const dailyPitch = read("companies/self-media/products/flagship-channel/projects/studio/tasks/daily-topic-pitch.md");
  assert.match(dailyPitch, /\.\.\/radar\/signals\//);

  const draft = read("companies/self-media/products/flagship-channel/projects/studio/tasks/multi-platform-draft.md");
  assert.match(draft, /\.\.\/radar\/signals\//);

  const retro = read("companies/self-media/products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md");
  assert.match(retro, /\.\.\/studio\/published\//);
  assert.match(retro, /\.\.\/radar\/signals\//);

  const matrixReview = read("companies/self-media/projects/matrix-hq/tasks/weekly-matrix-review.md");
  assert.match(matrixReview, /growth\/retros\//);
  assert.match(matrixReview, /启动上下文/);
});

function guardFixture(watchlist) {
  const projectDir = join(mkdtempSync(join(tmpdir(), "radar-sentinel-")), "project");
  mkdirSync(join(projectDir, "guards"), { recursive: true });
  copyFileSync(
    join(productDir, "projects", "radar", "guards", "radar-sentinel.mjs"),
    join(projectDir, "guards", "radar-sentinel.mjs")
  );
  if (watchlist !== undefined) {
    writeFileSync(
      join(projectDir, "watchlist.json"),
      typeof watchlist === "string" ? watchlist : JSON.stringify(watchlist, null, 2)
    );
  }
  return { projectDir, guardPath: join(projectDir, "guards", "radar-sentinel.mjs") };
}

function runGuard(guardPath) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [guardPath], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      rejectPromise(new Error("radar-sentinel timed out"));
    }, 20000);
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
    child.on("close", (status) => {
      clearTimeout(timer);
      resolvePromise({ status, stdout, stderr });
    });
  });
}

const RSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>fixture</title>
<item><title>A new agent workflow</title><link>https://example.com/agent-workflow</link>
<guid>fixture-item-1</guid><description>local first agent tooling</description>
<pubDate>Sun, 22 Nov 2026 09:00:00 GMT</pubDate></item>
</channel></rss>`;

function rssWatchlist(url) {
  return {
    profile: { niche: "测试赛道" },
    keywords: { boost: ["agent"], mute: [] },
    public_sources: [{ id: "fixture", name: "fixture", type: "rss", url, limit: 5, enabled: true }],
  };
}

async function withRssServer(fn) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/rss+xml; charset=utf-8" });
    res.end(RSS_FEED);
  });
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}/feed.xml`);
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

test("ac-3 雷达守卫：配置缺失/损坏、全部源失败、未捕获异常均以 2 退出并写 stderr", async () => {
  const missing = await runGuard(guardFixture(undefined).guardPath);
  assert.equal(missing.status, 2, "missing watchlist.json must exit 2");
  assert.match(missing.stderr, /watchlist\.json/);

  const corrupt = await runGuard(guardFixture("{ not valid json").guardPath);
  assert.equal(corrupt.status, 2, "corrupt watchlist.json must exit 2");
  assert.match(corrupt.stderr, /合法 JSON/);

  const allFailed = await runGuard(guardFixture(rssWatchlist("http://127.0.0.1:1/feed.xml")).guardPath);
  assert.equal(allFailed.status, 2, "all sources failing must exit 2");
  assert.match(allFailed.stderr, /全部 1 个外部源抓取失败/);
  assert.match(allFailed.stderr, /fixture/);

  const crashed = guardFixture(await withRssServer((url) => Promise.resolve(rssWatchlist(url))));
  writeFileSync(join(crashed.projectDir, ".state"), "not a directory");
  const uncaught = await runGuard(crashed.guardPath);
  assert.equal(uncaught.status, 2, "uncaught exception must exit 2");
  assert.match(uncaught.stderr, /未捕获异常/);
});

test("ac-3 雷达守卫：至少一个源成功且无新信号退出 1，发现新信号落盘并退出 0", async () => {
  await withRssServer(async (url) => {
    const skip = guardFixture(rssWatchlist(url));
    mkdirSync(join(skip.projectDir, ".state"), { recursive: true });
    writeFileSync(
      join(skip.projectDir, ".state", "seen-items.json"),
      JSON.stringify({ ids: ["rss:fixture:fixture-item-1"] })
    );
    const skipped = await runGuard(skip.guardPath);
    assert.equal(skipped.status, 1, "successful sources with no new items must exit 1");
    assert.equal(existsSync(join(skip.projectDir, ".state", "pending-signals.json")), false);

    const trigger = guardFixture(rssWatchlist(url));
    const triggered = await runGuard(trigger.guardPath);
    assert.equal(triggered.status, 0, "new items must exit 0");
    const pending = JSON.parse(readFileSync(join(trigger.projectDir, ".state", "pending-signals.json"), "utf8"));
    assert.equal(pending.totalNewCount, 1);
    assert.equal(pending.items[0].uid, "rss:fixture:fixture-item-1");
    assert.deepEqual(pending.items[0].matchedBoost, ["agent"]);
  });
});

const RACE_STATES = ["加注", "保持", "冻结", "淘汰"];
const RETRO_ARCHIVE_PATH = "retros/weekly-YYYY-Www.md";
const MATRIX_TASK = "companies/self-media/projects/matrix-hq/tasks/weekly-matrix-review.md";
const GROWTH_TASK = "companies/self-media/products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md";
const MATRIX_README = "companies/self-media/projects/matrix-hq/README.md";
const GROWTH_README = "companies/self-media/products/flagship-channel/projects/growth/README.md";

function thresholdBlock(markdown, relPath) {
  const match = /<!-- race-thresholds:start -->([\s\S]*?)<!-- race-thresholds:end -->/.exec(markdown);
  assert.ok(match, `${relPath}: missing race-thresholds block`);
  return match[1];
}

function thresholdNumbers(block) {
  const found = block.match(/-?\d+(?:\.\d+)?/g) ?? [];
  return [...new Set(found.map(Number))].sort((a, b) => a - b);
}

function tableRow(block, state, relPath) {
  const row = block
    .split("\n")
    .find((line) => line.trim().startsWith(`| ${state} |`));
  assert.ok(row, `${relPath}: 赛马判定表缺少「${state}」行`);
  const cells = row.split("|").map((cell) => cell.trim()).slice(1, -1);
  assert.equal(cells.length, 5, `${relPath}: 「${state}」行必须包含 5 列（状态/触发条件/样本门槛/观察窗/复核要求）`);
  return cells;
}

test("ac-race-thresholds 判定表四态齐全且阈值可解析、标注默认待校准", () => {
  const block = thresholdBlock(read(MATRIX_TASK), MATRIX_TASK);
  assert.match(block, /默认阈值/, "判定表必须标注默认阈值");
  assert.match(block, /首个真实周期实测后校准/, "判定表必须标注可校准");

  let numericGroups = 0;
  for (const state of RACE_STATES) {
    const cells = tableRow(block, state, MATRIX_TASK);
    const trigger = cells[1].match(/-?\d+(?:\.\d+)?/g) ?? [];
    assert.ok(trigger.length >= 2, `${state}: 触发条件至少要有 2 个数值阈值，实际 ${trigger.length}`);
    const sampleGate = cells[2].match(/-?\d+(?:\.\d+)?/g) ?? [];
    assert.ok(sampleGate.length >= 1, `${state}: 最小样本门槛必须含数值`);
    assert.ok(cells[3].length > 0 && cells[4].length > 0, `${state}: 观察窗与复核要求不得为空`);
    numericGroups += trigger.length;
  }
  assert.ok(numericGroups >= 4, `判定表应能正则解析出 ≥4 组数值阈值，实际 ${numericGroups}`);

  const numbers = thresholdNumbers(block);
  for (const expected of [0.5, 1.5, 2, 3, 4, 20]) {
    assert.ok(numbers.includes(expected), `判定表缺少基线阈值 ${expected}`);
  }
});

test("ac-rule-consistency growth 任务与两个 README 的阈值数值与 matrix-hq 完全一致", () => {
  const canonical = thresholdNumbers(thresholdBlock(read(MATRIX_TASK), MATRIX_TASK));
  assert.ok(canonical.length >= 4, `matrix-hq 阈值数值集合过小: ${canonical.join(",")}`);

  for (const relPath of [GROWTH_TASK, MATRIX_README, GROWTH_README]) {
    const block = thresholdBlock(read(relPath), relPath);
    assert.deepEqual(thresholdNumbers(block), canonical, `${relPath}: 阈值数值集合与 matrix-hq 不一致`);
    assert.match(block, /默认阈值/, `${relPath}: 阈值摘要必须标注默认阈值可校准`);
  }

  const growthBlock = thresholdBlock(read(GROWTH_TASK), GROWTH_TASK);
  for (const state of RACE_STATES) {
    tableRow(growthBlock, state, GROWTH_TASK);
  }
});

test("ac-retro-archive growth 同时产出 digest 与 ISO 周归档，matrix-hq 读取 retros/", () => {
  const retro = read(GROWTH_TASK);
  assert.ok(retro.includes(RETRO_ARCHIVE_PATH), "growth 任务必须写明 retros/weekly-YYYY-Www.md 归档路径");
  assert.ok(retro.includes("`digest.md`"), "growth 任务必须保留本周摘要 digest.md");
  assert.match(retro, /ISO 周/, "growth 任务必须说明归档按 ISO 周命名");

  const retrosDir = join(productDir, "projects", "growth", "retros");
  assert.equal(existsSync(retrosDir), true, "缺少 growth/retros 归档目录");
  assert.ok(listFiles(retrosDir).includes(".gitkeep"), "growth/retros 必须保留 .gitkeep");

  const matrix = read(MATRIX_TASK);
  assert.ok(matrix.includes(RETRO_ARCHIVE_PATH), "matrix-hq 任务必须读取 growth 的 retros/ 归档");
  assert.ok(matrix.includes("growth/retros/"), "matrix-hq 任务必须指向 growth 的 retros/ 目录");
});

test("ac-no-fake-metrics 复盘文档不含伪指标，digest 交接必须同时给出归档路径", () => {
  const reviewDocs = [MATRIX_TASK, GROWTH_TASK, MATRIX_README, GROWTH_README];
  for (const relPath of reviewDocs) {
    const text = read(relPath);
    assert.doesNotMatch(
      text,
      /(阅读量|粉丝数|曝光量|转化率|爆款案例|点赞数)\s*[:：]?\s*\d/,
      `${relPath}: 出现把具体指标当事实的伪数据`
    );
    assert.match(thresholdBlock(text, relPath), /默认阈值/, `${relPath}: 阈值必须以策略默认值呈现`);
  }

  for (const relPath of listFiles(companyDir)) {
    if (!/\.(md|html)$/i.test(relPath)) continue;
    if (!/\/(matrix-hq|growth)\//.test(`/${relPath}`)) continue;
    const text = readFileSync(join(companyDir, relPath), "utf8");
    if (!text.includes("digest.md")) continue;
    assert.ok(
      text.includes(RETRO_ARCHIVE_PATH),
      `${relPath}: 复盘摘要交接必须同时提到 ${RETRO_ARCHIVE_PATH} 归档`
    );
  }
});
