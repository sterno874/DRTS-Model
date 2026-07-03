import test from "node:test";
import assert from "node:assert/strict";
import {
  PIPELINE_TRIALS,
  CATALYSTS,
  catalystsInYear,
  sortCatalysts,
  computePipelineSummary,
  COMMUNITY_DD,
  BEAR_CASE,
  COMMUNITY_THREADS
} from "../js/math/pipeline.js";

test("PIPELINE_TRIALS includes ReSTART IMPACT REGAIN", () => {
  const ids = PIPELINE_TRIALS.map((t) => t.id);
  assert.ok(ids.includes("restart"));
  assert.ok(ids.includes("impact"));
  assert.ok(ids.includes("regain"));
});

test("REGAIN trial documents n=3 caveat", () => {
  const regain = PIPELINE_TRIALS.find((t) => t.id === "regain");
  assert.match(regain.caveat, /n=3/);
});

test("catalystsInYear 2026 is non-empty", () => {
  const c = catalystsInYear(2026);
  assert.ok(c.length >= 4);
  assert.ok(c.every((x) => x.windowStart <= "2026-12-31"));
});

test("sortCatalysts orders by windowStart", () => {
  const s = sortCatalysts(CATALYSTS);
  for (let i = 1; i < s.length; i++) {
    assert.ok(s[i - 1].windowStart <= s[i].windowStart);
  }
});

test("computePipelineSummary warns on REGAIN interim", () => {
  const s = computePipelineSummary({ regainN: 10 });
  assert.match(s.regainNote, /n=3/);
});

test("COMMUNITY_DD flags rejected PMA-before-readout claim", () => {
  const row = COMMUNITY_DD.find((r) => r.theme.includes("before ReSTART") || r.theme.includes("approval before"));
  assert.equal(row.verdict, "rejected");
});

test("BEAR_CASE and COMMUNITY_THREADS non-empty", () => {
  assert.ok(BEAR_CASE.length >= 5);
  assert.ok(COMMUNITY_THREADS.length >= 5);
  assert.ok(BEAR_CASE.every((r) => r.verdict && r.theme));
});

test("all catalysts have source URLs", () => {
  for (const c of CATALYSTS) {
    assert.ok(c.source.startsWith("http"), c.id);
  }
});
