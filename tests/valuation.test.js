import test from "node:test";
import assert from "node:assert/strict";
import { computeFullValuation, peakSalesM, COMPARABLES } from "../js/math/valuation.js";
import { DEFAULT_STATE, VAL_PRESETS } from "../js/ui/state.js";

test("peakSalesM converts $K price to $M peak", () => {
  // 1000 pts × 10% × 1 yr × $10K = $1M/yr
  assert.equal(peakSalesM({ patients: 1000, penetration: 0.1, price: 10, years: 1 }), 1);
});

test("base preset EV is order $500M–$5B not trillions", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  assert.ok(v.ev >= 500 && v.ev <= 5000, `EV ${v.ev}M outside $500M–$5B band`);
});

test("base preset implied $/sh is below $500", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  assert.ok(v.perSh > 0 && v.perSh < 500, `$/sh ${v.perSh} implausible`);
});

test("base preset cSCC peak is tens–low hundreds $M/yr", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const skin = v.rows.find((r) => r.id === "skin");
  assert.ok(skin.peak >= 50 && skin.peak <= 500, `cSCC peak ${skin.peak}M/yr out of range`);
});

test("contribution rows sum to total EV within rounding", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const rowSum = v.rows.reduce((s, r) => s + r.evContrib, 0) + v.platform;
  assert.ok(Math.abs(rowSum - v.ev) < 0.01);
});

test("each row EV = peak × P(s) × multiple when risk-adjusted", () => {
  const v = computeFullValuation({ ...DEFAULT_STATE.val, v_riskadj: true, v_mult: 4 });
  for (const row of v.rows) {
    const expected = row.peak * row.pSuccess * 4;
    assert.ok(Math.abs(row.evContrib - expected) < 0.01, `${row.id} EV mismatch`);
  }
});

test("risk-off uses P(s)=1 for EV contributions", () => {
  const v = computeFullValuation({ ...DEFAULT_STATE.val, v_riskadj: false, v_mult: 4 });
  for (const row of v.rows) {
    assert.equal(row.pSuccess, 1);
    assert.ok(Math.abs(row.evContrib - row.peak * 4) < 0.01);
  }
});

test("computeFullValuation includes four indications", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  assert.equal(v.rows.length, 4);
  assert.ok(v.ev > 0);
  assert.ok(v.perSh > 0);
});

test("prostate row applies 60% Tolmar supply share", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const prostate = v.rows.find((r) => r.id === "prostate");
  const gross = peakSalesM(prostate);
  assert.ok(Math.abs(prostate.peak - gross * 0.6) < 0.01);
});

test("bull preset raises EV vs bear", () => {
  const base = DEFAULT_STATE.val;
  const bull = computeFullValuation({ ...base, ...VAL_PRESETS.bull });
  const bear = computeFullValuation({ ...base, ...VAL_PRESETS.bear });
  assert.ok(bull.ev > bear.ev);
  assert.ok(bull.ev >= 500 && bull.ev <= 10000);
  assert.ok(bear.ev >= 100 && bear.ev <= 3000);
});

test("golden base-case numbers", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const skin = v.rows.find((r) => r.id === "skin");
  // 12000 × 0.15 × 1 × 85 / 1000 = 153 $M/yr gross peak
  assert.ok(Math.abs(skin.peak - 153) < 0.01);
  // EV ≈ 529M, $/sh ≈ 14.5 with cash
  assert.ok(Math.abs(v.ev - 529.46) < 1);
  assert.ok(Math.abs(v.perSh - 14.51) < 0.1);
});

test("COMPARABLES includes Tolmar deal", () => {
  assert.ok(COMPARABLES.some((c) => c.name.includes("Tolmar")));
});
