import test from "node:test";
import assert from "node:assert/strict";
import { computeHeaderStrip, DEFAULT_STATE, VAL_PRESETS } from "../js/ui/state.js";

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

test("frozen header strip base golden $/sh and vs-ref upside", () => {
  const h = computeHeaderStrip(DEFAULT_STATE);
  // Base EV ~$574M, shares 88M, cash $80.2M → $/sh ≈ $7.44
  assert.ok(Math.abs(parseFloat(h.perSh) - 7.44) < 0.1);
  assert.equal(h.refPrice, "13.00");
  // Equity $654M vs mkt cap 88×13=$1144M → about −43% (0.57×)
  assert.match(h.upsideLabel, /%/);
  assert.match(h.upsideLabel, /×/);
  assert.ok(parseFloat(h.upsidePct) < 0);
  assert.ok(Math.abs(parseFloat(h.upsideMult) - 0.57) < 0.05);
});

test("header strip commercial bull raises $/sh and upside vs base", () => {
  const base = computeHeaderStrip(DEFAULT_STATE);
  const s = structuredClone(DEFAULT_STATE);
  Object.assign(s.val, VAL_PRESETS.bull);
  const bull = computeHeaderStrip(s);
  assert.ok(parseFloat(bull.perSh) > parseFloat(base.perSh));
  assert.ok(parseFloat(bull.upsidePct) > parseFloat(base.upsidePct));
});
