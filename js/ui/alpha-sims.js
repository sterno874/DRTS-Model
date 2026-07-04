/**
 * Alpha DaRT educational simulations — inline SVG + vanilla JS.
 * Educational schematic only; not clinical treatment planning or MC dosimetry.
 */

/** @typedef {{ eMeV: number, rangeUm: number }} CsdaPoint */

/** ICRU / NIST CSDA ranges in water (approx.) — tag f */
export const CSDA_ALPHA_WATER = [
  { eMeV: 4.0, rangeUm: 30 },
  { eMeV: 5.5, rangeUm: 42 },
  { eMeV: 6.8, rangeUm: 56 },
  { eMeV: 7.7, rangeUm: 68 }
];

/** Typical alpha track in soft tissue (μm) — tag f */
export const ALPHA_RANGE_UM = { typical: 55, min: 40, max: 70, sparingLimit: 100 };

/** Representative modality ranges in tissue (μm) for log-scale bars — tag m pedagogical */
export const MODALITY_RANGES_UM = {
  alpha: 55,
  beta: 4000,
  gamma: 120000
};

/** Ra-224 decay chain — NNDC / IAEA half-lives — tag f */
export const DECAY_CHAIN = [
  {
    iso: "Ra-224",
    hl: "3.66 d",
    hlSec: 3.66 * 86400,
    mode: "α",
    clinical: "Parent fixed in the seed; continuously feeds the daughter chain over days of treatment.",
    distance: "Stays in the seed — source of the local α dose cloud."
  },
  {
    iso: "Rn-220",
    hl: "55.6 s",
    hlSec: 55.6,
    mode: "α",
    clinical: "Rn-220 decays in ~1 minute — daughters stay near the seed.",
    distance: "Short-lived α daughters stay near the seed (seconds)."
  },
  {
    iso: "Po-216",
    hl: "145 ms",
    hlSec: 0.145,
    mode: "α",
    clinical: "Primary short-lived α emitter (Eα ≈ 6.8 MeV); energy deposited within tens of μm of where it forms.",
    distance: "Near seed — milliseconds leave no time to diffuse far."
  },
  {
    iso: "Pb-212",
    hl: "10.6 h",
    hlSec: 10.6 * 3600,
    mode: "β⁻",
    clinical: "Longer half-life lets Pb-212 diffuse before decaying — the main extender of the dose cloud.",
    distance: "Extends dose cloud ~mm from the seed (Arazi 2010)."
  },
  {
    iso: "Bi-212",
    hl: "60.6 min",
    hlSec: 60.6 * 60,
    mode: "α / β⁻",
    clinical: "Branches to Po-212 (α) or Tl-208 (β⁻); continues local high-LET damage where Pb-212 arrived.",
    distance: "Near where Pb-212 diffused — still within the ~mm cloud."
  },
  {
    iso: "Po-212 / Tl-208",
    hl: "299 ns / 3.1 min",
    hlSec: 3.1 * 60,
    mode: "α / β⁻",
    clinical: "Final α (Po-212, ns) or β (Tl-208, minutes) steps before stable lead.",
    distance: "Local to Bi-212 location — short-lived α stays put."
  },
  {
    iso: "Pb-208",
    hl: "stable",
    hlSec: Infinity,
    mode: "—",
    clinical: "Stable end product of the chain — no further radiation.",
    distance: "No dose contribution."
  }
];

/**
 * Interpolate CSDA alpha range in water (μm) from energy (MeV).
 * @param {number} energyMeV
 * @returns {number}
 */
export function csdaRangeAlphaUm(energyMeV) {
  const pts = CSDA_ALPHA_WATER;
  if (energyMeV <= pts[0].eMeV) {
    return (pts[0].rangeUm / pts[0].eMeV) * energyMeV;
  }
  for (let i = 1; i < pts.length; i++) {
    if (energyMeV <= pts[i].eMeV) {
      const lo = pts[i - 1];
      const hi = pts[i];
      const t = (energyMeV - lo.eMeV) / (hi.eMeV - lo.eMeV);
      return lo.rangeUm + t * (hi.rangeUm - lo.rangeUm);
    }
  }
  const last = pts[pts.length - 1];
  return last.rangeUm * Math.pow(energyMeV / last.eMeV, 1.5);
}

/** Log-scale max for bar charts (μm). */
const LOG_MAX_UM = 150000;

/** Colors aligned with --sim-* tokens */
const SIM_COLORS = { alpha: "#d64545", beta: "#d98a00", gamma: "#2f6fed", grid: "#e8ecf2" };

/**
 * Log-scale position 0–1 for bar charts (μm).
 * @param {number} valueUm
 * @param {number} maxUm
 */
export function logScaleFraction(valueUm, maxUm = LOG_MAX_UM) {
  const v = Math.max(1, valueUm);
  const max = Math.max(v, maxUm);
  return Math.log10(v) / Math.log10(max);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function q(root, sel) {
  return (root || document).querySelector(sel);
}

function qa(root, sel) {
  return Array.from((root || document).querySelectorAll(sel));
}

/** Sim A — penetration depth / range comparison */
function initPenetration(root) {
  const host = q(root, "#alpha-sim-penetration");
  if (!host || host.dataset.init) return;
  host.dataset.init = "1";

  const svg = q(host, "svg");
  const slider = q(host, "#simA-energy");
  const valEl = q(host, "#simA-energy-val");
  const rangeEl = q(host, "#simA-range-val");
  const particlesG = q(svg, "#simA-particles");
  const killZone = q(svg, "#simA-killzone");
  const sparingLabel = q(host, "#simA-sparing");

  const seedX = 240;
  const seedY = 205;
  /** Schematic px/μm for tissue panel — capped so kill zone stays inside tumor */
  const pxPerUm = 0.75;
  const killCapPx = 52;

  let animId = 0;
  let particles = [];

  function spawnParticle(rangeUm) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({ angle, dist: 0, max: rangeUm * (0.85 + Math.random() * 0.15), life: 1 });
  }

  function drawBars(energyMeV) {
    const alphaUm = csdaRangeAlphaUm(energyMeV);
    const bars = q(svg, "#simA-bars");
    if (!bars) return;
    const specs = [
      { key: "alpha", label: "α (DaRT)", um: alphaUm, color: SIM_COLORS.alpha },
      { key: "beta", label: "β", um: MODALITY_RANGES_UM.beta, color: SIM_COLORS.beta },
      { key: "gamma", label: "γ / X-ray", um: MODALITY_RANGES_UM.gamma, color: SIM_COLORS.gamma }
    ];
    const barW = 440;
    const x0 = 108;
    const gridTicks = [1, 10, 100, 1000, 10000, 100000];
    const gridLines = gridTicks
      .map((t) => {
        const fx = x0 + logScaleFraction(t, LOG_MAX_UM) * barW;
        return `<line x1="${fx.toFixed(1)}" y1="24" x2="${fx.toFixed(1)}" y2="88" class="as-grid" stroke-dasharray="2 3"/>`;
      })
      .join("");
    bars.innerHTML =
      gridLines +
      specs
        .map((s, i) => {
          const y = 32 + i * 22;
          const frac = logScaleFraction(s.um);
          const w = Math.max(4, frac * barW);
          const label =
            s.key === "alpha"
              ? `${s.um.toFixed(0)} μm`
              : s.key === "beta"
                ? "~4 mm"
                : "cm+";
          return (
            `<g><text x="${x0 - 8}" y="${y + 10}" text-anchor="end" class="as-label">${s.label}</text>` +
            `<rect x="${x0}" y="${y}" width="${barW}" height="14" rx="3" fill="${SIM_COLORS.grid}"/>` +
            `<rect x="${x0}" y="${y}" width="${w.toFixed(1)}" height="14" rx="3" fill="${s.color}" opacity=".88"/>` +
            `<text x="${x0 + barW + 8}" y="${y + 10}" class="as-label-sm">${label}</text></g>`
          );
        })
        .join("") +
      `<text x="${x0 + barW / 2}" y="98" text-anchor="middle" class="as-label-sm">log₁₀ scale (μm) · 1 — 10 — 100 — 1k — 10k — 100k</text>`;

    if (killZone) {
      const r = Math.min(alphaUm * pxPerUm, killCapPx);
      killZone.setAttribute("r", String(r));
      killZone.setAttribute("cx", String(seedX));
      killZone.setAttribute("cy", String(seedY));
    }
    if (rangeEl) rangeEl.textContent = alphaUm.toFixed(0);
    const svgRange = q(host, "#simA-range-svg");
    if (svgRange) svgRange.textContent = alphaUm.toFixed(0);
    if (sparingLabel) {
      sparingLabel.textContent =
        alphaUm <= ALPHA_RANGE_UM.sparingLimit
          ? `Healthy tissue beyond ~${ALPHA_RANGE_UM.sparingLimit} μm receives negligible α dose — spatial precision.`
          : "At higher energies, range increases — still far shorter than β/γ RT.";
    }
    return alphaUm;
  }

  function tick(alphaUm) {
    if (!particlesG) return;
    if (particles.length < 24 && Math.random() < 0.35) spawnParticle(alphaUm);
    particles = particles.filter((p) => {
      p.dist += alphaUm * 0.012;
      p.life = 1 - p.dist / p.max;
      return p.life > 0;
    });
    particlesG.innerHTML = particles
      .map((p) => {
        const x = seedX + Math.cos(p.angle) * p.dist * pxPerUm;
        const y = seedY + Math.sin(p.angle) * p.dist * pxPerUm;
        return `<line x1="${seedX}" y1="${seedY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${SIM_COLORS.alpha}" stroke-width="1.4" opacity="${(p.life * 0.9).toFixed(2)}"/>`;
      })
      .join("");
  }

  function loop() {
    const e = slider ? parseFloat(slider.value) : 6.8;
    const alphaUm = drawBars(e);
    if (!prefersReducedMotion()) tick(alphaUm);
    animId = requestAnimationFrame(loop);
  }

  function onInput() {
    if (valEl && slider) valEl.textContent = parseFloat(slider.value).toFixed(1);
  }

  if (slider) {
    slider.addEventListener("input", onInput);
    onInput();
  }
  drawBars(slider ? parseFloat(slider.value) : 6.8);
  if (!prefersReducedMotion()) loop();

  host._cleanup = () => cancelAnimationFrame(animId);
}

/** Sim B — Bragg peak / LET schematic */
function initBragg(root) {
  const host = q(root, "#alpha-sim-bragg");
  if (!host || host.dataset.init) return;
  host.dataset.init = "1";

  const path = q(host, "#simB-let-curve");
  const dot = q(host, "#simB-scan-dot");
  const slider = q(host, "#simB-position");
  const letVal = q(host, "#simB-let-val");
  const letPeak = q(host, "#simB-let-svg");

  const pts = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const letValue = 18 + 182 * Math.pow(t, 2.15) * (1 - 0.08 * t);
    pts.push({ t, letValue });
  }
  const maxLet = pts[pts.length - 1].letValue;
  const axisG = q(host, "#simB-grid");

  if (axisG) {
    const grid = [];
    for (let g = 0; g <= 4; g++) {
      const gy = 200 - (g / 4) * 155;
      grid.push(`<line x1="48" y1="${gy}" x2="552" y2="${gy}" class="as-grid"/>`);
      grid.push(`<text x="42" y="${gy + 3}" text-anchor="end" class="as-label-sm">${Math.round((g / 4) * maxLet)}</text>`);
    }
    axisG.innerHTML = grid.join("");
  }

  if (path) {
    const d = pts.map((p, i) => `${i ? "L" : "M"} ${48 + p.t * 504} ${200 - (p.letValue / maxLet) * 155}`).join(" ");
    path.setAttribute("d", d);
    path.setAttribute("stroke", SIM_COLORS.alpha);
    path.setAttribute("fill", "none");
  }
  function letAt(t) {
    const i = Math.min(100, Math.max(0, Math.round(t * 100)));
    return pts[i].letValue;
  }

  if (letPeak) letPeak.textContent = maxLet.toFixed(0);

  function update() {
    const t = slider ? parseFloat(slider.value) / 100 : 0.85;
    const letValue = letAt(t);
    if (dot) {
      dot.setAttribute("cx", String(48 + t * 504));
      dot.setAttribute("cy", String(200 - (letValue / maxLet) * 155));
    }
    if (letVal) letVal.textContent = letValue.toFixed(0);
  }

  if (slider) slider.addEventListener("input", update);
  update();
}

/** Sim C — Ra-224 decay chain step-through (sequence of isotopes, not a clock) */
function initDecay(root) {
  const host = q(root, "#alpha-sim-decay");
  if (!host || host.dataset.init) return;
  host.dataset.init = "1";

  const progress = q(host, "#simC-progress");
  const timeline = q(host, "#simC-timeline");
  const detailIso = q(host, "#simC-detail-iso");
  const detailHl = q(host, "#simC-detail-hl");
  const detailMode = q(host, "#simC-detail-mode");
  const detailClinical = q(host, "#simC-detail-clinical");
  const detailDistance = q(host, "#simC-detail-distance");
  const prevBtn = q(host, "#simC-prev");
  const nextBtn = q(host, "#simC-next");
  const playBtn = q(host, "#simC-play");
  const n = DECAY_CHAIN.length;
  const stepPauseMs = prefersReducedMotion() ? 400 : 1600;

  let step = 0;
  let timerId = 0;
  let playing = false;

  function stopPlay() {
    playing = false;
    if (timerId) {
      clearInterval(timerId);
      timerId = 0;
    }
    if (playBtn) playBtn.textContent = "Step through chain";
  }

  function renderStep(idx) {
    step = ((idx % n) + n) % n;
    const node = DECAY_CHAIN[step];
    qa(host, ".simC-node").forEach((el, i) => {
      const active = i === step;
      el.classList.toggle("simC-active", active);
      el.classList.toggle("simC-done", i < step);
      el.setAttribute("aria-current", active ? "step" : "false");
    });
    if (timeline) {
      const maxLog = Math.log10(DECAY_CHAIN[0].hlSec);
      timeline.innerHTML = DECAY_CHAIN.map((c, i) => {
        const w =
          c.hlSec === Infinity
            ? 8
            : Math.max(4, (Math.log10(Math.max(c.hlSec, 0.001)) / maxLog) * 100);
        const fill =
          c.mode.includes("α") && !c.mode.includes("β")
            ? SIM_COLORS.alpha
            : c.mode.includes("β")
              ? SIM_COLORS.beta
              : "#94a3b8";
        return `<span class="simC-tl-seg${i === step ? " simC-active" : ""}" style="flex:${w};background:${fill}" title="${c.iso} t½ ${c.hl}"></span>`;
      }).join("");
    }
    if (progress) progress.textContent = `Step ${step + 1} of ${n}: ${node.iso}`;
    if (detailIso) detailIso.textContent = node.iso;
    if (detailHl) detailHl.textContent = node.hl === "stable" ? "Stable (NNDC)" : `t½ ${node.hl} (NNDC)`;
    if (detailMode) detailMode.textContent = node.mode;
    if (detailClinical) detailClinical.textContent = node.clinical;
    if (detailDistance) detailDistance.textContent = node.distance;
    if (prevBtn) prevBtn.disabled = step === 0;
    if (nextBtn) nextBtn.disabled = step === n - 1;
  }

  function goTo(idx, fromPlay) {
    if (!fromPlay) stopPlay();
    renderStep(idx);
    if (fromPlay && step === n - 1) stopPlay();
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (step > 0) goTo(step - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (step < n - 1) goTo(step + 1);
    });
  }
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (playing) {
        stopPlay();
        renderStep(step);
        return;
      }
      playing = true;
      playBtn.textContent = "Pause";
      if (step >= n - 1) renderStep(0);
      timerId = setInterval(() => {
        if (step >= n - 1) {
          stopPlay();
          renderStep(step);
          return;
        }
        goTo(step + 1, true);
      }, stepPauseMs);
    });
  }

  qa(host, ".simC-node").forEach((el, i) => {
    el.addEventListener("click", () => goTo(i));
  });

  renderStep(0);
  host._cleanup = () => stopPlay();
}

/** Sim D — hypoxia independence */
function initHypoxia(root) {
  const host = q(root, "#alpha-sim-hypoxia");
  if (!host || host.dataset.init) return;
  host.dataset.init = "1";

  const toggle = q(host, "#simD-toggle");
  const oerEl = q(host, "#simD-oer");
  let hypoxic = false;

  function render() {
    qa(host, ".simD-panel").forEach((panel) => {
      const mode = panel.dataset.mode;
      const core = q(panel, ".simD-core");
      const status = q(panel, ".simD-status");
      const o2grad = q(panel, ".simD-o2");
      if (mode === "photon") {
        const dead = hypoxic;
        if (core) core.setAttribute("fill", dead ? "#5b6472" : "#fdeaea");
        if (o2grad) o2grad.setAttribute("opacity", dead ? "0.95" : "0.5");
        if (status) {
          status.textContent = dead
            ? "Hypoxic core: OER ~2.5–3 → photons lose ~60% kill"
            : "Normoxic: photons effective (OER ~1)";
          status.className = "simD-status " + (dead ? "simD-bad" : "simD-good");
        }
      } else {
        if (core) core.setAttribute("fill", "#fdeaea");
        if (o2grad) o2grad.setAttribute("opacity", hypoxic ? "0.85" : "0.45");
        if (status) {
          status.textContent = hypoxic
            ? "Hypoxic core: α OER ~1.0–1.2 — high LET still kills"
            : "Normoxic: α kills locally (LET ~80 keV/μm)";
          status.className = "simD-status simD-good";
        }
      }
    });
    if (oerEl) {
      oerEl.textContent = hypoxic
        ? "O₂ gradient: rim normoxic · core &lt;5 mmHg · α effectiveness ~85–95% of normoxic vs photons ~30–40%"
        : "Uniform O₂ — both modalities at full relative effectiveness (schematic OER values)";
    }
    if (toggle) toggle.textContent = hypoxic ? "Show normoxic tumor" : "Show hypoxic core";
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      hypoxic = !hypoxic;
      render();
    });
  }
  render();
}

/** Sim E — intratumoral seed placement */
function initSeeds(root) {
  const host = q(root, "#alpha-sim-seeds");
  if (!host || host.dataset.init) return;
  host.dataset.init = "1";

  const slider = q(host, "#simE-density");
  const valEl = q(host, "#simE-density-val");
  const zonesG = q(host, "#simE-zones");
  const coverageEl = q(host, "#simE-coverage");

  const tumorCx = 200;
  const tumorCy = 130;
  const tumorR = 85;

  function seedPositions(n) {
    const seeds = [];
    if (n <= 1) return [{ x: tumorCx, y: tumorCy }];
    const rings = n <= 4 ? 1 : 2;
    seeds.push({ x: tumorCx, y: tumorCy });
    for (let ring = 1; ring <= rings; ring++) {
      const count = ring === 1 ? Math.min(4, n - 1) : n - 1 - Math.min(4, n - 1);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.4;
        const r = tumorR * (0.35 + ring * 0.28);
        seeds.push({ x: tumorCx + Math.cos(a) * r, y: tumorCy + Math.sin(a) * r * 0.75 });
      }
    }
    return seeds.slice(0, n);
  }

  function update() {
    const n = slider ? parseInt(slider.value, 10) : 5;
    if (valEl) valEl.textContent = String(n);
    const killR = csdaRangeAlphaUm(6.8) * 1.25;
    const seeds = seedPositions(n);

    if (zonesG) {
      zonesG.innerHTML = seeds
        .map((s) => {
          const rings = [1, 0.65, 0.35]
            .map(
              (f, ri) =>
                `<circle cx="${s.x}" cy="${s.y}" r="${(killR * f).toFixed(1)}" fill="none" stroke="${SIM_COLORS.alpha}" stroke-width="${ri === 0 ? 1.2 : 0.8}" opacity="${(0.35 - ri * 0.08).toFixed(2)}" stroke-dasharray="${ri ? "2 3" : "4 3"}"/>`
            )
            .join("");
          return (
            rings +
            `<circle cx="${s.x}" cy="${s.y}" r="5" fill="#2f6fed" stroke="#1a4fb8" stroke-width="1"/>` +
            `<circle cx="${s.x}" cy="${s.y}" r="2" fill="#fff" opacity=".6"/>`
          );
        })
        .join("");
    }

    const grid = 24;
    let inside = 0;
    let covered = 0;
    for (let gx = tumorCx - tumorR; gx <= tumorCx + tumorR; gx += grid) {
      for (let gy = tumorCy - tumorR * 0.75; gy <= tumorCy + tumorR * 0.75; gy += grid) {
        const dx = (gx - tumorCx) / tumorR;
        const dy = (gy - tumorCy) / (tumorR * 0.75);
        if (dx * dx + dy * dy > 1) continue;
        inside++;
        if (seeds.some((s) => Math.hypot(gx - s.x, gy - s.y) <= killR)) covered++;
      }
    }
    const pct = inside ? Math.round((covered / inside) * 100) : 0;
    if (coverageEl) {
      coverageEl.textContent = `~${pct}% tumor cross-section in α kill overlap (schematic grid — not MC dosimetry).`;
    }
  }

  if (slider) slider.addEventListener("input", update);
  update();
}

/**
 * Initialize all Biology tab simulations.
 * @param {ParentNode} [root]
 */
export function initAlphaSims(root = document) {
  initPenetration(root);
  initBragg(root);
  initDecay(root);
  initHypoxia(root);
  initSeeds(root);
}

/**
 * Tear down animation loops (testing / tab hide).
 * @param {ParentNode} [root]
 */
export function destroyAlphaSims(root = document) {
  qa(root, "[data-init]").forEach((el) => {
    if (typeof el._cleanup === "function") el._cleanup();
    delete el.dataset.init;
  });
}
