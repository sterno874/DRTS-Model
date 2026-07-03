/**
 * Pipeline facts and catalyst calendar — primary-sourced only.
 */

/** @typedef {{ id: string, trial: string, nct: string, label: string, windowStart: string, windowEnd: string, tag: string, source: string, note?: string }} Catalyst */

export const PIPELINE_TRIALS = [
  {
    id: "restart",
    name: "ReSTART",
    indication: "Recurrent cutaneous SCC",
    nct: "NCT05323253",
    nctUrl: "https://clinicaltrials.gov/study/NCT05323253",
    design: "Pivotal single-arm",
    enrollment: 88,
    status: "Enrollment complete May 2026",
    tag: "verified",
    source: "https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update"
  },
  {
    id: "impact",
    name: "IMPACT",
    indication: "Unresectable/metastatic pancreatic adenocarcinoma + chemo",
    nct: "NCT06698458",
    nctUrl: "https://clinicaltrials.gov/study/NCT06698458",
    design: "Multi-center pilot",
    enrollment: 40,
    status: "Recruitment complete Q3 2026 (est.)",
    tag: "verified",
    source: "https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update"
  },
  {
    id: "regain",
    name: "REGAIN",
    indication: "Recurrent glioblastoma",
    nct: "NCT06910306",
    nctUrl: "https://clinicaltrials.gov/study/NCT06910306",
    design: "Feasibility single-arm",
    enrollment: 10,
    status: "Interim n=3: 100% local control, 67% CR (May 2026 cutoff)",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/",
    caveat: "n=3 interim — not pivotal proof"
  },
  {
    id: "prostate",
    name: "Prostate pilot",
    indication: "Locally recurrent prostate cancer",
    nct: "NCT07290998",
    nctUrl: "https://clinicaltrials.gov/study/NCT07290998",
    design: "Pilot",
    enrollment: null,
    status: "Early enrollment; Tolmar US commercialization",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-and-tolmar-announce-strategic-collaboration-to-bring-alpha-dart-therapy-to-u-s-urological-cancer-patients/"
  },
  {
    id: "japan",
    name: "Japan approval",
    indication: "Unresectable locally recurrent H&N",
    nct: null,
    design: "Regulatory approval",
    enrollment: null,
    status: "Marketing approval Feb 2026 (first ex-Israel)",
    tag: "verified",
    source: "https://www.alphatau.com/single-post/alpha-tau-announces-full-year-2025-financial-results-and-provides-corporate-update"
  }
];

/** Catalyst windows from company guidance + CT.gov estimates. */
export const CATALYSTS = [
  {
    id: "restart_topline",
    trial: "ReSTART",
    nct: "NCT05323253",
    label: "ReSTART top-line ORR/DOR",
    windowStart: "2026-10-01",
    windowEnd: "2026-12-31",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-issues-letter-to-shareholders-five-concurrent-trials-in-the-u-s-with-multiple-significant-value-driving-milestones-ahead/"
  },
  {
    id: "impact_enroll",
    trial: "IMPACT",
    nct: "NCT06698458",
    label: "IMPACT enrollment complete",
    windowStart: "2026-07-01",
    windowEnd: "2026-09-30",
    tag: "verified",
    source: "https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update"
  },
  {
    id: "impact_data",
    trial: "IMPACT",
    nct: "NCT06698458",
    label: "IMPACT initial safety/feasibility data",
    windowStart: "2026-10-01",
    windowEnd: "2027-03-31",
    tag: "verified",
    source: "https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update"
  },
  {
    id: "regain_data",
    trial: "REGAIN",
    nct: "NCT06910306",
    label: "REGAIN additional feasibility data",
    windowStart: "2026-10-01",
    windowEnd: "2026-12-31",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/"
  },
  {
    id: "japan_commercial",
    trial: "Japan",
    nct: null,
    label: "Japan commercial ramp (timing unverified)",
    windowStart: "2026-04-01",
    windowEnd: "2027-06-30",
    tag: "assumption",
    source: "https://www.alphatau.com/single-post/alpha-tau-announces-full-year-2025-financial-results-and-provides-corporate-update",
    note: "Approval verified; revenue timing not disclosed"
  },
  {
    id: "pma_module",
    trial: "ReSTART",
    nct: "NCT05323253",
    label: "Modular PMA review (module 1 submitted Jan 2026)",
    windowStart: "2026-07-01",
    windowEnd: "2027-12-31",
    tag: "assumption",
    source: "https://alphatau.com/alpha-tau-issues-letter-to-shareholders-five-concurrent-trials-in-the-u-s-with-multiple-significant-value-driving-milestones-ahead/",
    note: "FDA review duration not public"
  }
];

/**
 * Catalysts active in a given calendar year.
 * @param {number} year
 * @returns {Catalyst[]}
 */
export function catalystsInYear(year) {
  const yStart = `${year}-01-01`;
  const yEnd = `${year}-12-31`;
  return CATALYSTS.filter((c) => c.windowStart <= yEnd && c.windowEnd >= yStart);
}

/**
 * Sort catalysts by window start.
 * @param {Catalyst[]} list
 */
export function sortCatalysts(list) {
  return [...list].sort((a, b) => a.windowStart.localeCompare(b.windowStart));
}

/**
 * Pipeline summary metrics from UI state (no invented trial results).
 * @param {{ impactEnroll?: number, regainN?: number, regainLdcPct?: number, japanApproved?: number }} state
 */
export function computePipelineSummary(state = {}) {
  const regainN = state.regainN ?? 10;
  const regainInterimN = 3;
  return {
    usTrials: PIPELINE_TRIALS.filter((t) => t.nct).length,
    regainInterimN,
    regainEnrollCap: regainN,
    regainNote: `Interim n=${regainInterimN} only — do not extrapolate to ${regainN}-pt feasibility`,
    japanApproved: !!state.japanApproved,
    impactTargetN: state.impactEnroll ?? 40
  };
}

/** Community DD claims cross-checked in RESEARCH.md */
export const COMMUNITY_DD = [
  {
    theme: "REGAIN 100% local control = GBM cure",
    verdict: "partial",
    tag: "community",
    note: "Interim n=3; local control ≠ OS; feasibility not pivotal"
  },
  {
    theme: "ReSTART enrollment done → PMA imminent",
    verdict: "partial",
    tag: "community",
    note: "88 pts enrolled verified; top-line ~end 2026; modular PMA in progress"
  },
  {
    theme: "Japan approval = revenue now",
    verdict: "partial",
    tag: "community",
    note: "Approval verified Feb 2026; commercial ramp timing unverified"
  },
  {
    theme: "Pancreatic = de-risked platform",
    verdict: "partial",
    tag: "community",
    note: "IMPACT pilot n=40; pooled FIH ≠ randomized Phase 3"
  },
  {
    theme: "Tolmar deal validates prostate",
    verdict: "verified",
    tag: "verified",
    note: "Commercial terms disclosed; US prostate data early"
  },
  {
    theme: "Cash runway to all readouts",
    verdict: "verified",
    tag: "verified",
    note: "~$77M cash FY2025; burn/dilution risk remains"
  },
  {
    theme: "Alpha works in hypoxic tumors",
    verdict: "verified",
    tag: "verified",
    note: "Preclinical + mechanism; indication-specific clinical advantage TBD"
  },
  {
    theme: "Imminent PMA before ReSTART top-line",
    verdict: "rejected",
    tag: "community",
    note: "Not supported by company timeline"
  }
];
