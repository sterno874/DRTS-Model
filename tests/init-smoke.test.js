import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_STATE,
  paramsFromPreset,
  paramsFromValPreset,
  paramsFromDtPreset,
  valuationInputsForState,
  restartPresetMatches,
  valPresetMatches,
  dtPresetMatches
} from "../js/ui/state.js";
import { computeRestartMetrics, mcRestartORR } from "../js/math/restart.js";
import { computeDecisionTree } from "../js/math/decision-tree.js";
import { computeFullValuation } from "../js/math/valuation.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainJs = readFileSync(path.join(root, "js/main.js"), "utf8");

test("main.js imports valuationInputsForState (init runtime fix)", () => {
  assert.match(mainJs, /valuationInputsForState/);
  assert.match(mainJs, /import[\s\S]*valuationInputsForState[\s\S]*from "\.\/ui\/state\.js"/);
});

test("init simulation path: restart metrics populate (not em-dash)", () => {
  const m = computeRestartMetrics(DEFAULT_STATE.restart);
  assert.ok(m.responders > 0);
  assert.ok(m.wilson.lo > 0 && m.wilson.hi <= 1);
  assert.ok(Number.isFinite(m.pBeatBench));
});

test("init simulation path: MC and decision tree outputs populate", () => {
  const r = DEFAULT_STATE.restart;
  const mc = mcRestartORR(
    {
      n: r.n,
      orrPct: r.orrPct,
      benchOrrPct: r.benchOrrPct,
      orrThresholdPct: r.orrThresholdPct,
      dorDurablePct: r.dorDurablePct,
      dorMinFracPct: r.dorMinFracPct,
      sims: 200,
      seed: 42
    },
    undefined
  );
  assert.ok(mc.pSuccess > 0 && mc.pSuccess <= 1);
  assert.ok(mc.histogram.some((c) => c > 0));

  const val = valuationInputsForState(DEFAULT_STATE, mc.pSuccess);
  const tree = computeDecisionTree({
    toplinePassRate: mc.pSuccess,
    val,
    pAcceptModularPct: r.dtAcceptModular,
    pDeferDataPct: r.dtDeferData,
    pRejectPct: r.dtReject,
    pCommFastPct: r.dtCommFast,
    pCommBasePct: r.dtCommBase,
    pCommSlowPct: r.dtCommSlow,
    branchDilution: true,
    linkFdaToTopline: false
  });
  assert.ok(tree.paths.length > 0);
  assert.ok(tree.weightedEv > 0);
  assert.ok(tree.weightedPerSh > 0);
  assert.ok(Math.abs(tree.probSum - 1) < 0.001);
});

test("init simulation path: valuation outputs populate", () => {
  const val = valuationInputsForState(DEFAULT_STATE, 0.72);
  const v = computeFullValuation(val);
  assert.ok(v.ev > 0);
  assert.ok(v.perSh > 0);
  assert.ok(v.rows.length >= 4);
});

test("preset click applies restart values and matches highlight logic", () => {
  const s = structuredClone(DEFAULT_STATE);
  Object.assign(s.restart, paramsFromPreset("commercial"));
  s.activeRestartPreset = "commercial";
  assert.ok(restartPresetMatches("commercial", s.restart));
  assert.ok(s.restart.orrPct > paramsFromPreset("bear").orrPct);
});

test("preset click applies valuation values", () => {
  const s = structuredClone(DEFAULT_STATE);
  Object.assign(s.val, paramsFromValPreset("prePma"));
  assert.equal(s.val.v_shares, 110);
  assert.ok(valPresetMatches("prePma", s.val));
  const modular = paramsFromValPreset("modularBase");
  assert.equal(modular.v_linkSkinPs, true);
});

test("decision tree preset applies branch weights", () => {
  const s = structuredClone(DEFAULT_STATE);
  Object.assign(s.restart, paramsFromDtPreset("skeptical"));
  assert.ok(dtPresetMatches("skeptical", s.restart));
  assert.ok(s.restart.dtReject > paramsFromDtPreset("base").dtReject);
});

test("node --check main.js passes", () => {
  execSync("node --check js/main.js", { cwd: root, stdio: "pipe" });
});
