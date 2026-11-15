# Eight user-supplied PSI accessions — 2026-11-15

All eight rendered NASA PSI detail pages were inspected directly in the browser. Plain web extraction returned empty HTML text, which did not mean the repository was unavailable. This supersedes the earlier access limitation for PSI-117.

| PSI | Version | Type / scope | Verified access |
| --- | --- | --- | --- |
| 117 | 2 | Ground CFD study of cool droplet flames | Description and file categories; analyzed data/reports listed, no attached experimental/model table |
| 159 | 1 | ACME CFI-G, ISS gas diffusion flames | Default experimental table: 180 rows reported; first 5 transcribed, 10 outcome observations imported |
| 10 | 1 | ACME Flame Design, ISS gas diffusion flames | Default experimental table: 121 rows reported; not imported |
| 62 | 1 | Ground UFGM study using BASS/BASS-II | Metadata package listed; no experimental/model table |
| 60 | 1 | Ground analysis of SPICE imagery | Metadata package listed; no experimental/model table |
| 181 | 1 | Materials science, solder alloys | Raw-data archives listed; context only, excluded from assistant evidence |
| 142 | 2 | Ground counterflow cool-flame study | Analyzed XLSX and experimental CSV filenames in version history; not downloaded |
| 108 | 4 | STDCE-1 thermocapillary fluid physics | Description read; context only, excluded from assistant evidence |

## Partial PSI-159 import

`data/psi159-observed-rows.json` preserves the exact visible headers and five source rows as strings, including blanks. It includes the source DOI, version, date, license and partial extraction scope. `data/psi-seed.json` is the normalized investigation record. The source record carries the SHA-256 of the preserved snapshot.

Test IDs: 21088A1, 21088 B1, 21088 C1, 21088 D1, 21088 F1. Burn duration and peak burner temperature are retained with units; uncertainty and time coordinates remain unreported. Peak burner temperature is not flame temperature. Tad is not imported as a measured outcome. Source instruments/calibration are not specified in the summary table, so measurement methods are labeled unreported.

Original pressure in bar is retained with its conversion to kPa in original_values. Oxygen and pressure are deliberately not mapped into the scenario's cabin-atmosphere fields: XO2 and fuel placement depend on burner configuration. Flow mass rate is not converted into air velocity. No interpolation or synthetic points were added.

This is a partial import of one selected table, not a claim to cover all PSI-159 tables or its raw-data archive. The initial library now has 30 resources; seeding a fresh database adds one CFI-G investigation to the original six, five runs and ten observations. Other accessions remain library metadata rather than being counted as equivalent flight experiments.

## Update Codespaces

See `source-expansion.md` for pull/build/restart steps. The launcher reseeds the catalogue and library. The live authenticated Codespace has not been modified by this session.
