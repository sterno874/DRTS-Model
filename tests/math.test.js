import test from "node:test";
import assert from "node:assert/strict";
import {
  wilsonInterval,
  binomUpperTail,
  riskAdjustedEV,
  evPerShare
} from "../js/math/device.js";

test("wilsonInterval golden values for ReSTART base case k=48 n=88", () => {
  const w = wilsonInterval(48, 88);
  assert.ok(Math.abs(w.lo - 0.44169880685506685) < 1e-9);
  assert.ok(Math.abs(w.hi - 0.6454076895474348) < 1e-9);
  assert.ok(Math.abs(w.p - 48 / 88) < 1e-12);
});

test("binomUpperTail golden value k=48 n=88 p0=0.30", () => {
  const p = binomUpperTail(48, 88, 0.3);
  assert.ok(Math.abs(p - 0.0000014137205267043516) < 1e-15);
});

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
  assert.equal(ev, (1000 * 0.1 * 10 * 5 * 4 * 0.5) / 1000);
});

test("evPerShare includes cash", () => {
  assert.equal(evPerShare(100, 10, 20), 12);
});
