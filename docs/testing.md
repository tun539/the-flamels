# Testing and release checks

## Public-source release

```sh
python scripts/build_presentation_data.py --check
python scripts/audit_public_release.py
python -m unittest discover -s backend/tests
npm --prefix frontend run typecheck
npm --prefix frontend run build
cd frontend
npx playwright install --with-deps chromium
npm run test:e2e
```

The catalogue includes 42 public-source resources, 10 investigations, 18 imported runs and 17 numerical observations. Private document-derived references are excluded from the distributed catalogue and snapshot. The public-source audit checks source hosts, source-parent resolution, duplicate IDs and snapshot consistency; it rejects private document links.

Backend checks cover unit conversions, missing values, run integrity, conservative ranking, source retrieval, citation IDs, optional AI fallback, import limits, CSV/JSON round trips, editorial seed upgrades and removal of excluded legacy document records from existing source catalogues.

Browser/API checks cover the full research journey, English source reading, missing-evidence states, observed measurements, qualitative-output preservation, comparison/export, scenario evaluation and backend/browser ranking parity. Session checks cover save/restore, shared links, malformed state, snapshot changes, clipboard fallback, mobile layout and preservation of unsaved scenario/query edits during navigation.

The production frontend and static presentation must both build. A successful build alone does not establish scientific validity of an imported dataset or a prediction model.

Coverage regression checks verify API and offline snapshot parity, default and adjusted windows, measured-only filtering, source links and mobile exports.

## Scenario readiness verification

- Core workspace: 33 backend and 22 Playwright tests passed. TypeScript, the production build, snapshot freshness, and the public-source audit passed.
- Extended edition: the pinned installer and all four integrity tests passed. The backend passed 284 tests and skipped four that require source files absent from the pinned checkout. All nine browser tests passed, including cited retrieval without a model key and the five conceptual 3D studios.
- Core snapshot: `4057b7ee10e9`; coverage method: `ambient-run-coverage-v1`; ranking method: `conservative-run-match-v1`.
