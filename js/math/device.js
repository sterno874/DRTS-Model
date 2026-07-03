/** Generic device-trial math utilities for DRTS-Model (Phase 1). */

export const LN2 = Math.log(2);

/** Standard normal CDF (Abramowitz & Stegun). */
export function Phi(x) {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + s * y);
}

/** Log-factorial via Stirling for moderate k; exact for small k. */
function logFactorial(k) {
  if (k <= 1) return 0;
  let s = 0;
  for (let i = 2; i <= k; i++) s += Math.log(i);
  return s;
}

/** Binomial log-likelihood P(X=k | n, p). */
export function logBinom(k, n, p) {
  if (p <= 0) return k === 0 ? 0 : -1e9;
  if (p >= 1) return k === n ? 0 : -1e9;
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
}

/**
 * Wilson score interval for binomial proportion (ORR etc.).
 * @returns {{ lo: number, hi: number, p: number }}
 */
export function wilsonInterval(successes, n, z = 1.96) {
  if (n <= 0) return { lo: 0, hi: 1, p: 0 };
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denom;
  return { lo: Math.max(0, center - margin), hi: Math.min(1, center + margin), p };
}

/**
 * Exact binomial one-sided P(X >= k | n, p0) — useful for single-arm ORR vs benchmark.
 */
export function binomUpperTail(k, n, p0) {
  let s = 0;
  for (let x = k; x <= n; x++) {
    s += Math.exp(logBinom(x, n, p0));
  }
  return Math.min(1, Math.max(0, s));
}

/** Exponential survival S(t) = exp(-λ t), λ = ln2 / mOS. */
export function sExp(t, mOS) {
  if (t <= 0 || mOS <= 0) return 1;
  return Math.exp(-LN2 * t / mOS);
}

/** Restricted mean survival time (trapezoid) to tau months. */
export function rmst(fn, tau, h = 0.25) {
  let s = 0;
  for (let t = 0; t < tau; t += h) s += (fn(t) + fn(t + h, tau)) / 2 * h;
  return s;
}

function sExpWrapper(t, tau) {
  return sExp(t, tau);
}

/** Simple risk-adjusted EV: sum of (peakSales × multiple × P(success)). Price in $K. */
export function riskAdjustedEV(indications) {
  return indications.reduce((sum, ind) => {
    const peak = (ind.patients * ind.penetration * ind.years * ind.price) / 1000;
    return sum + peak * ind.multiple * ind.pSuccess;
  }, 0);
}

/** Per-share EV from enterprise value and shares outstanding (millions). */
export function evPerShare(evMillions, sharesMillions, cashMillions = 0, debtMillions = 0) {
  if (sharesMillions <= 0) return NaN;
  return (evMillions + cashMillions - debtMillions) / sharesMillions;
}

/** TODO Phase 2: modular PMA timeline MC, IMPACT pilot Bayesian monitoring, REGAIN GBM RANO response model. */
