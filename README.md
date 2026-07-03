# Alpha Tau Medical ($DRTS) — Interactive Model

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)  
**Live (planned):** https://drts-model.vercel.app

Primary-sourced, open-source interactive model of **Alpha Tau Medical** (NASDAQ: **DRTS**) and its **Alpha DaRT** platform — same architecture as [SLS-Model](https://github.com/sterno874/SLS-Model): static HTML/CSS/ES modules, shareable scenario URLs, Node test harness, Vercel-ready.

> **Assumption:** **DRTS** = Alpha Tau Medical Ltd. (not another issuer). Documented in `RESEARCH.md`.

> ⚠️ **Educational / analytical only — not investment, medical, legal, or financial advice.** Phase 1 is research + scaffold; sliders are undisclosed assumptions.

## Tabs (Phase 1 shell)

1. **ReSTART (cSCC pivotal)** — single-arm ORR vs benchmark stub ([NCT05323253](https://clinicaltrials.gov/study/NCT05323253)); 88 patients enrolled May 2026.
2. **Pipeline & catalysts** — IMPACT pancreatic, REGAIN GBM, prostate pilot, Japan approval — fact grid with primary links.
3. **Valuation** — transparent peak-sales × multiple model (risk-adjusted); GBM/panc fully wired in Phase 2.
4. **Explain (ELI5 → PhD)** — mechanism, device regulatory path, model caveats.
5. **The Biology** — Alpha DaRT / Ra-224 placeholder diagram + sourced bullets.

## Run locally

```bash
cd DRTS-Model
python3 -m http.server 8080
# open http://localhost:8080/
```

```bash
npm test
```

No build step. ES modules require HTTP (not `file://`).

## File structure

```
DRTS-Model/
├── index.html
├── css/main.css
├── js/
│   ├── main.js
│   ├── math/device.js
│   └── ui/state.js
├── tests/
├── RESEARCH.md          # Phase 1 research notes (temporary)
├── vercel.json
└── LICENSE              # AGPL-3.0
```

## Phase 2 roadmap

- ReSTART: SAP-aligned ORR/DOR success rules, modular PMA timeline MC
- IMPACT / REGAIN: pilot safety & response models, catalyst calendar
- Valuation: full indication sliders, Tolmar supply economics, dilution scenarios
- Community DD panel with verified/rejected Reddit claims
- References migration from `RESEARCH.md` into tab panels

## Key sources

ClinicalTrials.gov: NCT05323253, NCT06698458, NCT06910306, NCT07290998, NCT03015883  
PubMed: [31759075](https://pubmed.ncbi.nlm.nih.gov/31759075/) (FIH SCC/H&N)  
IR: https://www.alphatau.com/

## License

AGPL-3.0 — see [LICENSE](LICENSE). Network use of modified versions must share source.
