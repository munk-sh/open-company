/* ==========================================================================
   One-Person Studio — Deterministic GSAP Choreography Primitives
   ========================================================================== */

window.StudioMotion = {
  /**
   * Initialize root timeline and hide all non-initial scene sheets.
   */
  createRootTimeline(initialSheetSelector, hiddenSheetSelectors = []) {
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    if (initialSheetSelector) {
      gsap.set(initialSheetSelector, { autoAlpha: 1 });
    }
    if (hiddenSheetSelectors.length > 0) {
      gsap.set(hiddenSheetSelectors.join(", "), { autoAlpha: 0 });
    }
    window.__timelines["root"] = tl;
    return tl;
  },

  /**
   * Crossfade from one scene sheet to the next at exact audio timestamp.
   */
  swapScene(tl, fromSelector, toSelector, atTime) {
    tl.to(fromSelector, { autoAlpha: 0, y: -10, duration: 0.25, ease: "power2.in" }, Math.max(0, atTime - 0.18));
    tl.fromTo(
      toSelector,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.35, ease: "expo.out" },
      atTime,
    );
  },

  /**
   * Reveal a group of nodes or cards with staggered motion at `atTime`.
   */
  revealGroup(tl, selector, atTime, opts = {}) {
    const { y = 18, x = 0, scale = 0.96, stagger = 0.1, duration = 0.42 } = opts;
    gsap.set(selector, { opacity: 0.18, y, x, scale });
    tl.to(
      selector,
      {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration,
        stagger,
        ease: "expo.out",
      },
      atTime,
    );
  },

  /**
   * Animate an SVG path stroke drawing in (requires stroke-dasharray & stroke-dashoffset set).
   */
  drawSvgPath(tl, selector, atTime, length = 400, duration = 0.45) {
    gsap.set(selector, { strokeDasharray: length, strokeDashoffset: length, opacity: 0.3 });
    tl.to(
      selector,
      {
        strokeDashoffset: 0,
        opacity: 1,
        duration,
        ease: "power2.inOut",
      },
      atTime,
    );
  },

  /**
   * Schedule burned-in Chinese subtitle cues (`[{ start, end, text }]`) onto `#caption-text`.
   */
  bindCaptions(tl, cues = [], captionSelector = "#caption-text") {
    const el = document.querySelector(captionSelector);
    if (!el || !Array.isArray(cues) || cues.length === 0) return;
    el.textContent = cues[0].text || "";
    for (const cue of cues) {
      tl.call(
        () => {
          el.textContent = cue.text;
        },
        null,
        cue.start,
      );
    }
  },
};
