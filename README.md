# Alpha Tau Medical ($DRTS) — Interactive Model

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)  
**Live:** https://drts-model.vercel.app · **Source:** https://github.com/sterno874/DRTS-Model

Primary-sourced, open-source interactive model of **Alpha Tau Medical** (NASDAQ: **DRTS**) and its **Alpha DaRT** platform — same architecture as [SLS-Model](https://github.com/sterno874/SLS-Model): static HTML/CSS/ES modules, shareable scenario URLs, Node test harness, Vercel-ready.

> **Assumption:** **DRTS** = Alpha Tau Medical Ltd. Documented in `RESEARCH.md`.

> ⚠️ **Educational / analytical only — not investment, medical, legal, or financial advice.**

## Tabs (Phase 2)

1. **ReSTART (cSCC pivotal)** — Wilson CI + binomial ORR vs historical benchmark (26–40% literature range; cemiplimab/pembrolizumab citations); MC co-primary DOR (per-responder durability prior); modular PMA timeline heuristic; bear/base/bull/best/stress presets ([NCT05323253](https://clinicaltrials.gov/study/NCT05323253)).
2. **Pipeline & catalysts** — IMPACT, REGAIN (n=3 interim caveat), prostate/Tolmar, Japan approval; display-only pilot posteriors (15% registrational P(s) cap); interactive catalyst calendar (2026–2027).
3. **Valuation** — Skin, GBM, pancreatic, prostate (60% Tolmar supply share); skin P(s) links to ReSTART MC P(success) by default; risk-adjusted EV; commercial bull platform capped at $8M; comparables; community DD reality-check table.
4. **Explain (ELI5 → PhD)** — Alpha vs beta/gamma, device PMA vs drug NDA, single-arm ORR logic — all sourced.
5. **The Biology** — Ra-224 decay chain SVG, hypoxia independence, seed placement — Keisari/Kelson / PubMed citations.

## Run locally

```bash
cd DRTS-Model
python3 -m http.server 8080
npm test
```

Or open via any static host. No build step, no npm analytics packages, no server-side storage. Vercel Web Analytics loads only on `*.vercel.app` deployments (not local file open).

Share URLs encode slider deltas: `#s1=<base64>` (empty hash = defaults).

Example (bull ReSTART scenario):  
`https://drts-model.vercel.app/#s1=eyJ2IjoyLCJyIjp7Im9vcnJQY3QiOjY1LCJiZW5jaE9yclBjdCI6Mjh9fX0`

Append `?embed=1` to hide chrome for iframe embeds.

## Deploy (Vercel)

Zero-config static site — same layout as [SLS-Model](https://github.com/sterno874/SLS-Model). Import [sterno874/DRTS-Model](https://github.com/sterno874/DRTS-Model) at [vercel.com/new](https://vercel.com/new); Vercel serves `index.html` from the repo root automatically. Assign the domain `drts-model.vercel.app` in **Project → Settings → Domains**. Enable **Web Analytics** in the Vercel project settings → **Analytics** tab (required for visitor counts to flow; the static `/_vercel/insights/script.js` snippet in `index.html` only works when hosted on Vercel). No build step or `package.json` dependencies required for deploy (`vercel.json` sets `cleanUrls` only) — this is not a Next.js app, so `@vercel/analytics/next` does not apply.

Redeploy from CLI (optional):

```bash
vercel deploy --prod
```

## File structure

```
DRTS-Model/
├── index.html          # HTML shell, meta/OG tags, Vercel Web Analytics snippet
├── css/main.css
├── js/main.js
├── js/math/{device,restart,pipeline,valuation}.js
├── js/ui/state.js
├── tests/               # unit/smoke tests + mutation runner
├── RESEARCH.md
├── CONTRIBUTING.md
└── vercel.json
```

## Phase 3 roadmap

- Public SAP-aligned ORR/DOR success rules when disclosed
- Full DOR time-to-event (KM) module
- IMPACT/REGAIN Bayesian monitoring stubs
- Live stock price / market cap overlay (optional)
- Dilution / burn-rate scenario tab
- Vercel deploy + stale-data badge automation

## Key sources

ClinicalTrials.gov: NCT05323253, NCT06698458, NCT06910306, NCT07290998  
PubMed: [31759075](https://pubmed.ncbi.nlm.nih.gov/31759075/) (FIH SCC/H&N), [29863979](https://pubmed.ncbi.nlm.nih.gov/29863979/) (cemiplimab cSCC)  
IR: https://www.alphatau.com/

## License

AGPL-3.0 — see [LICENSE](LICENSE).
