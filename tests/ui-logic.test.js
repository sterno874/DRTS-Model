import test from "node:test";
import assert from "node:assert/strict";
import {
  computeHeaderStrip,
  resolveLinkedSkinPs,
  valuationInputsForState,
  DEFAULT_STATE,
  VAL_PRESETS
} from "../js/ui/state.js";
import { computeFullValuation } from "../js/math/valuation.js";
import { computeRestartMetrics, mcRestartORR } from "../js/math/restart.js";

const BASE_MC = mcRestartORR({
  n: 88,
  orrPct: 55,
  benchOrrPct: 30,
  dorDurablePct: 81,
  dorMinFracPct: 50,
  sims: 1500,
  seed: 42
});

test("computeHeaderStrip returns ORR and per-share", () => {
  const h = computeHeaderStrip(DEFAULT_STATE, BASE_MC.pSuccess);
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
  // Link default on: header uses MC co-primary P(success) → skin P(s) 0.95, $/sh ≈ $10.22
  const h = computeHeaderStrip(DEFAULT_STATE, BASE_MC.pSuccess);
  assert.ok(Math.abs(parseFloat(h.perSh) - 10.22) < 0.1);
  assert.equal(h.refPrice, "13.00");
  // Equity ~$899M vs mkt cap 88×13=$1144M → about −21% (0.79×)
  assert.match(h.upsideLabel, /%/);
  assert.match(h.upsideLabel, /×/);
  assert.ok(parseFloat(h.upsidePct) < 0);
  assert.ok(h.upsideLabel.startsWith("-"), "base vs-ref must show negative sign");
  assert.ok(Math.abs(parseFloat(h.upsideMult) - 0.79) < 0.05);
});

test("header with link on ignores stale v_skinPs and matches valuation", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.val.v_linkSkinPs = true;
  s.val.v_skinPs = 0.55; // stale manual value
  const h = computeHeaderStrip(s, BASE_MC.pSuccess);
  const linkedVal = valuationInputsForState(s, BASE_MC.pSuccess);
  assert.equal(linkedVal.v_skinPs, 0.95);
  const v = computeFullValuation(linkedVal);
  assert.ok(Math.abs(parseFloat(h.perSh) - v.perSh) < 0.01);
});

test("header with link off uses manual skin P(s)", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.val.v_linkSkinPs = false;
  s.val.v_skinPs = 0.55;
  const h = computeHeaderStrip(s, BASE_MC.pSuccess);
  assert.ok(Math.abs(parseFloat(h.perSh) - 7.44) < 0.1);
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
  const base = computeHeaderStrip(DEFAULT_STATE, BASE_MC.pSuccess);
  const s = structuredClone(DEFAULT_STATE);
  const { label: _lb, ...bullPreset } = VAL_PRESETS.bull;
  Object.assign(s.val, bullPreset);
  // Link stays on — bull raises pen/mult/platform; skin P(s) still from MC
  const bull = computeHeaderStrip(s, BASE_MC.pSuccess);
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
