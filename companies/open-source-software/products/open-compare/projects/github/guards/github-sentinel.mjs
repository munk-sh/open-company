// High-frequency GitHub Sentinel Guard (Zero LLM token cost when idle).
// Checks GitHub Issues, Pull Requests, and latest Actions runs via `gh`.
// Compares fingerprint against `state/seen.txt`.
// Exit 0 -> wake Task Agent with reason on stdout.
// Exit 1 -> nothing new (skip LLM session).
// Exit 2 -> guard error.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const cursorPath = join(projectDir, "state", "seen.txt");
const patrolJsonPath = join(projectDir, "state", "github-patrol.json");

function readCursor() {
  try {
    return readFileSync(cursorPath, "utf8").trim();
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return "";
    }
    process.stdout.write("cursor unreadable\n");
    process.exit(2);
  }
}

function readPatrolState() {
  try {
    const raw = readFileSync(patrolJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function resolveRepo(patrol) {
  if (patrol && typeof patrol.repo === "string" && patrol.repo.includes("/")) {
    return patrol.repo.trim();
  }
  return process.env.GITHUB_REPO || "chaxiu/OpenCompare";
}

function collectKnownResolvedRunIds(patrol) {
  const ids = new Set();
  const ci = patrol?.ci;
  if (!ci || typeof ci !== "object") {
    return ids;
  }
  for (const key of ["archivedFailureRunIds", "historicalResolvedFailures", "resolvedRunIds"]) {
    if (Array.isArray(ci[key])) {
      for (const id of ci[key]) {
        if (id != null) ids.add(String(id));
      }
    }
  }
  if ((ci.resolved === true || ci.failureResolved === true) && ci.lastFailedRunId != null) {
    ids.add(String(ci.lastFailedRunId));
  }
  return ids;
}

function runGhJson(args) {
  const out = execFileSync("gh", args, {
    encoding: "utf8",
    timeout: 6000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out || "[]");
}

function collectCriticalDependabotAlerts(repo) {
  try {
    const alerts = runGhJson([
      "api",
      `repos/${repo}/dependabot/alerts?state=open&per_page=50`,
    ]);
    if (!Array.isArray(alerts)) return "";
    return alerts
      .filter(
        (alert) =>
          alert &&
          alert.state === "open" &&
          alert.security_advisory &&
          alert.security_advisory.severity === "critical",
      )
      .map((alert) => `DEPENDABOT#${alert.number}:critical`)
      .join(",");
  } catch {
    return "";
  }
}

function parseMarker(marker) {
  if (!marker || typeof marker !== "string") {
    return null;
  }
  const match = /^repo=([^|]*)\|issues=\[([^\]]*)\]\|prs=\[([^\]]*)\]\|failedRuns=\[([^\]]*)\]$/.exec(
    marker.trim(),
  );
  if (!match) {
    return null;
  }
  const toSet = (csv) =>
    new Set(
      csv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  return {
    repo: match[1],
    issues: toSet(match[2]),
    prs: toSet(match[3]),
    failedRuns: toSet(match[4]),
  };
}

const COMMENT_WINDOW = 100;
const BOT_LOGIN = "munk-agent";
const BOT_MENTION = /@munk-agent\b/i;

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

function readMunkAgentToken(startDir) {
  const fromEnv = process.env.GH_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const configPath = findConfigPath(startDir);
  if (!configPath) return "";
  let text = "";
  try {
    text = readFileSync(configPath, "utf8");
  } catch {
    return "";
  }
  const section = text.match(/(?:^|\n)\[github\]\s*\n([\s\S]*?)(?=\n\[|$)/);
  const body = section?.[1] ?? "";
  const line = body.match(/^[ \t]*munk_agent_token[ \t]*=[ \t]*(.*)$/m);
  if (!line?.[1]) return "";
  return readTomlScalar(line[1]);
}

function applyGithubToken() {
  const token = readMunkAgentToken(projectDir);
  if (token) process.env.GH_TOKEN = token;
}

function githubAuthProblem() {
  try {
    execFileSync("gh", ["api", "user", "--jq", ".login"], {
      encoding: "utf8",
      timeout: 6000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return null;
  } catch (error) {
    if (error && error.code === "ENOENT") return "error";
    const stderr = Buffer.isBuffer(error?.stderr)
      ? error.stderr.toString("utf8")
      : String(error?.stderr ?? "");
    if (/auth login|authentication|Bad credentials|HTTP 401|token/i.test(stderr)) {
      return "missing";
    }
    return "error";
  }
}

function issueFingerprint(issue) {
  const count = issue?.comments?.totalCount ?? 0;
  return `I#${issue.number}@${issue.updatedAt}(${count})`;
}

function parseIssueFingerprint(raw) {
  const match = /^I#(\d+)@(.+)\((\d+)\)$/.exec(raw);
  if (!match) return null;
  return {
    number: Number(match[1]),
    updatedAt: match[2],
    count: Number(match[3]),
    raw,
  };
}

function seenIssueIndex(seenRaw) {
  const parsed = parseMarker(seenRaw);
  const index = new Map();
  if (!parsed) return index;
  for (const item of parsed.issues) {
    const fp = parseIssueFingerprint(item);
    if (fp) index.set(fp.number, fp);
  }
  return index;
}

function commentNodes(issue) {
  const nodes = issue?.comments?.nodes;
  if (!Array.isArray(nodes)) return [];
  return nodes.filter((node) => node?.createdAt);
}

function newestComments(issue, count) {
  return commentNodes(issue)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-count);
}

function isQuietComment(node) {
  if (node?.author?.login === BOT_LOGIN) return true;
  if (node?.authorAssociation === "OWNER" && !BOT_MENTION.test(node.body ?? "")) return true;
  return false;
}

function newComments(issue, previousCount) {
  const total = issue?.comments?.totalCount ?? 0;
  const delta = total - previousCount;
  if (delta <= 0) return [];
  const nodes = commentNodes(issue);
  if (nodes.length < delta) return null;
  return newestComments(issue, delta);
}

function keepsCursor(issue, seenIssue) {
  if (!seenIssue) return false;
  const comments = newComments(issue, seenIssue.count);
  return Boolean(comments && comments.length > 0 && comments.every(isQuietComment));
}

function trackedFingerprint(issue, seenIssue) {
  if (keepsCursor(issue, seenIssue)) return seenIssue.raw;
  return issueFingerprint(issue);
}

function hasWakingCommentAfterClose(issue) {
  if (!issue?.closedAt) return false;
  const nodes = commentNodes(issue);
  const afterClose = nodes.filter((node) => node.createdAt > issue.closedAt);
  if (afterClose.some((node) => !isQuietComment(node))) return true;
  const total = issue?.comments?.totalCount ?? 0;
  if (total > nodes.length && nodes.length > 0) {
    const oldest = nodes.reduce(
      (min, node) => (node.createdAt < min ? node.createdAt : min),
      nodes[0].createdAt,
    );
    if (issue.closedAt < oldest) return true;
  }
  return false;
}

function closedIssueFingerprint(issue, seenIssue) {
  if (seenIssue) return trackedFingerprint(issue, seenIssue);
  return hasWakingCommentAfterClose(issue) ? issueFingerprint(issue) : null;
}

function issueSignatures(openIssues, closedIssues, seenIssues) {
  const parts = [];
  for (const issue of openIssues) {
    if (!issue?.number) continue;
    parts.push(trackedFingerprint(issue, seenIssues.get(issue.number)));
  }
  for (const issue of closedIssues) {
    if (!issue?.number) continue;
    const fingerprint = closedIssueFingerprint(issue, seenIssues.get(issue.number));
    if (fingerprint) parts.push(fingerprint);
  }
  return parts.join(",");
}

function hasUnseenItems(seenRaw, latestMarker) {
  const latest = parseMarker(latestMarker);
  if (!latest) {
    return Boolean(latestMarker && latestMarker !== seenRaw);
  }
  const seen = parseMarker(seenRaw);
  if (!seen || seen.repo !== latest.repo) {
    return (
      latest.issues.size > 0 ||
      latest.prs.size > 0 ||
      latest.failedRuns.size > 0
    );
  }
  for (const item of latest.issues) {
    if (!seen.issues.has(item)) return true;
  }
  for (const item of latest.prs) {
    if (!seen.prs.has(item)) return true;
  }
  for (const item of latest.failedRuns) {
    if (!seen.failedRuns.has(item)) return true;
  }
  return false;
}

function look(seen) {
  const patrol = readPatrolState();
  const repo = resolveRepo(patrol);
  const knownResolvedRunIds = collectKnownResolvedRunIds(patrol);

  // Owner comments stay quiet unless they mention @munk-agent.
  // Receipts from munk-agent stay quiet. A body or label edit with no new comment still wakes.
  const commentSelection = `comments(last: ${COMMENT_WINDOW}) { totalCount nodes { author { login } authorAssociation createdAt body } }`;
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        issues(states: OPEN, first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes { number updatedAt ${commentSelection} }
        }
        closedIssues: issues(states: CLOSED, first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes { number updatedAt closedAt ${commentSelection} }
        }
        pullRequests(states: OPEN, first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes { number updatedAt headRefOid }
        }
      }
    }
  `;
  const [owner, name] = repo.split("/");
  const gql = runGhJson([
    "api",
    "graphql",
    "-f",
    `query=${query}`,
    "-F",
    `owner=${owner}`,
    "-F",
    `name=${name}`,
  ]);
  const repoData = gql?.data?.repository ?? {};
  const prs = repoData.pullRequests?.nodes ?? [];
  const runs = runGhJson([
    "run",
    "list",
    "--repo",
    repo,
    "--limit",
    "10",
    "--json",
    "databaseId,workflowName,status,conclusion,headBranch,event",
  ]);

  const latestByScope = new Map();
  for (const r of runs) {
    if (!r || !r.conclusion) continue;
    const scopeKey = `${r.workflowName || "default"}:${r.headBranch || ""}`;
    if (!latestByScope.has(scopeKey)) {
      latestByScope.set(scopeKey, r);
    }
  }

  const issueSig = issueSignatures(
    repoData.issues?.nodes ?? [],
    repoData.closedIssues?.nodes ?? [],
    seenIssueIndex(seen),
  );
  const prSig = prs
    .map((p) => `PR#${p.number}@${p.updatedAt}:${String(p.headRefOid || "").slice(0, 7)}`)
    .join(",");
  const runFails = Array.from(latestByScope.values())
    .filter(
      (r) =>
        (r.conclusion === "failure" || r.conclusion === "cancelled") &&
        !knownResolvedRunIds.has(String(r.databaseId)),
    )
    .map((r) => `RUN#${r.databaseId}:${r.conclusion}(${r.headBranch})`);
  const dependabotAlerts = collectCriticalDependabotAlerts(repo);
  if (dependabotAlerts) {
    runFails.push(dependabotAlerts);
  }
  const failedRuns = runFails.join(",");

  const marker = `repo=${repo}|issues=[${issueSig}]|prs=[${prSig}]|failedRuns=[${failedRuns}]`;
  if (!issueSig && !prSig && !failedRuns && !seen) {
    return "";
  }
  return marker;
}

applyGithubToken();
const authProblem = githubAuthProblem();
if (authProblem === "missing") {
  process.stdout.write(
    "github auth missing: set [github].munk_agent_token or run gh auth login\n",
  );
  process.exit(0);
}

const seen = readCursor();
let latest = "";
try {
  latest = String(look(seen) ?? "");
} catch (error) {
  const message = error instanceof Error ? error.message : "check failed";
  process.stdout.write(`${message}\n`);
  process.exit(2);
}

if (!latest || !hasUnseenItems(seen, latest)) {
  process.exit(1);
}

process.stdout.write(`${latest}\n`);
process.exit(0);
