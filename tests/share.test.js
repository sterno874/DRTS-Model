import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShareHash,
  decodeShareHash,
  DEFAULT_STATE,
  VALID_TABS,
  inferActivePresets
} from "../js/ui/state.js";

test("default share hash is empty payload", () => {
  const h = buildShareHash(structuredClone(DEFAULT_STATE));
  assert.equal(h, "#s1=");
  assert.deepEqual(decodeShareHash(h), DEFAULT_STATE);
});

test("bare # hash loads default state", () => {
  assert.deepEqual(decodeShareHash("#"), DEFAULT_STATE);
});

test("no hash returns null for init fallback", () => {
  assert.equal(decodeShareHash(""), null);
});

test("tab change round-trips", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.tab = "pipeline";
  const h = buildShareHash(s);
  const d = decodeShareHash(h);
  assert.equal(d.tab, "pipeline");
});

test("pipeline delta round-trips", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.pipeline.calendarYear = 2027;
  const h = buildShareHash(s);
  const d = decodeShareHash(h);
  assert.equal(d.pipeline.calendarYear, 2027);
});

test("restart ORR delta round-trips", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.restart.orrPct = 62;
  const d = decodeShareHash(buildShareHash(s));
  assert.equal(d.restart.orrPct, 62);
});

test("restart preset marker round-trips", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.activeRestartPreset = "bull";
  s.restart.orrPct = 65;
  const d = decodeShareHash(buildShareHash(s));
  assert.equal(d.activeRestartPreset, "bull");
});

test("valuation preset marker round-trips", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.activeValPreset = "bear";
  s.val.v_mult = 3;
  const d = decodeShareHash(buildShareHash(s));
  assert.equal(d.activeValPreset, "bear");
});

test("inferActivePresets matches bull ORR", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.restart.orrPct = 65;
  assert.equal(inferActivePresets(s).activeRestartPreset, "bull");
});

test("v_shares round-trips through share hash", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.val.v_shares = 100;
  const d = decodeShareHash(buildShareHash(s));
  assert.equal(d.val.v_shares, 100);
});

test("v_linkSkinPs false round-trips", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.val.v_linkSkinPs = false;
  const d = decodeShareHash(buildShareHash(s));
  assert.equal(d.val.v_linkSkinPs, false);
});
