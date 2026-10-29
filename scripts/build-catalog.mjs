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
  return {
    id: base.id || "",
    title: base.title || base.id || "",
    lifecycle: base.lifecycle || "live",
    git: gitMatch ? gitMatch[1].trim() : "",
    branch: branchMatch ? branchMatch[1].trim() : "main",
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
