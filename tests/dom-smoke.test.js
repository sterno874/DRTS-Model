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

test("mobile nav panel exposes all tabs", () => {
  const nav = matchAll(/<div id="mobileNavPanel"[\s\S]*?<\/div>/g, html)[0][0];
  const navTabs = nav.match(/data-tab="([^"]+)"/g).map((s) => s.slice(10, -1));
  assert.deepEqual(navTabs, VALID_TABS);
});

test("hamburger nav toggle is accessible", () => {
  assert.match(html, /id="navToggle"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="mobileNavPanel"/);
  assert.match(js, /function initMobileNav\(/);
});

test("six explain levels", () => {
  const levels = matchAll(/class="lvlb[^"]*"[^>]*data-lvl="([^"]+)"/g, html).map((m) => m[1]);
  assert.deepEqual(levels, EXPLAIN_LEVELS);
});

test("biology tab has SVG placeholder", () => {
  assert.match(html, /id="tab-biology"/);
  assert.match(html, /pubmed\.ncbi\.nlm\.nih\.gov\/31759075/);
});

test("biology tab has five alpha simulation modules", () => {
  const simIds = [
    "alpha-sim-penetration",
    "alpha-sim-bragg",
    "alpha-sim-decay",
    "alpha-sim-hypoxia",
    "alpha-sim-seeds"
  ];
  for (const id of simIds) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  // SVG-backed sims (A, B, D, E); Sim C is a step-through chain, not a clock/timeline
  for (const id of ["alpha-sim-penetration", "alpha-sim-bragg", "alpha-sim-hypoxia", "alpha-sim-seeds"]) {
    assert.match(html, new RegExp(`id="${id}"[\\s\\S]*?<svg`));
  }
  assert.match(html, /id="simC-progress"/);
  assert.match(html, /id="simC-detail"/);
  assert.match(html, /id="simC-prev"/);
  assert.match(html, /id="simC-next"/);
  assert.match(html, /Step through chain/);
  assert.match(html, /sequence of isotopes, not a clock/);
  assert.doesNotMatch(html, /Ra-224 decay chain timeline/);
  assert.doesNotMatch(html, /Play decay/);
  assert.match(html, /alpha-sims\.css/);
  assert.match(html, /Educational schematic/);
});

test("biology tab decay chain has proportional timeline bar", () => {
  assert.match(html, /id="simC-timeline"/);
});

test("biology tab has shared sim design classes in css", () => {
  const css = readFileSync(path.join(root, "css/alpha-sims.css"), "utf8");
  assert.match(css, /--bio-bg|var\(--bio-bg/);
  assert.match(css, /\.sim-legend/);
  assert.match(css, /\.scale-bar/);
});

test("biology tab has D0 radiosensitivity table and dosimetry modeling", () => {
  assert.match(html, /id="bio-d0-radiosensitivity"/);
  assert.match(html, /id="bio-d0-table"/);
  assert.match(html, /id="bio-dosimetry-modeling"/);
  assert.match(html, /Radiosensitivity across tumor types/);
  assert.match(html, /Dosimetry modeling/);
  // D0 table cell lines from JRPR review
  for (const line of ["FaDu", "LL2", "SQ2", "PC3", "Panc02", "U87", "NCI-H520"]) {
    assert.match(html, new RegExp(line));
  }
  assert.match(html, /lower D₀ = more radiosensitive/);
  // Primary sources
  assert.match(html, /jrpr\.org\/journal\/view\.php\?number=1171/);
  assert.match(html, /pubmed\.ncbi\.nlm\.nih\.gov\/36464914/);
  assert.match(html, /10\.1088\/1361-6560\/ae5d7e/);
  assert.match(html, /Kim &amp; Sung/);
  assert.match(html, /Korotinsky/);
  assert.match(html, /Heger/);
  // D0 table primary-study PubMed links (via JRPR refs)
  const d0Block = html.slice(html.indexOf('id="bio-d0-table"'), html.indexOf('id="bio-dosimetry-modeling"'));
  for (const pmid of ["18059026", "19480976", "23225432", "22077335", "22153808", "36237307"]) {
    assert.match(d0Block, new RegExp(`pubmed\\.ncbi\\.nlm\\.nih\\.gov/${pmid}/`));
  }
  assert.match(d0Block, /Cooks 2012<\/a>/);
  assert.match(d0Block, /Lazarov 2012<\/a>/);
  assert.match(d0Block, /Horev-Drori 2012<\/a>/);
  assert.match(d0Block, /Nishri 2022<\/a>/);
  // Accuracy guardrails
  assert.match(html, /independent/);
  assert.match(html, /Emerging \/ theoretical|emerging\/theoretical/i);
  assert.doesNotMatch(html, /JRPR proves clinical efficacy/i);
});

test("explain levels cite newer dosimetry sources", () => {
  assert.match(js, /36464914/);
  assert.match(js, /ae5d7e/);
  assert.match(js, /jrpr\.org/);
  assert.match(js, /bio-d0-radiosensitivity/);
  assert.match(js, /bio-dosimetry-modeling/);
});

test("explain levels document MC co-primary DOR and skin P(s) link", () => {
  assert.match(js, /durable-responder fraction|durable\/responders/);
  assert.match(js, /P\(DOR≥6mo\|responder\)|pDurable/);
  assert.match(js, /Skin P\(s\) links to MC P\(success\)|skin P\(s\) defaults to this MC/);
});

test("explain levels link to biology simulations", () => {
  assert.match(js, /alpha-sim-penetration/);
  assert.match(js, /alpha-sim-bragg/);
  assert.match(js, /initAlphaSims/);
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

test("Phase 3 og-image and pilot panels present", () => {
  assert.match(html, /og-image\.png/);
  assert.match(html, /id="pilotPanels"/);
  assert.match(html, /Phase 3/);
  assert.match(html, /data-as-of=/);
  assert.match(html, /vv_burnQuarterly/);
  assert.match(html, /Quarterly cash burn/);
  assert.match(html, /value="6\.5"/);
  assert.match(html, /Q1 2026 P&amp;L vs cash burn/);
  assert.match(html, /youtu\.be\/Jyryv-152hc/);
  assert.match(html, /company-reported interview, not audited CFS/);
});

test("honesty framing: approval haircut, dilution stress, platform $M", () => {
  assert.match(html, /Model P\(success \| assumptions\)/);
  assert.match(html, /vv_approvalHaircut/);
  assert.match(html, /PMA approval given trial success/);
  assert.match(html, /data-dilution-stress="100"/);
  assert.match(html, /data-dilution-stress="110"/);
  assert.match(html, /F-3 shelf \+ ATM/);
  assert.match(html, /Platform optionality \(\$M, not \$B\)/);
  assert.match(html, /illustrative, not live/);
  assert.match(html, /MC trial P\(success \| assumptions\)/);
});

test("Phase 2 header strip and MC histogram present", () => {
  assert.match(html, /id="headerStrip"/);
  assert.match(html, /id="rMcHist"/);
});

test("five restart presets including stress", () => {
  const presets = matchAll(/data-preset="([^"]+)"/g, html).map((m) => m[1]);
  assert.ok(presets.includes("stress"));
  assert.ok(presets.includes("best"));
});

test("valuation has community DD and bear case tables", () => {
  assert.match(html, /id="vDDBody"/);
  assert.match(html, /id="vBearBody"/);
  assert.match(html, /Community DD/);
  assert.match(html, /Bear case/);
});

test("pipeline has community threads table", () => {
  assert.match(html, /id="pipeThreadsBody"/);
  assert.match(html, /id="pipeRestartDDBody"/);
});

test("pipeline catalyst timeline", () => {
  assert.match(html, /id="pipeCalendar"/);
  assert.match(html, /Catalyst timeline/);
  assert.match(html, /class="cat-tl-host"/);
  assert.match(html, /id="pcalendarYear"/);
});

test("prior bands on ReSTART and valuation sliders", () => {
  assert.match(html, /id="band-rorrPct"/);
  assert.match(html, /id="band-rbenchOrrPct"/);
  assert.match(html, /id="band-vv_skinPts"/);
  assert.match(html, /id="band-rdtAcceptModular"/);
  assert.match(html, /id="band-vv_platformCorrHaircut"/);
  assert.match(html, /id="band-vv_mechanismCorr"/);
  assert.match(html, /id="band-vv_deliveryRisk"/);
  assert.match(html, /id="rdtBranchDilution"/);
  assert.match(html, /id="rdtLinkFdaToTopline"/);
  assert.match(html, /Procedure economics/);
  assert.match(html, /class="bandkey"/);
  assert.match(html, /class="source-line"/);
});

test("main.js uses p-def preset highlights and sync", () => {
  assert.match(js, /refreshPresetHighlights/);
  assert.match(js, /syncPresetMarkers/);
  assert.match(js, /button\[data-preset\]/);
  assert.match(js, /paramsFromValPreset/);
  assert.match(js, /immediateMc/);
});

test("references and limitations sections", () => {
  assert.match(html, /References · ReSTART/);
  assert.match(html, /References · Valuation/);
  assert.match(html, /regal-limitations/);
  assert.match(html, /id="refs-restart"/);
});

test("pipeline has bear case table", () => {
  assert.match(html, /id="pipeBearBody"/);
  assert.match(html, /Bear case/);
});

test("MC histogram has axis labels", () => {
  assert.match(html, /id="rMcAxis"/);
  assert.match(html, /mc-hist-wrap/);
});

test("valuation how-it-works panel", () => {
  assert.match(html, /id="m-value"/);
});
