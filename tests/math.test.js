import test from "node:test";
import assert from "node:assert/strict";
import {
  wilsonInterval,
  binomUpperTail,
  riskAdjustedEV,
  evPerShare
} from "../js/math/device.js";

test("wilsonInterval midpoint near p for large n", () => {
  const w = wilsonInterval(44, 88);
  assert.ok(Math.abs(w.p - 0.5) < 0.01);
  assert.ok(w.lo < w.p && w.p < w.hi);
});

test("binomUpperTail decreases as observed successes decrease", () => {
  const a = binomUpperTail(50, 88, 0.3);
  const b = binomUpperTail(40, 88, 0.3);
  assert.ok(a < b);
});

test("riskAdjustedEV sums indications", () => {
  const ev = riskAdjustedEV([
    { patients: 1000, penetration: 0.1, price: 10, years: 5, multiple: 4, pSuccess: 0.5 }
  ]);
  assert.equal(ev, 1000 * 0.1 * 10 * 5 * 4 * 0.5);
});

test("evPerShare includes cash", () => {
  assert.equal(evPerShare(100, 10, 20), 12);
});
