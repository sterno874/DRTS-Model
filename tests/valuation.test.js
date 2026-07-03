import test from "node:test";
import assert from "node:assert/strict";
import { computeFullValuation, peakSalesM, COMPARABLES } from "../js/math/valuation.js";
import { DEFAULT_STATE } from "../js/ui/state.js";

test("peakSalesM multiplies inputs", () => {
  assert.equal(peakSalesM({ patients: 1000, penetration: 0.1, price: 10, years: 5 }), 5000);
});

test("computeFullValuation includes four indications", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  assert.equal(v.rows.length, 4);
  assert.ok(v.ev > 0);
  assert.ok(v.perSh > 0);
});

test("risk-off increases EV vs risk-on", () => {
  const on = computeFullValuation({ ...DEFAULT_STATE.val, v_riskadj: true });
  const off = computeFullValuation({ ...DEFAULT_STATE.val, v_riskadj: false });
  assert.ok(off.ev > on.ev);
});

test("prostate row applies 60% supply share", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const prostate = v.rows.find((r) => r.id === "prostate");
  const raw = peakSalesM(prostate);
  assert.ok(prostate.peak < raw);
});

test("bull preset raises EV vs bear", () => {
  const base = DEFAULT_STATE.val;
  const bull = computeFullValuation({ ...base, v_skinPs: 0.7, v_mult: 5 });
  const bear = computeFullValuation({ ...base, v_skinPs: 0.35, v_mult: 3 });
  assert.ok(bull.ev > bear.ev);
});

test("COMPARABLES includes Tolmar deal", () => {
  assert.ok(COMPARABLES.some((c) => c.name.includes("Tolmar")));
});
