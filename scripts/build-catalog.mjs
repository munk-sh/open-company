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
      zh: "开源软件公司",
      en: "Open Source Software Company",
    },
    description: {
      zh: "孵化、研发、验收并持续运营高品质开源桌面与开发者工具的 AI 软件公司模板（内含 OpenCompare 标杆案例）。",
      en: "An AI software company template for incubating, building, verifying, and operating production-grade open-source desktop & developer tools (featuring OpenCompare).",
    },
    opsHighlights: {
      zh: ["每日 21:00 全公司推进对账与跨产品经验提炼", "原生桌面操作通道（computer）"],
      en: ["Daily 21:00 cross-product progress & experience patrol", "Native desktop operator channel (computer)"],
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
    return {
      id: parsedProduct.id || productSlug,
      title: parsedProduct.title || productSlug,
      lifecycle: parsedProduct.lifecycle,
      git: parsedProduct.git,
      branch: parsedProduct.branch,
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
