import { riskAdjustedEV, evPerShare } from "../math/device.js";

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
  v: 1,
  tab: "restart",
  activeRestartPreset: "base",
  activeValPreset: "base",
  embed: false,
  restart: {
    n: 88,
    orrPct: 55,
    benchOrrPct: 30,
    dorMonths: 6,
    pSuccess: 65
  },
  pipeline: {
    impactEnroll: 40,
    impactReadoutQ: 4,
    regainN: 10,
    regainLdcPct: 100,
    japanApproved: 1
  },
  val: {
    v_skinPts: 12000,
    v_skinPen: 0.15,
    v_skinPrice: 85,
    v_skinYears: 5,
    v_skinPs: 0.55,
    v_gbmPts: 8000,
    v_gbmPen: 0.08,
    v_gbmPrice: 95,
    v_gbmYears: 4,
    v_gbmPs: 0.25,
    v_pancPts: 35000,
    v_pancPen: 0.05,
    v_pancPrice: 90,
    v_pancYears: 6,
    v_pancPs: 0.15,
    v_platform: 3,
    v_mult: 4,
    v_shares: 42,
    v_cash: 77,
    v_riskadj: true
  },
  ui: { explainLvl: "eli5" }
};

export const SHARE_PRESETS = {
  base: { orrPct: 55, benchOrrPct: 30, pSuccess: 65 },
  bull: { orrPct: 65, benchOrrPct: 28, pSuccess: 80 },
  bear: { orrPct: 42, benchOrrPct: 32, pSuccess: 35 }
};

export const VAL_PRESETS = {
  base: { v_skinPs: 0.55, v_gbmPs: 0.25, v_pancPs: 0.15, v_mult: 4 },
  bull: { v_skinPs: 0.7, v_gbmPs: 0.4, v_pancPs: 0.25, v_mult: 5 },
  bear: { v_skinPs: 0.35, v_gbmPs: 0.12, v_pancPs: 0.08, v_mult: 3 }
};

const RESTART_KEYS = ["n", "orrPct", "benchOrrPct", "dorMonths", "pSuccess"];
const VAL_KEYS = Object.keys(DEFAULT_STATE.val);

function deltaEncode(state, baseline) {
  const d = {};
  for (const k of Object.keys(baseline)) {
    const v = state[k];
    const b = baseline[k];
    if (typeof v === "boolean") {
      if (v !== b) d[k] = v ? 1 : 0;
    } else if (v !== b) d[k] = v;
  }
  return d;
}

export function buildShareHash(state) {
  const base = {
    ...DEFAULT_STATE.restart,
    ...SHARE_PRESETS.base
  };
  const payload = {
    v: 1,
    r: deltaEncode(state.restart, base),
    val: deltaEncode(state.val, DEFAULT_STATE.val)
  };
  if (state.tab !== DEFAULT_STATE.tab) payload.tab = state.tab;
  if (state.ui.explainLvl !== "eli5") payload.ui = { explainLvl: state.ui.explainLvl };
  if (!Object.keys(payload.r).length) delete payload.r;
  if (!Object.keys(payload.val).length) delete payload.val;
  delete payload.v;
  if (!Object.keys(payload).length) return "#s1=";
  return "#s1=" + b64urlEncode(JSON.stringify({ v: 1, ...payload }));
}

export function decodeShareHash(hash) {
  if (!hash || !hash.startsWith("#s1=")) return null;
  const raw = hash.slice(4);
  if (!raw) return structuredClone(DEFAULT_STATE);
  try {
    const p = JSON.parse(b64urlDecode(raw));
    const s = structuredClone(DEFAULT_STATE);
    if (p.tab) s.tab = p.tab;
    if (p.r) Object.assign(s.restart, p.r);
    if (p.val) Object.assign(s.val, p.val);
    if (p.ui) Object.assign(s.ui, p.ui);
    return s;
  } catch {
    return null;
  }
}

export function parseEmbedMode() {
  if (typeof location === "undefined") return false;
  return new URLSearchParams(location.search).get("embed") === "1";
}

export function computeValuationMetrics(val) {
  const inds = [
    {
      name: "skin",
      patients: val.v_skinPts,
      penetration: val.v_skinPen,
      price: val.v_skinPrice,
      years: val.v_skinYears,
      multiple: val.v_mult,
      pSuccess: val.v_riskadj ? val.v_skinPs : 1
    },
    {
      name: "gbm",
      patients: val.v_gbmPts,
      penetration: val.v_gbmPen,
      price: val.v_gbmPrice,
      years: val.v_gbmYears,
      multiple: val.v_mult,
      pSuccess: val.v_riskadj ? val.v_gbmPs : 1
    },
    {
      name: "panc",
      patients: val.v_pancPts,
      penetration: val.v_pancPen,
      price: val.v_pancPrice,
      years: val.v_pancYears,
      multiple: val.v_mult,
      pSuccess: val.v_riskadj ? val.v_pancPs : 1
    }
  ];
  const ev = riskAdjustedEV(inds) + val.v_platform;
  const perSh = evPerShare(ev, val.v_shares, val.v_cash);
  return { ev, perSh, inds };
}

export function paramsFromPreset(name) {
  const q = SHARE_PRESETS[name];
  if (!q) return null;
  return { ...DEFAULT_STATE.restart, ...q };
}
