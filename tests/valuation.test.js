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

test("computeFullValuation includes five indications including Japan", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  assert.equal(v.rows.length, 5);
  assert.ok(v.rows.some((r) => r.id === "japan"));
  assert.ok(v.ev > 0);
  assert.ok(v.perSh > 0);
});

test("prostate row applies 60% Tolmar supply share", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const prostate = v.rows.find((r) => r.id === "prostate");
  const gross = peakSalesM(prostate);
  assert.ok(Math.abs(prostate.peak - gross * 0.6) < 0.01);
});

test("Japan H&N peak uses patients × pen × years × price / 1000", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const japan = v.rows.find((r) => r.id === "japan");
  // 4000 × 0.08 × 1 × 70 / 1000 = 22.4
  assert.ok(Math.abs(japan.peak - 22.4) < 0.01);
  assert.ok(Math.abs(japan.evContrib - 22.4 * 0.5 * 4) < 0.01);
});

test("bull preset raises EV vs bear", () => {
  const base = DEFAULT_STATE.val;
  const bull = computeFullValuation({ ...base, ...VAL_PRESETS.bull });
  const bear = computeFullValuation({ ...base, ...VAL_PRESETS.bear });
  assert.ok(bull.ev > bear.ev);
  assert.ok(bull.ev >= 500 && bull.ev <= 10000);
  assert.ok(bear.ev >= 100 && bear.ev <= 3000);
});

test("commercial bull raises skin pen and multiple vs base", () => {
  assert.equal(VAL_PRESETS.bull.v_skinPen, 0.25);
  assert.equal(VAL_PRESETS.bull.v_prostatePen, 0.1);
  assert.equal(VAL_PRESETS.bull.v_mult, 6);
  assert.ok(VAL_PRESETS.bull.v_skinPs > VAL_PRESETS.base.v_skinPs);
});

test("commercial bull (ops) caps platform at $8M", () => {
  assert.equal(VAL_PRESETS.bull.v_platform, 8);
  assert.ok(VAL_PRESETS.bull.v_platform <= 8);
  assert.match(VAL_PRESETS.bull.label, /Commercial bull/);
  // Units are $M — $8M not $8B or $15M
  assert.ok(VAL_PRESETS.bull.v_platform < 15);
});

test("default share count is 88M ordinary shares", () => {
  assert.equal(DEFAULT_STATE.val.v_shares, 88);
});

test("golden base-case numbers", () => {
  const v = computeFullValuation(DEFAULT_STATE.val);
  const skin = v.rows.find((r) => r.id === "skin");
  const japan = v.rows.find((r) => r.id === "japan");
  // 12000 × 0.15 × 1 × 85 / 1000 = 153 $M/yr gross peak
  assert.ok(Math.abs(skin.peak - 153) < 0.01);
  // Japan: 22.4 peak → EV contrib 44.8; prior four-ind EV 529.46 + 44.8 = 574.26
  assert.ok(Math.abs(japan.peak - 22.4) < 0.01);
  assert.ok(Math.abs(v.ev - 574.26) < 1);
  // $/sh = (574.26 + 80.2) / 88 ≈ 7.44
  assert.ok(Math.abs(v.perSh - 7.44) < 0.1);
});

test("golden commercial bull numbers", () => {
  const { label: _lb, ...bull } = VAL_PRESETS.bull;
  const v = computeFullValuation({ ...DEFAULT_STATE.val, ...bull });
  assert.ok(Math.abs(v.ev - 1941.77) < 2);
  // (1941.77 + 80.2) / 88 ≈ 22.98
  assert.ok(Math.abs(v.perSh - 22.98) < 0.2);
  assert.equal(v.platform, 8);
});

test("COMPARABLES includes Tolmar deal", () => {
  assert.ok(COMPARABLES.some((c) => c.name.includes("Tolmar")));
});

test("platform correlation haircut reduces non-skin EV", () => {
  const base = computeFullValuation(DEFAULT_STATE.val);
  const hair = computeFullValuation({ ...DEFAULT_STATE.val, v_platformCorrHaircut: 20 });
  assert.ok(hair.ev < base.ev);
  const skinBase = base.rows.find((r) => r.id === "skin");
  const skinHair = hair.rows.find((r) => r.id === "skin");
  assert.ok(Math.abs(skinBase.evContrib - skinHair.evContrib) < 0.01);
});

test("non-skin link pulls GBM P(s) toward skin", () => {
  const s = {
    ...DEFAULT_STATE.val,
    v_linkNonSkinPs: true,
    v_nonSkinSkinLink: 1,
    v_skinPs: 0.8,
    v_gbmPs: 0.25
  };
  const v = computeFullValuation(s);
  const gbm = v.rows.find((r) => r.id === "gbm");
  assert.ok(Math.abs(gbm.pSuccess - 0.8) < 0.01);
});

test("immune preset adds platformImmune bucket", () => {
  const { label: _lb, ...immune } = VAL_PRESETS.immune;
  const v = computeFullValuation({ ...DEFAULT_STATE.val, ...immune });
  assert.equal(v.platformImmune, 2);
  assert.ok(v.ev > computeFullValuation(DEFAULT_STATE.val).ev);
});
