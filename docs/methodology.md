# Relevance methodology v1

Weights: theme 30%, atmosphere 25%, material/geometry 20%, gravity 15%, measurement 10%. These are design assumptions, not validated scientific risk coefficients.

Each component is 0 (mismatch), 1 (match), or unknown. Lower bound sums known matched weights. Upper bound adds all unknown weights. Coverage sums known weights. Sort by lower bound, then stable investigation ID.

Atmosphere must match oxygen fraction ±0.01, pressure ±5 kPa and airflow ±0.05 m/s in the SAME run. Partial missing atmosphere is unknown. No Cartesian product of independently observed ranges is created. Material matching requires recorded geometry; the requested and recorded geometry strings must also match. This remains a relevance heuristic, not proof of physical equivalence.

The best matching actual run is selected per investigation. No measured runs means atmosphere and measurement components remain unknown. A requested condition mismatch or missing component sets outside-coverage status. Synthetic studies are excluded.

Seed summaries cite NASA overview section headings and describe objectives, not experimentally observed outcomes. Source classification and methodological limitations remain visible in exports.

## Scenario readiness and atmosphere coverage

The scenario evaluation API adds `evidence_coverage`. `POST /api/scenarios/coverage` accepts the same scenario fields with an optional `filters` object and returns the coverage report alone. The report includes a catalogue fingerprint, method version, run provenance and evidence IDs as `[investigation_id, run_id]` pairs. JSON and printable HTML investigation exports include the report for their selected investigations when a scenario is supplied. The dedicated coverage export includes the active filters, window, exact paired coordinates, counts and per-run source locators.

The `ambient-run-coverage-v1` rule uses an inclusive window of ±4 oxygen percentage points and ±13.789514586336 kPa (2 psi) by default. The interface allows adjustments and filters by investigation, run material and atmosphere basis.

| Check | Numerator | Denominator |
| --- | --- | --- |
| Recorded atmosphere | Source-linked runs with a jointly measured or source-reported ambient oxygen and total-pressure pair | All filtered runs |
| Nearby atmosphere | Eligible reported pairs within the selected window | All eligible reported pairs |
| Gravity regime | Source-linked runs matching the requested gravity label | Source-linked runs with a reported gravity label |
| Applicable solid materials | Nearby runs with matching gravity, explicit solid phase and the requested material when supplied | Nearby runs with matching gravity and any explicit material phase |

A check is thin with one or two supporting runs and documented from three supporting runs. Missing applies when the relevant evidence is unavailable. Outside coverage applies when an eligible comparison cohort exists but has no matches. An empty filtered result has no applicable checks. The gap map shows test-matrix pairs as outlined squares, and the reported-run counts exclude them. Assumed, derived, model-output and oxidizer-stream conditions are excluded from the map. Single-source legacy runs retain their locators; a multi-source run requires an explicit run-level link.

The atmosphere search does not match diluent mixtures, fuels, hardware or geometry. The readiness counts characterize coverage of the catalogue, and the ranking retains its independent `conservative-run-match-v1` relevance method.
