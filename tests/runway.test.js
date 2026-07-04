import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRunwayMonths,
  DEFAULT_CASH_M,
  DEFAULT_BURN_QUARTERLY_M,
  Q1_2026_CASH_M,
  GAAP_OP_LOSS_Q1_2026_M,
  WARRANT_REMEASURE_Q1_2026_M,
  NET_LOSS_Q1_2026_M
} from "../js/math/valuation.js";

test("computeRunwayMonths scales with cash and burn", () => {
  assert.ok(Math.abs(computeRunwayMonths(80.2, 6.5) - 37.0) < 0.5);
  assert.ok(computeRunwayMonths(100, 10) > computeRunwayMonths(50, 10));
});

test("default burn is CFO cash burn, not GAAP op loss", () => {
  assert.equal(DEFAULT_CASH_M, 76.9);
  assert.equal(Q1_2026_CASH_M, 80.2);
  assert.equal(DEFAULT_BURN_QUARTERLY_M, 6.5);
  assert.ok(DEFAULT_BURN_QUARTERLY_M < GAAP_OP_LOSS_Q1_2026_M);
  assert.ok(DEFAULT_BURN_QUARTERLY_M < NET_LOSS_Q1_2026_M);
});

test("Q1 2026 P&L constants match primary sources", () => {
  assert.equal(NET_LOSS_Q1_2026_M, 22.9);
  assert.equal(WARRANT_REMEASURE_Q1_2026_M, 9.6);
  assert.equal(GAAP_OP_LOSS_Q1_2026_M, 13.3);
});

test("default runway at Q1 cash covers ~12 quarters", () => {
  const months = computeRunwayMonths(Q1_2026_CASH_M, DEFAULT_BURN_QUARTERLY_M);
  const quarters = months / 3;
  assert.ok(quarters > 11 && quarters < 13);
});
