import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRestartMetrics,
  mcRestartORR,
  CSCC_BENCHMARKS,
  estimateReadoutMonths,
  pmaTimelineMonths,
  DEFAULT_ORR_THRESHOLD_PCT
} from "../js/math/restart.js";

test("computeRestartMetrics golden base case n=88 ORR 55%", () => {
  const m = computeRestartMetrics({
    n: 88,
    orrPct: 55,
    benchOrrPct: 30,
    dorMonths: 6,
    dorBenchMonths: 6,
    orrThresholdPct: 35,
    pSuccess: 65
  });
  assert.equal(m.responders, 48);
  assert.ok(Math.abs(m.wilson.lo - 0.44169880685506685) < 1e-9);
  assert.ok(Math.abs(m.pBeatBench - 0.9999985862794732) < 1e-6);
  assert.ok(Math.abs(m.pCombined - 0.869999183576396) < 1e-6);
});

test("mcRestartORR golden seed=42 sims=1500", () => {
  const mc = mcRestartORR(
    { n: 88, orrPct: 55, benchOrrPct: 30, orrThresholdPct: 35, sims: 1500, seed: 42 },
    undefined
  );
  assert.ok(Math.abs(mc.pSuccess - 0.9553333333333334) < 1e-10);
  assert.ok(Math.abs(mc.orrMedian - 54.54545454545454) < 1e-10);
});

test("computeRestartMetrics Wilson CI brackets observed ORR", () => {
  const m = computeRestartMetrics({ n: 88, orrPct: 55, benchOrrPct: 30, dorMonths: 6, pSuccess: 65 });
  assert.equal(m.responders, 48);
  assert.ok(m.wilson.lo < 0.55 && m.wilson.hi > 0.55);
});

test("higher ORR increases P(beat benchmark)", () => {
  const low = computeRestartMetrics({ n: 88, orrPct: 40, benchOrrPct: 30, dorMonths: 6 });
  const high = computeRestartMetrics({ n: 88, orrPct: 65, benchOrrPct: 30, dorMonths: 6 });
  assert.ok(high.pBeatBench > low.pBeatBench);
});

test("DOR pass when months >= benchmark", () => {
  assert.equal(computeRestartMetrics({ n: 88, orrPct: 50, benchOrrPct: 30, dorMonths: 6, dorBenchMonths: 6 }).dorPass, true);
  assert.equal(computeRestartMetrics({ n: 88, orrPct: 50, benchOrrPct: 30, dorMonths: 4, dorBenchMonths: 6 }).dorPass, false);
});

test("mcRestartORR returns valid histogram", () => {
  const mc = mcRestartORR({ n: 88, orrPct: 55, benchOrrPct: 30, sims: 500, seed: 1 });
  assert.equal(mc.histogram.length, 20);
  assert.ok(mc.pSuccess >= 0 && mc.pSuccess <= 1);
  assert.ok(mc.orrMedian > 0);
});

test("mcRestartORR seeded is reproducible", () => {
  const a = mcRestartORR({ n: 88, orrPct: 55, benchOrrPct: 30, sims: 200, seed: 99 });
  const b = mcRestartORR({ n: 88, orrPct: 55, benchOrrPct: 30, sims: 200, seed: 99 });
  assert.equal(a.pSuccess, b.pSuccess);
});

test("bull ORR preset beats bear in MC success rate", () => {
  const bull = mcRestartORR({ n: 88, orrPct: 65, benchOrrPct: 28, sims: 800, seed: 7 });
  const bear = mcRestartORR({ n: 88, orrPct: 42, benchOrrPct: 32, sims: 800, seed: 7 });
  assert.ok(bull.pSuccess > bear.pSuccess);
});

test("CSCC benchmarks include cemiplimab and pembrolizumab", () => {
  assert.ok(CSCC_BENCHMARKS.some((b) => b.id === "cemiplimab_met"));
  assert.ok(CSCC_BENCHMARKS.some((b) => b.orrPct >= 26 && b.orrPct <= 47));
});

test("estimateReadoutMonths Dec 2026 from May 2026", () => {
  assert.equal(estimateReadoutMonths(5, 2026, 12, 2026), 7);
});

test("pmaTimelineMonths increases with remaining modules", () => {
  assert.ok(pmaTimelineMonths(1, 3) < pmaTimelineMonths(0, 3));
});

test("DEFAULT_ORR_THRESHOLD_PCT is 35", () => {
  assert.equal(DEFAULT_ORR_THRESHOLD_PCT, 35);
});
