#!/usr/bin/env node
/**
 * Zero-Token Preflight Guard for `brain/tasks/inbox-digest.md`
 *
 * Checks two input channels without consuming any LLM tokens:
 * 1. `inbox/` directory: Any new raw note/link/transcript files (excluding `README.md`, dotfiles, and `archive/`).
 * 2. `../radar/signals/`: Any recent signal markdown files containing recommendations for `brain`
 *    that have been updated since the last recorded digest hash in `.state/brain-guard-state.json`.
 *
 * Exit codes:
 * - 0: New inputs found (writes `.state/pending-brain-inputs.json` and wakes Agent)
 * - 1: Nothing new to digest (skips TaskRun at 0 token cost)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROJECTS_ROOT = path.resolve(PROJECT_ROOT, '..');
const INBOX_DIR = path.join(PROJECT_ROOT, 'inbox');
const STATE_DIR = path.join(PROJECT_ROOT, '.state');
const STATE_FILE = path.join(STATE_DIR, 'brain-guard-state.json');
const PENDING_FILE = path.join(STATE_DIR, 'pending-brain-inputs.json');

async function resolveSiblingProjectDir(specId, titleKeyword) {
  const direct = path.join(PROJECTS_ROOT, specId);
  try {
    await fs.access(direct);
    return direct;
  } catch {
    // scan Munk runtime ops-<hex> siblings via meta.json
  }
  try {
    const entries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const candidate = path.join(PROJECTS_ROOT, entry.name);
      const meta = await readJsonSafe(path.join(candidate, 'meta.json'), null);
      if (typeof meta?.title === 'string' && meta.title.includes(titleKeyword)) {
        return candidate;
      }
    }
  } catch {
    // ignore
  }
  return direct;
}

function sha1(content) {
  return crypto.createHash('sha1').update(content).digest('hex');
}

async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function scanInboxFiles() {
  try {
    const entries = await fs.readdir(INBOX_DIR, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.startsWith('.')) continue;
      if (entry.name.toLowerCase() === 'readme.md') continue;
      const fullPath = path.join(INBOX_DIR, entry.name);
      const stat = await fs.stat(fullPath);
      if (stat.size === 0) continue;
      files.push({
        fileName: entry.name,
        relativePath: `inbox/${entry.name}`,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
    return files;
  } catch {
    return [];
  }
}

async function scanRadarSignalsForBrain(seenRadarHashes) {
  const radarRoot = await resolveSiblingProjectDir('radar', '情报雷达');
  const subdirs = ['signals', 'recon'];
  const matches = [];
  const updatedHashes = { ...seenRadarHashes };

  for (const sub of subdirs) {
    const targetDir = path.join(radarRoot, sub);
    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const markdownFiles = entries
        .filter((e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('.') && e.name.toLowerCase() !== 'readme.md')
        .map((e) => e.name)
        .sort()
        .slice(-6);

      for (const name of markdownFiles) {
        const key = `${sub}/${name}`;
        const fullPath = path.join(targetDir, name);
        const content = await fs.readFile(fullPath, 'utf8');
        const digestHash = sha1(content);

        if (seenRadarHashes[key] === digestHash || seenRadarHashes[name] === digestHash) {
          continue;
        }

        const mentionsBrain =
          /`brain`/i.test(content) ||
          /(?:→|->)\s*brain\b/i.test(content) ||
          /交给\s*brain/i.test(content) ||
          /沉淀入?\s*brain/i.test(content) ||
          /第二大脑/.test(content);

        if (mentionsBrain) {
          matches.push({
            fileName: name,
            relativePath: path.relative(PROJECT_ROOT, fullPath),
            hash: digestHash,
          });
          updatedHashes[key] = digestHash;
        }
      }
    } catch {
      // directory may not exist yet
    }
  }

  return { matches, updatedHashes };
}

async function main() {
  await fs.mkdir(STATE_DIR, { recursive: true });
  const state = await readJsonSafe(STATE_FILE, {
    lastCheckedAt: null,
    seenRadarHashes: {},
  });

  const inboxFiles = await scanInboxFiles();
  const { matches: radarSignals, updatedHashes } = await scanRadarSignalsForBrain(
    state.seenRadarHashes || {}
  );

  const forceTrigger = process.env.BRAIN_FORCE_TRIGGER === '1';
  const hasWork = forceTrigger || inboxFiles.length > 0 || radarSignals.length > 0;

  if (!hasWork) {
    process.exit(1);
  }

  const nowIso = new Date().toISOString();
  await fs.writeFile(
    PENDING_FILE,
    JSON.stringify(
      {
        generatedAt: nowIso,
        forceTrigger,
        inboxFilesCount: inboxFiles.length,
        inboxFiles,
        radarSignalsCount: radarSignals.length,
        radarSignals,
      },
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(
    STATE_FILE,
    JSON.stringify(
      {
        lastCheckedAt: nowIso,
        seenRadarHashes: updatedHashes,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(
    `[brain-inbox-guard] Waking brain: ${inboxFiles.length} inbox item(s), ${radarSignals.length} radar signal file(s).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[brain-inbox-guard] Unexpected error:', err);
  process.exit(1);
});
