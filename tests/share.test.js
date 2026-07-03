import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShareHash,
  decodeShareHash,
  DEFAULT_STATE,
  VALID_TABS
} from "../js/ui/state.js";

test("default share hash is empty payload", () => {
  const h = buildShareHash(structuredClone(DEFAULT_STATE));
  assert.equal(h, "#s1=");
  assert.deepEqual(decodeShareHash(h), DEFAULT_STATE);
});

test("tab change round-trips", () => {
  const s = structuredClone(DEFAULT_STATE);
  s.tab = "pipeline";
  const h = buildShareHash(s);
  const d = decodeShareHash(h);
  assert.equal(d.tab, "pipeline");
});

test("VALID_TABS has five entries", () => {
  assert.equal(VALID_TABS.length, 5);
  assert.ok(VALID_TABS.includes("restart"));
  assert.ok(VALID_TABS.includes("biology"));
});
