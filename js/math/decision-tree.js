/**
 * Regulatory + commercial decision tree for ReSTART skin path.
 * MC feeds topline pass rate only; FDA/PMA and commercial ramp are tree-owned.
 */

import { computeFullValuation, peakSalesM } from "./valuation.js";
import { evPerShare } from "./device.js";

/** Primary sources for FDA modular PMA and single-arm bias. */
export const FDA_SOURCES = [
  {
    id: "modular_pma",
    label: "FDA modular PMA program",
    url: "https://www.fda.gov/medical-devices/premarket-submissions/modular-premarket-approval-program",
    tag: "verified"
  },
  {
    id: "single_arm_bias",
    label: "FDA pivotal device design — single-arm / historical-control caveats",
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-pivotal-clinical-investigations-medical-devices",
    tag: "verified"
  },
  {
    id: "breakthrough",
    label: "FDA Breakthrough Devices program",
    url: "https://www.fda.gov/medical-devices/how-study-and-market-your-device/breakthrough-devices-program",
    tag: "verified"
  }
];

/** Penetration multipliers vs base slider for commercial ramp branches. */
export const COMMERCIAL_PEN_MULT = { fast: 1.4, base: 1.0, slow: 0.6 };

/** Skin P(success) on defer-more-data branch (partial de-risk only). */
export const DEFER_SKIN_PS = 0.2;

/** F-3 / 20-F ordinary-share anchor (M) — fast-approve paths. */
export const BRANCH_SHARES_BASE_M = 88;
/** Dilution stress when trial fails or FDA rejects (F-3 + ATM scenario). */
export const BRANCH_SHARES_FAIL_M = 100;
export const BRANCH_SHARES_REJECT_M = 110;

/**
 * Per-path share count (M) when branch dilution auto is on.
 * Fail / reject / defer → higher stress; accept + fast ramp → base filing count.
 * @param {string} pathId
 */
export function branchSharesM(pathId) {
  if (pathId === "topline_fail") return BRANCH_SHARES_FAIL_M;
  if (pathId === "fda_reject") return BRANCH_SHARES_REJECT_M;
  if (pathId.startsWith("defer_")) return BRANCH_SHARES_FAIL_M;
  if (pathId.startsWith("accept_")) return BRANCH_SHARES_BASE_M;
  return BRANCH_SHARES_BASE_M;
}

/** Normalize three branch weights to probabilities summing to 1. */
export function normalizeBranchWeights(a, b, c) {
  const sum = Math.max(1e-9, a + b + c);
  return { p0: a / sum, p1: b / sum, p2: c / sum };
}

/**
 * 🔬 Optional correlated branch priors: higher MC topline pass nudges P(accept) up, P(reject) down.
 * Commercial fast-ramp weight scales with accept probability.
 * Linear map documented in Explain tab — default OFF preserves manual sliders.
 * @param {number} toplinePass — 0–1
 * @param {{ p0: number, p1: number, p2: number }} fda — accept / defer / reject
 * @param {{ p0: number, p1: number, p2: number }} comm — fast / base / slow
 * @param {boolean} [link=false]
 */
export function applyCorrelatedBranchPriors(toplinePass, fda, comm, link = false) {
  if (!link) return { fda, comm, linked: false };
  const t = Math.max(0, Math.min(1, toplinePass ?? 0.5));
  const fdaRaw = normalizeBranchWeights(
    fda.p0 * (0.7 + 0.3 * t),
    fda.p1,
    fda.p2 * (1.3 - 0.3 * t)
  );
  const commRaw = normalizeBranchWeights(
    comm.p0 * (0.5 + 0.5 * fdaRaw.p0),
    comm.p1,
    comm.p2
  );
  return { fda: fdaRaw, comm: commRaw, linked: true, toplinePass: t };
}

/**
 * Full valuation for one tree leaf: adjust skin peak via pen mult and skin P(s).
 * @param {object} val — base valuation state
 * @param {{ penMult?: number, skinPs?: number, riskAdj?: boolean }} leaf
 */
export function valuationForLeaf(val, leaf) {
  const v = { ...val };
  const penMult = leaf.penMult ?? 1;
  const skinPs = leaf.skinPs ?? (v.v_riskadj ? v.v_skinPs : 1);
  v.v_skinPen = Math.min(0.95, (v.v_skinPen ?? 0.15) * penMult);
  if (v.v_riskadj) v.v_skinPs = skinPs;
  return computeFullValuation(v);
}

/**
 * Regulatory decision tree: topline (MC) → FDA/PMA → commercial ramp.
 * @param {object} p
 * @param {number} p.toplinePassRate — MC co-primary P(success), 0–1
 * @param {object} p.val — valuation state (skin pen/P(s)/mult/shares/cash)
 * @param {number} [p.pAcceptModularPct] — FDA accept modular PMA (conditional on pass)
 * @param {number} [p.pDeferDataPct]
 * @param {number} [p.pRejectPct]
 * @param {number} [p.pCommFastPct] — commercial ramp (conditional on approval paths)
 * @param {number} [p.pCommBasePct]
 * @param {number} [p.pCommSlowPct]
 * @param {boolean} [p.branchDilution=true] — auto per-path share stress (F-3/ATM)
 * @param {boolean} [p.linkFdaToTopline=false] — 🔬 correlated FDA/commercial priors
 */
export function computeDecisionTree(p) {
  const toplinePass = Math.max(0, Math.min(1, p.toplinePassRate ?? 0.5));
  const toplineFail = 1 - toplinePass;

  const fdaBase = normalizeBranchWeights(
    p.pAcceptModularPct ?? 65,
    p.pDeferDataPct ?? 25,
    p.pRejectPct ?? 10
  );
  const commBase = normalizeBranchWeights(
    p.pCommFastPct ?? 25,
    p.pCommBasePct ?? 50,
    p.pCommSlowPct ?? 25
  );
  const correlated = applyCorrelatedBranchPriors(
    toplinePass,
    fdaBase,
    commBase,
    !!p.linkFdaToTopline
  );
  const fda = correlated.fda;
  const comm = correlated.comm;

  const val = p.val;
  const riskAdj = !!val.v_riskadj;
  const baseShares = val.v_shares ?? BRANCH_SHARES_BASE_M;
  const cash = val.v_cash ?? 0;
  const branchDilution = p.branchDilution !== false;

  /** @type {Array<{ id: string, label: string, prob: number, ev: number, perSh: number, sharesM: number, tag?: string }>} */
  const paths = [];

  function pushPath(row) {
    const sharesM = branchDilution ? branchSharesM(row.id) : baseShares;
    paths.push({
      ...row,
      sharesM,
      perSh: evPerShare(row.ev, sharesM, cash)
    });
  }

  // Topline fail — skin path dead; keep non-skin + platform at base assumptions
  const failLeaf = valuationForLeaf(val, { penMult: 1, skinPs: riskAdj ? 0.05 : 0 });
  pushPath({
    id: "topline_fail",
    label: "Topline fail (ORR+DOR)",
    prob: toplineFail,
    ev: failLeaf.ev,
    tag: "mc"
  });

  const commBranches = [
    { id: "fast", label: "Fast ramp", mult: COMMERCIAL_PEN_MULT.fast, p: comm.p0 },
    { id: "base", label: "Base ramp", mult: COMMERCIAL_PEN_MULT.base, p: comm.p1 },
    { id: "slow", label: "Slow ramp", mult: COMMERCIAL_PEN_MULT.slow, p: comm.p2 }
  ];

  // FDA reject — no US skin approval
  const rejectLeaf = valuationForLeaf(val, { penMult: 1, skinPs: riskAdj ? 0 : 0 });
  pushPath({
    id: "fda_reject",
    label: "Pass → FDA reject",
    prob: toplinePass * fda.p2,
    ev: rejectLeaf.ev,
    tag: "fda"
  });

  // FDA defer — partial skin de-risk
  for (const cb of commBranches) {
    const leaf = valuationForLeaf(val, {
      penMult: cb.mult * 0.5,
      skinPs: riskAdj ? DEFER_SKIN_PS : 0.5
    });
    pushPath({
      id: `defer_${cb.id}`,
      label: `Pass → Defer data → ${cb.label}`,
      prob: toplinePass * fda.p1 * cb.p,
      ev: leaf.ev,
      tag: "fda"
    });
  }

  // FDA accept modular PMA — full approval path
  for (const cb of commBranches) {
    const leaf = valuationForLeaf(val, {
      penMult: cb.mult,
      skinPs: riskAdj ? 1 : 1
    });
    pushPath({
      id: `accept_${cb.id}`,
      label: `Pass → Accept modular PMA → ${cb.label}`,
      prob: toplinePass * fda.p0 * cb.p,
      ev: leaf.ev,
      tag: "fda"
    });
  }

  const probSum = paths.reduce((s, x) => s + x.prob, 0);
  const weightedEv = paths.reduce((s, x) => s + x.prob * x.ev, 0);
  const weightedPerSh = paths.reduce((s, x) => s + x.prob * x.perSh, 0);

  return {
    toplinePass,
    toplineFail,
    fda,
    comm,
    fdaBase,
    commBase,
    correlatedPriors: correlated.linked,
    branchDilution,
    baseShares,
    paths,
    probSum,
    weightedEv,
    weightedPerSh,
    sources: FDA_SOURCES
  };
}
