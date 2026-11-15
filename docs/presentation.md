# FlameAtlas presentation

Live showcase: https://flameatlas-evidence-studio.kh-ng-gian-l-5063.chatgpt.site (owner-private Site; sign in with the owning ChatGPT account).

Open `/present` in the running MVP. The workspace header links to this route. It has no API dependency: the presentation uses a curated, versioned snapshot so it can also run as a standalone static site.

## Demo sequence

1. Start with the source composition and four inventory counts: 47 resources, 10 investigation records, 18 imported runs, 17 numerical observations. They describe different entities and must not be added together.
2. Choose Saffire-II to inspect five numeric burn durations among nine samples. Select sample 2-9 to inspect its source locator. Its material remains unreported. The other four samples retain the qualitative value `Insignificant` in the table.
3. Choose CFI-G and switch to peak burner temperature. The five observations are in degrees Celsius; these are burner temperatures, not flame temperatures. Each run retains its configuration and provenance. Selecting a point reveals the original source-row conditions, including mass flow, termination type and comments where reported.
4. Choose Saffire-III to demonstrate the explicit missing-output state. No zero or interpolated observation replaces a missing value.
5. Read the coverage matrix. Its numerator is the number of imported runs with a non-null standardized field. Its denominator is the imported runs in that campaign, not the entire NASA archive.
6. Search or expand the source catalogue, open primary-source links and inspect limitations. Use the presentation controller, download the snapshot, or print/save PDF.

## Scientific chart rules

- Plot observations within one campaign and one quantity. Do not join categorical samples into a time series or fit an unsupported trend.
- Require matching units and measurement methods before displaying the shared plot. Different configurations are preserved; differences in values are not presented as causal effects.
- Preserve units, source locators, unrounded values, missing conditions and qualitative outputs. The display rounds labels to three decimals, while the selected-point detail, table and download retain source precision.
- Do not display uncertainty bars when no measurement uncertainty was reported. No exact cabin oxygen is inferred from a range, approximate value, or burner mixture.
- Coverage is data availability, not confidence or fire hazard. No Moon/Mars extrapolation or certified safety assessment is implied.

## Refresh the snapshot

```sh
python scripts/build_presentation_data.py
python scripts/build_presentation_data.py --check
cd frontend
npm run typecheck
npm run build
npm run test:e2e
```

The generator reads `data/seed.json`, `data/psi-seed.json` and `data/resources.json`, excludes synthetic studies, calculates counts and hashes the exact source bytes with SHA-256. It includes source-check dates and a schema version. CI rejects a stale snapshot. The presentation does not automatically reflect imports made into a running workspace database.

## Standalone delivery

The standalone presentation uses the same `Presentation.tsx`, CSS module and generated JSON, with a root page that supplies the existing Codespace URL as `workspaceUrl`. It exports with Next.js `output: "export"`. The research workspace itself remains the full Next.js/FastAPI application. A presentation-site build does not deploy or authenticate that backend.

Site project: `appgprj_6afa4250b3548191808a611678e1e4a8`. Keep this identity for future updates. Existing Site access settings must be preserved.
