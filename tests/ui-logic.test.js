import test from "node:test";
import assert from "node:assert/strict";
import {
  computeHeaderStrip,
  resolveLinkedSkinPs,
  DEFAULT_STATE,
  VAL_PRESETS
} from "../js/ui/state.js";
import { computeRestartMetrics, mcRestartORR } from "../js/math/restart.js";

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
  assert.ok(h.upsideLabel.startsWith("-"), "base vs-ref must show negative sign");
  assert.ok(Math.abs(parseFloat(h.upsideMult) - 0.57) < 0.05);
});

test("header labels risk-adj equity $/sh and vs-ref", () => {
  const h = computeHeaderStrip(DEFAULT_STATE);
  assert.equal(h.perShLabel, "Risk-adj equity $/sh");
  assert.equal(h.vsRefLabel, "vs-ref");
  assert.equal(h.riskAdj, true);
  const gross = structuredClone(DEFAULT_STATE);
  gross.val.v_riskadj = false;
  assert.equal(computeHeaderStrip(gross).perShLabel, "Gross equity $/sh");
});

test("header strip commercial bull raises $/sh and upside vs base", () => {
  const base = computeHeaderStrip(DEFAULT_STATE);
  const s = structuredClone(DEFAULT_STATE);
  const { label: _lb, ...bullPreset } = VAL_PRESETS.bull;
  Object.assign(s.val, bullPreset);
  const bull = computeHeaderStrip(s);
  assert.ok(parseFloat(bull.perSh) > parseFloat(base.perSh));
  assert.ok(parseFloat(bull.upsidePct) > parseFloat(base.upsidePct));
  // Positive upside must keep explicit "+" sign (mutation target)
  assert.ok(parseFloat(bull.upsidePct) > 0);
  assert.ok(bull.upsideLabel.startsWith("+"), "bull vs-ref must show + sign");
});

test("resolveLinkedSkinPs prefers MC P(success) over pCombined", () => {
  const mc = mcRestartORR({
    n: 88,
    orrPct: 55,
    benchOrrPct: 30,
    sims: 1500,
    seed: 42
  });
  const linked = resolveLinkedSkinPs(DEFAULT_STATE.restart, mc.pSuccess);
  assert.ok(Math.abs(linked - Math.round(mc.pSuccess * 20) / 20) < 1e-9);
  const fallback = resolveLinkedSkinPs(DEFAULT_STATE.restart, null);
  const pCombined = computeRestartMetrics(DEFAULT_STATE.restart).pCombined;
  assert.ok(Math.abs(fallback - Math.round(pCombined * 20) / 20) < 1e-9);
});

test("link toggle default is on for base", () => {
  assert.equal(DEFAULT_STATE.val.v_linkSkinPs, true);
});
