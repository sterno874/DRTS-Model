import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VALID_TABS, EXPLAIN_LEVELS } from "../js/ui/state.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const js = readFileSync(path.join(root, "js/main.js"), "utf8");

function matchAll(re, text) {
  const out = [];
  let m;
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  while ((m = g.exec(text)) !== null) out.push(m);
  return out;
}

test("index.html links css and js module", () => {
  assert.match(html, /href="css\/main\.css"/);
  assert.match(html, /type="module" src="js\/main\.js"/);
});

test("tab buttons match VALID_TABS", () => {
  const tabs = matchAll(/class="tabbtn[^"]*"[^>]*data-tab="([^"]+)"/g, html).map((m) => m[1]);
  assert.deepEqual(tabs, VALID_TABS);
});

test("bottom nav exposes all tabs", () => {
  const nav = matchAll(/<nav id="bottomNav"[\s\S]*?<\/nav>/g, html)[0][0];
  const navTabs = nav.match(/data-tab="([^"]+)"/g).map((s) => s.slice(10, -1));
  assert.deepEqual(navTabs, VALID_TABS);
});

test("six explain levels", () => {
  const levels = matchAll(/class="lvlb[^"]*"[^>]*data-lvl="([^"]+)"/g, html).map((m) => m[1]);
  assert.deepEqual(levels, EXPLAIN_LEVELS);
});

test("biology tab has SVG placeholder", () => {
  assert.match(html, /id="tab-biology"/);
  assert.match(html, /class="bio-svg"/);
  assert.match(html, /pubmed\.ncbi\.nlm\.nih\.gov\/31759075/);
});

test("ReSTART cites NCT05323253", () => {
  assert.match(html, /NCT05323253/);
});

test("no duplicate element ids", () => {
  const ids = matchAll(/\bid="([^"]+)"/g, html).map((m) => m[1]);
  const seen = new Set();
  const dupes = [];
  for (const id of ids) {
    if (seen.has(id)) dupes.push(id);
    seen.add(id);
  }
  assert.deepEqual(dupes, []);
});

test("main.js exports toggleMethod and decodeShareHash usage", () => {
  assert.match(js, /decodeShareHash/);
  assert.match(js, /window\.toggleMethod/);
});

test("Phase 2 header strip and MC histogram present", () => {
  assert.match(html, /id="headerStrip"/);
  assert.match(html, /id="rMcHist"/);
  assert.match(html, /Phase 2/);
});

test("five restart presets including stress", () => {
  const presets = matchAll(/data-preset="([^"]+)"/g, html).map((m) => m[1]);
  assert.ok(presets.includes("stress"));
  assert.ok(presets.includes("best"));
});

test("valuation has community DD table", () => {
  assert.match(html, /id="vDDBody"/);
  assert.match(html, /Community DD/);
});

test("pipeline catalyst calendar", () => {
  assert.match(html, /id="pipeCalendar"/);
});
