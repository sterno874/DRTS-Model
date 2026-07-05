/** Mutation targets for DRTS-Model math modules. */
export const MUTATION_TEST_FILES = [
  "math.test.js",
  "restart.test.js",
  "valuation.test.js",
  "share.test.js",
  "runway.test.js",
  "ui-logic.test.js",
  "pilot.test.js",
  "decision-tree.test.js"
];

export const MUTATION_TARGETS = [
  {
    id: "wilson-denom",
    file: "js/math/device.js",
    description: "Break Wilson denominator",
    apply: (src) => src.replace("const denom = 1 + z2 / n;", "const denom = 1;")
  },
  {
    id: "binom-loop",
    file: "js/math/device.js",
    description: "Skip binomial tail summation",
    apply: (src) => src.replace("for (let x = k; x <= n; x++)", "for (let x = k; x <= k; x++)")
  },
  {
    id: "ev-multiply",
    file: "js/math/valuation.js",
    description: "Drop peak sales multiplication",
    apply: (src) =>
      src.replace(
        "return (patients * penetration * years * price) / 1000;",
        "return patients + penetration;"
      )
  },
  {
    id: "restart-responders",
    file: "js/math/restart.js",
    description: "Wrong responder count formula",
    apply: (src) => src.replace("Math.round((n * orrPct) / 100)", "Math.round(n / orrPct)")
  },
  {
    id: "mc-success",
    file: "js/math/restart.js",
    description: "Invert MC co-primary success condition",
    apply: (src) =>
      src.replace("if (passOrr && passDor) {", "if (!(passOrr && passDor)) {")
  },
  {
    id: "prostate-share",
    file: "js/math/valuation.js",
    description: "Remove Tolmar 60% supply share",
    apply: (src) => src.replace("if (ind.supplyShare) peak *= ind.supplyShare;", "// mutated")
  },
  {
    id: "runway-months",
    file: "js/math/valuation.js",
    description: "Drop quarterly-to-months factor in runway",
    apply: (src) =>
      src.replace("return (cashM / burnQuarterlyM) * 3;", "return cashM / burnQuarterlyM;")
  },
  {
    id: "ev-per-share-cash",
    file: "js/math/device.js",
    description: "Drop cash term from evPerShare",
    apply: (src) =>
      src.replace(
        "return (evMillions + cashMillions - debtMillions) / sharesMillions;",
        "return (evMillions - debtMillions) / sharesMillions;"
      )
  },
  {
    id: "pcombined-blend",
    file: "js/math/restart.js",
    description: "Break pCombined structural/prior blend weights",
    apply: (src) =>
      src.replace(
        "pStructural * 0.55 + pPmaSlider * 0.45",
        "pStructural * 0.99 + pPmaSlider * 0.01"
      )
  },
  {
    id: "share-hash-shares",
    file: "js/ui/state.js",
    description: "Drop v_shares on share-hash restore",
    apply: (src) =>
      src.replace(
        "Object.assign(s.val, p.val);",
        "const { v_shares, ...rest } = p.val; Object.assign(s.val, rest);"
      )
  },
  {
    id: "header-upside-sign",
    file: "js/ui/state.js",
    description: "Drop signed prefix on header upside label",
    apply: (src) =>
      src.replace(
        "${upsidePct >= 0 ? \"+\" : \"\"}${upsidePct.toFixed(0)}%",
        "${upsidePct.toFixed(0)}%"
      )
  },
  {
    id: "registrational-cap",
    file: "js/math/device.js",
    description: "Remove registrational P(s) hard cap",
    apply: (src) =>
      src.replace(
        "return Math.min(p, cap);",
        "return p;"
      )
  }
];
