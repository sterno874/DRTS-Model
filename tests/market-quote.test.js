import test from "node:test";
import assert from "node:assert/strict";
import {
  parseQuotePayload,
  formatApproxPrice,
  formatApproxMarketCapM,
  buildQuoteMeta,
  computeVsMarketUpside,
  fetchLiveQuote,
  QUOTE_LABEL
} from "../js/ui/market-quote.js";
import { computeHeaderStrip, DEFAULT_STATE } from "../js/ui/state.js";
import { mcRestartORR } from "../js/math/restart.js";

const BASE_MC = mcRestartORR({
  n: 88,
  orrPct: 55,
  benchOrrPct: 30,
  dorDurablePct: 81,
  dorMinFracPct: 50,
  sims: 1500,
  seed: 42
});

test("parseQuotePayload accepts valid DRTS Yahoo quote", () => {
  const q = parseQuotePayload({
    symbol: "DRTS",
    price: 13.23,
    marketCapM: 1164,
    source: "yahoo"
  });
  assert.equal(q.ok, true);
  assert.equal(q.price, 13.23);
});

test("computeHeaderStrip uses delayed quote for vs-ref upside", () => {
  const live = { ok: true, price: 20, marketCapM: 1760, marketCapEstimated: false };
  const h = computeHeaderStrip(DEFAULT_STATE, BASE_MC.pSuccess, live);
  assert.equal(h.refPrice, "20.00");
  assert.equal(h.refSource, "live");
  assert.equal(h.vsRefLabel, "vs live");
  assert.equal(h.mktCap, "1760");
  assert.ok(parseFloat(h.upsidePct) < parseFloat(computeHeaderStrip(DEFAULT_STATE, BASE_MC.pSuccess).upsidePct));
});

test("fetchLiveQuote mocks fetch", async () => {
  const q = await fetchLiveQuote("DRTS", {
    fetchFn: async () => ({
      ok: true,
      json: async () => ({ symbol: "DRTS", price: 13, marketCapM: 1144, source: "yahoo" })
    })
  });
  assert.equal(q.ok, true);
});

test("approx formatting and label", () => {
  assert.equal(formatApproxPrice(13.23), "~$13.23");
  assert.equal(formatApproxMarketCapM(1164), "~$1.2B");
  assert.equal(QUOTE_LABEL, "Approx · delayed");
  assert.match(buildQuoteMeta({ ok: true, marketCapM: 1164 }), /mkt cap ~\$1\.2B/);
});

test("computeVsMarketUpside with live cap", () => {
  const u = computeVsMarketUpside(746, 1144);
  assert.ok(u.upsidePct < 0);
  assert.match(u.upsideLabel, /×/);
});
