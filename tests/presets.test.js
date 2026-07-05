import test from "node:test";
import assert from "node:assert/strict";
import { SHARE_PRESETS, VAL_PRESETS, paramsFromPreset, paramsFromValPreset, restartPresetMatches, valPresetMatches, DEFAULT_STATE } from "../js/ui/state.js";
import { computeRestartMetrics } from "../js/math/restart.js";

for (const name of Object.keys(SHARE_PRESETS)) {
  test(`restart preset "${name}" produces metrics`, () => {
    const p = paramsFromPreset(name);
    assert.ok(p);
    const m = computeRestartMetrics(p);
    assert.ok(m.pBeatBench >= 0 && m.pBeatBench <= 1);
  });
}

test("bull preset ORR exceeds bear", () => {
  const bull = paramsFromPreset("bull");
  const bear = paramsFromPreset("bear");
  assert.ok(bull.orrPct > bear.orrPct);
});

test("stress preset ORR at threshold", () => {
  const s = paramsFromPreset("stress");
  assert.equal(s.orrPct, 35);
});

test("VAL_PRESETS has base bull bear", () => {
  assert.ok(VAL_PRESETS.base && VAL_PRESETS.bull && VAL_PRESETS.bear);
});

test("bull preset is Commercial bull (ops) with platform ≤$8M", () => {
  assert.match(VAL_PRESETS.bull.label, /Commercial bull \(ops\)/);
  assert.ok(VAL_PRESETS.bull.v_platform <= 8);
});

test("best preset exists for FIH-adjacent scenario", () => {
  assert.ok(SHARE_PRESETS.best);
  assert.ok(SHARE_PRESETS.best.orrPct >= 55);
});

test("paramsFromValPreset resets unstated fields to defaults", () => {
  const immune = paramsFromValPreset("immune");
  assert.equal(immune.v_platformImmune, 2);
  const base = paramsFromValPreset("base");
  assert.equal(base.v_platformImmune, 0);
  assert.equal(base.v_platform, 3);
});

test("val preset immune then base clears platformImmune", () => {
  const s = structuredClone(DEFAULT_STATE);
  Object.assign(s.val, paramsFromValPreset("immune"));
  assert.equal(s.val.v_platformImmune, 2);
  Object.assign(s.val, paramsFromValPreset("base"));
  assert.equal(s.val.v_platformImmune, 0);
});

test("restartPresetMatches detects bull ORR", () => {
  const s = structuredClone(DEFAULT_STATE);
  Object.assign(s.restart, paramsFromPreset("bull"));
  assert.ok(restartPresetMatches("bull", s.restart));
  assert.ok(!restartPresetMatches("bear", s.restart));
});

test("valPresetMatches detects commercial bull", () => {
  const s = structuredClone(DEFAULT_STATE);
  Object.assign(s.val, paramsFromValPreset("bull"));
  assert.ok(valPresetMatches("bull", s.val));
  assert.ok(!valPresetMatches("bear", s.val));
});
