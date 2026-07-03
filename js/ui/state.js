import { computeFullValuation } from "../math/valuation.js";
import { computeRestartMetrics } from "../math/restart.js";

export const VALID_TABS = ["restart", "pipeline", "value", "explain", "biology"];
export const EXPLAIN_LEVELS = ["eli5", "ms", "hs", "col", "pro", "phd"];

export function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin =
    typeof atob !== "undefined"
      ? atob(str)
      : Buffer.from(str, "base64").toString("binary");
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const DEFAULT_STATE = {
  v: 2,
  tab: "restart",
  activeRestartPreset: "base",
  activeValPreset: "base",
  embed: false,
  restart: {
    n: 88,
    orrPct: 55,
    benchOrrPct: 30,
    dorMonths: 6,
    dorBenchMonths: 6,
    orrThresholdPct: 35,
    pSuccess: 65,
    readoutMonth: 12,
    readoutYear: 2026,
    pmaModulesDone: 1,
    pmaModulesTotal: 3,
    mcSims: 1500
  },
  pipeline: {
    impactEnroll: 40,
    regainN: 10,
    regainLdcPct: 100,
    japanApproved: 1,
    calendarYear: 2026
  },
  val: {
    v_skinPts: 12000,
    v_skinPen: 0.15,
    v_skinPrice: 85,
    v_skinYears: 1,
    v_skinPs: 0.55,
    v_gbmPts: 8000,
    v_gbmPen: 0.08,
    v_gbmPrice: 95,
    v_gbmYears: 1,
    v_gbmPs: 0.25,
    v_pancPts: 35000,
    v_pancPen: 0.05,
    v_pancPrice: 90,
    v_pancYears: 1,
    v_pancPs: 0.15,
    v_prostatePts: 15000,
    v_prostatePen: 0.06,
    v_prostatePrice: 80,
    v_prostateYears: 1,
    v_prostatePs: 0.2,
    v_platform: 3,
    v_mult: 4,
    v_shares: 42,
    v_cash: 80.2,
    v_burnQuarterly: 10.6,
    v_riskadj: true
  },
  ui: { explainLvl: "eli5", showHeaderStrip: true }
};

/** ReSTART scenario presets — stress tests, not predictions. */
export const SHARE_PRESETS = {
  base: {
    orrPct: 55,
    benchOrrPct: 30,
    dorMonths: 6,
    pSuccess: 65,
    label: "Base — ORR 55% vs 30% bench"
  },
  bull: {
    orrPct: 65,
    benchOrrPct: 28,
    dorMonths: 7,
    pSuccess: 80,
    label: "Bull — strong ORR + DOR"
  },
  bear: {
    orrPct: 42,
    benchOrrPct: 32,
    dorMonths: 5,
    pSuccess: 35,
    label: "Bear — marginal vs bench"
  },
  best: {
    orrPct: 60,
    benchOrrPct: 30,
    dorMonths: 8,
    pSuccess: 75,
    label: "Best available guess — FIH-adjacent ORR"
  },
  stress: {
    orrPct: 35,
    benchOrrPct: 30,
    dorMonths: 4,
    pSuccess: 20,
    label: "Stress — at ORR threshold"
  }
};

export const VAL_PRESETS = {
  base: {
    v_skinPs: 0.55,
    v_gbmPs: 0.25,
    v_pancPs: 0.15,
    v_prostatePs: 0.2,
    v_mult: 4,
    v_platform: 3
  },
  bull: {
    v_skinPs: 0.7,
    v_gbmPs: 0.4,
    v_pancPs: 0.25,
    v_prostatePs: 0.35,
    v_mult: 5,
    v_platform: 6
  },
  bear: {
    v_skinPs: 0.35,
    v_gbmPs: 0.12,
    v_pancPs: 0.08,
    v_prostatePs: 0.1,
    v_mult: 3,
    v_platform: 0
  }
};

const RESTART_KEYS = Object.keys(DEFAULT_STATE.restart);
const VAL_KEYS = Object.keys(DEFAULT_STATE.val);
const PIPELINE_KEYS = Object.keys(DEFAULT_STATE.pipeline);

function deltaEncode(state, baseline) {
  const d = {};
  for (const k of Object.keys(baseline)) {
    const v = state[k];
    const b = baseline[k];
    if (typeof v === "boolean") {
      if (v !== b) d[k] = v ? 1 : 0;
    } else if (v !== b && v !== undefined) d[k] = v;
  }
  return d;
}

/** Match slider values to nearest named preset for share-link restore UI. */
export function inferActivePresets(state) {
  const out = {
    activeRestartPreset: state.activeRestartPreset || DEFAULT_STATE.activeRestartPreset,
    activeValPreset: state.activeValPreset || DEFAULT_STATE.activeValPreset
  };
  let bestR = null;
  let bestRScore = Infinity;
  for (const [name, preset] of Object.entries(SHARE_PRESETS)) {
    const score = Math.abs((preset.orrPct ?? 0) - state.restart.orrPct);
    if (score < bestRScore) {
      bestRScore = score;
      bestR = name;
    }
  }
  if (bestR && bestRScore <= 1) out.activeRestartPreset = bestR;

  let bestV = null;
  let bestVScore = Infinity;
  for (const [name, preset] of Object.entries(VAL_PRESETS)) {
    const score =
      Math.abs((preset.v_skinPs ?? 0) - state.val.v_skinPs) +
      Math.abs((preset.v_mult ?? 0) - state.val.v_mult);
    if (score < bestVScore) {
      bestVScore = score;
      bestV = name;
    }
  }
  if (bestV && bestVScore <= 0.06) out.activeValPreset = bestV;
  return out;
}

export function buildShareHash(state) {
  const { label: _lb, ...presetCore } = SHARE_PRESETS.base;
  const base = {
    ...DEFAULT_STATE.restart,
    ...presetCore
  };
  const payload = {
    v: 2,
    r: deltaEncode(state.restart, base),
    val: deltaEncode(state.val, DEFAULT_STATE.val),
    pipe: deltaEncode(state.pipeline, DEFAULT_STATE.pipeline)
  };
  if (state.tab !== DEFAULT_STATE.tab) payload.tab = state.tab;
  if (state.activeRestartPreset && state.activeRestartPreset !== DEFAULT_STATE.activeRestartPreset) {
    payload.rp = state.activeRestartPreset;
  }
  if (state.activeValPreset && state.activeValPreset !== DEFAULT_STATE.activeValPreset) {
    payload.vp = state.activeValPreset;
  }
  if (state.ui.explainLvl !== "eli5") payload.ui = { explainLvl: state.ui.explainLvl };
  if (!Object.keys(payload.r).length) delete payload.r;
  if (!Object.keys(payload.val).length) delete payload.val;
  if (!Object.keys(payload.pipe).length) delete payload.pipe;
  const version = payload.v;
  delete payload.v;
  if (!Object.keys(payload).length) return "#s1=";
  return "#s1=" + b64urlEncode(JSON.stringify({ v: version, ...payload }));
}

export function decodeShareHash(hash) {
  if (!hash) return null;
  if (hash === "#") return structuredClone(DEFAULT_STATE);
  if (!hash.startsWith("#s1=")) return null;
  const raw = hash.slice(4);
  if (!raw) return structuredClone(DEFAULT_STATE);
  try {
    const p = JSON.parse(b64urlDecode(raw));
    const s = structuredClone(DEFAULT_STATE);
    if (p.tab) s.tab = p.tab;
    if (p.rp) s.activeRestartPreset = p.rp;
    if (p.vp) s.activeValPreset = p.vp;
    if (p.r) Object.assign(s.restart, p.r);
    if (p.val) Object.assign(s.val, p.val);
    if (p.pipe) Object.assign(s.pipeline, p.pipe);
    if (p.ui) Object.assign(s.ui, p.ui);
    if (!p.rp || !p.vp) {
      const inferred = inferActivePresets(s);
      if (!p.rp) s.activeRestartPreset = inferred.activeRestartPreset;
      if (!p.vp) s.activeValPreset = inferred.activeValPreset;
    }
    return s;
  } catch {
    return null;
  }
}

export function parseEmbedMode(search = "", hash = "") {
  if (typeof location !== "undefined") {
    search = location.search;
    hash = location.hash;
  }
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (q.get("embed") === "1") return true;
  if (hash) {
    const s = decodeShareHash(hash);
    if (s && s.embed) return true;
  }
  return false;
}

export function computeValuationMetrics(val) {
  return computeFullValuation(val);
}

export function paramsFromPreset(name) {
  const q = SHARE_PRESETS[name];
  if (!q) return null;
  const { label, ...rest } = q;
  return { ...DEFAULT_STATE.restart, ...rest };
}

/** Frozen header strip: ReSTART ORR scenario + implied $/sh. */
export function computeHeaderStrip(state) {
  const r = computeRestartMetrics(state.restart);
  const v = computeFullValuation(state.val);
  return {
    preset: state.activeRestartPreset,
    orrPct: state.restart.orrPct,
    wilson: `${(r.wilson.lo * 100).toFixed(0)}–${(r.wilson.hi * 100).toFixed(0)}%`,
    pBeat: (r.pBeatBench * 100).toFixed(0),
    pPma: state.restart.pSuccess,
    ev: v.ev.toFixed(0),
    perSh: v.perSh.toFixed(2)
  };
}

export { RESTART_KEYS, VAL_KEYS, PIPELINE_KEYS };
