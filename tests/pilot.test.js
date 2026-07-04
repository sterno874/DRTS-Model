import test from "node:test";
import assert from "node:assert/strict";
import {
  betaPosteriorMean,
  computeRegainPanel,
  computeImpactPanel,
  REGAIN_INTERIM
} from "../js/math/pilot.js";

test("REGAIN interim n=3 disclosed counts", () => {
  assert.equal(REGAIN_INTERIM.n, 3);
  assert.equal(REGAIN_INTERIM.localControl, 3);
  assert.equal(REGAIN_INTERIM.completeResponse, 2);
});

test("computeRegainPanel CR interval is very wide at n=3", () => {
  const p = computeRegainPanel();
  assert.equal(p.n, 3);
  assert.ok(p.crCiHi - p.crCiLo > 40, "n=3 CR CI should span >40pp");
  assert.ok(p.ratePct > 75);
  assert.equal(p.crRatePct, 60);
});

test("REGAIN n=3 cannot set registrational P(s) without hard cap", () => {
  const p = computeRegainPanel();
  assert.equal(p.displayOnly, true);
  assert.equal(p.feasibilityNotPivotal, true);
  assert.ok(p.rawRegistrationalPs > p.maxRegistrationalPs);
  assert.equal(p.cappedRegistrationalPs, p.maxRegistrationalPs);
  assert.ok(p.cappedRegistrationalPs <= 0.15);
});

test("computeImpactPanel shows no disclosed responses", () => {
  const p = computeImpactPanel();
  assert.equal(p.disclosed, false);
  assert.equal(p.targetN, 40);
  assert.ok(p.priorLo < 20 && p.priorHi > 80);
});

test("IMPACT is display-only with wide prior and P(s) cap", () => {
  const p = computeImpactPanel();
  assert.equal(p.displayOnly, true);
  assert.equal(p.feasibilityNotPivotal, true);
  assert.ok(p.priorHi - p.priorLo > 50, "wide prior band");
  assert.ok(p.cappedRegistrationalPs <= 0.15);
});

test("betaPosteriorMean uniform prior at 2/3", () => {
  assert.ok(Math.abs(betaPosteriorMean(2, 3) - 0.6) < 0.01);
});
