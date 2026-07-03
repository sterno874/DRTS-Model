import test from "node:test";
import assert from "node:assert/strict";
import {
  csdaRangeAlphaUm,
  logScaleFraction,
  CSDA_ALPHA_WATER,
  ALPHA_RANGE_UM,
  DECAY_CHAIN
} from "../js/ui/alpha-sims.js";

test("csdaRangeAlphaUm interpolates ICRU table points", () => {
  assert.ok(Math.abs(csdaRangeAlphaUm(5.5) - 42) < 1);
  assert.ok(Math.abs(csdaRangeAlphaUm(6.8) - 56) < 1);
  assert.ok(Math.abs(csdaRangeAlphaUm(7.7) - 68) < 1);
});

test("csdaRangeAlphaUm increases with energy", () => {
  assert.ok(csdaRangeAlphaUm(4.0) < csdaRangeAlphaUm(6.8));
  assert.ok(csdaRangeAlphaUm(6.8) < csdaRangeAlphaUm(8.5));
});

test("alpha range within cited tissue bounds", () => {
  const r = csdaRangeAlphaUm(6.8);
  assert.ok(r >= ALPHA_RANGE_UM.min);
  assert.ok(r <= ALPHA_RANGE_UM.max + 10);
});

test("logScaleFraction orders modalities correctly", () => {
  const a = logScaleFraction(55);
  const b = logScaleFraction(4000);
  const g = logScaleFraction(120000);
  assert.ok(a < b);
  assert.ok(b < g);
  assert.ok(logScaleFraction(1) >= 0);
  assert.ok(logScaleFraction(120000) <= 1);
});

test("CSDA table and decay chain have expected entries", () => {
  assert.equal(CSDA_ALPHA_WATER.length, 4);
  assert.equal(DECAY_CHAIN[0].iso, "Ra-224");
  assert.ok(DECAY_CHAIN.some((n) => n.iso.includes("Po-216")));
  assert.equal(DECAY_CHAIN.length, 7);
  assert.equal(DECAY_CHAIN[DECAY_CHAIN.length - 1].iso, "Pb-208");
  for (const node of DECAY_CHAIN) {
    assert.ok(node.mode, `${node.iso} has decay mode`);
    assert.ok(node.clinical, `${node.iso} has clinical note`);
    assert.ok(node.distance, `${node.iso} has distance note`);
    assert.ok(node.hl, `${node.iso} has half-life`);
  }
});
