import test from "node:test";
import assert from "node:assert/strict";
import {
  computeDecisionTree,
  normalizeBranchWeights,
  valuationForLeaf,
  FDA_SOURCES,
  COMMERCIAL_PEN_MULT
} from "../js/math/decision-tree.js";
import { DEFAULT_STATE } from "../js/ui/state.js";
import { mcRestartORR } from "../js/math/restart.js";

const MC = mcRestartORR({
  n: 88,
  orrPct: 55,
  benchOrrPct: 30,
  sims: 1500,
  seed: 42
});

test("normalizeBranchWeights sums to 1", () => {
  const w = normalizeBranchWeights(65, 25, 10);
  assert.ok(Math.abs(w.p0 + w.p1 + w.p2 - 1) < 1e-9);
  assert.ok(Math.abs(w.p0 - 0.65) < 1e-9);
});

test("FDA_SOURCES includes modular PMA and single-arm guidance", () => {
  assert.ok(FDA_SOURCES.some((s) => s.id === "modular_pma"));
  assert.ok(FDA_SOURCES.some((s) => s.id === "single_arm_bias"));
});

test("decision tree path probabilities sum to ~1", () => {
  const tree = computeDecisionTree({
    toplinePassRate: MC.pSuccess,
    val: DEFAULT_STATE.val
  });
  assert.ok(Math.abs(tree.probSum - 1) < 0.02);
  assert.ok(tree.paths.length >= 8);
});

test("topline fail path has lower $/sh than accept fast path", () => {
  const tree = computeDecisionTree({
    toplinePassRate: 0.95,
    val: DEFAULT_STATE.val,
    pAcceptModularPct: 70,
    pDeferDataPct: 20,
    pRejectPct: 10,
    pCommFastPct: 30,
    pCommBasePct: 50,
    pCommSlowPct: 20
  });
  const fail = tree.paths.find((p) => p.id === "topline_fail");
  const acceptFast = tree.paths.find((p) => p.id === "accept_fast");
  assert.ok(fail && acceptFast);
  assert.ok(acceptFast.perSh > fail.perSh);
});

test("commercial fast ramp raises skin EV vs slow on accept path", () => {
  const fast = valuationForLeaf(DEFAULT_STATE.val, { penMult: COMMERCIAL_PEN_MULT.fast, skinPs: 1 });
  const slow = valuationForLeaf(DEFAULT_STATE.val, { penMult: COMMERCIAL_PEN_MULT.slow, skinPs: 1 });
  assert.ok(fast.ev > slow.ev);
});

test("weighted tree EV equals sum P(path) x EV(path)", () => {
  const tree = computeDecisionTree({
    toplinePassRate: MC.pSuccess,
    val: DEFAULT_STATE.val
  });
  const manualEv = tree.paths.reduce((s, p) => s + p.prob * p.ev, 0);
  assert.ok(Math.abs(tree.weightedEv - manualEv) < 0.05);
});

test("weighted tree $/sh equals probability-weighted path $/sh", () => {
  const tree = computeDecisionTree({
    toplinePassRate: 0.9,
    val: DEFAULT_STATE.val
  });
  const manualPsh = tree.paths.reduce((s, p) => s + p.prob * p.perSh, 0);
  assert.ok(Math.abs(tree.weightedPerSh - manualPsh) < 0.05);
});

test("path probabilities sum to exactly 1", () => {
  const tree = computeDecisionTree({
    toplinePassRate: MC.pSuccess,
    val: DEFAULT_STATE.val,
    pAcceptModularPct: 65,
    pDeferDataPct: 25,
    pRejectPct: 10,
    pCommFastPct: 25,
    pCommBasePct: 50,
    pCommSlowPct: 25
  });
  assert.ok(Math.abs(tree.probSum - 1) < 1e-9);
});

test("MC topline pass feeds tree root", () => {
  const tree = computeDecisionTree({
    toplinePassRate: MC.pSuccess,
    val: DEFAULT_STATE.val
  });
  assert.ok(Math.abs(tree.toplinePass - MC.pSuccess) < 1e-9);
  const fail = tree.paths.find((p) => p.id === "topline_fail");
  assert.ok(Math.abs(fail.prob - (1 - MC.pSuccess)) < 1e-9);
});

test("weighted tree EV is between min and max path EV", () => {
  const tree = computeDecisionTree({
    toplinePassRate: 0.9,
    val: DEFAULT_STATE.val
  });
  const evs = tree.paths.map((p) => p.ev);
  assert.ok(tree.weightedEv >= Math.min(...evs) - 1);
  assert.ok(tree.weightedEv <= Math.max(...evs) + 1);
});
