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
 */
export function peakSalesM({ patients, penetration, price, years }) {
  return patients * penetration * price * years;
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

/** Re-export for backward compatibility. */
export { riskAdjustedEV, evPerShare };
