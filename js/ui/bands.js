/**
 * Prior / implausible / anchor bands for ReSTART and Valuation sliders.
 * Blue strips = 1σ/2σ/3σ plausible priors; red hatch = hard-to-defend zone; ◆ = reported anchor.
 */

export function pctB(v, mn, mx) {
  return Math.min(100, Math.max(0, ((v - mn) / (mx - mn)) * 100));
}

/** ReSTART scenario sliders — ORR/DOR/PMA priors for cSCC pivotal. */
export const RESTART_BANDS = [
  {
    id: "rorrPct",
    min: 20,
    max: 85,
    sig: { b1: [45, 65], b2: [35, 75], b3: [20, 85] },
    imp: [78, 85],
    anchor: null,
    why: "Assumed true ORR (undisclosed). FIH DaRT SCC/HN 78.6% CR in 28 lesions — different design; do not treat as ReSTART ORR anchor."
  },
  {
    id: "rbenchOrrPct",
    min: 10,
    max: 50,
    sig: { b1: [26, 38], b2: [22, 45], b3: [10, 50] },
    anchor: 47,
    why: "Historical benchmark p₀. Recurrent cSCC systemic therapy ~26–40%; cemiplimab metastatic pivotal ORR 47% (Migden 2018)."
  },
  {
    id: "rorrThresholdPct",
    min: 20,
    max: 60,
    sig: { b1: [30, 40], b2: [25, 48], b3: [20, 60] },
    anchor: 35,
    why: "Success threshold until public SAP — default 35% is adjustable assumption."
  },
  {
    id: "rdorMonths",
    min: 3,
    max: 12,
    sig: { b1: [5, 8], b2: [4, 10], b3: [3, 12] },
    imp: [10, 12],
    anchor: null,
    why: "Assumed median DOR (months). Primary endpoint is DOR at 6 months — not full KM in this stub."
  },
  {
    id: "rdorBenchMonths",
    min: 3,
    max: 12,
    sig: { b1: [5, 7], b2: [4, 9], b3: [3, 12] },
    anchor: 6,
    why: "DOR gate per ReSTART protocol — 6-month durability co-primary."
  },
  {
    id: "rdorDurablePct",
    min: 40,
    max: 95,
    sig: { b1: [70, 90], b2: [55, 95], b3: [40, 95] },
    anchor: 81,
    why: "MC P(DOR≥6mo | responder). Default 81% from pembrolizumab LA cSCC label."
  },
  {
    id: "rdorMinFracPct",
    min: 25,
    max: 90,
    sig: { b1: [40, 70], b2: [30, 80], b3: [25, 90] },
    anchor: 50,
    why: "MC co-primary: min fraction of responders that must be durable."
  },
  {
    id: "rpSuccess",
    min: 5,
    max: 95,
    sig: { b1: [45, 75], b2: [30, 85], b3: [5, 95] },
    imp: [88, 95],
    why: "Subjective P(modular PMA approval | data). Blended with structural ORR/DOR score in model."
  },
  {
    id: "rn",
    min: 40,
    max: 100,
    sig: { b1: [82, 92], b2: [75, 98], b3: [40, 100] },
    anchor: 88,
    why: "Enrollment n — 88 patients complete May 2026 (company PR)."
  }
];

/** Regulatory decision tree sliders (element ids r + dt*). */
export const DECISION_TREE_BANDS = [
  {
    id: "rdtAcceptModular",
    min: 5,
    max: 90,
    sig: { b1: [50, 75], b2: [35, 85], b3: [5, 90] },
    anchor: 65,
    why: "P(FDA accept modular PMA | topline pass) — module 1 submitted Jan 2026; Breakthrough Device path."
  },
  {
    id: "rdtDeferData",
    min: 0,
    max: 60,
    sig: { b1: [15, 35], b2: [8, 45], b3: [0, 60] },
    why: "P(clock-stop / defer more data) — modular PMA Q-subs; not FDA clock."
  },
  {
    id: "rdtReject",
    min: 0,
    max: 40,
    sig: { b1: [5, 18], b2: [2, 25], b3: [0, 40] },
    imp: [30, 40],
    why: "P(FDA reject | topline pass) — single-arm historical-control bias per FDA device guidance."
  },
  {
    id: "rdtCommFast",
    min: 5,
    max: 60,
    sig: { b1: [15, 35], b2: [10, 45], b3: [5, 60] },
    why: "Commercial fast-ramp branch weight — 1.4× base pen multiplier in tree."
  },
  {
    id: "rdtCommBase",
    min: 10,
    max: 70,
    sig: { b1: [35, 55], b2: [25, 60], b3: [10, 70] },
    anchor: 50,
    why: "Commercial base-ramp branch weight — matches valuation pen slider."
  },
  {
    id: "rdtCommSlow",
    min: 5,
    max: 60,
    sig: { b1: [15, 35], b2: [10, 45], b3: [5, 60] },
    why: "Commercial slow-ramp branch weight — 0.6× base pen multiplier in tree."
  }
];

/** ReSTART + decision tree sliders — alias for extenders. */
export const CFG_RESTART = [...RESTART_BANDS, ...DECISION_TREE_BANDS];

/** Valuation sliders — epidemiology, pricing, and P(success) priors. */
export const VAL_BANDS = [
  {
    id: "vv_skinPts",
    min: 2000,
    max: 25000,
    sig: { b1: [8000, 18000], b2: [5000, 22000], b3: [2000, 25000] },
    why: "US addressable recurrent/locally advanced cSCC patients/yr — SEER-derived estimate (~12K default)."
  },
  {
    id: "vv_skinPen",
    min: 0.02,
    max: 0.4,
    sig: { b1: [0.08, 0.22], b2: [0.05, 0.3], b3: [0.02, 0.4] },
    imp: [0.32, 0.4],
    why: "Peak penetration for intratumoral device — no approved direct comp; cemiplimab SoC caps share."
  },
  {
    id: "vv_skinPrice",
    min: 30,
    max: 150,
    sig: { b1: [65, 110], b2: [50, 130], b3: [30, 150] },
    anchor: 85,
    imp: [130, 150],
    why: "Procedure price ($K) — intratumoral radiotherapy; no US list price yet."
  },
  {
    id: "vv_skinPs",
    min: 0.05,
    max: 0.95,
    sig: { b1: [0.35, 0.7], b2: [0.2, 0.85], b3: [0.05, 0.95] },
    why: "Model P(success | assumptions) — when linked: trial co-primary × PMA haircut (not MC alone / not approval certainty)."
  },
  {
    id: "vv_approvalHaircut",
    min: 0.25,
    max: 1,
    sig: { b1: [0.55, 0.85], b2: [0.4, 0.95], b3: [0.25, 1] },
    anchor: 0.75,
    why: "P(PMA approval | trial co-primary success) — haircut when link is on; default 75%."
  },
  {
    id: "vv_gbmPts",
    min: 1000,
    max: 15000,
    sig: { b1: [5000, 12000], b2: [3000, 14000], b3: [1000, 15000] },
    why: "US rGBM addressable patients/yr — REGAIN feasibility only; low P(success) in model."
  },
  {
    id: "vv_gbmPen",
    min: 0.01,
    max: 0.2,
    sig: { b1: [0.04, 0.12], b2: [0.02, 0.16], b3: [0.01, 0.2] },
    imp: [0.15, 0.2],
    why: "GBM penetration — ablative local therapy niche; OS benefit unproven."
  },
  {
    id: "vv_gbmPrice",
    min: 40,
    max: 150,
    sig: { b1: [70, 120], b2: [55, 140], b3: [40, 150] },
    why: "GBM procedure pricing assumption."
  },
  {
    id: "vv_gbmPs",
    min: 0.05,
    max: 0.6,
    sig: { b1: [0.12, 0.35], b2: [0.08, 0.45], b3: [0.05, 0.6] },
    imp: [0.45, 0.6],
    why: "P(REGAIN approval) — interim n=3 local control ≠ OS; keep low."
  },
  {
    id: "vv_pancPts",
    min: 5000,
    max: 50000,
    sig: { b1: [20000, 42000], b2: [12000, 48000], b3: [5000, 50000] },
    why: "Pancreatic addressable patients/yr — IMPACT pilot only."
  },
  {
    id: "vv_pancPen",
    min: 0.01,
    max: 0.15,
    sig: { b1: [0.03, 0.08], b2: [0.02, 0.12], b3: [0.01, 0.15] },
    why: "Panc penetration — early feasibility; pooled ASCO OS is separate design."
  },
  {
    id: "vv_pancPrice",
    min: 40,
    max: 150,
    sig: { b1: [70, 110], b2: [55, 130], b3: [40, 150] },
    why: "Panc procedure pricing assumption — IMPACT pilot only."
  },
  {
    id: "vv_pancPs",
    min: 0.05,
    max: 0.5,
    sig: { b1: [0.08, 0.22], b2: [0.05, 0.32], b3: [0.05, 0.5] },
    why: "P(pancreatic approval) — no US response data disclosed for IMPACT."
  },
  {
    id: "vv_prostatePts",
    min: 3000,
    max: 30000,
    sig: { b1: [10000, 22000], b2: [6000, 28000], b3: [3000, 30000] },
    why: "Prostate patients/yr — Tolmar commercialization deal (60% net to Alpha Tau)."
  },
  {
    id: "vv_prostatePen",
    min: 0.01,
    max: 0.2,
    sig: { b1: [0.04, 0.1], b2: [0.02, 0.14], b3: [0.01, 0.2] },
    why: "Prostate penetration — partner-led; Alpha Tau as device supplier."
  },
  {
    id: "vv_prostatePrice",
    min: 30,
    max: 120,
    sig: { b1: [55, 95], b2: [40, 110], b3: [30, 120] },
    why: "Prostate procedure price assumption."
  },
  {
    id: "vv_prostatePs",
    min: 0.05,
    max: 0.5,
    sig: { b1: [0.1, 0.28], b2: [0.06, 0.38], b3: [0.05, 0.5] },
    why: "P(prostate approval) — earlier than GBM/panc in partner timeline."
  },
  {
    id: "vv_japanPts",
    min: 1000,
    max: 12000,
    sig: { b1: [2500, 6000], b2: [1500, 8000], b3: [1000, 12000] },
    why: "Japan unresectable/recurrent H&N eligible pool (assumption — not disclosed)."
  },
  {
    id: "vv_japanPen",
    min: 0.01,
    max: 0.3,
    sig: { b1: [0.04, 0.12], b2: [0.02, 0.18], b3: [0.01, 0.3] },
    why: "Japan H&N penetration — Shonin approved; PMS/reimbursement lag."
  },
  {
    id: "vv_japanPrice",
    min: 30,
    max: 120,
    sig: { b1: [50, 85], b2: [40, 100], b3: [30, 120] },
    why: "Japan procedure price ($K) — assumption; no list price disclosed."
  },
  {
    id: "vv_japanPs",
    min: 0.1,
    max: 0.9,
    sig: { b1: [0.35, 0.65], b2: [0.2, 0.8], b3: [0.1, 0.9] },
    why: "P(Japan commercial ramp) — approval verified; revenue unverified (PMS n=66 ≠ sales)."
  },
  {
    id: "vv_shares",
    min: 40,
    max: 120,
    sig: { b1: [85, 95], b2: [75, 105], b3: [40, 120] },
    anchor: 88,
    why: "Ordinary shares (M) — ◆ default ~88.0M per SEC F-3 / 20-F; header $/sh denominator. Dilution stress 100–110M for F-3/ATM."
  },
  {
    id: "vv_refPrice",
    min: 5,
    max: 30,
    sig: { b1: [10, 16], b2: [8, 20], b3: [5, 30] },
    anchor: 13,
    why: "Illustrative ref price ($/sh) — assumption as-of ~Jul 2026; not a live quote or data feed."
  },
  {
    id: "vv_cash",
    min: 10,
    max: 150,
    sig: { b1: [65, 90], b2: [45, 110], b3: [10, 150] },
    anchor: 76.9,
    why: "Cash ($M) — ◆ FY2025 ~$76.9M filing anchor; default slider uses Q1 2026 ~$80.2M."
  },
  {
    id: "vv_burnQuarterly",
    min: 4,
    max: 20,
    sig: { b1: [5, 8], b2: [4.5, 12], b3: [4, 20] },
    anchor: 6.5,
    imp: [12, 20],
    why: "Quarterly cash burn ($M) — CFO interview (company-reported, not audited CFS) ~$5–6M+/qtr; not GAAP op loss $13.3M."
  },
  {
    id: "vv_mult",
    min: 2,
    max: 8,
    sig: { b1: [3, 5.5], b2: [2.5, 6.5], b3: [2, 8] },
    imp: [7, 8],
    why: "EV / peak-sales multiple — device biotech convention ~3–6×."
  },
  {
    id: "vv_platform",
    min: 0,
    max: 20,
    sig: { b1: [1, 6], b2: [0, 10], b3: [0, 20] },
    imp: [14, 20],
    why: "Platform optionality ($M, not $B) — residual optionality; Japan H&N is a separate indication line."
  },
  {
    id: "vv_platformImmune",
    min: 0,
    max: 5,
    sig: { b1: [0, 2], b2: [0, 3], b3: [0, 5] },
    imp: [4, 5],
    why: "🔬 Immune / abscopal upside ($M) — JRPR 2024 emerging only; not pivotal proof."
  },
  {
    id: "vv_platformCorrHaircut",
    min: 0,
    max: 30,
    sig: { b1: [0, 12], b2: [0, 20], b3: [0, 30] },
    imp: [25, 30],
    why: "Non-skin EV correlation haircut — skin approval does not fully transfer to GBM/panc/Japan."
  },
  {
    id: "vv_nonSkinSkinLink",
    min: 0,
    max: 1,
    sig: { b1: [0.25, 0.65], b2: [0.1, 0.85], b3: [0, 1] },
    anchor: 0.5,
    why: "Non-skin P(s) blend toward skin when link toggle is on — λ fraction in model."
  }
];

/** Valuation sliders — alias for extenders. */
export const CFG_VAL = VAL_BANDS;

export const ALL_BANDS = [...CFG_RESTART, ...CFG_VAL];

export function buildBands(getEl) {
  ALL_BANDS.forEach((c) => {
    const host = getEl("band-" + c.id);
    if (!host) return;
    host.style.position = "relative";
    host.style.height = "12px";
    host.innerHTML = "";
    const strip = document.createElement("div");
    strip.className = "strip sigma";
    strip.style.top = "1px";
    strip.title = c.why || "Prior plausibility band (1σ/2σ/3σ).";
    const seg = (lohi, op) => {
      const s = document.createElement("div");
      s.className = "seg";
      s.style.left = pctB(lohi[0], c.min, c.max) + "%";
      s.style.width = pctB(lohi[1], c.min, c.max) - pctB(lohi[0], c.min, c.max) + "%";
      s.style.background = "rgba(47,111,237," + op + ")";
      return s;
    };
    strip.appendChild(seg(c.sig.b3, 0.14));
    strip.appendChild(seg(c.sig.b2, 0.28));
    strip.appendChild(seg(c.sig.b1, 0.5));
    if (c.imp) {
      const im = document.createElement("div");
      im.className = "seg imp";
      im.title = "Implausible / hard to defend — " + (c.why || "");
      im.style.left = pctB(c.imp[0], c.min, c.max) + "%";
      im.style.width = pctB(c.imp[1], c.min, c.max) - pctB(c.imp[0], c.min, c.max) + "%";
      strip.appendChild(im);
    }
    host.appendChild(strip);
    if (c.anchor != null) {
      const a = document.createElement("div");
      a.style.position = "absolute";
      a.style.top = "-3px";
      a.style.left = "calc(" + pctB(c.anchor, c.min, c.max) + "% - 4px)";
      a.style.fontSize = "9px";
      a.style.color = "#111";
      a.textContent = "◆";
      a.title = "Reported / anchor value: " + c.anchor;
      host.appendChild(a);
    }
    const mk = document.createElement("div");
    mk.className = "marker";
    mk.id = "mk-" + c.id;
    mk.style.height = "12px";
    host.appendChild(mk);
  });
}

export function renderBands(getEl, getValue) {
  ALL_BANDS.forEach((c) => {
    const m = getEl("mk-" + c.id);
    if (!m) return;
    const raw = getValue(c.id);
    const v = raw != null ? +raw : c.min;
    m.style.left = "calc(" + pctB(v, c.min, c.max) + "% - 1px)";
  });
}

/** Test helper: band config covers slider min/max from HTML defaults. */
export function bandCoversRange(cfg, min, max) {
  return cfg.min <= min && cfg.max >= max && cfg.sig.b3[0] >= min && cfg.sig.b3[1] <= max;
}
