// Runs `gh` with [github].munk_agent_token when that field is set.
// The token stays in the child environment and is never printed.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function findConfigPath(startDir) {
  let current = startDir;
  const root = parse(current).root;
  for (let depth = 0; depth < 32; depth += 1) {
    const candidate = join(current, "config.toml");
    if (existsSync(candidate)) return candidate;
    if (current === root) return null;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return null;
}

function readTomlScalar(raw) {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function readMunkAgentToken() {
  const fromEnv = process.env.GH_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const starts = [process.cwd(), dirname(scriptDir)];
  for (const start of starts) {
    const configPath = findConfigPath(start);
    if (!configPath) continue;
    let text = "";
    try {
      text = readFileSync(configPath, "utf8");
    } catch {
      continue;
    }
    const section = text.match(/(?:^|\n)\[github\]\s*\n([\s\S]*?)(?=\n\[|$)/);
    const line = (section?.[1] ?? "").match(/^[ \t]*munk_agent_token[ \t]*=[ \t]*(.*)$/m);
    if (line?.[1]) return readTomlScalar(line[1]);
  }
  return "";
}

const token = readMunkAgentToken();
const env = { ...process.env };
if (token) env.GH_TOKEN = token;

const child = spawnSync("gh", process.argv.slice(2), { stdio: "inherit", env });
if (child.error) {
  process.stderr.write(`${child.error.message}\n`);
  process.exit(1);
}
process.exit(child.status ?? 1);
