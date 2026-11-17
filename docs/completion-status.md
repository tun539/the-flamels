# Delivery status — public-source release

FlameAtlas is a working research MVP with an English presentation site and a full Next.js/FastAPI/SQLite workspace. Source checks in the curated snapshot were last performed on 2026-11-15; this release completes the English software workflow and restricts the public catalogue to distributable public sources.

Five private document-derived references are excluded from public source files, generated snapshots and retrieval indexes. The public catalogue contains no private Drive document links or derived paper summaries.

## Evidence inventory

- 42 catalogued public source resources, including 26 NASA PSI accessions.
- 10 investigation records: six metadata overviews and four campaigns with imported summary rows.
- 18 imported runs and 17 numerical observations: 12 reported durations and five peak burner temperatures.
- Four qualitative Saffire-II outputs remain `Insignificant`, not numerical zero. Saffire-III has two imported condition rows and no measured output.
- Raw table entries, source locators, original units, measurement precision and original-source checksums are preserved.

## Presentation and standalone research tools

The published presentation includes source-composition charts, campaign-specific observation plots, an availability matrix, an investigation explorer, comparison of 2–4 records, source search, cited evidence retrieval, scenario relevance intervals, CSV/JSON exports and print styles. Seven presentation sections support previous/next controls, arrow keys, Page Up/Down and Escape. These tools use a versioned repository snapshot and do not need an active Codespace or model API key.

Browser-local saved research sessions, shareable validated view links, unsaved-change indicators and stale scenario-result warnings are implemented. View links preserve settings while recomputing results against the current dataset.

All interface copy, curated source summaries, published-finding paraphrases, status messages and assistant responses are in English. Original third-party source documents and user-imported content retain their own language.

## Full research workspace

- SQLite/FTS5 investigation and evidence search; investigation detail and individual observations.
- Source library with ten display columns and a reader with findings, access states, DOI links, locators and limitations.
- Comparison of 2–4 investigations with actual run-condition tables and method/unit mismatch warnings.
- Scenario evaluation by the documented conservative lower-bound heuristic, separately from evidence quality or fire hazard.
- Evidence retrieval without keys. Optional server-side model selection and cached embedding reranking use validated evidence IDs and fall back to keyword retrieval.
- JSON/CSV import with preview, unit conversion, duplicate detection and explicit commit; JSON/CSV/printable HTML export.
- Known pre-English seed revisions upgrade only when the stored record matches its accepted checksum. User-edited records are retained. Editorial upgrades cannot change stored measurements.

## Verification and delivery boundaries

CI runs backend tests, snapshot freshness checks, TypeScript compilation, production builds and browser journeys. Browser tests cover the research workflow, missing evidence, imports/exports, comparison, scenario evaluation and snapshot/backend ranking parity.

The standalone site preserves its existing Site access settings. The full workspace runs locally, in Docker or in the existing private Codespace. Publishing the static presentation does not publish the FastAPI backend or add multi-user authentication.

## External dependencies and future scope

Only the inspected source-summary subset is imported. Complete raw archives, independently validated prediction models, video analysis, recurring synchronization and public multi-user deployment are not delivered by this MVP. Optional paid model calls require the user's server-side configuration. Private Drive PDF full text is not redistributed.

Research support tool. Not a certified fire safety assessment.
