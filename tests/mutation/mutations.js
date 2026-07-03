/** Mutation targets for DRTS-Model math modules. */
export const MUTATION_TEST_FILES = [
  "math.test.js",
  "restart.test.js",
  "valuation.test.js",
  "share.test.js"
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
    description: "Invert MC success condition",
    apply: (src) => src.replace("if (beatBench && passThresh) wins++;", "if (!beatBench || !passThresh) wins++;")
  },
  {
    id: "prostate-share",
    file: "js/math/valuation.js",
    description: "Remove Tolmar 60% supply share",
    apply: (src) => src.replace("if (ind.supplyShare) peak *= ind.supplyShare;", "// mutated")
  }
];
