#!/usr/bin/env node

/**
 * Studio Video Lifecycle Controller (`studio-ctl.mjs`)
 *
 * Keeps `src/video-studio/` lean across 100+ videos by separating:
 *   1. Shared foundation (`src/video-studio/shared/`)
 *   2. Single-slot active build stage (`src/video-studio/workspace/`)
 *   3. Pure-text per-episode archive (`../../episodes/YYYY-MM/<slug>/`, ~30KB each)
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineRoot = resolve(__dirname, "..");
const studioRoot = resolve(engineRoot, "../..");
const sharedDir = join(engineRoot, "shared");
const workspaceDir = join(engineRoot, "workspace");
const episodesRoot = join(studioRoot, "episodes");
const rendersRoot = join(studioRoot, "renders");
const stateFile = join(workspaceDir, ".mounted-episode.json");

const SOURCE_FILES = ["scenes.json", "index.html", "episode.css", "timeline.js"];

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ensureSharedLink() {
  mkdirSync(workspaceDir, { recursive: true });
  const linkPath = join(workspaceDir, "shared");
  try {
    const st = lstatSync(linkPath);
    if (st.isSymbolicLink() || st.isDirectory()) {
      return;
    }
    unlinkSync(linkPath);
  } catch {
    // does not exist yet
  }
  symlinkSync("../shared", linkPath, "dir");
}

function writeWorkspaceConfig(slug, title) {
  writeFileSync(
    join(workspaceDir, "meta.json"),
    `${JSON.stringify({ id: slug, name: title || slug }, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(workspaceDir, "hyperframes.json"),
    `${JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        paths: {
          blocks: "compositions",
          components: "compositions/components",
          assets: "audio",
        },
        media: { autoProxy: true },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function findEpisodeDir(ref) {
  const direct = resolve(episodesRoot, ref);
  if (existsSync(direct) && statSync(direct).isDirectory()) {
    return direct;
  }
  if (!existsSync(episodesRoot)) return null;
  for (const ym of readdirSync(episodesRoot)) {
    const candidate = join(episodesRoot, ym, ref);
    if (existsSync(candidate) && statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  return null;
}

function syncWorkspaceToEpisode() {
  if (!existsSync(stateFile)) return null;
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  if (!state.episodeDir) return null;
  mkdirSync(state.episodeDir, { recursive: true });
  for (const file of SOURCE_FILES) {
    const src = join(workspaceDir, file);
    if (existsSync(src)) {
      copyFileSync(src, join(state.episodeDir, file));
    }
  }
  return state;
}

function buildStarterFiles(slug, aspect, theme) {
  const isPortrait = aspect === "9:16";
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1920 : 1080;

  const scenes = {
    slug,
    title: slug,
    aspect,
    theme,
    voice: "zh-CN-YunxiNeural",
    totalDuration: 12,
    scenes: [
      {
        id: "scene-1-hook",
        startTime: 0,
        duration: 6,
        fragments: [2.2],
        kicker: "CORE INSIGHT",
        headline: "先给反直觉结论",
        subhead: "用动态图形演出来，绝不堆砌长文",
        visualMetaphor: "左侧旧模式痛点红卡 -> 右侧新机制高亮绿卡",
        narration: "很多人做视频卡在剪辑软件里，其实用代码驱动时间轴反而快十倍。",
      },
      {
        id: "scene-2-takeaway",
        startTime: 6,
        duration: 6,
        fragments: [8.0],
        kicker: "TAKEAWAY",
        headline: "三步跑通自动化闭环",
        subhead: "脚本测时 · 定制动效 · 自动体检",
        visualMetaphor: "三步递进节点连线随语音依次点亮",
        narration: "先合成语音锁定秒数，再写定制动画，最后一键体检导出成片。",
      },
    ],
    cues: [
      { start: 0, end: 3.0, text: "很多人做视频卡在剪辑软件里" },
      { start: 3.0, end: 6.0, text: "其实用代码驱动时间轴反而快十倍" },
      { start: 6.0, end: 9.0, text: "先合成语音锁定秒数，再写定制动画" },
      { start: 9.0, end: 12.0, text: "最后一键体检导出成片" },
    ],
  };

  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${theme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${width}, height=${height}" />
    <title>${slug}</title>
    <link rel="stylesheet" href="shared/styles/base.css" />
    <link rel="stylesheet" href="episode.css" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  </head>
  <body>
    <div id="root" data-composition-id="root" data-start="0" data-duration="12" data-width="${width}" data-height="${height}">
      <section id="clip-scene-1" class="clip" data-composition-id="scene-1-hook" data-start="0" data-duration="6"></section>
      <section id="clip-scene-2" class="clip" data-composition-id="scene-2-takeaway" data-start="6" data-duration="6"></section>

      <!-- Scene 1 Sheet -->
      <div id="sheet-scene-1" class="scene-sheet">
        <div class="scene-header">
          <span class="scene-kicker">01 · CORE INSIGHT</span>
          <h1 class="scene-headline">先给反直觉结论</h1>
          <p class="scene-subhead">用动态图形演出来，绝不堆砌长文</p>
        </div>
        <div class="scene-stage">
          <div class="demo-grid">
            <div class="motion-card s1-node">
              <span class="status-pill danger">手工拉关键帧</span>
              <div class="metric-hero" style="color: var(--accent-rose); margin-top: 20px;">4.5h</div>
            </div>
            <div class="motion-card s1-node">
              <span class="status-pill ok">代码驱动时间轴</span>
              <div class="metric-hero" style="margin-top: 20px;">15m</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scene 2 Sheet -->
      <div id="sheet-scene-2" class="scene-sheet">
        <div class="scene-header">
          <span class="scene-kicker">02 · TAKEAWAY</span>
          <h1 class="scene-headline">三步跑通自动化闭环</h1>
          <p class="scene-subhead">脚本测时 · 定制动效 · 自动体检</p>
        </div>
        <div class="scene-stage">
          <div class="motion-card s2-node" style="width: 100%; text-align: center;">
            <span class="status-pill ok">READY TO RENDER</span>
            <div class="metric-hero" style="margin-top: 24px;">100% SYNC</div>
          </div>
        </div>
      </div>

      <!-- Synced Chinese Subtitle Rail -->
      <div class="caption-rail">
        <div id="caption-text" class="caption-box">很多人做视频卡在剪辑软件里</div>
      </div>
    </div>

    <script src="shared/scripts/motion-primitives.js"></script>
    <script src="timeline.js"></script>
  </body>
</html>
`;

  const css = `.demo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  width: 100%;
}

#root[data-width="1080"] .demo-grid {
  grid-template-columns: 1fr;
}
`;

  const js = `const tl = window.StudioMotion.createRootTimeline("#sheet-scene-1", ["#sheet-scene-2"]);

window.StudioMotion.revealGroup(tl, ".s1-node", 0.4, { stagger: 0.18 });
window.StudioMotion.swapScene(tl, "#sheet-scene-1", "#sheet-scene-2", 6.0);
window.StudioMotion.revealGroup(tl, ".s2-node", 6.4);

window.StudioMotion.bindCaptions(tl, [
  { start: 0, end: 3.0, text: "很多人做视频卡在剪辑软件里" },
  { start: 3.0, end: 6.0, text: "其实用代码驱动时间轴反而快十倍" },
  { start: 6.0, end: 9.0, text: "先合成语音锁定秒数，再写定制动画" },
  { start: 9.0, end: 12.0, text: "最后一键体检导出成片" }
]);
`;

  return {
    "scenes.json": `${JSON.stringify(scenes, null, 2)}\n`,
    "index.html": html,
    "episode.css": css,
    "timeline.js": js,
  };
}

function mountEpisodeDir(episodeDir, slug) {
  rmSync(workspaceDir, { recursive: true, force: true });
  mkdirSync(join(workspaceDir, "audio"), { recursive: true });
  ensureSharedLink();

  for (const file of SOURCE_FILES) {
    const src = join(episodeDir, file);
    if (existsSync(src)) {
      copyFileSync(src, join(workspaceDir, file));
    }
  }

  let title = slug;
  const scenesPath = join(workspaceDir, "scenes.json");
  if (existsSync(scenesPath)) {
    try {
      const parsed = JSON.parse(readFileSync(scenesPath, "utf8"));
      title = parsed.title || slug;
    } catch {
      // ignore
    }
  }

  writeWorkspaceConfig(slug, title);
  writeFileSync(
    stateFile,
    `${JSON.stringify({ slug, episodeDir, mountedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Mounted episode '${slug}' into src/video-studio/workspace/`);
}

const [, , cmd, ...args] = process.argv;

if (cmd === "init") {
  const slug = args[0];
  if (!slug || slug.startsWith("-")) {
    console.error("Usage: node scripts/studio-ctl.mjs init <YYYY-MM-DD-slug> [--aspect 9:16|16:9] [--theme dark-keynote|clean-editorial]");
    process.exit(1);
  }
  const aspectIdx = args.indexOf("--aspect");
  const aspect = aspectIdx !== -1 && args[aspectIdx + 1] ? args[aspectIdx + 1] : "9:16";
  const themeIdx = args.indexOf("--theme");
  const theme = themeIdx !== -1 && args[themeIdx + 1] ? args[themeIdx + 1] : "dark-keynote";

  const ym = /^\d{4}-\d{2}/.exec(slug)?.[0] ?? currentYearMonth();
  const episodeDir = join(episodesRoot, ym, slug);
  mkdirSync(episodeDir, { recursive: true });

  const starter = buildStarterFiles(slug, aspect, theme);
  for (const [name, content] of Object.entries(starter)) {
    const target = join(episodeDir, name);
    if (!existsSync(target)) {
      writeFileSync(target, content, "utf8");
    }
  }

  mountEpisodeDir(episodeDir, slug);
} else if (cmd === "mount") {
  const ref = args[0];
  if (!ref) {
    console.error("Usage: node scripts/studio-ctl.mjs mount <slug | YYYY-MM/slug>");
    process.exit(1);
  }
  const episodeDir = findEpisodeDir(ref);
  if (!episodeDir) {
    console.error(`Episode not found under episodes/: ${ref}`);
    process.exit(1);
  }
  const slug = episodeDir.split(/[\\/]/).pop();
  mountEpisodeDir(episodeDir, slug);
} else if (cmd === "check" || cmd === "preview" || cmd === "render") {
  const state = syncWorkspaceToEpisode();
  if (!state) {
    console.error("No active episode mounted in workspace/. Run `init` or `mount` first.");
    process.exit(1);
  }
  const hfArgs = ["--yes", "hyperframes@0.9.0", cmd, ...args];
  const res = spawnSync("npx", hfArgs, {
    cwd: workspaceDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  syncWorkspaceToEpisode();
  process.exit(res.status ?? 0);
} else if (cmd === "archive") {
  const state = syncWorkspaceToEpisode();
  if (!state) {
    console.log("Workspace is already clean.");
    process.exit(0);
  }
  rmSync(join(workspaceDir, "audio"), { recursive: true, force: true });
  rmSync(join(workspaceDir, ".hyperframes"), { recursive: true, force: true });
  console.log(`Archived pure-text sources to ${state.episodeDir} and cleaned workspace audio/render caches.`);
} else if (cmd === "prune") {
  const keepIdx = args.indexOf("--keep");
  const keepCount = keepIdx !== -1 && args[keepIdx + 1] ? Number(args[keepIdx + 1]) : 15;
  if (!existsSync(rendersRoot)) process.exit(0);
  const dirs = readdirSync(rendersRoot)
    .filter((d) => !d.startsWith("."))
    .map((d) => ({ name: d, full: join(rendersRoot, d) }))
    .filter((d) => statSync(d.full).isDirectory())
    .sort((a, b) => b.name.localeCompare(a.name));

  let removedMp4 = 0;
  for (const old of dirs.slice(keepCount)) {
    for (const f of readdirSync(old.full)) {
      if (f.endsWith(".mp4")) {
        unlinkSync(join(old.full, f));
        removedMp4++;
      }
    }
  }
  console.log(`Pruned ${removedMp4} old MP4 file(s) beyond latest ${keepCount} episodes.`);
} else {
  console.log("Commands: init | mount | check | preview | render | archive | prune");
}
