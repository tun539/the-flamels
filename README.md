# FlameAtlas — The Flamels

Microgravity combustion evidence workspace. Ten investigation records, 47 source resources, 18 imported runs and 17 numerical observations from PSI-159 and Saffire I–III summary tables.

## Run

### Open on GitHub without installing locally

[Open FlameAtlas in GitHub Codespaces](https://codespaces.new/tun539/the-flamels?quickstart=1)

Create a Codespace on `main`. Setup installs Python/Node dependencies and builds the MVP; startup launches both servers automatically. Open **Ports → 3000 → Open in Browser** when ready. Keep port visibility private: the app does not provide multi-user authentication. Codespaces availability and usage depend on your GitHub account; stop the Codespace when finished. This is an interactive development runtime, not permanent public hosting.

If startup fails, inspect `.runtime/mvp.log`. Run `.venv/bin/python scripts/run_mvp.py --background` to start again. Data stays in that Codespace's `data/flameatlas.db`; export it before deleting the Codespace.

### Docker

```sh
cp .env.example .env
docker compose up --build
```

Open http://localhost:3000. API documentation: http://localhost:8000/docs. SQLite persists in the Docker volume. Services bind to localhost; this is a local research workspace, not an authenticated multi-user deployment.

## Local development

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
python scripts/seed.py
uvicorn backend.app.main:app --reload
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

## Product presentation

Open **Presentation ↗** in the workspace header or visit `/present` for the product showcase. It includes source composition, campaign-specific observation plots, a coverage matrix, source search, presentation controls and print/PDF styles. The showcase works without the API using a versioned repository snapshot. See [presentation guide](docs/presentation.md).

## Source library and reading

Open **Library** for the ten-column source table: 10 data links, 5 Sheet papers, 26 PSI accessions and related NASA resources (47 total). Select **Đọc** for summaries, cited findings and limitations. **Coverage** shows which experimental conditions are actually present. See [new sources and Codespace update](docs/source-expansion.md), [delivery status](docs/completion-status.md) and [testing](docs/testing.md).

## Features

- SQLite and FTS5 study catalogue; study detail and source links.
- Compare 2–4 investigations with explicit missing values.
- Scenario evaluation with conservative relevance bounds, metadata coverage and mismatch flags.
- Evidence retrieval assistant without API keys, with source summaries and locators.
- Validated JSON/CSV import, preview and explicit commit; duplicate detection and import checksums.
- JSON exports can be imported directly; canonical values are not converted a second time. Original units remain attached to each run.
- Comparison includes individual run conditions and flags different measurement quantities, units or methods.
- CSV, JSON and printable HTML exports including provenance and scenario ranking.
- Responsive interface, loading/error/empty states and retry.

## Data and scientific scope

Six overview seed records verify metadata from NASA's Combustion Science overview. CFI-G adds five partial PSI-159 rows and ten observations. Saffire I–III add thirteen sample runs and seven numerical burn durations. The complete preserved Saffire summary tables also contain notes, pre-test rows and blank rows that are excluded from run counts. A NASA page snapshot and checksum accompany the seed. Editorial theme labels are not experimental findings. Imported records are unverified until independently reviewed.

Relevance is not fire hazard. Unknown metadata contributes an interval, not a positive match. No quantitative combustion predictions, certified safety recommendations, or partial-gravity extrapolation are provided.

The assistant defaults to deterministic retrieval. Optional server-side OpenAI evidence selection and cached embedding reranking are configured in .env.example. Measurement plots and import field/unit mapping are available for supplied data. Shared cloud deployment requires authentication and deployment hardening.

## Tests

```sh
python -m unittest discover -s backend/tests
cd frontend
npm run typecheck
npm run build
```

See [18-source PSI batch and Saffire import](docs/psi-batch-two.md), [PSI accessions and partial import](docs/psi-accessions.md), [requirements](docs/product-requirements.txt), [methodology](docs/methodology.md), [data dictionary](docs/data-dictionary.md), [demo](docs/demo.md), and [remaining work](docs/roadmap.md).

Research support tool. Not a certified fire safety assessment.
