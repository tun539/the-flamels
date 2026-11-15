# PSI batch two — 2026-11-15

The user supplied 19 links representing 18 unique accessions. PSI-107 appeared twice and PSI-25 already existed. All 18 rendered detail pages were read directly in the NASA PSI browser interface; PSI-25 was updated in place and 17 new source records were added. Library count: 47 resources, including 26 unique PSI accessions. Each source has a verified title, DOI, version, reading scope and limitations.

| Accessions | Group | Integration |
| --- | --- | --- |
| 101, 102 | SAME-R, SAME | Source descriptions and methodology; no newly imported runs |
| 115 | SAME smoke modeling | Model source, not flight observations |
| 98, 99, 100 | Saffire I, II, III | Preserved complete default summary tables; 2 + 9 + 2 sample runs |
| 39 | CFI | Source description, conflicting pressure ranges flagged |
| 106, 107 | SLICE, SPICE | Source descriptions; SLICE table is a date/fuel log |
| 20, 21, 22, 23 | ACME BRE, CLD Flame, E-FIELD, s-Flame | Source descriptions; s-Flame table is a daily aggregate |
| 25, 26 | BASS-II, BASS | Source descriptions; BASS study not duplicated |
| 68, 69 | FLEX-2, FLEX | Source descriptions; ranges are not expanded into fictional combinations |
| 47 | DAFT/DAFT-2 | Instrument feasibility source; existing DAFT study not duplicated |

Table presence and total row counts are reported only where observed after loading: Saffire-I 5 rows, Saffire-II 16, Saffire-III 3, SLICE 13, s-Flame 19, FLEX-2 9 and the selected FLEX table 275. These are table rows, not automatically counts of individual experiments. Other table counts remain unconfirmed. Asynchronous loading initially displayed “No associated Experimental Table” before CSV rows arrived; those temporary labels were not used to conclude that data does not exist.

## Saffire normalization

`data/saffire-observed-tables.json` contains the complete rendered summary tables as strings, including headers, blanks and notes. All three campaigns show CC0-1.0. `data/psi-seed.json` contains the normalized records and a SHA-256 reference to that snapshot.

- Saffire-I: 5 source rows → 2 sample runs. Burn durations: 420 s and 70 s. Airflow: 20 cm/s → 0.2 m/s. Source narrative and table disagree about dimension orientation; geometry remains null and the source cells are preserved. Project metadata also differs from Approach about platform; Cygnus is taken from Approach and the inconsistency is flagged.
- Saffire-II: 16 source rows → 9 sample runs. The first four “Insignificant” outcomes remain qualitative, not zero. Five explicit burn durations become observations. Material cells for 2-6 and 2-9 remain null. “037 mm”, “Samle Thickness” and “?-g” labels are preserved without silent correction. Ambiguous microgravity/ground comparison columns are not imported as measurements.
- Saffire-III: 3 source rows → 2 sample runs and no numerical outcomes. Airflow: 30 cm/s → 0.3 m/s. No burn duration is invented.
- Approximate oxygen values and changing ranges remain in original_values; the exact oxygen_fraction field stays null. Unreported pressure, geometry, measurement uncertainty and time coordinates remain null.

Fresh and existing databases seeded twice produce exactly 10 investigations, 18 runs and 17 observations, including the prior CFI-G sample. These remain summary-table extracts, not the full NASA raw-data archives.

## Current limits and updating Codespaces

No full video, sensor time series, report PDF or modeling .dat file was downloaded in this batch. Metadata hypotheses and objectives are not relabeled as measured findings. Search by exact PSI ID now restricts results to that accession.

Use the pull/build/restart instructions in `source-expansion.md` to update an existing Codespace. The remote Codespace is authenticated and was not changed during this source update.
