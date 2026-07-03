import test from "node:test";
import assert from "node:assert/strict";
import { SHARE_PRESETS, VAL_PRESETS, paramsFromPreset } from "../js/ui/state.js";
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

test("best preset exists for FIH-adjacent scenario", () => {
  assert.ok(SHARE_PRESETS.best);
  assert.ok(SHARE_PRESETS.best.orrPct >= 55);
});
