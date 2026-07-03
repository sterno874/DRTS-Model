import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRunwayMonths,
  DEFAULT_CASH_M,
  DEFAULT_BURN_QUARTERLY_M
} from "../js/math/valuation.js";

test("computeRunwayMonths scales with cash and burn", () => {
  assert.ok(Math.abs(computeRunwayMonths(76.9, 10.6) - 21.8) < 0.5);
  assert.ok(computeRunwayMonths(100, 10) > computeRunwayMonths(50, 10));
});

test("default runway constants match FY2025 disclosures", () => {
  assert.equal(DEFAULT_CASH_M, 76.9);
  assert.ok(DEFAULT_BURN_QUARTERLY_M > 9 && DEFAULT_BURN_QUARTERLY_M < 12);
});
