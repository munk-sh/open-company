const tl = window.StudioMotion.createRootTimeline("#sheet-scene-1", [
  "#sheet-scene-2",
  "#sheet-scene-3",
]);

// Scene 1: 0s -> 7.2s (fragment at 2.6s)
window.StudioMotion.revealGroup(tl, "#s1-graveyard", 0.3);
gsap.set("#s1-leverage", { opacity: 0.15, y: 24, scale: 0.96 });
tl.to(
  "#s1-leverage",
  { opacity: 1, y: 0, scale: 1.02, borderColor: "#3ddc84", duration: 0.45, ease: "expo.out" },
  2.6,
);

// Scene 2: 7.2s -> 35.8s (fragments at 12.4s, 19.8s, 27.1s)
window.StudioMotion.swapScene(tl, "#sheet-scene-1", "#sheet-scene-2", 7.2);
window.StudioMotion.revealGroup(tl, ".s2-input", 7.6, { stagger: 0.2 });
window.StudioMotion.drawSvgPath(tl, "#s2-path-left", 12.4, 240, 0.55);
window.StudioMotion.drawSvgPath(tl, "#s2-path-right", 19.8, 240, 0.55);
gsap.set("#s2-evergreen", { opacity: 0.18, scale: 0.94, y: 18 });
tl.to(
  "#s2-evergreen",
  { opacity: 1, scale: 1, y: 0, borderColor: "#3ddc84", duration: 0.5, ease: "expo.out" },
  27.1,
);

// Scene 3: 35.8s -> 58.4s (fragments at 42.0s, 49.5s)
window.StudioMotion.swapScene(tl, "#sheet-scene-2", "#sheet-scene-3", 35.8);
window.StudioMotion.revealGroup(tl, ".s3-outlet", 36.3, { stagger: 0.22 });
tl.to(".s3-outlet", { borderColor: "#38bdf8", duration: 0.35, stagger: 0.15 }, 42.0);
tl.to(".s3-outlet", { borderColor: "#3ddc84", scale: 1.015, duration: 0.4, stagger: 0.15 }, 49.5);

window.StudioMotion.bindCaptions(tl, [
  { start: 0, end: 2.6, text: "我删掉了三年攒下的四千条笔记" },
  { start: 2.6, end: 7.2, text: "产出反而翻了三倍" },
  { start: 7.2, end: 12.4, text: "真正有复利的不是收藏，而是碰撞" },
  { start: 12.4, end: 19.8, text: "外部的新信号，撞上你自己的原话和判断" },
  { start: 19.8, end: 27.1, text: "才会长成一张能反复调用的常青卡" },
  { start: 27.1, end: 35.8, text: "每次写稿和做产品都从卡片直接供弹" },
  { start: 35.8, end: 42.0, text: "今晚别再当收藏夹仓鼠了" },
  { start: 42.0, end: 49.5, text: "挑三条你最常想起的观点写成三张卡" },
  { start: 49.5, end: 58.4, text: "下周它们就会变成你的长文、视频与微产品" },
]);
