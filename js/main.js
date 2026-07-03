"use strict";

import {
  computeRestartMetrics,
  mcRestartORR,
  CSCC_BENCHMARKS,
  estimateReadoutMonths,
  pmaTimelineMonths
} from "./math/restart.js";
import {
  PIPELINE_TRIALS,
  CATALYSTS,
  catalystsInYear,
  sortCatalysts,
  computePipelineSummary,
  COMMUNITY_DD
} from "./math/pipeline.js";
import { COMPARABLES, computeRunwayMonths } from "./math/valuation.js";
import { computeRegainPanel, computeImpactPanel, REGAIN_INTERIM, IMPACT_PILOT } from "./math/pilot.js";
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
  computeHeaderStrip,
  paramsFromPreset
} from "./ui/state.js";

const $ = (id) => document.getElementById(id);

let state = structuredClone(DEFAULT_STATE);
let activeTab = "restart";
let curLvl = "eli5";
let restoringState = false;

const EXPL = {
  eli5: `<h3>What is Alpha Tau (DRTS)?</h3>
<p><span class="tag f">Fact</span> <b>Alpha Tau Medical ($DRTS)</b> makes a cancer treatment called <b>Alpha DaRT</b>. Doctors place tiny radioactive seeds <em>inside</em> a tumor. The seeds release <b>alpha particles</b> — very strong radiation that travels only a few cell widths, so it kills tumor cells nearby without blasting the whole body.</p>
<p><span class="tag m">Model</span> This app lets you move sliders to explore <em>what-if</em> scenarios. Sliders are guesses — not secret trial results. Facts come from ClinicalTrials.gov and company press releases.</p>
<p><span class="tag c">Community</span> Reddit posts about DRTS often hype GBM "100% control" — remember that was only <b>3 patients</b> so far.</p>`,

  ms: `<h3>Trials &amp; endpoints</h3>
<p><span class="tag f">Fact</span> <b>ReSTART</b> (<a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>) treats recurrent skin cancer (cSCC). Everyone gets DaRT; success is measured by <b>ORR</b> (tumor shrinkage) and <b>DOR</b> (how long response lasts — 6 months matters).</p>
<p><span class="tag f">Fact</span> <b>IMPACT</b> (pancreas) and <b>REGAIN</b> (brain GBM) are smaller pilot studies — they test safety and feasibility first, not approval by themselves.</p>
<p><span class="tag f">Fact</span> This is a <b>medical device</b> path (PMA to FDA), not a pill approval (NDA). Japan approved DaRT for some head &amp; neck cancers in Feb 2026.</p>`,

  hs: `<h3>Alpha vs beta/gamma radiation</h3>
<p><span class="tag f">Fact</span> Alpha particles have high energy but travel ~50–100 μm — roughly one human cell diameter × hundreds. Beta/gamma (typical external beam RT) penetrate farther. DaRT uses <b>Radium-224</b> seeds; decay daughters diffuse ~mm-scale inside the tumor (<a href="https://pubmed.ncbi.nlm.nih.gov/31759075/" target="_blank" rel="noopener">PubMed 31759075</a>).</p>
<p><span class="tag f">Fact</span> Alpha damage is less dependent on oxygen than photons — relevant for hypoxic solid tumors (<a href="https://pubmed.ncbi.nlm.nih.gov/18059026/" target="_blank" rel="noopener">Keisari 2007</a>).</p>
<p><span class="tag m">Model</span> ReSTART compares ORR to historical benchmarks (~26–40% for systemic therapy in recurrent cSCC; cemiplimab ~47% in metastatic disease per <a href="https://pubmed.ncbi.nlm.nih.gov/29863979/" target="_blank" rel="noopener">Migden 2018</a>).</p>`,

  col: `<h3>Single-arm ORR inference</h3>
<p><span class="tag f">Fact</span> ReSTART primary endpoints: confirmed ORR (RECIST 1.1) + DOR at 6 months — <a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>. Enrollment: 88 patients, complete May 2026.</p>
<p><span class="tag m">Model</span> Wilson score 95% CI for binomial ORR; one-sided exact binomial tail P(X ≥ k | n, p₀) vs benchmark p₀. Monte Carlo draws true ORR ~ Beta prior centered on slider, simulates n=88 binomial outcomes.</p>
<p><span class="tag m">Model</span> ORR success threshold default 35% (adjustable — public SAP not filed). DOR modeled as pass/fail vs 6-month gate. Combined P(PMA) blends structural ORR/DOR score with subjective slider.</p>
<p><span class="tag u">Assumption</span> Modular PMA: module 1 submitted Jan 2026; review timeline heuristic only.</p>`,

  pro: `<h3>Device PMA vs drug NDA</h3>
<p><span class="tag f">Fact</span> Alpha DaRT is classified as a device; ReSTART supports a <b>modular PMA</b> (Breakthrough Device for recurrent cSCC). FDA review focuses on safety + effectiveness in the intended population — here, single-arm ORR/DOR vs historical performance, not randomized OS HR.</p>
<p><span class="tag f">Fact</span> REGAIN holds Breakthrough Device for rGBM but remains feasibility (n≤10); interim n=3 showed 100% local control, 67% CR — <a href="https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/" target="_blank" rel="noopener">Jun 2026 PR</a>.</p>
<p><span class="tag m">Model</span> Valuation: EV = Σ (peak sales × multiple × P(success|stage)) + platform option. Tolmar prostate deal: Alpha Tau receives 60% of net sales as supplier.</p>
<p><span class="tag c">Community</span> Retail DD often conflates REGAIN local control with OS benefit — model treats GBM P(success) separately at low prior.</p>`,

  phd: `<h3>Alpha dosimetry &amp; regulatory statistics</h3>
<p><span class="tag f">Fact</span> Ra-224 (t½ 3.66 d) → Rn-220 → Po-216 → Pb-212 chain; effective dose cloud ~mm (Arazi et al., Phys Med Biol 2010; Keisari/Kelson preclinical program). Intratumoral seed placement requires uniform coverage — cold spots risk recurrence.</p>
<p><span class="tag f">Fact</span> Single-arm pivotal acceptance requires compelling effect vs natural history / historical controls (FDA device precedent; indication-specific). Binomial exact test appropriate for ORR; DOR requires time-to-event analysis not fully replicated in this educational MC stub.</p>
<p><span class="tag m">Model</span> MC uses Beta(α,β) with α = p·20, β = (1−p)·20 around assumed ORR; success = observed ORR ≥ threshold AND binomial beat of benchmark at α=0.05 one-sided heuristic. Not a replacement for SAP.</p>
<p><span class="tag u">Limit</span> Does not model competing cemiplimab/pembrolizumab SoC drift, modular PMA clock-stops, or correlated platform approval across indications.</p>`
};

function fmtAsOf(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" });
}

function initFactsAsOf() {
  document.querySelectorAll(".facts .fact[data-as-of]").forEach((el) => {
    if (el.querySelector(".as-of")) return;
    const sp = document.createElement("span");
    sp.className = "as-of";
    sp.textContent = "[as of " + fmtAsOf(el.dataset.asOf) + "]";
    el.appendChild(sp);
  });
}

function renderPilotPanels() {
  const host = $("pilotPanels");
  if (!host) return;
  const regain = computeRegainPanel();
  const impact = computeImpactPanel();
  host.innerHTML =
    `<div class="pilot-card card"><h2>REGAIN · GBM feasibility</h2>` +
    `<div class="pilot-stat"><b>Local control</b> ${regain.ratePct.toFixed(0)}% posterior mean<br/>95% CI ${regain.ciLo.toFixed(0)}–${regain.ciHi.toFixed(0)}% · n=${regain.n} disclosed</div>` +
    `<div class="pilot-stat"><b>Complete response (RANO)</b> ${regain.crRatePct.toFixed(0)}% posterior mean<br/>95% CI ${regain.crCiLo.toFixed(0)}–${regain.crCiHi.toFixed(0)}%</div>` +
    `<p class="field-note">${regain.note} · <a href="${REGAIN_INTERIM.source}" target="_blank" rel="noopener">Primary source</a></p></div>` +
    `<div class="pilot-card card"><h2>IMPACT · pancreatic pilot</h2>` +
    `<div class="pilot-stat"><b>US pilot responses</b> not disclosed</div>` +
    `<div class="pilot-stat"><b>Target enrollment</b> n=${impact.targetN}</div>` +
    `<div class="pilot-stat"><b>Uniform prior band</b> ${impact.priorLo.toFixed(0)}–${impact.priorHi.toFixed(0)}% (no data yet)</div>` +
    `<p class="field-note">${impact.note} · <a href="${IMPACT_PILOT.pooledSource}" target="_blank" rel="noopener">ASCO 2026 pooled pancreatic</a> is separate design.</p></div>`;
}

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
    if (lab) {
      lab.textContent =
        typeof v === "number"
          ? Number.isInteger(v)
            ? v
            : v < 1 && v > 0
              ? v.toFixed(2)
              : v.toFixed(1)
          : v;
    }
  }
}

function updateHeaderStrip() {
  const strip = $("headerStrip");
  if (!strip || !state.ui.showHeaderStrip) return;
  const h = computeHeaderStrip(state);
  strip.innerHTML =
    `<span class="best-est-item best-est-item--scenario"><span class="best-est-label">Scenario</span><span class="best-est-val best-est-val--scenario">${SHARE_PRESETS[state.activeRestartPreset]?.label || h.preset}</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">Assumed ORR</span><span class="best-est-val">${h.orrPct}%</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">Wilson CI</span><span class="best-est-val">${h.wilson}</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">P(beat bench)</span><span class="best-est-val">${h.pBeat}%</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">Implied $/sh</span><span class="best-est-val">$${h.perSh}</span></span>`;
}

function renderMcHistogram(mc) {
  const host = $("rMcHist");
  if (!host || !mc) return;
  const max = Math.max(...mc.histogram, 1);
  host.innerHTML = mc.histogram
    .map((c, i) => {
      const lo = (i / mc.histogram.length) * 100;
      const hi = ((i + 1) / mc.histogram.length) * 100;
      const h = Math.round((c / max) * 100);
      return `<div title="ORR ${lo.toFixed(0)}–${hi.toFixed(0)}%: ${c} sims" style="flex:1;height:${Math.max(2, h)}%;background:var(--accent);opacity:.75;border-radius:2px 2px 0 0"></div>`;
    })
    .join("");
  const cap = $("rMcCaption");
  if (cap) {
    cap.textContent = `MC n=${mc.sims}: P(success) ${(mc.pSuccess * 100).toFixed(1)}% · median ORR ${mc.orrMedian.toFixed(1)}% (95% ${mc.orrLo.toFixed(0)}–${mc.orrHi.toFixed(0)}%)`;
  }
}

function updateRestartUI() {
  const r = state.restart;
  const m = computeRestartMetrics(r);
  if ($("rResp")) $("rResp").textContent = m.responders + " / " + m.n;
  if ($("rWilson")) {
    $("rWilson").textContent =
      (m.wilson.lo * 100).toFixed(1) + "–" + (m.wilson.hi * 100).toFixed(1) + "%";
  }
  if ($("rPbeat")) $("rPbeat").textContent = (m.pBeatBench * 100).toFixed(1) + "%";
  if ($("rPsucc")) $("rPsucc").textContent = r.pSuccess + "%";
  if ($("rPcombined")) $("rPcombined").textContent = (m.pCombined * 100).toFixed(1) + "%";
  if ($("rDorPass")) {
    $("rDorPass").textContent = m.dorPass ? "Pass ≥" + r.dorBenchMonths + " mo" : "Below gate";
    $("rDorPass").className = "ov " + (m.dorPass ? "dor-pass" : "dor-fail");
  }
  const readoutMo = estimateReadoutMonths(5, 2026, r.readoutMonth, r.readoutYear);
  if ($("rReadout")) $("rReadout").textContent = readoutMo + " mo from May 2026 enroll complete";
  if ($("rPmaEta")) {
    $("rPmaEta").textContent =
      "~" + pmaTimelineMonths(r.pmaModulesDone, r.pmaModulesTotal) + " mo post top-line (heuristic)";
  }

  const mc = mcRestartORR(
    {
      n: r.n,
      orrPct: r.orrPct,
      benchOrrPct: r.benchOrrPct,
      orrThresholdPct: r.orrThresholdPct,
      sims: r.mcSims,
      seed: 42
    },
    undefined
  );
  renderMcHistogram(mc);
  if ($("rMcPsucc")) $("rMcPsucc").textContent = (mc.pSuccess * 100).toFixed(1) + "%";
}

function renderCatalystCalendar() {
  const host = $("pipeCalendar");
  if (!host) return;
  const year = state.pipeline.calendarYear;
  const list = sortCatalysts(catalystsInYear(year));
  if (!list.length) {
    host.innerHTML = `<p class="field-note">No catalysts in ${year}.</p>`;
    return;
  }
  host.innerHTML =
    `<div class="catalyst-list">` +
    list
      .map(
        (c) =>
          `<div class="catalyst-item"><div class="cat-head"><b>${c.label}</b> <span class="tag ${c.tag === "verified" ? "f" : "u"}">${c.tag}</span></div>` +
          `<div class="cat-meta">${c.trial}${c.nct ? ` · <a href="https://clinicaltrials.gov/study/${c.nct}" target="_blank" rel="noopener">${c.nct}</a>` : ""}</div>` +
          `<div class="cat-window">${c.windowStart.slice(0, 7)} → ${c.windowEnd.slice(0, 7)}</div>` +
          (c.note ? `<div class="cat-note">${c.note}</div>` : "") +
          `</div>`
      )
      .join("") +
    `</div>`;
}

function updatePipelineUI() {
  renderCatalystCalendar();
  const s = computePipelineSummary(state.pipeline);
  if ($("pipeSummary")) {
    $("pipeSummary").textContent = `${s.usTrials} US IDE trials · REGAIN ${s.regainNote} · IMPACT target n=${s.impactTargetN}`;
  }
}

function updateValUI() {
  const m = computeValuationMetrics(state.val);
  if ($("vEv")) $("vEv").textContent = "$" + m.ev.toFixed(0) + "M";
  if ($("vPsh")) $("vPsh").textContent = "$" + m.perSh.toFixed(2);
  if ($("vPeak")) $("vPeak").textContent = "$" + m.totalPeak.toFixed(0) + "M/yr risk-adj";
  const burn = state.val.v_burnQuarterly ?? 10.6;
  const runway = computeRunwayMonths(state.val.v_cash, burn);
  if ($("vRunway")) {
    $("vRunway").textContent =
      runway === Infinity ? "∞ mo" : runway.toFixed(1) + " mo (~" + (runway / 12).toFixed(1) + " yr)";
  }

  const tbody = $("vContribBody");
  if (tbody) {
    tbody.innerHTML = m.rows
      .map(
        (row) =>
          `<tr><td>${row.label}</td><td>$${row.peak.toFixed(0)}M</td><td>${(row.pSuccess * 100).toFixed(0)}%</td><td>$${row.evContrib.toFixed(0)}M</td></tr>`
      )
      .join("");
  }
}

function updateNow() {
  readSliders("r", Object.keys(state.restart), state.restart);
  readSliders("v", Object.keys(state.val), state.val);
  readSliders("p", Object.keys(state.pipeline), state.pipeline);
  const riskEl = $("v_riskadj");
  if (riskEl) state.val.v_riskadj = riskEl.checked;
  updateRestartUI();
  updatePipelineUI();
  updateValUI();
  updateHeaderStrip();
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
  writeSliders("p", state.pipeline);
  if ($("v_riskadj")) $("v_riskadj").checked = state.val.v_riskadj;
  curLvl = state.ui.explainLvl || "eli5";
  updateRestartUI();
  updatePipelineUI();
  updateValUI();
  updateHeaderStrip();
  showLevel(curLvl);
  if (s.tab) switchTab(s.tab);
  document.querySelectorAll("[data-preset]").forEach((b) => {
    b.classList.toggle("p-def", b.dataset.preset === state.activeRestartPreset);
  });
  document.querySelectorAll("[data-val-preset]").forEach((b) => {
    b.classList.toggle("p-def", b.dataset.valPreset === state.activeValPreset);
  });
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
  document.querySelectorAll("[data-val-preset]").forEach((b) => {
    b.classList.toggle("p-def", b.dataset.valPreset === name);
  });
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

function renderStaticPanels() {
  const bench = $("benchTableBody");
  if (bench) {
    bench.innerHTML = CSCC_BENCHMARKS.map(
      (b) =>
        `<tr><td>${b.label}</td><td>${b.orrPct}% (${b.rangeLo}–${b.rangeHi})</td><td><span class="tag ${b.tag === "verified" ? "f" : "a"}">${b.tag}</span></td><td><a href="${b.source}" target="_blank" rel="noopener">Source</a></td></tr>`
    ).join("");
  }

  const trials = $("pipeTrialsGrid");
  if (trials) {
    trials.innerHTML = PIPELINE_TRIALS.map(
      (t) =>
        `<div class="fact"><b>${t.name}</b> — ${t.indication}<br/>${t.nct ? `<a href="${t.nctUrl}" target="_blank" rel="noopener">${t.nct}</a><br/>` : ""}${t.design} · ${t.enrollment != null ? "n≈" + t.enrollment : "n TBD"}<br/>${t.status}<br/><span class="tag ${t.tag === "verified" ? "f" : "u"}">${t.tag}</span>${t.caveat ? `<br/><span class="tag c">${t.caveat}</span>` : ""}</div>`
    ).join("");
  }

  const cmp = $("vCompBody");
  if (cmp) {
    cmp.innerHTML = COMPARABLES.map(
      (c) =>
        `<tr><td>${c.name}</td><td>${c.evMultiple}</td><td>${c.note}</td><td><span class="tag ${c.tag === "verified" ? "f" : "a"}">${c.tag}</span></td></tr>`
    ).join("");
  }

  const dd = $("vDDBody");
  if (dd) {
    dd.innerHTML = COMMUNITY_DD.map((row) => {
      const cls = row.verdict === "verified" ? "val-ok" : row.verdict === "rejected" ? "val-no" : "val-part";
      const icon = row.verdict === "verified" ? "✅" : row.verdict === "rejected" ? "❌" : "⚠️";
      return `<tr><td>${row.theme}</td><td><span class="${cls}">${icon}</span> ${row.verdict}</td><td><span class="tag ${row.tag === "verified" ? "f" : "c"}">${row.tag}</span></td><td>${row.note}</td></tr>`;
    }).join("");
  }
}

window.toggleMethod = (id) => {
  const el = $(id);
  if (el) el.hidden = !el.hidden;
};

function init() {
  if (parseEmbedMode()) document.body.classList.add("embed-mode");

  renderStaticPanels();
  renderPilotPanels();
  initFactsAsOf();

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

  ["r", "v", "p"].forEach((prefix) => {
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

export { updateNow, applyRestartPreset, switchTab, state };
