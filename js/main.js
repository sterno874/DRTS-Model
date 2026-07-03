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
  COMMUNITY_DD,
  BEAR_CASE,
  COMMUNITY_THREADS
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
import { buildBands, renderBands } from "./ui/bands.js";
import { initAlphaSims } from "./ui/alpha-sims.js";

const $ = (id) => document.getElementById(id);

let state = structuredClone(DEFAULT_STATE);
let activeTab = "restart";
let curLvl = "eli5";
let restoringState = false;

const EXPL = {
  eli5: `<h3>What is Alpha Tau (DRTS)?</h3>
<p><span class="tag f">Fact</span> <b>Alpha Tau Medical ($DRTS)</b> makes <b>Alpha DaRT</b> — a cancer treatment where doctors place tiny radioactive seeds <em>inside</em> a tumor. The seeds release <b>alpha particles</b>: very strong radiation that only travels a few cell widths, killing nearby tumor cells while sparing healthy tissue farther away (<a href="https://www.alphatau.com/alpha-dart-radiotherapy" target="_blank" rel="noopener">company technology page</a>).</p>
<p><span class="tag f">Fact</span> Their main US approval push is <b>ReSTART</b> for recurrent skin cancer (cSCC) — <a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>. <b>88 patients</b> enrolled, complete May 2026 (<a href="https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update" target="_blank" rel="noopener">Q1 2026 PR</a>).</p>
<p><span class="tag m">Model</span> Blue strips on sliders show <em>plausible guess ranges</em> from literature — not secret trial data. Move sliders to ask "what if ORR is X%?" Facts come from ClinicalTrials.gov, PubMed, and IR.</p>
<p><span class="tag c">Community</span> Reddit posts about DRTS often hype GBM "100% control" — that was only <b>3 patients</b> in REGAIN so far (<a href="https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/" target="_blank" rel="noopener">Jun 2026 PR</a>). Local control ≠ living longer.</p>`,

  ms: `<h3>Trials &amp; endpoints</h3>
<p><span class="tag f">Fact</span> <b>ReSTART</b> (<a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>) is a single-arm pivotal study in recurrent cutaneous SCC. Everyone receives intratumoral DaRT. Co-primary endpoints: <b>ORR</b> (confirmed tumor shrinkage per RECIST 1.1) and <b>DOR at 6 months</b> (how long responses last).</p>
<p><span class="tag f">Fact</span> <b>IMPACT</b> (pancreatic, US pilot ~40 pts) and <b>REGAIN</b> (recurrent GBM, feasibility n≤10) are earlier IDE studies — safety/feasibility, not standalone approval paths. Five concurrent US trials per <a href="https://alphatau.com/alpha-tau-issues-letter-to-shareholders-five-concurrent-trials-in-the-u-s-with-multiple-significant-value-driving-milestones-ahead/" target="_blank" rel="noopener">shareholder letter</a>.</p>
<p><span class="tag f">Fact</span> Alpha DaRT follows a <b>device PMA</b> path (FDA), not a drug NDA. Breakthrough Device designation for recurrent cSCC; first modular PMA module submitted Jan 2026. Japan approved DaRT for selected head &amp; neck indications Feb 2026 (<a href="https://www.alphatau.com/single-post/alpha-tau-announces-full-year-2025-financial-results-and-provides-corporate-update" target="_blank" rel="noopener">FY2025 PR</a>).</p>
<p><span class="tag m">Model</span> ReSTART success is judged vs <b>historical ORR benchmarks</b> (~26–40% systemic therapy range), not a randomized control arm. Cemiplimab metastatic cSCC ORR 47% is a PD-1 comparator — <a href="https://pubmed.ncbi.nlm.nih.gov/29863979/" target="_blank" rel="noopener">Migden 2018</a>.</p>
<p>→ See <a href="#alpha-sim-decay" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">how Ra-224 decays</a> on the Biology tab.</p>`,

  hs: `<h3>Alpha vs beta/gamma radiation</h3>
<p><span class="tag f">Fact</span> Alpha particles deliver high linear energy transfer (LET) but travel ~50–100 μm — roughly hundreds of cell diameters at most. External beam photons (beta/gamma) penetrate centimeters. DaRT seeds use <b>Radium-224</b> (t½ 3.7 d); decay daughters (Rn-220, Po-216) diffuse ~mm-scale inside the tumor (<a href="https://pubmed.ncbi.nlm.nih.gov/31759075/" target="_blank" rel="noopener">Arazi et al. FIH</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/18059026/" target="_blank" rel="noopener">Keisari 2007</a>).</p>
<p><span class="tag f">Fact</span> High-LET alpha damage is less oxygen-dependent than low-LET photons — relevant for hypoxic solid tumors where external RT underperforms. Preclinical solid-tumor responsiveness documented in the Keisari/Kelson program.</p>
<p><span class="tag f">Fact</span> FIH DaRT in SCC/H&amp;N reported 78.6% CR in 28 lesions with no grade ≥3 toxicity — <a href="https://pubmed.ncbi.nlm.nih.gov/31759075/" target="_blank" rel="noopener">PubMed 31759075</a>. Different patient mix and endpoints vs ReSTART pivotal; do not equate CR with pivotal ORR.</p>
<p><span class="tag m">Model</span> ReSTART ORR slider priors span ~45–65% (1σ) as undisclosed assumptions. Benchmark slider anchors cemiplimab 47% (◆) and literature floor 26–40%. Wilson 95% CI brackets binomial uncertainty at n=88.</p>
<p>→ Try the interactive <a href="#alpha-sim-penetration" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">penetration depth sim</a> and <a href="#alpha-sim-hypoxia" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">hypoxia comparison</a> on the Biology tab.</p>`,

  col: `<h3>Single-arm ORR inference</h3>
<p><span class="tag f">Fact</span> ReSTART co-primary endpoints: confirmed ORR (RECIST 1.1) + DOR at 6 months — <a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>. Enrollment complete: n=88 (<a href="https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update" target="_blank" rel="noopener">May 2026 PR</a>). Top-line ~end 2026 per company guidance.</p>
<p><span class="tag m">Model</span> <b>Wilson score interval</b> for binomial ORR (better than Wald at extremes). One-sided exact binomial tail: P(X ≥ k | n, p₀) vs historical benchmark p₀. Historical p₀ default 30% — literature recurrent cSCC systemic therapy ~26–40%; pembrolizumab locally advanced 34% — <a href="https://pubmed.ncbi.nlm.nih.gov/32997973/" target="_blank" rel="noopener">Gross 2020</a>.</p>
<p><span class="tag m">Model</span> Monte Carlo: true ORR ~ Beta(20p, 20(1−p)) centered on assumed slider; simulate n=88 binomial outcomes; success if ORR ≥ threshold (default 35%, SAP not public) AND beats benchmark. Seeded n=1500 for reproducibility.</p>
<p><span class="tag m">Model</span> DOR modeled as pass/fail vs 6-month gate — not Kaplan–Meier. Combined P(PMA) = 55% structural ORR/DOR score + 45% subjective PMA prior slider. Modular PMA module 1 submitted Jan 2026 — timeline heuristic only (<a href="https://www.fda.gov/medical-devices/premarket-submissions/modular-premarket-approval-program" target="_blank" rel="noopener">FDA modular PMA</a>).</p>
<p><span class="tag u">Assumption</span> Blue prior bands on sliders encode literature-backed plausibility; red hatch = hard to defend without data.</p>
<p>→ Biology tab: <a href="#alpha-sim-decay" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">Ra-224 decay chain</a> · <a href="#alpha-sim-seeds" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">seed placement</a> for how local α dose is delivered.</p>`,

  pro: `<h3>Device PMA vs drug NDA</h3>
<p><span class="tag f">Fact</span> Alpha DaRT is a Class III device seeking <b>modular PMA</b> for recurrent cSCC (Breakthrough Device). FDA evaluates safety and effectiveness vs historical performance / natural history — not randomized OS hazard ratio like oncology drugs. Single-arm ORR + durability is standard for some device oncologic indications when randomized trials are infeasible.</p>
<p><span class="tag f">Fact</span> REGAIN (rGBM) Breakthrough Device; feasibility enrollment n≤10. Interim n=3: 100% local disease control, 67% CR per RANO — <a href="https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/" target="_blank" rel="noopener">Jun 2026 PR</a>. Does not establish OS benefit or registrational success.</p>
<p><span class="tag f">Fact</span> IMPACT pancreatic US pilot targets n=40 — no US response counts disclosed; pooled ASCO 2026 pancreatic OS data is a separate non-US design. Do not import into IMPACT posterior.</p>
<p><span class="tag m">Model</span> Valuation: risk-adj EV = Σ (peak sales × EV multiple × P(success)) + platform option. Peak = eligible pool × penetration × price × years. Cash ~$76.9M, ~42M ADS FY2025. Tolmar prostate: Alpha Tau 60% of net sales as supplier — <a href="https://www.alphatau.com/single-post/alpha-tau-announces-full-year-2025-financial-results-and-provides-corporate-update" target="_blank" rel="noopener">FY2025 PR</a>.</p>
<p><span class="tag c">Community</span> r/DRTS_Stock themes cross-checked in Valuation DD table — REGAIN local control often overstated as GBM cure; model keeps GBM P(success) low by default.</p>
<p><span class="tag f">Fact</span> <b>Range &amp; LET.</b> CSDA α range in soft tissue scales with initial energy: R ≈ 42 μm at 5.5 MeV, ~56 μm at 6.8 MeV (Po-216 in Ra-224 chain), up to ~68 μm at 7.7 MeV (<a href="https://pubmed.ncbi.nlm.nih.gov/20463379/" target="_blank" rel="noopener">Arazi 2010</a>; ICRU stopping-power tables). LET peaks near track end — dense ionization yields complex DNA damage with reduced oxygen enhancement ratio vs photons (<a href="https://pubmed.ncbi.nlm.nih.gov/26388465/" target="_blank" rel="noopener">Kelson &amp; Keisari 2015</a>). <span class="tag m">Schematic</span> — not patient-specific dosimetry.</p>
<p>→ <a href="#alpha-sim-penetration" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">Sim A: penetration</a> · <a href="#alpha-sim-bragg" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">Sim B: LET</a> on Biology tab.</p>`,

  phd: `<h3>Alpha dosimetry &amp; regulatory statistics</h3>
<p><span class="tag f">Fact</span> Ra-224 (t½ 3.66 d) → Rn-220 (55.6 s) → Po-216 (145 ms, Eα ≈ 6.78 MeV) → Pb-212 → Bi-212 chain; effective dose cloud ~1–2 mm from daughter diffusion while individual α tracks remain ~40–70 μm (<a href="https://pubmed.ncbi.nlm.nih.gov/20463379/" target="_blank" rel="noopener">Arazi 2010</a>; Keisari/Kelson preclinical). Uniform seed coverage required — cold spots risk local recurrence.</p>
<p><span class="tag f">Fact</span> <b>Range equation (pedagogical).</b> CSDA range R in water scales approximately as R(μm) ∝ E<sup>1.5</sup> for MeV-scale α (Bragg–Kleeman rule; ICRU Report 49). Tabulated: 5.5 MeV → 42 μm; 6.8 MeV → 56 μm; 7.7 MeV → 68 μm. LET rises toward range endpoint — relative biological effectiveness reflects complex DSB yield, not absorbed dose alone (<a href="https://pubmed.ncbi.nlm.nih.gov/26388465/" target="_blank" rel="noopener">Kelson &amp; Keisari 2015</a>). <span class="tag m">Educational</span> — full patient dosimetry requires MC + imaging.</p>
<p><span class="tag f">Fact</span> Single-arm device pivotal acceptance: effect size vs historical controls / performance goals per FDA device precedent and indication-specific guidance. Binomial exact test for ORR; DOR requires time-to-event methods (KM, Brookmeyer-Crowley) not fully implemented here.</p>
<p><span class="tag m">Model</span> MC: Beta(α,β) with α = p·20, β = (1−p)·20 — moderate prior strength. Success = observed ORR ≥ threshold AND one-sided binomial beat of p₀ at α=0.05 heuristic. Wilson CI used for display, not as primary test statistic.</p>
<p><span class="tag m">Model</span> Prior bands: 1σ/2σ/3σ blue strips from literature (cemiplimab ORR 47%, FIH CR 78.6% marked implausible for pivotal ORR, DOR gate 6 mo anchored). Valuation bands: SEER epidemiology, FY2025 filing anchors for cash/shares/burn.</p>
<p><span class="tag u">Limit</span> No competing-risk SoC drift (cemiplimab/pembrolizumab), modular PMA review clock-stops, correlated indication approvals, spatial dosimetry heterogeneity, or SAP-defined alpha-spending. Educational model only — not a substitute for regulatory submission statistics.</p>
<p>→ All five Biology simulations: <a href="#tab-biology" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">open Biology tab</a> (penetration, Bragg/LET, decay, hypoxia, seeds).</p>`
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

function updateBands() {
  renderBands($, (id) => $(id)?.value);
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
  updateBands();
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
  if (t === "biology") initAlphaSims();
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

  const ddRowHtml = (row) => {
    const cls = row.verdict === "verified" ? "val-ok" : row.verdict === "rejected" ? "val-no" : "val-part";
    const icon = row.verdict === "verified" ? "✅" : row.verdict === "rejected" ? "❌" : "⚠️";
    return `<tr><td>${row.theme}</td><td><span class="${cls}">${icon}</span> ${row.verdict}</td><td><span class="tag ${row.tag === "verified" ? "f" : "c"}">${row.tag}</span></td><td>${row.note}</td></tr>`;
  };

  const dd = $("vDDBody");
  if (dd) dd.innerHTML = COMMUNITY_DD.map(ddRowHtml).join("");

  const bear = $("vBearBody");
  if (bear) bear.innerHTML = BEAR_CASE.map(ddRowHtml).join("");

  const restartThemes = [
    "ReSTART",
    "Modular PMA",
    "ORR",
    "FIH",
    "cemiplimab",
    "enrollment",
    "PMA imminent",
    "PD-1"
  ];
  const pipeRestart = $("pipeRestartDDBody");
  if (pipeRestart) {
    pipeRestart.innerHTML = COMMUNITY_DD.filter((row) =>
      restartThemes.some((k) => row.theme.toLowerCase().includes(k.toLowerCase()))
    )
      .map((row) => {
        const cls = row.verdict === "verified" ? "val-ok" : row.verdict === "rejected" ? "val-no" : "val-part";
        const icon = row.verdict === "verified" ? "✅" : row.verdict === "rejected" ? "❌" : "⚠️";
        return `<tr><td>${row.theme}</td><td><span class="${cls}">${icon}</span> ${row.verdict}</td><td>${row.note}</td></tr>`;
      })
      .join("");
  }

  const threads = $("pipeThreadsBody");
  if (threads) {
    threads.innerHTML = COMMUNITY_THREADS.map(
      (t) =>
        `<tr><td><a href="${t.url}" target="_blank" rel="noopener">${t.label}</a></td><td>${t.author}</td><td>${t.note}</td></tr>`
    ).join("");
  }
}

window.toggleMethod = (id) => {
  const el = $(id);
  if (el) el.hidden = !el.hidden;
};

function init() {
  if (parseEmbedMode()) document.body.classList.add("embed-mode");

  buildBands($);
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
  initAlphaSims();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

export { updateNow, applyRestartPreset, switchTab, state };
