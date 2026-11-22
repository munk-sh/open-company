#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const companiesRoot = join(repoRoot, "companies");
const outPath = join(repoRoot, "catalog.json");

const REPO_URL = "https://github.com/munk-sh/open-company";
const DEFAULT_REF = "main";

const BILINGUAL_METADATA = {
  "open-source-software": {
    name: {
      zh: "开源软件团队",
      en: "Open-Source Software Team",
    },
    description: {
      zh: "一支替你持续维护开源软件的 AI 团队：有人盯 GitHub Issue 和构建报错、有人写代码、有人在真实桌面上做打包与界面测试、有人每天定时发版。内含实战项目 OpenCompare。",
      en: "An AI team that maintains open-source software end to end: watching GitHub issues & CI, writing code, testing real desktop builds, and cutting daily releases. Includes OpenCompare as a live project.",
    },
    opsHighlights: {
      zh: [
        "daily-patrol：每晚 21:00 盘点全团队进度，把踩坑经验写回共享规则",
        "computer：需要使用真实电脑桌面点击操作时的公共执行通道",
      ],
      en: [
        "daily-patrol: 21:00 nightly progress review & shared lessons update",
        "computer: Shared operator channel for real desktop GUI actions",
      ],
    },
    productSummaries: {
      "open-compare": {
        zh: "配备 7 项日常值班任务：GitHub Issue 与构建报错盯盘、每日 07:00 定时发版、安装包启动自检、大文件夹性能测试、软件界面交互实测、桌面系统窗口实测、发版后自动回帖关单。",
        en: "Equipped with 7 standing shifts: GitHub issue & CI watch, 07:00 daily release, installer smoke check, large-folder stress test, UI interaction check, native window check, and post-release issue replies.",
      },
    },
  },
  "self-media": {
    name: {
      zh: "自媒体矩阵",
      en: "Self-Media Matrix",
    },
    description: {
      zh: "一套按「矩阵赛马」运营多账号自媒体的 AI 团队：顶层总控每周比较各频道真实转化，决定加注、冻结或淘汰，并把爆款结构沉淀为共享打法；内置首发样板频道 flagship-channel，自带零 Token 热点哨兵、选题工坊与频道复盘。",
      en: "An AI team that runs a multi-account media matrix as a channel race: a top-level HQ compares real conversion each week, decides which channels to scale, freeze, or retire, and distills winning structures into shared playbooks. Ships with a flagship-channel starter product with a zero-token signal sentinel, topic studio, and weekly retros.",
    },
    opsHighlights: {
      zh: [
        "matrix-hq：每周日 20:00 汇总各频道增长复盘并给出赛马决策",
        "radar：零 Token 公开源哨兵每小时扫描真实热点与跨网信息差",
        "studio：每日 10:00 产出选题提案，拍板后生成多平台成品包",
        "growth：每周日 19:00 用真实数据复盘频道方向",
      ],
      en: [
        "matrix-hq: Weekly Sunday 20:00 channel comparison and race decisions",
        "radar: Zero-token hourly scan of public sources and cross-platform signal gaps",
        "studio: 10:00 daily topic pitches, then multi-platform draft packages",
        "growth: Sunday 19:00 channel retro backed by real data",
      ],
    },
    productSummaries: {
      "flagship-channel": {
        zh: "首发样板频道：从 Day-0 空态开始，含 radar 热点哨兵（每小时）、studio 每日选题与多平台成品包、growth 周度复盘，用真实数据验证方向是否值得加注。",
        en: "Flagship starter channel: starts from an honest Day-0 empty state with an hourly radar sentinel, daily topic pitches and multi-platform draft packages, plus weekly growth retros to prove whether the direction deserves more investment.",
      },
    },
  },
};

function parseScalarYaml(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([a-zA-Z0-9_-]+):\s*(.+)$/.exec(rawLine);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[match[1]] = val;
    }
  }
  return result;
}

function parseProductYaml(text) {
  const base = parseScalarYaml(text);
  const gitMatch = /\n\s+git:\s*([^\s#]+)/.exec(text);
  const branchMatch = /\n\s+branch:\s*([^\s#]+)/.exec(text);
  const unquote = (val) => val.trim().replace(/^['"]|['"]$/g, "");
  return {
    id: base.id || "",
    title: base.title || base.id || "",
    lifecycle: base.lifecycle || "live",
    git: gitMatch ? unquote(gitMatch[1]) : "",
    branch: branchMatch ? unquote(branchMatch[1]) : "main",
  };
}

function parseTaskTitle(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!fmMatch) return "";
  const titleMatch = /^title:\s*(.+)$/m.exec(fmMatch[1]);
  if (!titleMatch) return "";
  return titleMatch[1].trim().replace(/^['"]|['"]$/g, "");
}

function listSubdirs(dirPath) {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter((name) => !name.startsWith("."))
    .filter((name) => {
      try {
        return statSync(join(dirPath, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function listMarkdownTasks(tasksDir) {
  if (!existsSync(tasksDir)) return [];
  return readdirSync(tasksDir)
    .filter((name) => name.endsWith(".md") && !name.startsWith("."))
    .sort()
    .map((name) => {
      const id = name.replace(/\.md$/, "");
      const title = parseTaskTitle(join(tasksDir, name)) || id;
      return { id, title };
    });
}

function scanCompany(slug) {
  const companyDir = join(companiesRoot, slug);
  const companyfilePath = join(companyDir, "Companyfile.yaml");
  if (!existsSync(companyfilePath)) {
    throw new Error(`Missing Companyfile.yaml in companies/${slug}`);
  }
  const companyYaml = parseScalarYaml(readFileSync(companyfilePath, "utf8"));
  if (companyYaml.spec !== "open-company/v0") {
    throw new Error(`Invalid spec in companies/${slug}/Companyfile.yaml: ${companyYaml.spec}`);
  }

  const companyProjectsDir = join(companyDir, "projects");
  const companyProjects = listSubdirs(companyProjectsDir).map((projectId) => {
    const tasks = listMarkdownTasks(join(companyProjectsDir, projectId, "tasks"));
    return {
      id: projectId,
      tasksCount: tasks.length,
      tasks,
    };
  });

  const productsDir = join(companyDir, "products");
  const products = listSubdirs(productsDir).map((productSlug) => {
    const pDir = join(productsDir, productSlug);
    const pFile = join(pDir, "Productfile.yaml");
    if (!existsSync(pFile)) {
      throw new Error(`Missing Productfile.yaml in companies/${slug}/products/${productSlug}`);
    }
    const parsedProduct = parseProductYaml(readFileSync(pFile, "utf8"));
    const pProjectsDir = join(pDir, "projects");
    const pProjects = listSubdirs(pProjectsDir);
    const allTasks = [];
    for (const proj of pProjects) {
      const tasks = listMarkdownTasks(join(pProjectsDir, proj, "tasks"));
      allTasks.push(...tasks);
    }
    const productId = parsedProduct.id || productSlug;
    return {
      id: productId,
      title: parsedProduct.title || productSlug,
      lifecycle: parsedProduct.lifecycle,
      git: parsedProduct.git,
      branch: parsedProduct.branch,
      summary: BILINGUAL_METADATA[slug]?.productSummaries?.[productId] ?? null,
      projectsCount: pProjects.length,
      tasksCount: allTasks.length,
      tasks: allTasks,
    };
  });

  const sourceUrl = `${REPO_URL}/tree/${DEFAULT_REF}/companies/${slug}`;
  const deepLink = `munk://company/import?url=${encodeURIComponent(sourceUrl)}`;
  const i18n = BILINGUAL_METADATA[slug];

  return {
    slug,
    id: companyYaml.id,
    name: i18n?.name ?? {
      zh: companyYaml.name || slug,
      en: companyYaml.name || slug,
    },
    description: i18n?.description ?? {
      zh: companyYaml.description || "",
      en: companyYaml.description || "",
    },
    opsHighlights: i18n?.opsHighlights ?? {
      zh: [],
      en: [],
    },
    sourceUrl,
    deepLink,
    opsProjectsCount: companyProjects.length,
    opsProjects: companyProjects,
    products,
  };
}

const slugs = listSubdirs(companiesRoot);
const companies = slugs.map(scanCompany);

const catalog = {
  version: 1,
  repo: REPO_URL,
  companies,
};

writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Built catalog.json with ${companies.length} company template(s).`);
