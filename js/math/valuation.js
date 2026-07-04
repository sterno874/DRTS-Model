/**
 * Risk-adjusted peak-sales valuation for Alpha DaRT indications.
 */

import { riskAdjustedEV, evPerShare } from "./device.js";

/** Device/oncology comparables (public deal benchmarks — not DRTS-specific). */
export const COMPARABLES = [
  {
    name: "Varian (radiation oncology)",
    evMultiple: "8–12× sales (historical)",
    note: "Large installed base; not intratumoral alpha",
    tag: "assumption"
  },
  {
    name: "Novocure Optune (device)",
    evMultiple: "~4–6× peak revenue at maturity",
    note: "Recurrent GBM device precedent",
    tag: "assumption"
  },
  {
    name: "Tolmar supply deal (DRTS)",
    evMultiple: "60% of net sales to Alpha Tau",
    note: "Prostate/bladder US — verified PR Jun 2026",
    tag: "verified",
    source: "https://alphatau.com/alpha-tau-and-tolmar-announce-strategic-collaboration-to-bring-alpha-dart-therapy-to-u-s-urological-cancer-patients/"
  }
];

/**
 * Peak annual revenue for one indication ($M).
 * @param {number} patients — eligible patients per year (absolute count)
 * @param {number} penetration — share treated (decimal, e.g. 0.15)
 * @param {number} price — procedure price in $K
 * @param {number} years — avg years on therapy (treatment-duration intensity)
 */
export function peakSalesM({ patients, penetration, price, years }) {
  return (patients * penetration * years * price) / 1000;
}

/**
 * Full valuation from val state object.
 * @param {object} val — keys v_skinPts, v_skinPen, etc.
 */
export function computeFullValuation(val) {
  const risk = !!val.v_riskadj;
  const mult = val.v_mult ?? 4;

  const indications = [
    {
      id: "skin",
      label: "Recurrent cSCC (ReSTART)",
      patients: val.v_skinPts,
      penetration: val.v_skinPen,
      price: val.v_skinPrice,
      years: val.v_skinYears ?? 5,
      pSuccess: risk ? val.v_skinPs : 1
    },
    {
      id: "gbm",
      label: "Recurrent GBM (REGAIN path)",
      patients: val.v_gbmPts,
      penetration: val.v_gbmPen,
      price: val.v_gbmPrice,
      years: val.v_gbmYears ?? 4,
      pSuccess: risk ? val.v_gbmPs : 1
    },
    {
      id: "panc",
      label: "Pancreatic (IMPACT path)",
      patients: val.v_pancPts,
      penetration: val.v_pancPen,
      price: val.v_pancPrice,
      years: val.v_pancYears ?? 6,
      pSuccess: risk ? val.v_pancPs : 1
    },
    {
      id: "prostate",
      label: "Prostate (Tolmar)",
      patients: val.v_prostatePts ?? 15000,
      penetration: val.v_prostatePen ?? 0.06,
      price: val.v_prostatePrice ?? 80,
      years: val.v_prostateYears ?? 5,
      pSuccess: risk ? (val.v_prostatePs ?? 0.2) : 1,
      supplyShare: 0.6
    },
    {
      id: "japan",
      label: "Japan H&N (Shonin)",
      patients: val.v_japanPts ?? 4000,
      penetration: val.v_japanPen ?? 0.08,
      price: val.v_japanPrice ?? 70,
      years: val.v_japanYears ?? 1,
      pSuccess: risk ? (val.v_japanPs ?? 0.5) : 1
    }
  ];

  const rows = indications.map((ind) => {
    let peak = peakSalesM(ind);
    if (ind.supplyShare) peak *= ind.supplyShare;
    const riskAdjPeak = peak * ind.pSuccess;
    const evContrib = riskAdjPeak * mult;
    return { ...ind, peak, riskAdjPeak, evContrib };
  });

  const platform = val.v_platform ?? 0;
  const ev = rows.reduce((s, r) => s + r.evContrib, 0) + platform;
  const perSh = evPerShare(ev, val.v_shares, val.v_cash);
  const totalPeak = rows.reduce((s, r) => s + r.riskAdjPeak, 0);

  return { ev, perSh, rows, platform, totalPeak, mult };
}

/**
 * Cash runway (months) from cash balance and quarterly cash burn.
 * Uses cash burn (CFO / cash management), not GAAP net loss or operating loss.
 * @param {number} cashM — cash & equivalents ($M)
 * @param {number} burnQuarterlyM — quarterly cash burn ($M, positive = outflow)
 */
export function computeRunwayMonths(cashM, burnQuarterlyM) {
  if (burnQuarterlyM <= 0) return Infinity;
  return (cashM / burnQuarterlyM) * 3;
}

/** FY2025 filing cash anchor for prior bands (UI default cash is Q1 2026 $80.2M). */
export const DEFAULT_CASH_M = 76.9;
/** Q1 2026 cash, cash equivalents, short-term + restricted deposits ($M). */
export const Q1_2026_CASH_M = 80.2;
/**
 * Default quarterly cash burn ($M) for runway math.
 * Midpoint of CFO commentary (~$5–6M+/qtr historically, ramping with trials; ~$25M/yr).
 * Not GAAP operating loss ($13.3M Q1) or net loss ($22.9M incl. warrants).
 */
export const DEFAULT_BURN_QUARTERLY_M = 6.5;
/** Q1 2026 GAAP figures ($M) — P&L context only; not runway inputs. */
export const GAAP_OP_LOSS_Q1_2026_M = 13.3;
export const WARRANT_REMEASURE_Q1_2026_M = 9.6;
export const NET_LOSS_Q1_2026_M = 22.9;
export const RUNWAY_SOURCE =
  "https://www.alphatau.com/single-post/alpha-tau-announces-first-quarter-2026-financial-results-and-provides-corporate-update";
export const Q1_2026_6K_EXHIBIT =
  "https://www.sec.gov/Archives/edgar/data/1871321/000121390026058424/ea029058401ex99-1.htm";
/** CFO Rafi Levy interview — cash burn commentary (company-reported, not audited cash-flow statement). */
export const CFO_BURN_INTERVIEW = "https://youtu.be/Jyryv-152hc";

/** Re-export for backward compatibility. */
export { riskAdjustedEV, evPerShare };
