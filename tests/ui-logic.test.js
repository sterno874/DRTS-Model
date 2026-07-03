import test from "node:test";
import assert from "node:assert/strict";
import { computeHeaderStrip, DEFAULT_STATE } from "../js/ui/state.js";

test("computeHeaderStrip returns ORR and per-share", () => {
  const h = computeHeaderStrip(DEFAULT_STATE);
  assert.equal(h.orrPct, 55);
  assert.match(h.wilson, /%/);
  assert.ok(parseFloat(h.perSh) > 0);
});

test("computeHeaderStrip updates with bull preset ORR", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.restart.orrPct = 65;
  assert.equal(computeHeaderStrip(s).orrPct, 65);
});
