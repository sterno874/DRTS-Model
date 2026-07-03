/**
 * Read-only Bayesian response-rate panels for IMPACT / REGAIN pilot trials.
 * Uses disclosed interim counts only — wide priors when n is tiny.
 */

import { wilsonInterval } from "./device.js";

/** Beta(a,b) posterior mean after observing s successes in n trials (conjugate update). */
export function betaPosteriorMean(successes, n, alphaPrior = 1, betaPrior = 1) {
  const s = Math.max(0, Math.min(n, successes));
  return (alphaPrior + s) / (alphaPrior + betaPrior + n);
}

/** Equal-tailed credible interval via Wilson on posterior mean (approx for display). */
export function betaPosteriorInterval(successes, n, alphaPrior = 1, betaPrior = 1, z = 1.96) {
  const postS = alphaPrior + successes;
  const postN = alphaPrior + betaPrior + n;
  return wilsonInterval(postS, postN, z);
}

/**
 * REGAIN interim — disclosed n=3, 100% local disease control, 67% CR (2 CR + 1 SD).
 * Source: Jun 2026 FDA clearance PR (cutoff May 3, 2026).
 */
export const REGAIN_INTERIM = {
  n: 3,
  localControl: 3,
  completeResponse: 2,
  source:
    "https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/",
  asOf: "2026-05-03"
};

/** IMPACT pilot — enrollment target n=40; no disclosed per-patient response counts in US pilot yet. */
export const IMPACT_PILOT = {
  targetN: 40,
  disclosedResponses: null,
  pooledNote:
    "Pooled pancreatic FIH studies presented at ASCO 2026 — different design from IMPACT US pilot",
  pooledSource:
    "https://alphatau.com/alpha-tau-announces-strong-overall-survival-results-from-alpha-dart-pancreatic-cancer-studies-presented-at-2026-asco-annual-meeting/",
  asOf: "2026-06-01"
};

/**
 * REGAIN read-only panel metrics.
 * @returns {{ n: number, ratePct: number, ciLo: number, ciHi: number, crRatePct: number, crCiLo: number, crCiHi: number, note: string }}
 */
export function computeRegainPanel() {
  const { n, localControl, completeResponse } = REGAIN_INTERIM;
  const ldc = betaPosteriorInterval(localControl, n);
  const cr = betaPosteriorInterval(completeResponse, n);
  return {
    n,
    ratePct: betaPosteriorMean(localControl, n) * 100,
    ciLo: ldc.lo * 100,
    ciHi: ldc.hi * 100,
    crRatePct: betaPosteriorMean(completeResponse, n) * 100,
    crCiLo: cr.lo * 100,
    crCiHi: cr.hi * 100,
    note: `Interim n=${n} only — 95% credible intervals span ~${(cr.lo * 100).toFixed(0)}–${(cr.hi * 100).toFixed(0)}% CR; not OS or pivotal proof`
  };
}

/**
 * IMPACT read-only panel — no US pilot response data; shows prior-only uncertainty band.
 */
export function computeImpactPanel() {
  const prior = betaPosteriorInterval(0, 0, 1, 1);
  return {
    targetN: IMPACT_PILOT.targetN,
    disclosed: false,
    priorLo: prior.lo * 100,
    priorHi: prior.hi * 100,
    note: "No IMPACT US pilot response counts disclosed — uniform Beta(1,1) prior shown; do not import pooled ASCO pancreatic OS into IMPACT n=40 feasibility"
  };
}
