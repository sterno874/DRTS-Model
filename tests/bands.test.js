import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESTART_BANDS,
  VAL_BANDS,
  ALL_BANDS,
  pctB,
  bandCoversRange
} from "../js/ui/bands.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(root, "index.html"), "utf8");

test("pctB clamps to 0–100", () => {
  assert.equal(pctB(0, 0, 100), 0);
  assert.equal(pctB(100, 0, 100), 100);
  assert.equal(pctB(-10, 0, 100), 0);
  assert.equal(pctB(200, 0, 100), 100);
  assert.equal(pctB(50, 0, 100), 50);
});

test("every band config has valid sigma ordering b1 inside b2 inside b3", () => {
  for (const c of ALL_BANDS) {
    assert.ok(c.sig.b1[0] >= c.sig.b3[0], `${c.id} b1 lo >= b3 lo`);
    assert.ok(c.sig.b1[1] <= c.sig.b3[1], `${c.id} b1 hi <= b3 hi`);
    assert.ok(c.sig.b2[0] >= c.sig.b3[0], `${c.id} b2 lo >= b3 lo`);
    assert.ok(c.sig.b2[1] <= c.sig.b3[1], `${c.id} b2 hi <= b3 hi`);
    assert.ok(c.min <= c.sig.b3[0], `${c.id} min <= b3 lo`);
    assert.ok(c.max >= c.sig.b3[1], `${c.id} max >= b3 hi`);
  }
});

test("ReSTART band ids match HTML slider ids", () => {
  for (const c of RESTART_BANDS) {
    assert.match(html, new RegExp(`id="${c.id}"`), `missing slider ${c.id}`);
    assert.match(html, new RegExp(`id="band-${c.id}"`), `missing band host band-${c.id}`);
  }
});

test("valuation band ids match HTML slider ids", () => {
  for (const c of VAL_BANDS) {
    assert.match(html, new RegExp(`id="${c.id}"`), `missing slider ${c.id}`);
    assert.match(html, new RegExp(`id="band-${c.id}"`), `missing band host band-${c.id}`);
  }
});

test("key anchors match known reported values", () => {
  const bench = RESTART_BANDS.find((c) => c.id === "rbenchOrrPct");
  assert.equal(bench.anchor, 47);
  const enroll = RESTART_BANDS.find((c) => c.id === "rn");
  assert.equal(enroll.anchor, 88);
  const cash = VAL_BANDS.find((c) => c.id === "vv_cash");
  assert.equal(cash.anchor, 76.9);
});

test("bandCoversRange helper", () => {
  const c = RESTART_BANDS[0];
  assert.ok(bandCoversRange(c, c.min, c.max));
});

test("implausible zones only where defined", () => {
  const withImp = ALL_BANDS.filter((c) => c.imp);
  assert.ok(withImp.length >= 5);
  for (const c of withImp) {
    assert.ok(c.imp[0] < c.imp[1], `${c.id} imp range`);
    assert.ok(c.imp[0] >= c.min && c.imp[1] <= c.max, `${c.id} imp within slider`);
  }
});
