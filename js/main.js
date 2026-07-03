"use strict";

import {
  wilsonInterval,
  binomUpperTail
} from "./math/device.js";
import {
  VALID_TABS,
  EXPLAIN_LEVELS,
  DEFAULT_STATE,
  SHARE_PRESETS,
  VAL_PRESETS,
  buildShareHash,
  decodeShareHash,
  parseEmbedMode,
  computeValuationMetrics,
  paramsFromPreset
} from "./ui/state.js";

const $ = (id) => document.getElementById(id);

let state = structuredClone(DEFAULT_STATE);
let activeTab = "restart";
let curLvl = "eli5";
let restoringState = false;

const EXPL = {
  eli5: `<p><span class="tag f">Fact</span> <b>Alpha Tau (DRTS)</b> treats solid tumors by placing tiny radioactive seeds (<b>Alpha DaRT</b>) inside the tumor. The seeds release alpha particles — very strong, very short-range radiation that kills nearby cancer cells without traveling far through healthy tissue.</p>
<p><span class="tag m">Model</span> This app lets you adjust <em>assumptions</em> about trial success and sales — not predict the stock. Sliders are guesses; facts come from company press releases and ClinicalTrials.gov.</p>`,
  ms: `<p><b>ReSTART</b> is a single-arm pivotal study: everyone gets DaRT, and the company compares response rates to historical benchmarks. <b>IMPACT</b> and <b>REGAIN</b> are earlier pilot/feasibility studies in pancreas and brain cancer.</p>
<p>Device path: modular <b>PMA</b> submission to FDA (ReSTART), distinct from drug NDA/BLA. Japan already approved DaRT for selected head & neck cancers (Feb 2026).</p>`,
  hs: `<p>Alpha DaRT uses <b>Radium-224</b> seeds. Decay daughters (Rn-220, Po-216, Pb-212) diffuse ~mm-scale in tissue, delivering high-LET alpha hits. Mechanism is relatively oxygen-independent vs photon RT — relevant for hypoxic solid tumors.</p>
<p>Primary endpoints vary by trial: ReSTART = ORR + DOR (RECIST 1.1); REGAIN = safety/feasibility with RANO for GBM; IMPACT = safety/feasibility with chemo combinations.</p>`,
  col: `<p><b>Single-arm ORR inference:</b> Phase 1 shell uses binomial tail vs historical benchmark p₀ — Phase 2 will add exact SAP-aligned thresholds once public.</p>
<p><b>Valuation:</b> Risk-adjusted peak sales × multiple + platform optionality; shares and cash from FY2025 PR (~42M ADS, ~$77M cash — verify latest quarter).</p>`,
  pro: `<p>Wilson intervals for ORR; exact binomial upper tail for H₀: p ≤ p_benchmark. EV = Σ indication peak × multiple × P(success|stage).</p>
<p>TODO Phase 2: time-to-readout calendar MC, modular PMA module timeline, correlated platform success factors, Tolmar supply economics (60% of net sales to Alpha Tau).</p>`,
  phd: `<p>Alpha dosimetry: short-range α (~50–100 μm) limits cross-organ toxicity but requires uniform seed placement — see internal dosimetry models (Arazi et al., Phys Med Biol 2010). Diffusion-convection of daughters sets effective dose cloud diameter.</p>
<p>Regulatory: Breakthrough Device (cSCC, rGBM); TAP pilot for GBM. Single-arm pivotal acceptable when effect size large vs SoC — precedent-dependent; model does not assume approval.</p>`
};

function toast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

function readSliders(prefix, keys, target) {
  for (const k of keys) {
    const el = $(prefix + k);
    if (!el) continue;
    target[k] = el.type === "checkbox" ? el.checked : parseFloat(el.value);
  }
}

function writeSliders(prefix, obj) {
  for (const [k, v] of Object.entries(obj)) {
    const el = $(prefix + k);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = !!v;
    else el.value = v;
    const lab = $(prefix + k + "Val");
    if (lab) lab.textContent = typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(1)) : v;
  }
}

function updateRestartUI() {
  const r = state.restart;
  const resp = Math.round((r.n * r.orrPct) / 100);
  const wi = wilsonInterval(resp, r.n);
  const pBeat = 1 - binomUpperTail(resp, r.n, r.benchOrrPct / 100);
  if ($("rResp")) $("rResp").textContent = resp + " / " + r.n;
  if ($("rWilson")) $("rWilson").textContent = (wi.lo * 100).toFixed(1) + "–" + (wi.hi * 100).toFixed(1) + "%";
  if ($("rPbeat")) $("rPbeat").textContent = (pBeat * 100).toFixed(1) + "%";
  if ($("rPsucc")) $("rPsucc").textContent = r.pSuccess + "%";
}

function updateValUI() {
  const m = computeValuationMetrics(state.val);
  if ($("vEv")) $("vEv").textContent = "$" + m.ev.toFixed(0) + "M";
  if ($("vPsh")) $("vPsh").textContent = "$" + m.perSh.toFixed(2);
}

function updateNow() {
  readSliders("r", ["n", "orrPct", "benchOrrPct", "dorMonths", "pSuccess"], state.restart);
  readSliders("v", Object.keys(state.val), state.val);
  const riskEl = $("v_riskadj");
  if (riskEl) state.val.v_riskadj = riskEl.checked;
  updateRestartUI();
  updateValUI();
  if (!restoringState) updateHashQuiet();
}

function updateHashQuiet() {
  const h = buildShareHash(state);
  if (location.hash !== h) history.replaceState(null, "", h || "#");
}

function applyState(s) {
  restoringState = true;
  state = s;
  writeSliders("r", state.restart);
  writeSliders("v", state.val);
  if ($("v_riskadj")) $("v_riskadj").checked = state.val.v_riskadj;
  curLvl = state.ui.explainLvl || "eli5";
  updateRestartUI();
  updateValUI();
  showLevel(curLvl);
  if (s.tab) switchTab(s.tab);
  restoringState = false;
}

function applyRestartPreset(name) {
  const p = paramsFromPreset(name);
  if (!p) return;
  Object.assign(state.restart, p);
  state.activeRestartPreset = name;
  writeSliders("r", state.restart);
  document.querySelectorAll("[data-preset]").forEach((b) => {
    b.classList.toggle("p-def", b.dataset.preset === name);
  });
  updateNow();
}

function applyValPreset(name) {
  const q = VAL_PRESETS[name];
  if (!q) return;
  Object.assign(state.val, q);
  state.activeValPreset = name;
  writeSliders("v", state.val);
  updateNow();
}

function switchTab(t) {
  if (!VALID_TABS.includes(t)) return;
  activeTab = t;
  document.querySelectorAll(".tabbtn").forEach((x) => {
    const on = x.dataset.tab === t;
    x.classList.toggle("active", on);
    x.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("#bottomNav button").forEach((x) => {
    const on = x.dataset.tab === t;
    x.classList.toggle("active", on);
    x.setAttribute("aria-current", on ? "page" : "false");
  });
  VALID_TABS.forEach((id) => {
    const el = $("tab-" + id);
    if (el) el.hidden = id !== t;
  });
  if (!restoringState) {
    state.tab = t;
    updateHashQuiet();
  }
}

function showLevel(l) {
  curLvl = l;
  state.ui.explainLvl = l;
  document.querySelectorAll(".lvlb").forEach((b) => b.classList.toggle("active", b.dataset.lvl === l));
  const body = $("explbody");
  if (body) body.innerHTML = EXPL[l] || "";
  if (!restoringState) updateHashQuiet();
}

window.toggleMethod = (id) => {
  const el = $(id);
  if (el) el.hidden = !el.hidden;
};

function init() {
  if (parseEmbedMode()) document.body.classList.add("embed-mode");

  document.querySelectorAll(".tabbtn").forEach((b) => {
    b.onclick = () => {
      switchTab(b.dataset.tab);
      if (!restoringState) window.scrollTo(0, 0);
    };
  });
  document.querySelectorAll("#bottomNav button").forEach((b) => {
    b.onclick = () => {
      switchTab(b.dataset.tab);
      if (!restoringState) window.scrollTo(0, 0);
    };
  });
  document.querySelectorAll(".lvlb").forEach((b) => (b.onclick = () => showLevel(b.dataset.lvl)));
  document.querySelectorAll("[data-preset]").forEach((b) => (b.onclick = () => applyRestartPreset(b.dataset.preset)));
  document.querySelectorAll("[data-val-preset]").forEach((b) => (b.onclick = () => applyValPreset(b.dataset.valPreset)));

  ["r", "v"].forEach((prefix) => {
    document.querySelectorAll(`[id^="${prefix}"]`).forEach((el) => {
      if (el.type === "range" || el.type === "number") el.addEventListener("input", updateNow);
    });
  });
  const risk = $("v_riskadj");
  if (risk) risk.addEventListener("change", updateNow);

  const btnShare = $("btnShare");
  if (btnShare) {
    btnShare.onclick = async () => {
      updateNow();
      const url = location.origin + location.pathname + buildShareHash(state);
      try {
        await navigator.clipboard.writeText(url);
        toast("Share link copied");
      } catch {
        prompt("Copy share URL:", url);
      }
    };
  }
  const btnPrint = $("btnPrint");
  if (btnPrint) btnPrint.onclick = () => window.print();

  const decoded = decodeShareHash(location.hash);
  if (decoded) applyState(decoded);
  else {
    applyRestartPreset("base");
    switchTab("restart");
    showLevel("eli5");
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
