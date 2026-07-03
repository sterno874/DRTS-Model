# Contributing

Thanks for helping improve an honest, primary-sourced model — not a bull or bear pitch.

## Ground rules

1. **Cite primary sources** for factual changes (ClinicalTrials.gov, SEC, company IR, peer-reviewed papers). Reddit / retail DD may appear as **community**-tagged scenarios, never as verified facts.
2. **Separate facts from assumptions.** Published enrollment, endpoints, and PR numbers are locked. Undisclosed trial outcomes stay on sliders with plausibility notes.
3. **Show your math** in the relevant tab Methodology panel; add tests in `tests/`.
4. **No investment hype.** Keep disclaimers intact. Do not invent trial results.

## Project structure

```
DRTS-Model/
├── index.html
├── css/main.css
├── js/
│   ├── main.js
│   ├── math/
│   │   ├── device.js      # Wilson, binomial, EV helpers
│   │   ├── restart.js     # ReSTART ORR/DOR + MC
│   │   ├── pipeline.js    # Catalysts, trial facts, community DD
│   │   └── valuation.js   # Peak sales × multiple
│   └── ui/state.js        # Share URLs, presets, header strip
├── tests/
│   └── mutation/          # Lightweight mutation runner
├── RESEARCH.md
└── vercel.json
```

## Run locally

```bash
python3 -m http.server 8080
# http://localhost:8080/
```

ES modules require HTTP (not `file://`).

## Tests

Node 20+ required.

```bash
npm test
npm run test:mutation
node --test tests/restart.test.js
```

CI runs `npm test` on push/PR (`.github/workflows/verify-math.yml`).

## Workflow

1. Fork / branch from `main`
2. Change code + tests together
3. `npm test` must pass (54+ tests)
4. Open PR with source links for any new factual claims

## License

Contributions are under [AGPL-3.0](LICENSE).
