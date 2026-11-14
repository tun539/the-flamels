# Relevance methodology v1

Weights: theme 30%, atmosphere 25%, material/geometry 20%, gravity 15%, measurement 10%. These are design assumptions, not validated scientific risk coefficients.

Each component is 0 (mismatch), 1 (match), or unknown. Lower bound sums known matched weights. Upper bound adds all unknown weights. Coverage sums known weights. Sort by lower bound, then stable investigation ID.

Atmosphere must match oxygen fraction ±0.01, pressure ±5 kPa and airflow ±0.05 m/s in the SAME run. Partial missing atmosphere is unknown. No Cartesian product of independently observed ranges is created. Material matching requires recorded geometry; the requested and recorded geometry strings must also match. This remains a relevance heuristic, not proof of physical equivalence.

The best matching actual run is selected per investigation. No measured runs means atmosphere and measurement components remain unknown. A requested condition mismatch or missing component sets outside-coverage status. Synthetic studies are excluded.

Seed summaries cite NASA overview section headings and describe objectives, not experimentally observed outcomes. Source classification and methodological limitations remain visible in exports.
