/**
 * ReSTART pivotal cSCC — single-arm ORR + DOR vs historical benchmark.
 * Device PMA path (not drug OS HR).
 */

import { wilsonInterval, binomUpperTail, logBinom } from "./device.js";

/** Published recurrent / locally advanced cSCC systemic therapy ORR benchmarks (primary literature). */
export const CSCC_BENCHMARKS = [
  {
    id: "cemiplimab_met",
    label: "Cemiplimab (metastatic cSCC pivotal)",
    orrPct: 47,
    rangeLo: 42,
    rangeHi: 52,
    source: "https://www.fda.gov/drugs/drug-approvals-and-databases/fda-approves-cemiplimab-rwlc-metastatic-or-locally-advanced-cutaneous-squamous-cell-carcinoma",
    tag: "verified"
  },
  {
    id: "cemiplimab_la",
    label: "Cemiplimab (locally advanced cSCC, FDA label)",
    orrPct: 49,
    rangeLo: 31,
    rangeHi: 67,
    source: "https://www.fda.gov/drugs/drug-approvals-and-databases/fda-approves-cemiplimab-rwlc-metastatic-or-locally-advanced-cutaneous-squamous-cell-carcinoma",
    tag: "verified"
  },
  {
    id: "pembrolizumab_la",
    label: "Pembrolizumab (locally advanced cSCC, KEYNOTE-629)",
    orrPct: 50,
    rangeLo: 36,
    rangeHi: 64,
    source: "https://www.merck.com/news/fda-approves-expanded-indication-for-mercks-keytruda-pembrolizumab-in-locally-advanced-cutaneous-squamous-cell-carcinoma-cscc/",
    tag: "verified"
  },
  {
    id: "pembrolizumab_rm",
    label: "Pembrolizumab (recurrent/met cSCC, initial KEYNOTE-629)",
    orrPct: 34,
    rangeLo: 25,
    rangeHi: 44,
    source: "https://pubmed.ncbi.nlm.nih.gov/32997973/",
    tag: "verified"
  },
  {
    id: "literature_floor",
    label: "Historical systemic therapy (recurrent cSCC, pooled)",
    orrPct: 30,
    rangeLo: 26,
    rangeHi: 40,
    source: "https://pubmed.ncbi.nlm.nih.gov/31759075/",
    note: "FIH DaRT context; not ReSTART comparator",
    tag: "assumption"
  }
];

/** Default SAP-style success thresholds (public SAP not filed — user-adjustable). */
export const DEFAULT_ORR_THRESHOLD_PCT = 35;
export const DEFAULT_DOR_THRESHOLD_MONTHS = 6;
/**
 * Default P(DOR ≥ 6 mo | responder) from PD-1 cSCC labels (pembrolizumab LA: 81% DOR ≥6 mo).
 * MC co-primary uses this per-responder prior; deterministic dorMonths slider remains sensitivity only.
 */
export const DEFAULT_DOR_DURABLE_PCT = 81;
/** Min fraction of responders that must be durable for MC co-primary pass. */
export const DEFAULT_DOR_MIN_FRAC_PCT = 50;

/**
 * Deterministic ReSTART metrics from assumed ORR and enrollment.
 * @param {{ n: number, orrPct: number, benchOrrPct: number, dorMonths: number, dorBenchMonths?: number, orrThresholdPct?: number, pSuccess?: number }} p
 */
export function computeRestartMetrics(p) {
  const n = Math.max(1, Math.round(p.n));
  const orrPct = Math.max(0, Math.min(100, p.orrPct));
  const bench = p.benchOrrPct / 100;
  const responders = Math.round((n * orrPct) / 100);
  const wi = wilsonInterval(responders, n);
  const pBeatBench = 1 - binomUpperTail(responders, n, bench);
  const orrThresh = (p.orrThresholdPct ?? DEFAULT_ORR_THRESHOLD_PCT) / 100;
  const pOrrPass = 1 - binomUpperTail(Math.ceil(orrThresh * n), n, orrPct / 100);
  const pOrrVsBench = pBeatBench;

  const dorMonths = p.dorMonths ?? DEFAULT_DOR_THRESHOLD_MONTHS;
  const dorBench = p.dorBenchMonths ?? DEFAULT_DOR_THRESHOLD_MONTHS;
  const dorPass = dorMonths >= dorBench;

  // Heuristic: ORR statistical beat + DOR gate + subjective PMA prior
  const pStructural =
    pOrrVsBench * (dorPass ? 1 : 0.65) * (wi.lo >= bench ? 1.05 : wi.lo >= bench * 0.85 ? 0.9 : 0.75);
  const pPmaSlider = (p.pSuccess ?? 65) / 100;
  const pCombined = Math.min(0.99, Math.max(0.01, pStructural * 0.55 + pPmaSlider * 0.45));

  return {
    n,
    responders,
    orrPct,
    wilson: wi,
    pBeatBench,
    pOrrPass,
    dorMonths,
    dorPass,
    pCombined,
    pStructural: Math.min(1, pStructural),
    orrThresholdPct: orrThresh * 100
  };
}

/** Sample binomial ORR given true rate (for MC). */
function sampleBinomial(n, p, rng = Math.random) {
  let s = 0;
  for (let i = 0; i < n; i++) if (rng() < p) s++;
  return s;
}

/**
 * Monte Carlo: draw true ORR ~ Beta prior centered on assumed ORR, observe n patients.
 * Co-primary win = ORR gate (threshold + beat bench) AND durable-responder fraction gate.
 * Each responder is durable with P(DOR ≥ 6 mo) from prior (PD-1 comps / FIH default).
 * Deterministic dorMonths slider is sensitivity only — not used in MC draws.
 * @returns {{ sims: number, pSuccess: number, orrMedian: number, orrLo: number, orrHi: number, histogram: number[], pOrrOnly: number, pDorGivenOrr: number }}
 */
export function mcRestartORR(
  {
    n,
    orrPct,
    benchOrrPct,
    orrThresholdPct = DEFAULT_ORR_THRESHOLD_PCT,
    dorDurablePct = DEFAULT_DOR_DURABLE_PCT,
    dorMinFracPct = DEFAULT_DOR_MIN_FRAC_PCT,
    sims = 2000,
    seed
  },
  rng = Math.random
) {
  const N = Math.max(1, Math.round(n));
  const center = orrPct / 100;
  const bench = benchOrrPct / 100;
  const thresh = orrThresholdPct / 100;
  const pDurable = Math.max(0, Math.min(1, dorDurablePct / 100));
  const minFrac = Math.max(0, Math.min(1, dorMinFracPct / 100));
  const bins = 20;
  const hist = new Array(bins).fill(0);
  let wins = 0;
  let orrWins = 0;
  let dorWinsGivenOrr = 0;
  const observed = [];

  let r = rng;
  if (seed != null) {
    let s = seed >>> 0;
    r = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // Beta(a,b) around center with moderate uncertainty
  const a = Math.max(2, center * 20);
  const b = Math.max(2, (1 - center) * 20);

  for (let i = 0; i < sims; i++) {
    const trueP = betaSample(a, b, r);
    const k = sampleBinomial(N, trueP, r);
    const orrObs = k / N;
    observed.push(orrObs);
    const bin = Math.min(bins - 1, Math.floor(orrObs * bins));
    hist[bin]++;
    const beatBench = 1 - binomUpperTail(k, N, bench) > 0.5 || orrObs > bench;
    const passThresh = orrObs >= thresh;
    const passOrr = beatBench && passThresh;
    if (passOrr) orrWins++;
    // Co-primary DOR: each responder durable with pDurable; need durable/k ≥ minFrac
    let passDor = false;
    if (k > 0) {
      const durable = sampleBinomial(k, pDurable, r);
      passDor = durable / k >= minFrac;
    }
    if (passOrr && passDor) {
      wins++;
      dorWinsGivenOrr++;
    }
  }

  observed.sort((x, y) => x - y);
  const q = (p) => observed[Math.floor(p * (observed.length - 1))] ?? 0;

  return {
    sims,
    pSuccess: wins / sims,
    pOrrOnly: orrWins / sims,
    pDorGivenOrr: orrWins > 0 ? dorWinsGivenOrr / orrWins : 0,
    orrMedian: q(0.5) * 100,
    orrLo: q(0.025) * 100,
    orrHi: q(0.975) * 100,
    histogram: hist
  };
}

function betaSample(a, b, rng) {
  const x = gammaSample(a, rng);
  const y = gammaSample(b, rng);
  return x / (x + y);
}

function gammaSample(shape, rng) {
  if (shape < 1) return gammaSample(shape + 1, rng) * Math.pow(rng(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do {
      x = randn(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function randn(rng) {
  const u = rng() || 1e-10;
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Months from enrollment complete to top-line (company guidance ~end 2026). */
export function estimateReadoutMonths(enrollCompleteMonth = 5, enrollCompleteYear = 2026, readoutMonth = 12, readoutYear = 2026) {
  return (readoutYear - enrollCompleteYear) * 12 + (readoutMonth - enrollCompleteMonth);
}

/** Modular PMA timeline heuristic (months post top-line) — point estimate. */
export function pmaTimelineMonths(modulesSubmitted = 1, modulesTotal = 3) {
  const baseReview = 6;
  const perModule = 2;
  return baseReview + (modulesTotal - modulesSubmitted) * perModule;
}

/**
 * Modular PMA timeline with clock-stop uncertainty band (heuristic, not FDA clock).
 * @param {{ modulesSubmitted?: number, modulesTotal?: number, clockStops?: number, clockStopMonthsMean?: number, clockStopMonthsSd?: number }} p
 * @returns {{ monthsLo: number, monthsMid: number, monthsHi: number, note: string }}
 */
export function modularPmaTimeline(p = {}) {
  const modulesSubmitted = p.modulesSubmitted ?? 1;
  const modulesTotal = p.modulesTotal ?? 3;
  const clockStops = Math.max(0, p.clockStops ?? 1);
  const stopMean = p.clockStopMonthsMean ?? 3;
  const stopSd = p.clockStopMonthsSd ?? 1.5;
  const base = pmaTimelineMonths(modulesSubmitted, modulesTotal);
  const stopTotal = clockStops * stopMean;
  const stopSpread = clockStops * 2 * stopSd;
  return {
    monthsLo: Math.max(3, Math.round(base + stopTotal - stopSpread)),
    monthsMid: Math.round(base + stopTotal),
    monthsHi: Math.round(base + stopTotal + stopSpread),
    note: "Heuristic modular PMA + clock-stop band — not FDA review clock"
  };
}
