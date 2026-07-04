"use strict";

import {
  computeRestartMetrics,
  mcRestartORR,
  CSCC_BENCHMARKS,
  estimateReadoutMonths,
  pmaTimelineMonths,
  modularPmaTimeline
} from "./math/restart.js";
import {
  PIPELINE_TRIALS,
  catalystsInYear,
  sortCatalysts,
  layoutTimeline,
  quarterTicks,
  timelineBounds,
  timelineFrac,
  formatCatalystMonth,
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
  resolveLinkedSkinPs,
  resolveTrialPs,
  paramsFromPreset,
  inferActivePresets
} from "./ui/state.js";
import { buildBands, renderBands } from "./ui/bands.js";
import { initAlphaSims } from "./ui/alpha-sims.js";

const $ = (id) => document.getElementById(id);

let state = structuredClone(DEFAULT_STATE);
let activeTab = "restart";
let curLvl = "eli5";
let restoringState = false;
let updateRaf = null;
let lastMcResult = null;
const tabsDirty = { restart: true, pipeline: true, value: true, explain: true, biology: true };

function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

const EXPL = {
  eli5: `<h3>What is Alpha Tau (DRTS)?</h3>
<h4>Alpha radiation vs ordinary radiation</h4>
<p><span class="tag f">Fact</span> <b>Alpha Tau Medical ($DRTS)</b> makes <b>Alpha DaRT</b> — a cancer treatment where doctors place tiny radioactive seeds <em>inside</em> a tumor. The seeds release <b>alpha particles</b>: very strong radiation that only travels a few cell widths, killing nearby tumor cells while sparing healthy tissue farther away (<a href="https://www.alphatau.com/alpha-dart-radiotherapy" target="_blank" rel="noopener">company technology page</a>).</p>
<p><span class="tag f">Fact</span> Ordinary radiation (X-rays / “gamma”) goes through the body like a flashlight beam. Beta particles travel farther than alpha but still less than X-rays. Alpha radiation is more like a short, heavy punch — it dumps energy in a tiny neighborhood and stops. That is why DaRT is implanted <em>in</em> the tumor instead of beamed from outside.</p>
<h4>How DaRT works</h4>
<p><span class="tag f">Fact</span> Each seed carries <b>Radium-224</b>. As it decays, short-lived “daughter” atoms wander a few millimeters inside the tumor and fire more alpha particles. Healthy tissue a short distance away gets little dose — the point of local alpha therapy (<a href="https://pubmed.ncbi.nlm.nih.gov/31759075/" target="_blank" rel="noopener">first-in-human SCC trial</a>).</p>
<h4>ReSTART — the main US trial</h4>
<p><span class="tag f">Fact</span> The main US approval push is <b>ReSTART</b> for recurrent skin cancer (cSCC) — <a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>. <b>88 patients</b> enrolled, complete May 2026 (<a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026053589/ea028978301ex99-1.htm" target="_blank" rel="noopener">SEC 6-K</a>). Doctors will report how many tumors shrank (<b>ORR</b>) and whether responses lasted at least 6 months (<b>DOR</b>). Top-line is guided toward end-2026.</p>
<h4>Device PMA, not a drug NDA</h4>
<p><span class="tag f">Fact</span> Alpha DaRT is regulated as a <b>medical device</b> (PMA), not a pill or infusion (NDA). FDA often judges devices against historical performance goals rather than a randomized drug-style control arm. Breakthrough Device designation applies for recurrent cSCC.</p>
<h4>Pipeline beyond skin</h4>
<p><span class="tag c">Community</span> Reddit posts about DRTS often hype GBM “100% control” — that was only <b>3 patients</b> in REGAIN so far (<a href="https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/" target="_blank" rel="noopener">Jun 2026 PR</a>). Local control ≠ living longer. The model tags REGAIN as <b>feasibility n≤10</b> everywhere — not a registrational GBM program yet. IMPACT (pancreas) and a prostate pilot with Tolmar are earlier studies too.</p>
<h4>What this model is (and isn’t)</h4>
<p><span class="tag m">Model</span> Blue strips on sliders show <em>plausible guess ranges</em> from literature — not secret trial data. Move sliders to ask “what if ORR is X%?” Facts come from ClinicalTrials.gov, PubMed, and IR. Valuation numbers are scenarios, not a price target.</p>
<p><span class="tag f">Fact</span> Liquidity was ~$80.2M at Mar 31 2026 per the <a href="https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update" target="_blank" rel="noopener">Q1 PR</a>. Runway uses <b>cash burn</b> (CFO ~$5–6M+/qtr — <a href="https://youtu.be/Jyryv-152hc" target="_blank" rel="noopener">interview</a>), not the $22.9M net loss (which includes $9.6M non-cash warrant mark-to-market). Share count (~88.0M ordinary shares per <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">SEC F-3</a> / <a href="https://www.sec.gov/cgi-bin/viewer?accession_number=0001213900-26-025174&action=view&cik=1871321" target="_blank" rel="noopener">20-F</a>) matters for “per share” math — an F-3 shelf can dilute later, so treat $/share as a scenario, not a promise.</p>
<p>→ Peek at how far alpha travels in the <a href="#alpha-sim-penetration" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">Biology penetration sim</a>.</p>`,

  ms: `<h3>Trials &amp; endpoints</h3>
<h4>Alpha vs beta/gamma</h4>
<p><span class="tag f">Fact</span> Alpha particles (high LET, ~tens of μm range) differ from beta/gamma/X-ray beams (lower LET, mm–cm penetration). DaRT uses <b>Ra-224</b> seeds so alpha-emitting daughters can diffuse a few millimeters inside the tumor while healthy tissue farther away gets little dose (<a href="https://pubmed.ncbi.nlm.nih.gov/31759075/" target="_blank" rel="noopener">Arazi et al. FIH</a>). That short range is why seeds must be placed <em>in</em> the tumor, not beamed from outside.</p>
<h4>ReSTART co-primaries</h4>
<p><span class="tag f">Fact</span> <b>ReSTART</b> (<a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>) is a single-arm pivotal study in recurrent cutaneous SCC. Everyone receives intratumoral DaRT. Co-primary endpoints: <b>ORR</b> (confirmed tumor shrinkage per RECIST 1.1) and <b>DOR at 6 months</b> (how long responses last). Enrollment complete: n=88; top-line guided toward end-2026. Secondary endpoints include PFS/OS at 1 year per the <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026053589/ea028978301ex99-1.htm" target="_blank" rel="noopener">SEC 6-K</a>.</p>
<p><span class="tag m">Model</span> ReSTART success is judged vs <b>historical ORR benchmarks</b> (~26–40% systemic therapy range), not a randomized control arm. PD-1 comps: cemiplimab 47%/49% LA (<a href="https://www.fda.gov/drugs/drug-approvals-and-databases/fda-approves-cemiplimab-rwlc-metastatic-or-locally-advanced-cutaneous-squamous-cell-carcinoma" target="_blank" rel="noopener">FDA</a>); pembrolizumab LA 50% (<a href="https://www.merck.com/news/fda-approves-expanded-indication-for-mercks-keytruda-pembrolizumab-in-locally-advanced-cutaneous-squamous-cell-carcinoma-cscc/" target="_blank" rel="noopener">Merck 2021</a>). The ReSTART tab’s Wilson CI and Monte Carlo show how uncertain an n=88 rate still is.</p>
<h4>PMA vs NDA</h4>
<p><span class="tag f">Fact</span> Alpha DaRT follows a <b>device PMA</b> path (FDA), not a drug NDA. <a href="https://www.fda.gov/medical-devices/how-study-and-market-your-device/breakthrough-devices-program" target="_blank" rel="noopener">Breakthrough Device</a> for recurrent cSCC; first modular PMA module submitted Jan 2026 (<a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026000777/ea027162402ex99-1_alpha.htm" target="_blank" rel="noopener">SEC 6-K</a>). Japan Shonin for selected H&amp;N Feb 2026 (<a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026019635/ea027814401ex99-1_alpha.htm" target="_blank" rel="noopener">SEC 6-K</a>) — real approval, but reimbursement and post-market study still matter for commercial timing.</p>
<h4>Pipeline — REGAIN n=3 caveat</h4>
<p><span class="tag f">Fact</span> <b>IMPACT</b> (pancreatic, US pilot ~40 pts) and <b>REGAIN</b> (recurrent GBM, feasibility n≤10) are earlier IDE studies — safety/feasibility, not standalone approval paths. Five concurrent US trials per <a href="https://alphatau.com/alpha-tau-issues-letter-to-shareholders-five-concurrent-trials-in-the-u-s-with-multiple-significant-value-driving-milestones-ahead/" target="_blank" rel="noopener">shareholder letter</a>.</p>
<p><span class="tag f">Fact</span> REGAIN interim (n=3): 100% local disease control, 67% CR per RANO — <a href="https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/" target="_blank" rel="noopener">Jun 2026 PR</a>. With only three patients, rates can swing wildly; the Pipeline tab keeps REGAIN labeled feasibility, not a GBM approval path. Local control is not overall survival.</p>
<h4>Valuation limits</h4>
<p><span class="tag f">Fact</span> Tolmar US urology deal (Jun 2026): $20M equity, $15M manufacturing, up to $161.5M milestones; Alpha Tau receives <b>60% of net sales</b> as supplier — <a href="https://alphatau.com/alpha-tau-and-tolmar-announce-strategic-collaboration-to-bring-alpha-dart-therapy-to-u-s-urological-cancer-patients/" target="_blank" rel="noopener">collaboration PR</a>.</p>
<p><span class="tag u">Assumption</span> Valuation peak-sales and P(success) sliders are educational scenarios. Cash (~$80.2M Q1) and ~88.0M ordinary shares from the <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">F-3</a> / <a href="https://www.sec.gov/cgi-bin/viewer?accession_number=0001213900-26-025174&action=view&cik=1871321" target="_blank" rel="noopener">20-F</a> set the per-share denominator — F-3 shelf capacity is not the same as shares outstanding today. Treat $/share as a what-if, not a target price.</p>
<p>→ See <a href="#alpha-sim-decay" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">how Ra-224 decays</a> and <a href="#alpha-sim-seeds" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">seed placement</a> on the Biology tab.</p>`,

  hs: `<h3>Alpha vs beta/gamma radiation</h3>
<h4>Mechanism — why alpha is different</h4>
<p><span class="tag f">Fact</span> Alpha particles deliver high linear energy transfer (LET) but travel ~50–100 μm — roughly a few cell diameters. External beam photons (beta/gamma) penetrate centimeters. DaRT seeds use <b>Radium-224</b> (t½ 3.7 d); decay daughters (Rn-220, Po-216) diffuse ~mm-scale inside the tumor (<a href="https://pubmed.ncbi.nlm.nih.gov/31759075/" target="_blank" rel="noopener">Arazi et al. FIH</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/18059026/" target="_blank" rel="noopener">Keisari 2007</a>). The seed is a local source; the daughters extend the kill zone a few millimeters without turning the treatment into whole-body radiation.</p>
<p><span class="tag f">Fact</span> High-LET alpha damage is less oxygen-dependent than low-LET photons — relevant for hypoxic solid tumors where external RT underperforms. Preclinical solid-tumor responsiveness is documented in the Keisari/Kelson program; Biology tab sims illustrate penetration and hypoxia schematically (not treatment planning).</p>
<p><span class="tag f">Fact</span> FIH DaRT in SCC/H&amp;N reported 78.6% CR in 28 lesions with no grade ≥3 toxicity — <a href="https://pubmed.ncbi.nlm.nih.gov/31759075/" target="_blank" rel="noopener">PubMed 31759075</a>. Different patient mix and endpoints vs ReSTART pivotal; do not equate FIH CR with pivotal ORR.</p>
<h4>ReSTART — ORR and DOR</h4>
<p><span class="tag f">Fact</span> ReSTART co-primaries are confirmed ORR (RECIST 1.1) and DOR at 6 months — <a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>. Enrollment complete at n=88 (May 2026); top-line guided ~end 2026. Single-arm design means success is framed against historical performance, not a concurrent control. Secondary PFS/OS at 1 year are supportive, not co-primary.</p>
<p><span class="tag m">Model</span> ReSTART ORR slider priors span ~45–65% (1σ) as undisclosed assumptions. Benchmark slider anchors cemiplimab 47% (◆) and literature floor 26–40%. Wilson 95% CI brackets binomial uncertainty at n=88. Deterministic DOR months slider is a sensitivity gate; Monte Carlo co-primary draws per-responder durability (default P(DOR≥6mo|responder)=81% from pembrolizumab LA cSCC) and requires a minimum durable fraction — not a full Kaplan–Meier curve.</p>
<h4>PMA vs NDA</h4>
<p><span class="tag f">Fact</span> Device PMA (modular, Breakthrough for recurrent cSCC) is a different regulatory lane than a drug NDA. Module 1 submitted Jan 2026; full submission timing depends on data maturation and remaining modules (<a href="https://www.fda.gov/medical-devices/premarket-submissions/modular-premarket-approval-program" target="_blank" rel="noopener">FDA modular PMA</a>). FDA device guidance flags single-arm bias risks — Breakthrough helps sequencing, not certainty of approval.</p>
<h4>Pipeline caveats</h4>
<p><span class="tag f">Fact</span> Pipeline beyond skin: REGAIN rGBM feasibility (n≤10; interim n=3 local control, 67% CR per RANO — <a href="https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/" target="_blank" rel="noopener">Jun 2026 PR</a>) and IMPACT pancreatic pilot (target n=40, US responses not disclosed) are hypothesis-generating. Japan Shonin (selected H&amp;N, Feb 2026) is real approval but reimbursement and PMS still matter for commercial timing.</p>
<h4>Valuation limits &amp; share count</h4>
<p><span class="tag u">Assumption</span> Blue prior bands on sliders encode literature-backed plausibility; red hatch = hard to defend without data. Monte Carlo uses a seeded Beta prior (n=1500) so repeated visits get the same histogram. Valuation $/share divides risk-adjusted EV by share count — treat share count as an input that can change with ATM/shelf issuance (~$300M F-3 + $100M ATM per <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">SEC F-3</a>). Cash ~$80.2M (Q1 2026) and ~88.0M ordinary shares from the <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">F-3</a> / <a href="https://www.sec.gov/cgi-bin/viewer?accession_number=0001213900-26-025174&action=view&cik=1871321" target="_blank" rel="noopener">20-F</a> are anchors, not forecasts.</p>
<p>→ Try the interactive <a href="#alpha-sim-penetration" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">penetration depth sim</a>, <a href="#alpha-sim-bragg" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">LET / Bragg</a>, and <a href="#alpha-sim-hypoxia" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">hypoxia comparison</a> on the Biology tab.</p>`,

  col: `<h3>Single-arm ORR inference</h3>
<h4>DaRT mechanism (college depth)</h4>
<p><span class="tag f">Fact</span> Mechanism: Ra-224-loaded seeds release α-emitting daughters that create a mm-scale dose cloud while individual α tracks remain ~40–70 μm (<a href="https://pubmed.ncbi.nlm.nih.gov/20463379/" target="_blank" rel="noopener">Arazi 2010</a>). High LET and reduced oxygen enhancement ratio vs photons motivate use in hypoxic solid tumors — see Biology sims for pedagogy, not Monte Carlo dosimetry. Seed spacing matters: cold spots risk local recurrence even when average dose looks adequate.</p>
<p><span class="tag f">Fact</span> Newer peer-reviewed modeling extends that picture without inventing new α ranges: <a href="https://pubmed.ncbi.nlm.nih.gov/36464914/" target="_blank" rel="noopener">Heger et al. Med Phys 2023</a> (Arazi group) builds realistic single-seed dose tables for planning; <a href="https://iopscience.iop.org/article/10.1088/1361-6560/ae5d7e" target="_blank" rel="noopener">Korotinsky &amp; Arazi Phys Med Biol 2026</a> adds microdosimetry with broad nucleus-size distributions. An <b>independent</b> review (<a href="https://www.jrpr.org/journal/view.php?number=1171" target="_blank" rel="noopener">Kim &amp; Sung JRPR 2024</a>) compiles in vitro D₀ by tumor cell line (lower D₀ = more radiosensitive) and notes early clinical planning often used a standardized ~10 Gy prescription — useful context, not proof of efficacy. Biology tab has the D₀ table and dosimetry section.</p>
<h4>ReSTART — ORR, DOR, and historical controls</h4>
<p><span class="tag f">Fact</span> ReSTART co-primary endpoints: confirmed ORR (RECIST 1.1) + DOR at 6 months — <a href="https://clinicaltrials.gov/study/NCT05323253" target="_blank" rel="noopener">NCT05323253</a>. Secondary: PFS/OS at 1 yr per <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026053589/ea028978301ex99-1.htm" target="_blank" rel="noopener">SEC 6-K</a>. Enrollment complete: n=88. Top-line ~end 2026 per company guidance. Population: recurrent cSCC failed ≥1L SoC, no curative surgery/RT, no nodal/distant mets.</p>
<p><span class="tag m">Model</span> <b>Wilson score interval</b> for binomial ORR (better than Wald at extremes). One-sided exact binomial tail: P(X ≥ k | n, p₀) vs historical benchmark p₀. Historical p₀ default 30% — PD-1 labels: cemiplimab 47%/49% LA (<a href="https://www.fda.gov/drugs/drug-approvals-and-databases/fda-approves-cemiplimab-rwlc-metastatic-or-locally-advanced-cutaneous-squamous-cell-carcinoma" target="_blank" rel="noopener">FDA</a>); pembrolizumab LA 50% (<a href="https://www.merck.com/news/fda-approves-expanded-indication-for-mercks-keytruda-pembrolizumab-in-locally-advanced-cutaneous-squamous-cell-carcinoma-cscc/" target="_blank" rel="noopener">Merck</a>). FIH CR 78.6% is marked implausible as a pivotal ORR prior — different design and lesion-level analysis.</p>
<p><span class="tag m">Model</span> Monte Carlo: true ORR ~ Beta(20p, 20(1−p)) centered on assumed slider; simulate n=88 binomial outcomes; co-primary success if ORR ≥ threshold (default 35%, SAP not public) AND beats benchmark AND durable-responder fraction ≥ min (default 50%), with each responder durable at P(DOR≥6mo|responder) (default 81% from pembrolizumab LA). Seeded n=1500 for reproducibility — not Kaplan–Meier.</p>
<h4>PMA vs NDA</h4>
<p><span class="tag m">Model</span> Combined P(PMA) = 55% structural ORR/DOR score + 45% subjective PMA prior slider. Modular PMA module 1 submitted Jan 2026 — timeline heuristic only (<a href="https://www.fda.gov/medical-devices/premarket-submissions/modular-premarket-approval-program" target="_blank" rel="noopener">FDA modular PMA</a>). PMA ≠ NDA: FDA device guidance emphasizes historical performance goals and single-arm bias risks (<a href="https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-pivotal-clinical-investigations-medical-devices" target="_blank" rel="noopener">pivotal device design guidance</a>). Breakthrough Device designation affects review interaction, not the statistical bar for effectiveness.</p>
<h4>Pipeline — REGAIN and IMPACT</h4>
<p><span class="tag f">Fact</span> Pipeline caveats: REGAIN interim n=3 cannot support registrational inference (wide posterior on Pipeline tab; no OS estimand). IMPACT US pilot responses undisclosed — uniform prior band only; do not mix pooled ASCO pancreatic OS into IMPACT priors. Japan Shonin is indication-limited with PMS and reimbursement still forward-looking.</p>
<h4>Valuation identity &amp; share-count caution</h4>
<p><span class="tag m">Model</span> Valuation peak ($M/yr) = patients/yr × pen × years × price ($K) ÷ 1,000; risk-adj EV sums indication contributions × P(success) + platform option. Indication P(success) defaults keep GBM/pancreas low relative to skin.</p>
<p><span class="tag u">Assumption</span> Blue prior bands on sliders encode literature-backed plausibility; red hatch = hard to defend without data. Share links encode slider deltas plus preset markers (<code>rp</code>/<code>vp</code>) so bull/bear scenarios restore correctly across tabs. Per-share outputs use ~88.0M ordinary shares and cash from the <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">F-3</a> / <a href="https://www.sec.gov/cgi-bin/viewer?accession_number=0001213900-26-025174&action=view&cik=1871321" target="_blank" rel="noopener">20-F</a> — F-3/ATM capacity can change the denominator without the model auto-diluting.</p>
<p>→ Biology tab: <a href="#alpha-sim-decay" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">Ra-224 decay chain</a> · <a href="#alpha-sim-seeds" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">seed placement</a> · <a href="#alpha-sim-penetration" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">penetration</a> for how local α dose is delivered.</p>`,

  pro: `<h3>Device PMA vs drug NDA</h3>
<h4>Regulatory frame</h4>
<p><span class="tag f">Fact</span> Alpha DaRT is a Class III device seeking <b>modular PMA</b> for recurrent cSCC (<a href="https://www.fda.gov/medical-devices/how-study-and-market-your-device/breakthrough-devices-program" target="_blank" rel="noopener">Breakthrough Device</a>). FDA evaluates vs historical performance — single-arm bias flagged in <a href="https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-pivotal-clinical-investigations-medical-devices" target="_blank" rel="noopener">pivotal device design guidance</a>. That is a different evidentiary frame than a drug NDA with concurrent controls and ICH E9 estimands. Modular review can include clock-stops and interactive Q-subs outside any timeline heuristic in this app.</p>
<h4>ReSTART — registrational spine</h4>
<p><span class="tag f">Fact</span> ReSTART (n=88) co-primaries ORR + 6-month DOR are the registrational spine for US skin. ORR inference here uses Wilson CI + exact binomial vs historical p₀; DOR is not KM/Brookmeyer–Crowley — MC uses a per-responder durability prior (PD-1 comps) plus a min durable-fraction gate. SAP-defined thresholds are not public — default ORR success threshold 35% is an assumption. Secondary PFS/OS at 1 yr are supportive readouts, not co-primary gates.</p>
<p><span class="tag m">Model</span> Combined P(PMA) blends a structural ORR/DOR score (55%) with a subjective PMA prior slider (45%). Monte Carlo draws true ORR from a moderate Beta prior, simulates n=88 binomial outcomes, and scores co-primary success only if ORR threshold + historical-benchmark beat + durable-responder fraction all hold. Seeded n=1500 for reproducible histograms. MC P(success) is <b>trial co-primary success under model assumptions</b> — not approval certainty. When the valuation link toggle is on, skin P(s) = trial P(success) × PMA approval haircut (default 75%), labeled model P(success | assumptions).</p>
<h4>Pipeline — REGAIN n=3 and IMPACT</h4>
<p><span class="tag f">Fact</span> REGAIN (rGBM) Breakthrough Device + <a href="https://www.fda.gov/medical-devices/total-product-life-cycle-advisory-program-tap" target="_blank" rel="noopener">FDA TAP</a> pilot (<a href="https://www.alphatau.com/single-post/alpha-tau-announces-acceptance-into-fda-s-total-product-life-cycle-advisory-program-to-accelerate-ma" target="_blank" rel="noopener">Oct 2024 PR</a>); feasibility enrollment n≤10. Interim n=3: 100% local disease control, 67% CR per RANO — <a href="https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/" target="_blank" rel="noopener">Jun 2026 PR</a>. Does not establish OS benefit or registrational success; posterior intervals on the Pipeline tab stay wide by design.</p>
<p><span class="tag f">Fact</span> IMPACT pancreatic US pilot targets n=40 (<a href="https://www.alphatau.com/single-post/alpha-tau-announces-fda-approval-of-ide-supplement-to-expand-alpha-dart-impact-trial-to-patients-wi" target="_blank" rel="noopener">IDE supplement Apr 2026</a>) — no US response counts disclosed; pooled ASCO 2026 pancreatic OS data is a separate design and must not be mixed into IMPACT priors. Japan Shonin (Feb 2026) is the first ex-Israel approval; PMS and reimbursement timing remain commercial risks.</p>
<h4>Valuation limits &amp; dilution</h4>
<p><span class="tag m">Model</span> Valuation: peak ($M/yr) = patients/yr × pen × years × price ($K) ÷ 1,000; risk-adj EV = Σ (peak × EV multiple × P(success)) + platform. Cash default ~$80.2M (Q1 2026); ~88.0M ordinary shares per <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">SEC F-3</a> / <a href="https://www.sec.gov/cgi-bin/viewer?accession_number=0001213900-26-025174&action=view&cik=1871321" target="_blank" rel="noopener">20-F FY2025</a>. Tolmar: 60% net sales — <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026064461/ea0293331-6k_alpha.htm" target="_blank" rel="noopener">SEC 6-K</a>. Indication P(success) defaults keep GBM/pancreas low relative to skin.</p>
<p><span class="tag f">Fact</span> Q1 2026 net loss $22.9M includes <b>$9.6M non-cash warrant liability remeasurement</b> (DRTSW mark-to-market) — inflates GAAP EPS/net loss without cash outflow. GAAP operating loss $13.3M is OpEx, not cash burn. Runway math uses cash burn (default $6.5M/qtr from CFO commentary ~$5–6M+/qtr, ~$25M/yr) — <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026058424/ea029058401ex99-1.htm" target="_blank" rel="noopener">SEC 6-K Ex. 99.1</a> · <a href="https://youtu.be/Jyryv-152hc" target="_blank" rel="noopener">CFO interview</a> (company-reported, not an audited cash-flow statement).</p>
<p><span class="tag f">Fact</span> F-3 shelf up to $300M + $100M ATM (Apr 2026) adds dilution flexibility — not the same as imminent issuance (<a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">SEC F-3</a>). Per-share scenarios should be stress-tested against higher share counts; the model does not auto-dilute on shelf capacity.</p>
<p><span class="tag c">Community</span> r/DRTS_Stock themes cross-checked in Valuation DD table — REGAIN local control often overstated as GBM cure; model keeps GBM P(success) low by default.</p>
<h4>Range, LET &amp; dosimetry literature (professional)</h4>
<p><span class="tag f">Fact</span> CSDA α range in soft tissue scales with initial energy: R ≈ 42 μm at 5.5 MeV, ~56 μm at 6.8 MeV (Po-216 in Ra-224 chain), up to ~68 μm at 7.7 MeV (<a href="https://pubmed.ncbi.nlm.nih.gov/20463379/" target="_blank" rel="noopener">Arazi 2010</a>; ICRU stopping-power tables). LET peaks near track end — dense ionization yields complex DNA damage with reduced oxygen enhancement ratio vs photons (<a href="https://pubmed.ncbi.nlm.nih.gov/26388465/" target="_blank" rel="noopener">Kelson &amp; Keisari 2015</a>). <span class="tag m">Schematic</span> — not patient-specific dosimetry.</p>
<p><span class="tag f">Fact</span> Macroscopic planning uses diffusion-leakage transport of daughters (mm-scale cloud) while individual tracks stay ~40–70 μm. <a href="https://pubmed.ncbi.nlm.nih.gov/36464914/" target="_blank" rel="noopener">Heger et al. 2023</a> (Alpha Tau–funded, Arazi group) shows finite line-source approximations underestimate dose vs full 2D seed solutions and recommends TG-43-style lookup tables. <a href="https://iopscience.iop.org/article/10.1088/1361-6560/ae5d7e" target="_blank" rel="noopener">Korotinsky &amp; Arazi 2026</a> links macroscopic dose to survival/TCP under broad nucleus-size distributions — a microdosimetry update, not a new penetration number. <a href="https://www.jrpr.org/journal/view.php?number=1171" target="_blank" rel="noopener">Kim &amp; Sung JRPR 2024</a> (independent, Catholic University of Korea) reviews DL/FEM/MC models and in vitro D₀ heterogeneity across cell lines; flags rudimentary ~10 Gy standardized planning in early trials and calls for better planning near bone/teeth. Abscopal / immuno-combo signals are tagged emerging/theoretical — not pivotal proof. See Biology tab D₀ table and dosimetry section.</p>
<p>→ <a href="#alpha-sim-penetration" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">Sim A: penetration</a> · <a href="#bio-d0-radiosensitivity" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">D₀ table</a> · <a href="#bio-dosimetry-modeling" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">dosimetry modeling</a> on Biology tab.</p>`,

  phd: `<h3>Alpha dosimetry &amp; regulatory statistics</h3>
<h4>Ra-224 chain &amp; dose cloud</h4>
<p><span class="tag f">Fact</span> Ra-224 (t½ 3.66 d) → Rn-220 (55.6 s) → Po-216 (145 ms, Eα ≈ 6.78 MeV) → Pb-212 → Bi-212 chain; effective dose cloud ~1–2 mm from daughter diffusion while individual α tracks remain ~40–70 μm (<a href="https://pubmed.ncbi.nlm.nih.gov/20463379/" target="_blank" rel="noopener">Arazi 2010</a>; Keisari/Kelson preclinical). Uniform seed coverage required — cold spots risk local recurrence. β/γ emissions in the chain are secondary for tumor kill relative to α LET.</p>
<p><span class="tag f">Fact</span> <b>Range equation (pedagogical).</b> CSDA range R in water scales approximately as R(μm) ∝ E<sup>1.5</sup> for MeV-scale α (Bragg–Kleeman rule; ICRU Report 49). Tabulated: 5.5 MeV → 42 μm; 6.8 MeV → 56 μm; 7.7 MeV → 68 μm. LET rises toward range endpoint — relative biological effectiveness reflects complex DSB yield, not absorbed dose alone (<a href="https://pubmed.ncbi.nlm.nih.gov/26388465/" target="_blank" rel="noopener">Kelson &amp; Keisari 2015</a>). <span class="tag m">Educational</span> — full patient dosimetry requires MC transport + imaging; Biology sims are schematic only.</p>
<p><span class="tag f">Fact</span> <b>Dosimetry literature stack (peer-reviewed).</b> Arazi 2010 established the diffusion-leakage macroscopic framework. <a href="https://pubmed.ncbi.nlm.nih.gov/36464914/" target="_blank" rel="noopener">Heger et al. Med Phys 2023;50:1793–1811</a> (PMID 36464914; Alpha TAU–funded) extends DL to realistic seed geometries: 1D time-dependent solutions match 2D midplane to sub-percent and remain within a few percent to ~2 mm from the seed edge; full 2D solutions are recommended for TG-43-like dose lookup tables. <a href="https://iopscience.iop.org/article/10.1088/1361-6560/ae5d7e" target="_blank" rel="noopener">Korotinsky &amp; Arazi Phys Med Biol 2026;71:095030</a> (online 13 May 2026) is microdosimetry Part I: broad spherical nucleus-radius distributions cause survival curves to depart from pure exponential at high therapeutic doses and make TCP highly sensitive to the minimal nucleus size included — a step beyond uniform-cell assumptions in Arazi 2010, without revising CSDA α track lengths. <a href="https://www.jrpr.org/journal/view.php?number=1171" target="_blank" rel="noopener">Kim &amp; Sung J. Radiat. Prot. Res. 2024;49(3):102–113</a> is an <b>independent</b> review (no Alpha Tau affiliation stated; Sung reports OncoMed collaborations) synthesizing DL models, Heger/Zhang FEM, MC desorption studies, in vitro D₀ tables (FaDu most sensitive among reported lines; NCI-H520 least), and early clinical cohorts. JRPR explicitly notes rudimentary standardized ~10 Gy planning, generally tolerable local toxicities with attention near bone/teeth, and immune/abscopal themes as potential rather than proven pivotal endpoints. Distinguish Arazi-group modeling (Alpha Tau–affiliated) from JRPR’s outside synthesis. Biology tab: <a href="#bio-d0-radiosensitivity" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">D₀ table</a> · <a href="#bio-dosimetry-modeling" onclick="document.querySelector('.tabbtn[data-tab=biology]').click();return true;">dosimetry modeling</a>.</p>
<h4>Single-arm device statistics</h4>
<p><span class="tag f">Fact</span> Single-arm device pivotal acceptance: effect size vs historical controls / performance goals per FDA device precedent and indication-specific guidance — not NDA-style confirmatory RCTs. Binomial exact test for ORR; DOR requires time-to-event methods (KM, Brookmeyer–Crowley) not fully implemented here. Modular PMA review can include clock-stops and interactive Q-subs outside this model’s timeline heuristic.</p>
<p><span class="tag m">Model</span> MC: Beta(α,β) with α = p·20, β = (1−p)·20 — moderate prior strength. Co-primary success = observed ORR ≥ threshold AND one-sided binomial beat of p₀ at α=0.05 heuristic AND durable/responders ≥ minFrac, with each responder durable ~ Bern(pDurable) (default pDurable=0.81 from pembrolizumab LA DOR≥6mo). Wilson CI used for display, not as primary test statistic. Combined P(PMA) blends structural ORR/DOR score with a subjective PMA prior — not a formal Bayesian decision analysis. Skin P(s) links to MC P(success) by default (share hash omits derived skin P(s) when linked). SAP-defined alpha-spending and multiplicity for co-primaries are not public.</p>
<h4>Pipeline — REGAIN n=3 as feasibility only</h4>
<p><span class="tag f">Fact</span> REGAIN n=3 interim is a feasibility signal only (wide posterior; no OS estimand; local control ≠ survival). IMPACT US responses undisclosed — uniform prior band on Pipeline tab. Japan Shonin (Feb 2026) is the first ex-Israel approval but PMS n=66 and reimbursement timing remain forward-looking — see Pipeline catalyst calendar. Platform IP: controlled Ra-224 daughter release — <a href="https://patents.google.com/patent/US11969485B2/en" target="_blank" rel="noopener">US11969485B2</a> (Kelson/Keisari/Alpha Tau). Clinical radiation safety: <a href="https://pubmed.ncbi.nlm.nih.gov/39565227/" target="_blank" rel="noopener">PubMed 39565227</a>.</p>
<h4>Valuation limits &amp; share-count caution</h4>
<p><span class="tag m">Model</span> Prior bands: 1σ/2σ/3σ blue strips from literature (cemiplimab ORR 47%/49% LA per FDA label, pembrolizumab LA 50% per Merck, FIH CR 78.6% marked implausible for pivotal ORR). Valuation bands: SEER epidemiology, <a href="https://www.sec.gov/cgi-bin/viewer?accession_number=0001213900-26-025174&action=view&cik=1871321" target="_blank" rel="noopener">SEC 20-F</a> cash/shares anchors; burn prior centered on CFO cash-burn range (~$5–8M/qtr), with GAAP op-loss territory (~$13M+) marked implausible as a cash-burn input. Peak-sales identity is linear in patients × pen × price; EV multiple and platform option are conventions, not market-implied.</p>
<p><span class="tag f">Fact</span> Warrant liability mark-to-market is a <b>non-cash</b> P&amp;L item under IFRS/US GAAP liability accounting for certain warrants (DRTSW). Q1 2026 financial expenses net $9.6M were “primarily due to the remeasurement of warrants liability” — <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026058424/ea029058401ex99-1.htm" target="_blank" rel="noopener">SEC 6-K Ex. 99.1</a>. Separating (i) GAAP net loss $22.9M, (ii) GAAP operating loss $13.3M, and (iii) cash burn ~$5–6M+/qtr (CFO interview) is required for runway; conflating any of (i)/(ii) with cash burn overstates dilution urgency. Q1 PR did not disclose cash used in operations; cash rose $76.9M → $80.2M QoQ (financing/other).</p>
<p><span class="tag u">Assumption</span> Per-share outputs divide risk-adjusted EV by ~88.0M ordinary shares (88,009,737 per <a href="https://www.sec.gov/Archives/edgar/data/1871321/000121390026048160/ea0285710-f3_alpha.htm" target="_blank" rel="noopener">SEC F-3</a> / 20-F) — prior model incorrectly used ~42M “FD ADS.” Header “vs ref” uses an illustrative ~$13 ref (assumption as-of ~Jul 2026, not live). Japan H&amp;N is a fifth indication (Shonin verified; PMS n=66 ≠ revenue). F-3 shelf up to $300M + $100M ATM is capacity, not issuance — the model does not auto-dilute on shelf size. Stress-test $/share against higher share counts before treating any scenario as a price target.</p>
<p><span class="tag u">Limit</span> No competing-risk SoC drift (cemiplimab/pembrolizumab), modular PMA review clock-stops, correlated indication approvals, spatial dosimetry heterogeneity, SAP-defined alpha-spending, or fully diluted share-count paths from F-3/ATM. Educational model only — not a substitute for regulatory submission statistics or investment advice.</p>
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
  const r = state.restart;
  const pma = modularPmaTimeline({
    modulesSubmitted: r.pmaModulesDone,
    modulesTotal: r.pmaModulesTotal,
    clockStops: r.pmaClockStops ?? 1
  });
  host.innerHTML =
    `<div class="pilot-card card"><h2>Modular PMA · clock-stop heuristic</h2>` +
    `<div class="pilot-stat"><b>Review band (post top-line)</b> ${pma.monthsLo}–${pma.monthsHi} mo (mid ${pma.monthsMid})</div>` +
    `<div class="pilot-stat"><b>Modules</b> ${r.pmaModulesDone}/${r.pmaModulesTotal} submitted · clock-stops ${r.pmaClockStops ?? 1}</div>` +
    `<p class="field-note">${pma.note}. Point estimate without stops: ~${pmaTimelineMonths(r.pmaModulesDone, r.pmaModulesTotal)} mo.</p></div>` +
    `<div class="pilot-card card"><h2>REGAIN · GBM feasibility <span class="tag c">not pivotal</span></h2>` +
    `<div class="pilot-stat"><b>Local control</b> ${regain.ratePct.toFixed(0)}% posterior mean<br/>95% CI ${regain.ciLo.toFixed(0)}–${regain.ciHi.toFixed(0)}% · n=${regain.n} disclosed</div>` +
    `<div class="pilot-stat"><b>Complete response (RANO)</b> ${regain.crRatePct.toFixed(0)}% posterior mean<br/>95% CI ${regain.crCiLo.toFixed(0)}–${regain.crCiHi.toFixed(0)}%</div>` +
    `<div class="pilot-stat"><b>Registrational P(s) cap</b> ≤${(regain.maxRegistrationalPs * 100).toFixed(0)}% (raw ${(regain.rawRegistrationalPs * 100).toFixed(0)}% → capped ${(regain.cappedRegistrationalPs * 100).toFixed(0)}%) · display-only</div>` +
    `<p class="field-note">${regain.note} · <a href="${REGAIN_INTERIM.source}" target="_blank" rel="noopener">Primary source</a></p></div>` +
    `<div class="pilot-card card"><h2>IMPACT · pancreatic pilot <span class="tag c">feasibility</span></h2>` +
    `<div class="pilot-stat"><b>US pilot responses</b> not disclosed</div>` +
    `<div class="pilot-stat"><b>Target enrollment</b> n=${impact.targetN}</div>` +
    `<div class="pilot-stat"><b>Wide prior band</b> ${impact.priorLo.toFixed(0)}–${impact.priorHi.toFixed(0)}% (no US data)</div>` +
    `<div class="pilot-stat"><b>Registrational P(s) cap</b> ≤${(impact.maxRegistrationalPs * 100).toFixed(0)}% · display-only, cannot drive high P(s)</div>` +
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
  const h = computeHeaderStrip(state, lastMcResult?.pSuccess);
  const upsideTitle =
    `Model equity $${h.equity}M (EV+cash) vs mkt cap $${h.mktCap}M (shares × illustrative ref $${h.refPrice}). ${h.riskAdj ? "Risk-adjusted" : "Gross"} equity $/sh. Ref price is illustrative only (assumption as-of ~Jul 2026) — not a live quote or market data feed.`;
  strip.innerHTML =
    `<span class="best-est-item best-est-item--scenario"><span class="best-est-label">Scenario</span><span class="best-est-val best-est-val--scenario">${SHARE_PRESETS[state.activeRestartPreset]?.label || h.preset}</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">Assumed ORR</span><span class="best-est-val">${h.orrPct}%</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">Wilson CI</span><span class="best-est-val">${h.wilson}</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">P(beat bench)</span><span class="best-est-val">${h.pBeat}%</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item"><span class="best-est-label">${h.perShLabel}</span><span class="best-est-val">$${h.perSh}</span></span>` +
    `<span class="best-est-sep">·</span><span class="best-est-item" title="${upsideTitle}"><span class="best-est-label">${h.vsRefLabel}</span><span class="best-est-val">${h.upsideLabel}</span></span>`;
}

function renderMcHistogram(mc) {
  const host = $("rMcHist");
  if (!host || !mc) return;
  const max = Math.max(...mc.histogram, 1);
  const bins = mc.histogram.length;
  host.innerHTML = mc.histogram
    .map((c, i) => {
      const lo = (i / bins) * 100;
      const hi = ((i + 1) / bins) * 100;
      const h = Math.round((c / max) * 100);
      return `<div title="ORR ${lo.toFixed(0)}–${hi.toFixed(0)}%: ${c} sims" style="flex:1;height:${Math.max(2, h)}%;background:var(--accent);opacity:.75;border-radius:2px 2px 0 0"></div>`;
    })
    .join("");
  const axis = $("rMcAxis");
  if (axis) {
    axis.innerHTML = [0, 25, 50, 75, 100]
      .map((t) => `<div>${t}%</div>`)
      .join("");
  }
  const cap = $("rMcCaption");
  if (cap) {
    const dorNote =
      mc.pOrrOnly != null
        ? ` · ORR-only ${(mc.pOrrOnly * 100).toFixed(1)}% · P(DOR|ORR) ${(mc.pDorGivenOrr * 100).toFixed(0)}%`
        : "";
    cap.textContent = `MC n=${mc.sims}: trial co-primary P(success | assumptions) ${(mc.pSuccess * 100).toFixed(1)}%${dorNote} · median ORR ${mc.orrMedian.toFixed(1)}% (95% ${mc.orrLo.toFixed(0)}–${mc.orrHi.toFixed(0)}%) — educational gates only, not PMA certainty`;
  }
}

function applyLinkedSkinPs() {
  if (!state.val.v_linkSkinPs) return;
  const linked = resolveLinkedSkinPs(
    state.restart,
    lastMcResult?.pSuccess,
    state.val.v_approvalHaircut
  );
  state.val.v_skinPs = linked;
  const el = $("vv_skinPs");
  if (el) el.value = linked;
  const lab = $("vv_skinPsVal");
  if (lab) lab.textContent = linked.toFixed(2);
}

function updateSkinPsLinkUI() {
  const linkEl = $("v_linkSkinPs");
  if (linkEl) state.val.v_linkSkinPs = linkEl.checked;
  const skinEl = $("vv_skinPs");
  if (skinEl) skinEl.disabled = !!state.val.v_linkSkinPs;
  const haircutEl = $("vv_approvalHaircut");
  if (haircutEl) haircutEl.disabled = !state.val.v_linkSkinPs;
  const note = $("skinPsLinkNote");
  if (!note) return;
  const trialPs = resolveTrialPs(state.restart, lastMcResult?.pSuccess);
  const approvalPs = resolveLinkedSkinPs(
    state.restart,
    lastMcResult?.pSuccess,
    state.val.v_approvalHaircut
  );
  const haircut = state.val.v_approvalHaircut ?? 0.75;
  const skinPs = state.val.v_skinPs;
  if (state.val.v_linkSkinPs) {
    const src = lastMcResult ? "MC trial co-primary" : "pCombined";
    note.textContent =
      `Linked — trial P(success | assumptions) ${trialPs.toFixed(2)} (${src}) × PMA haircut ${(haircut * 100).toFixed(0)}% → approval P(s) ${approvalPs.toFixed(2)}. ` +
      `Single-arm ORR+DOR gates are educational; PMA is not ~${(trialPs * 100).toFixed(0)}% certain — historical-control and FDA review risk remain.`;
    note.className = "field-note skin-ps-link-note";
  } else {
    const diverge = Math.abs(skinPs - approvalPs) > 0.02;
    note.textContent = diverge
      ? `Unlinked — model P(success | assumptions) ${skinPs.toFixed(2)} diverges from linked approval P(s) ${approvalPs.toFixed(2)} (trial ${trialPs.toFixed(2)} × haircut).`
      : `Unlinked — model P(success | assumptions) ${skinPs.toFixed(2)} matches linked approval path ${approvalPs.toFixed(2)}.`;
    note.className = "field-note skin-ps-link-note" + (diverge ? " skin-ps-diverge" : "");
  }
}

function applyDilutionStress(sharesM) {
  state.val.v_shares = sharesM;
  const el = $("vv_shares");
  if (el) el.value = sharesM;
  const lab = $("vv_sharesVal");
  if (lab) lab.textContent = sharesM;
  document.querySelectorAll("[data-dilution-stress]").forEach((b) => {
    b.classList.toggle("p-def", Number(b.dataset.dilutionStress) === sharesM);
  });
  scheduleUpdate();
}

function runMcSimulation() {
  const r = state.restart;
  lastMcResult = mcRestartORR(
    {
      n: r.n,
      orrPct: r.orrPct,
      benchOrrPct: r.benchOrrPct,
      orrThresholdPct: r.orrThresholdPct,
      dorDurablePct: r.dorDurablePct,
      dorMinFracPct: r.dorMinFracPct,
      sims: r.mcSims,
      seed: 42
    },
    undefined
  );
  renderMcHistogram(lastMcResult);
  if ($("rMcPsucc")) $("rMcPsucc").textContent = (lastMcResult.pSuccess * 100).toFixed(1) + "%";
  if ($("rMcOrrOnly")) $("rMcOrrOnly").textContent = (lastMcResult.pOrrOnly * 100).toFixed(1) + "%";
  applyLinkedSkinPs();
  updateSkinPsLinkUI();
  if (activeTab === "value" || tabsDirty.value) updateValUI();
  updateHeaderStrip();
}

const scheduleMcUpdate = debounce(runMcSimulation, 120);

function updateRestartUI(includeMc = true) {
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
  const pmaBand = modularPmaTimeline({
    modulesSubmitted: r.pmaModulesDone,
    modulesTotal: r.pmaModulesTotal,
    clockStops: r.pmaClockStops ?? 1
  });
  if ($("rPmaEta")) {
    $("rPmaEta").textContent =
      `${pmaBand.monthsLo}–${pmaBand.monthsHi} mo post top-line (mid ${pmaBand.monthsMid}; clock-stop band)`;
  }

  if (!includeMc) {
    applyLinkedSkinPs();
    updateSkinPsLinkUI();
    return;
  }
  // Always run MC when restart inputs change (not only on ReSTART tab): linked skin P(s)
  // and the header strip depend on co-primary MC P(success).
  if (restoringState) runMcSimulation();
  else scheduleMcUpdate();
}

function catalystTagHtml(tag) {
  if (tag === "verified") return `<span class="tag f">verified</span>`;
  return `<span class="tag a">estimate</span>`;
}

function catalystCardHtml(it) {
  const c = it.catalyst;
  const windowLabel = `${formatCatalystMonth(c.windowStart)} – ${formatCatalystMonth(c.windowEnd)}`;
  const nct = c.nct
    ? ` · <a href="https://clinicaltrials.gov/study/${c.nct}" target="_blank" rel="noopener">${c.nct}</a>`
    : "";
  const note = c.note ? `<div class="cat-tl-note">${c.note}</div>` : "";
  const source = c.source
    ? `<a class="cat-tl-source" href="${c.source}" target="_blank" rel="noopener">Source</a>`
    : "";
  const cont =
    it.continuesRight || it.continuesLeft
      ? `<span class="cat-tl-continues">${it.continuesRight ? "continues →" : "← continues"}</span>`
      : "";
  const dotClass =
    "cat-tl-dot" + (c.tag === "verified" ? " cat-tl-dot--verified" : " cat-tl-dot--estimate");
  return (
    `<li class="cat-tl-item">` +
    `<div class="${dotClass}" aria-hidden="true"></div>` +
    `<div class="cat-tl-card">` +
    `<div class="cat-tl-card-head"><span class="cat-tl-trial">${c.trial}</span>${catalystTagHtml(c.tag)}${source}</div>` +
    `<div class="cat-tl-label">${c.label}</div>` +
    `<div class="cat-tl-window">${windowLabel}${cont}${nct}</div>` +
    note +
    `</div></li>`
  );
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

  const items = layoutTimeline(list, year);
  const lanes = items.reduce((n, it) => Math.max(n, it.lane + 1), 1);
  const { start, end } = timelineBounds(year);
  const todayIso = new Date().toISOString().slice(0, 10);
  const showToday = todayIso >= start && todayIso <= end;
  const todayFrac = showToday ? timelineFrac(todayIso, start, end) : null;
  const ticks = quarterTicks(year);

  const tickHtml = ticks
    .map(
      (t) =>
        `<div class="cat-tl-tick" style="left:${(t.frac * 100).toFixed(2)}%"><span>${t.label}</span></div>`
    )
    .join("");

  // Layer 1: Gantt bars only (no cards over the chart)
  const barHtml = items
    .map((it) => {
      const c = it.catalyst;
      const leftPct = (it.left * 100).toFixed(2);
      const widthPct = (it.width * 100).toFixed(2);
      const windowLabel = `${formatCatalystMonth(c.windowStart)} – ${formatCatalystMonth(c.windowEnd)}`;
      const titleParts = [windowLabel, c.trial, c.label, c.tag === "verified" ? "verified" : "estimate"];
      if (it.continuesRight) titleParts.push("continues past year end");
      if (c.note) titleParts.push(c.note);
      const title = titleParts.join(" · ").replace(/"/g, "&quot;");
      const barClass =
        "cat-tl-bar" +
        (c.tag === "verified" ? " cat-tl-bar--verified" : " cat-tl-bar--estimate") +
        (it.continuesLeft ? " cat-tl-bar--cont-left" : "") +
        (it.continuesRight ? " cat-tl-bar--cont-right" : "");
      const contMark = it.continuesRight
        ? `<span class="cat-tl-bar-arrow" aria-hidden="true">→</span>`
        : "";
      return (
        `<div class="${barClass}" style="left:${leftPct}%;width:${widthPct}%;--lane:${it.lane}" title="${title}">` +
        `<span class="cat-tl-bar-label">${c.trial}</span>${contMark}</div>`
      );
    })
    .join("");

  const todayHtml = showToday
    ? `<div class="cat-tl-today" style="left:${(todayFrac * 100).toFixed(2)}%" title="Today"><span>Today</span></div>`
    : "";

  // Layer 2: full-width event cards in date order (shared desktop + mobile)
  const listHtml = items.map(catalystCardHtml).join("");

  host.innerHTML =
    `<div class="cat-timeline" style="--lanes:${lanes}">` +
    `<div class="cat-tl-legend" aria-hidden="true">` +
    `<span class="cat-tl-leg"><i class="cat-tl-leg-swatch cat-tl-leg-swatch--verified"></i> verified</span>` +
    `<span class="cat-tl-leg"><i class="cat-tl-leg-swatch cat-tl-leg-swatch--estimate"></i> estimate</span>` +
    (showToday ? `<span class="cat-tl-leg"><i class="cat-tl-leg-today"></i> today</span>` : "") +
    `<span class="cat-tl-leg"><i class="cat-tl-leg-cont">→</i> continues past year</span>` +
    `</div>` +
    `<div class="cat-tl-chart" aria-label="Catalyst timeline ${year}">` +
    `<div class="cat-tl-ticks">${tickHtml}</div>` +
    `<div class="cat-tl-track">` +
    `<div class="cat-tl-line"></div>` +
    todayHtml +
    barHtml +
    `</div></div>` +
    `<ol class="cat-tl-list">${listHtml}</ol>` +
    `</div>`;
}

function updatePipelineUI() {
  renderCatalystCalendar();
  renderPilotPanels();
  const s = computePipelineSummary(state.pipeline);
  if ($("pipeSummary")) {
    $("pipeSummary").textContent = `${s.usTrials} US IDE trials · REGAIN ${s.regainNote} · IMPACT target n=${s.impactTargetN}`;
  }
}

function updateValUI() {
  applyLinkedSkinPs();
  updateSkinPsLinkUI();
  document.querySelectorAll("[data-dilution-stress]").forEach((b) => {
    b.classList.toggle("p-def", Number(b.dataset.dilutionStress) === state.val.v_shares);
  });
  const m = computeValuationMetrics(state.val);
  const riskAdj = !!state.val.v_riskadj;
  if ($("vEv")) $("vEv").textContent = "$" + m.ev.toFixed(0) + "M";
  if ($("vPsh")) $("vPsh").textContent = "$" + m.perSh.toFixed(2) + (riskAdj ? " risk-adj" : " gross");
  if ($("vPeak")) $("vPeak").textContent = "$" + m.totalPeak.toFixed(0) + "M/yr" + (riskAdj ? " risk-adj" : " gross");
  const burn = state.val.v_burnQuarterly ?? 6.5;
  const runway = computeRunwayMonths(state.val.v_cash, burn);
  if ($("vRunway")) {
    $("vRunway").textContent =
      runway === Infinity ? "∞ mo" : runway.toFixed(1) + " mo (~" + (runway / 12).toFixed(1) + " yr)";
  }

  const tbody = $("vContribBody");
  if (tbody) {
    tbody.innerHTML =
      m.rows
        .map(
          (row) =>
            `<tr><td>${row.label}</td><td>$${row.peak.toFixed(0)}M</td><td>${(row.pSuccess * 100).toFixed(0)}%</td><td>$${row.evContrib.toFixed(0)}M</td></tr>`
        )
        .join("") +
      `<tr><td>Platform option</td><td>—</td><td>—</td><td>$${m.platform.toFixed(0)}M</td></tr>`;
  }
}

function updateBands() {
  renderBands($, (id) => $(id)?.value);
}

function updateNow(forceAll = false) {
  readSliders("r", Object.keys(state.restart), state.restart);
  readSliders("v", Object.keys(state.val), state.val);
  readSliders("p", Object.keys(state.pipeline), state.pipeline);
  const riskEl = $("v_riskadj");
  if (riskEl) state.val.v_riskadj = riskEl.checked;
  const linkEl = $("v_linkSkinPs");
  if (linkEl) state.val.v_linkSkinPs = linkEl.checked;
  updateRestartUI(forceAll || activeTab === "restart");
  if (forceAll || activeTab === "pipeline" || tabsDirty.pipeline) updatePipelineUI();
  if (forceAll || activeTab === "value" || tabsDirty.value) updateValUI();
  updateSkinPsLinkUI();
  updateHeaderStrip();
  updateBands();
  tabsDirty.restart = activeTab !== "restart";
  tabsDirty.pipeline = activeTab !== "pipeline";
  tabsDirty.value = activeTab !== "value";
  if (!restoringState) updateHashQuiet();
}

function scheduleUpdate() {
  if (restoringState) {
    updateNow(true);
    return;
  }
  if (updateRaf) return;
  updateRaf = requestAnimationFrame(() => {
    updateRaf = null;
    updateNow(false);
  });
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
  if ($("v_linkSkinPs")) $("v_linkSkinPs").checked = state.val.v_linkSkinPs;
  curLvl = state.ui.explainLvl || "eli5";
  updateNow(true);
  showLevel(curLvl);
  if (s.tab) switchTab(s.tab, true);
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
  updateNow(true);
}

function applyValPreset(name) {
  const q = VAL_PRESETS[name];
  if (!q) return;
  const { label: _lb, ...rest } = q;
  Object.assign(state.val, rest);
  state.activeValPreset = name;
  writeSliders("v", state.val);
  document.querySelectorAll("[data-val-preset]").forEach((b) => {
    b.classList.toggle("p-def", b.dataset.valPreset === name);
  });
  updateNow(true);
}

const TAB_SHORT_LABELS = {
  restart: "ReSTART",
  pipeline: "Pipeline",
  value: "Valuation",
  explain: "Explain",
  biology: "Biology"
};

function closeMobileNav() {
  const panel = $("mobileNavPanel");
  const toggle = $("navToggle");
  const backdrop = $("mobileNavBackdrop");
  if (!panel) return;
  panel.classList.remove("is-open");
  panel.hidden = true;
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  }
  if (backdrop) {
    backdrop.classList.remove("is-open");
    backdrop.hidden = true;
  }
  document.body.classList.remove("nav-open");
}

function openMobileNav() {
  const panel = $("mobileNavPanel");
  const toggle = $("navToggle");
  const backdrop = $("mobileNavBackdrop");
  if (!panel || !toggle) return;
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("is-open"));
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Close navigation menu");
  if (backdrop) {
    backdrop.hidden = false;
    backdrop.classList.add("is-open");
  }
  document.body.classList.add("nav-open");
}

function syncMobileNav(t) {
  document.querySelectorAll(".mobile-nav-item").forEach((x) => {
    const on = x.dataset.tab === t;
    x.classList.toggle("active", on);
    x.setAttribute("aria-current", on ? "page" : "false");
  });
  const lbl = $("hdrActiveTab");
  if (lbl && TAB_SHORT_LABELS[t]) lbl.textContent = TAB_SHORT_LABELS[t];
}

function initMobileNav() {
  const panel = $("mobileNavPanel");
  const toggle = $("navToggle");
  const backdrop = $("mobileNavBackdrop");
  if (!panel || !toggle) return;
  toggle.onclick = () => {
    if (panel.classList.contains("is-open")) closeMobileNav();
    else openMobileNav();
  };
  if (backdrop) backdrop.onclick = closeMobileNav;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileNav();
  });
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("is-open")) return;
    const target = e.target;
    if (!panel.contains(target) && !toggle.contains(target)) closeMobileNav();
  });
  panel.querySelectorAll(".mobile-nav-item").forEach((btn) => {
    btn.onclick = () => {
      switchTab(btn.dataset.tab);
      closeMobileNav();
      if (!restoringState) window.scrollTo(0, 0);
    };
  });
}

function switchTab(t, fromRestore = false) {
  if (!VALID_TABS.includes(t)) return;
  activeTab = t;
  document.querySelectorAll(".tabbtn").forEach((x) => {
    const on = x.dataset.tab === t;
    x.classList.toggle("active", on);
    x.setAttribute("aria-selected", on ? "true" : "false");
  });
  syncMobileNav(t);
  closeMobileNav();
  VALID_TABS.forEach((id) => {
    const el = $("tab-" + id);
    if (el) el.hidden = id !== t;
  });
  if (t === "biology") initAlphaSims();
  if (t === "restart" && (tabsDirty.restart || !lastMcResult)) runMcSimulation();
  if (t === "pipeline" && tabsDirty.pipeline) updatePipelineUI();
  if (t === "value" && tabsDirty.value) updateValUI();
  if (t === "explain" && tabsDirty.explain) showLevel(curLvl);
  tabsDirty[t] = false;
  if (!restoringState) {
    state.tab = t;
    if (!fromRestore) updateHashQuiet();
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
        `<tr><td>${c.name}${c.source ? ` · <a href="${c.source}" target="_blank" rel="noopener">source</a>` : ""}</td><td>${c.evMultiple}</td><td>${c.note}</td><td><span class="tag ${c.tag === "verified" ? "f" : "a"}">${c.tag}</span></td></tr>`
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

  const pipeBear = $("pipeBearBody");
  if (pipeBear) pipeBear.innerHTML = BEAR_CASE.map(ddRowHtml).join("");

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
  initMobileNav();
  document.querySelectorAll(".lvlb").forEach((b) => (b.onclick = () => showLevel(b.dataset.lvl)));
  document.querySelectorAll("[data-preset]").forEach((b) => (b.onclick = () => applyRestartPreset(b.dataset.preset)));
  document.querySelectorAll("[data-val-preset]").forEach((b) => (b.onclick = () => applyValPreset(b.dataset.valPreset)));
  document.querySelectorAll("[data-dilution-stress]").forEach((b) => {
    b.onclick = () => applyDilutionStress(Number(b.dataset.dilutionStress));
  });

  ["r", "v", "p"].forEach((prefix) => {
    document.querySelectorAll(`[id^="${prefix}"]`).forEach((el) => {
      if (el.type === "range" || el.type === "number") el.addEventListener("input", scheduleUpdate);
    });
  });
  const risk = $("v_riskadj");
  if (risk) risk.addEventListener("change", scheduleUpdate);
  const linkSkin = $("v_linkSkinPs");
  if (linkSkin) linkSkin.addEventListener("change", scheduleUpdate);

  const btnShare = $("btnShare");
  if (btnShare) {
    btnShare.onclick = async () => {
      updateNow(true);
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
    switchTab("restart", true);
    showLevel("eli5");
    runMcSimulation();
  }
  initAlphaSims();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

export { updateNow, applyRestartPreset, switchTab, state };
