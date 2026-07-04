/**
 * Read-only Bayesian response-rate panels for IMPACT / REGAIN pilot trials.
 * Uses disclosed interim counts only — wide priors when n is tiny.
 * Feasibility / pilot posteriors are display-only and cannot set registrational P(s)
 * without a hard contribution cap (see capRegistrationalPs).
 */

import {
  wilsonInterval,
  capRegistrationalPs,
  REGAIN_MAX_REGISTRATIONAL_PS,
  IMPACT_MAX_REGISTRATIONAL_PS
} from "./device.js";

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
 * REGAIN read-only panel metrics — feasibility, not pivotal.
 * n=3 posterior cannot set registrational P(s) without hard cap (max 15% contribution).
 */
export function computeRegainPanel() {
  const { n, localControl, completeResponse } = REGAIN_INTERIM;
  const ldc = betaPosteriorInterval(localControl, n);
  const cr = betaPosteriorInterval(completeResponse, n);
  const rawPs = betaPosteriorMean(localControl, n);
  const cappedPs = capRegistrationalPs(rawPs, REGAIN_MAX_REGISTRATIONAL_PS);
  return {
    n,
    ratePct: rawPs * 100,
    ciLo: ldc.lo * 100,
    ciHi: ldc.hi * 100,
    crRatePct: betaPosteriorMean(completeResponse, n) * 100,
    crCiLo: cr.lo * 100,
    crCiHi: cr.hi * 100,
    displayOnly: true,
    feasibilityNotPivotal: true,
    rawRegistrationalPs: rawPs,
    cappedRegistrationalPs: cappedPs,
    maxRegistrationalPs: REGAIN_MAX_REGISTRATIONAL_PS,
    note: `Interim n=${n} only — feasibility not pivotal. 95% CI ~${(cr.lo * 100).toFixed(0)}–${(cr.hi * 100).toFixed(0)}% CR; registrational P(s) contribution capped at ${(REGAIN_MAX_REGISTRATIONAL_PS * 100).toFixed(0)}% (display-only, cannot drive valuation P(s))`
  };
}

/**
 * IMPACT read-only panel — no US pilot response data; wide prior band only.
 * Display-only: cannot drive high P(s) without hard cap.
 */
export function computeImpactPanel() {
  const prior = betaPosteriorInterval(0, 0, 1, 1);
  const priorMean = betaPosteriorMean(0, 0, 1, 1);
  const cappedPs = capRegistrationalPs(priorMean, IMPACT_MAX_REGISTRATIONAL_PS);
  return {
    targetN: IMPACT_PILOT.targetN,
    disclosed: false,
    displayOnly: true,
    feasibilityNotPivotal: true,
    priorLo: prior.lo * 100,
    priorHi: prior.hi * 100,
    priorMeanPct: priorMean * 100,
    cappedRegistrationalPs: cappedPs,
    maxRegistrationalPs: IMPACT_MAX_REGISTRATIONAL_PS,
    note: "No IMPACT US pilot response counts disclosed — wide uniform Beta(1,1) prior only (display-only). Cannot drive high P(s); registrational contribution capped at 15%. Do not import pooled ASCO pancreatic OS into IMPACT n=40 feasibility."
  };
}
