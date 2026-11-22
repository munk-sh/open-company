import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
    "companies/self-media/products/flagship-channel/code/pitches/.gitkeep",
    "companies/self-media/products/flagship-channel/code/drafts/.gitkeep",
    "companies/self-media/products/flagship-channel/code/published/.gitkeep",
    "companies/self-media/products/flagship-channel/projects/radar/guards/radar-sentinel.mjs",
    "companies/self-media/products/flagship-channel/projects/radar/watchlist.json",
    "companies/self-media/products/flagship-channel/projects/studio/tasks/daily-topic-pitch.md",
    "companies/self-media/products/flagship-channel/projects/studio/tasks/multi-platform-draft.md",
    "companies/self-media/products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md",
  ]) {
    assert.equal(existsSync(join(repoRoot, relPath)), true, `missing ${relPath}`);
  }

  const contentFiles = listFiles(join(productDir, "code")).filter((name) => !name.endsWith(".gitkeep"));
  assert.deepEqual(contentFiles, ["README.md"], "channel content library must start empty (only README.md)");
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
  assert.match(dailyPitch, /flagship-channel\/radar/);

  const matrixReview = read("companies/self-media/projects/matrix-hq/tasks/weekly-matrix-review.md");
  assert.match(matrixReview, /^ {2}schedule: "0 20 \* \* 0"$/m);
  assert.match(matrixReview, /^period: week$/m);
  assert.match(matrixReview, /flagship-channel\/growth/);

  const retro = read("companies/self-media/products/flagship-channel/projects/growth/tasks/weekly-channel-retro.md");
  assert.match(retro, /^ {2}schedule: "0 19 \* \* 0"$/m);
  assert.match(retro, /^period: week$/m);
  assert.match(retro, /flagship-channel\/studio/);
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
