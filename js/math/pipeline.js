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
    design: "Multi-center pilot (safety primary)",
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
    status: "Interim n=3: 100% local control, 67% CR (May 2026 cutoff); FDA cleared final 7",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-receives-fda-clearance-to-complete-enrollment-in-regain-recurrent-glioblastoma-trial-and-add-two-u-s-clinical-sites-early-interim-results-showed-100-local-disease-control/",
    caveat: "n=3 interim — feasibility not pivotal"
  },
  {
    id: "prostate",
    name: "Prostate pilot",
    indication: "Locally recurrent prostate cancer",
    nct: "NCT07290998",
    nctUrl: "https://clinicaltrials.gov/study/NCT07290998",
    design: "Pilot single-arm (n≈12)",
    enrollment: 12,
    status: "Not yet recruiting; Tolmar US commercialization Jun 2026",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-and-tolmar-announce-strategic-collaboration-to-bring-alpha-dart-therapy-to-u-s-urological-cancer-patients/"
  },
  {
    id: "japan",
    name: "Japan approval",
    indication: "Unresectable locally advanced/recurrent H&N",
    nct: null,
    design: "Shonin marketing approval + PMS n=66",
    enrollment: 66,
    status: "Marketing approval Feb 2026 (first ex-Israel); PMS at 5 centers",
    tag: "verified",
    source: "https://www.alphatau.com/single-post/alpha-tau-medical-receives-japanese-marketing-approval-for-alpha-dart-in-unresectable-locally-advan"
  },
  {
    id: "tolmar",
    name: "Tolmar deal",
    indication: "US prostate (+ bladder option)",
    nct: null,
    design: "Commercial collaboration",
    enrollment: null,
    status: "$20M equity + $15M mfg; up to $161.5M milestones; 60% net sales supply",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-and-tolmar-announce-strategic-collaboration-to-bring-alpha-dart-therapy-to-u-s-urological-cancer-patients/"
  }
];

/** Catalyst windows from company guidance + CT.gov estimates. */
export const CATALYSTS = [
  {
    id: "tolmar_close",
    trial: "Tolmar",
    nct: null,
    label: "Tolmar collaboration close ($20M equity + $15M mfg)",
    windowStart: "2026-06-01",
    windowEnd: "2026-09-30",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-and-tolmar-announce-strategic-collaboration-to-bring-alpha-dart-therapy-to-u-s-urological-cancer-patients/"
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
    id: "pma_complete",
    trial: "ReSTART",
    nct: "NCT05323253",
    label: "Modular PMA submission complete (company guidance)",
    windowStart: "2026-10-01",
    windowEnd: "2026-12-31",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-issues-letter-to-shareholders-five-concurrent-trials-in-the-u-s-with-multiple-significant-value-driving-milestones-ahead/",
    note: "Module 1 submitted Jan 2026; full submission toward year-end per shareholder letter"
  },
  {
    id: "japan_commercial",
    trial: "Japan",
    nct: null,
    label: "Japan commercial ramp (timing unverified)",
    windowStart: "2026-04-01",
    windowEnd: "2027-06-30",
    tag: "assumption",
    source: "https://www.alphatau.com/single-post/alpha-tau-medical-receives-japanese-marketing-approval-for-alpha-dart-in-unresectable-locally-advan",
    note: "Shonin approved Feb 2026; reimbursement timing not disclosed"
  },
  {
    id: "pma_module",
    trial: "ReSTART",
    nct: "NCT05323253",
    label: "Modular PMA FDA review (post top-line)",
    windowStart: "2027-01-01",
    windowEnd: "2028-06-30",
    tag: "assumption",
    source: "https://www.fda.gov/medical-devices/premarket-submissions/modular-premarket-approval-program",
    note: "Review duration not public; Breakthrough Device may shorten clock"
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

/** High-signal retail / community DD themes — cross-checked in RESEARCH.md */
export const COMMUNITY_DD = [
  {
    theme: "REGAIN 100% local control = GBM cure",
    verdict: "partial",
    tag: "community",
    note: "Interim n=3 (May 2026 cutoff); local control ≠ OS; feasibility not pivotal — Jun 2026 FDA clearance PR"
  },
  {
    theme: "ReSTART enrollment done → PMA imminent",
    verdict: "partial",
    tag: "community",
    note: "88 pts enrolled verified May 2026; top-line ~end 2026; modular PMA module 1 Jan 2026 — not approval yet"
  },
  {
    theme: "Japan approval = revenue now",
    verdict: "partial",
    tag: "community",
    note: "Shonin Feb 2026 verified; PMS n=66 required; reimbursement discussions ongoing — no revenue disclosed"
  },
  {
    theme: "Pancreatic = de-risked / huge TAM",
    verdict: "partial",
    tag: "community",
    note: "ASCO 2026 pooled FIH OS encouraging; IMPACT US pilot n=40 safety-primary — not randomized Phase 3"
  },
  {
    theme: "Tolmar deal validates prostate platform",
    verdict: "verified",
    tag: "verified",
    note: "SEC 6-K Jun 2026: $20M equity, $15M mfg, up to $161.5M milestones, 60% net sales supply price"
  },
  {
    theme: "Five US trials = fully derisked",
    verdict: "partial",
    tag: "community",
    note: "Five concurrent IDEs verified; separate PMA path and data bar per indication"
  },
  {
    theme: "Cash runway covers all readouts",
    verdict: "verified",
    tag: "verified",
    note: "$80.2M liquidity Mar 2026; ~$10.6M/qtr burn — runway ~7 qtr before Tolmar/milestone inflows; dilution risk remains"
  },
  {
    theme: "Alpha works in hypoxic tumors (oxygen-independent)",
    verdict: "verified",
    tag: "verified",
    note: "Keisari 2007 preclinical + mechanism; clinical advantage indication-specific"
  },
  {
    theme: "Modular PMA = approval before ReSTART top-line",
    verdict: "rejected",
    tag: "community",
    note: "Module 1 submitted Jan 2026; company expects full submission toward year-end after data maturation"
  },
  {
    theme: "$15+ price targets (Barclays, Reddit)",
    verdict: "partial",
    tag: "community",
    note: "Barclays OW $15 PT May 28 2026 verified as analyst opinion — not company guidance; retail PT posts unverified"
  },
  {
    theme: "Abscopal / systemic immune effect proven",
    verdict: "rejected",
    tag: "community",
    note: "Case reports + preclinical only; H&N + pembrolizumab IDE early — not validated in pivotal data"
  },
  {
    theme: "ReSTART ORR will match FIH 78.6% CR",
    verdict: "rejected",
    tag: "community",
    note: "FIH n=28 lesions, different population/endpoints vs pivotal n=88 recurrent cSCC — PubMed 31759075"
  },
  {
    theme: "ASCO pancreatic OS = IMPACT de-risked",
    verdict: "partial",
    tag: "community",
    note: "Pooled 3 Phase I/II studies (Jun 2026 PR); IMPACT primary = SAE rate, not OS"
  },
  {
    theme: "Radiopharm M&A takeout imminent",
    verdict: "partial",
    tag: "community",
    note: "Sector M&A active (Novartis, Bayer, etc.); no disclosed DRTS process — r/DRTS_Stock speculation"
  },
  {
    theme: "100% pancreatic local control (DDW 2026)",
    verdict: "partial",
    tag: "community",
    note: "Company-reported pooled evaluable patients at DDW 2026 — peer-reviewed publication pending; not IMPACT US data"
  }
];

/** Bear-case claims from shorts, skeptics, and filing risk factors — verified where possible */
export const BEAR_CASE = [
  {
    theme: "Pre-revenue / widening losses → dilution",
    verdict: "verified",
    tag: "verified",
    note: "FY2025 net loss $42.6M; Q1 2026 $22.9M; F-3 shelf $300M + $100M ATM filed Apr 2026 — flexibility ≠ immediate dilution"
  },
  {
    theme: "Single-arm PMA may fail FDA historical-control bar",
    verdict: "partial",
    tag: "community",
    note: "ReSTART has no concurrent control; FDA device guidance flags historical-control bias; Breakthrough + modular PMA mitigate but do not eliminate"
  },
  {
    theme: "ReSTART ORR below PD-1 benchmarks (cemiplimab 47%)",
    verdict: "partial",
    tag: "community",
    note: "Device pivotal vs drug labels — different endpoints/populations; bear case if ORR ~35–40% with weak DOR"
  },
  {
    theme: "Manufacturing / Ra-224 supply scale-up risk",
    verdict: "partial",
    tag: "community",
    note: "NH facility expansion + Tolmar $15M mfg investment; 20-F cites supply chain; no public failure disclosed"
  },
  {
    theme: "Israel HQ / geopolitical overhang",
    verdict: "partial",
    tag: "community",
    note: "Jerusalem HQ; US subsidiary Lawrence MA; bears cite regional risk — no disclosed operational disruption in 2025–2026 filings"
  },
  {
    theme: "Japan revenue slower than bulls expect",
    verdict: "partial",
    tag: "community",
    note: "PMS n=66 + reimbursement TBD; HekaBio partner — approval verified, commercial ramp timing unverified"
  },
  {
    theme: "REGAIN n=3 regression to mean in remaining 7 pts",
    verdict: "verified",
    tag: "verified",
    note: "Feasibility n≤10; interim not predictive; GBM rORR with systemic therapy often single digits per CMO May 2026 PR"
  },
  {
    theme: "Competing alpha / RT modalities",
    verdict: "partial",
    tag: "community",
    note: "Systemic alpha (Bayer Xofigo, Actinium, Telix) vs intratumoral DaRT — different delivery; EBRT/brachytherapy incumbents (Varian, Elekta)"
  },
  {
    theme: "Warrant / SPAC overhang (DRTSW)",
    verdict: "partial",
    tag: "verified",
    note: "Q1 2026 financial expense $9.6M from warrant remeasurement; legacy SPAC structure in 20-F"
  },
  {
    theme: "Insider selling into catalysts",
    verdict: "partial",
    tag: "community",
    note: "Jun 2026 Form 4 sales reported (e.g. Levy ~$352K per newswire); routine vs bearish signal debatable"
  }
];

/** Reddit / forum threads cited in diligence (archival availability varies) */
export const COMMUNITY_THREADS = [
  {
    label: "r/DRTS_Stock hub",
    url: "https://www.reddit.com/r/DRTS_Stock/",
    author: "community",
    note: "Primary ticker subreddit per Merlintrader Jan 2026; active Jul 2026 (AltIndex Reddit mentions +165% day)"
  },
  {
    label: "Merlintrader — retail DD synthesis",
    url: "https://merlintrader.substack.com/p/alpha-tau-medical-drts-from-under",
    author: "Merlintrader",
    note: "Documents r/DRTS_Stock growth, ReSTART/PMA/pancreatic debate themes"
  },
  {
    label: "Merlintrader stock hub (timeline + bear/bull)",
    url: "https://www.merlintrader.com/alpha-tau-stock-hub/",
    author: "Merlintrader, Jane, Gemini",
    note: "F-3 dilution, REGAIN interim, Japan approval — sourced timeline"
  },
  {
    label: "Stocktwits — REGAIN catalyst day",
    url: "https://stocktwits.com/news-articles/markets/equity/drts-stock-rises-early-us-brain-cancer-trial-results-today/cZX9xaTReWl",
    author: "retail (anonymous)",
    note: "Bull: '100% control in pancreatic and skin'; bear caution on n=3 GBM sample"
  },
  {
    label: "InvestorsHub DRTS board",
    url: "https://investorshub.advfn.com/Alpha-Tau-Medical-Ltd-DRTS-40950",
    author: "IHUB members",
    note: "REGAIN FDA 30-day response window discussion May–Jun 2026"
  },
  {
    label: "r/pennystocks catalyst calendar",
    url: "https://www.reddit.com/r/pennystocks/comments/1i0q961/upcoming_penny_stock_catalysts_calendar_for/",
    author: "Avish_Golakiya",
    note: "Lists DRTS among biotech catalyst watchlists"
  },
  {
    label: "Seeking Alpha bull framing",
    url: "https://seekingalpha.com/article/4885167-alpha-tau-medical-stock-2026-breakthrough-year",
    author: "SA contributor",
    note: "Acknowledges dilution risk + ~5–6 qtr runway; platform/M&A angle"
  }
];
