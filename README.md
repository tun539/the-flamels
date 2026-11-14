# FlameAtlas — The Flamels

Microgravity combustion evidence workspace. Six NASA-sourced investigation metadata records; no fabricated measurement runs.

## Run

```sh
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

## Features

- SQLite and FTS5 study catalogue; study detail and source links.
- Compare 2–4 investigations with explicit missing values.
- Scenario evaluation with conservative relevance bounds, metadata coverage and mismatch flags.
- Evidence retrieval assistant without API keys, with source summaries and locators.
- Validated JSON/CSV import, preview and explicit commit; duplicate detection and import checksums.
- CSV, JSON and printable HTML exports including provenance and scenario ranking.
- Responsive interface, loading/error/empty states and retry.

## Data and scientific scope

The six seed records verify metadata from NASA's Combustion Science overview. There are **zero imported experimental runs**. A NASA page snapshot and checksum accompany the seed. Editorial theme labels are not experimental findings. Imported records are unverified until independently reviewed.

Relevance is not fire hazard. Unknown metadata contributes an interval, not a positive match. No quantitative combustion predictions, certified safety recommendations, or partial-gravity extrapolation are provided.

The assistant currently provides deterministic retrieval. Optional generative LLM/embedding adapters, measurement time-series plots, advanced ingestion mapping, and authenticated cloud deployment are not implemented.

## Tests

```sh
python -m unittest discover -s backend/tests
cd frontend
npm run typecheck
npm run build
```

See [requirements](docs/product-requirements.txt), [methodology](docs/methodology.md), [data dictionary](docs/data-dictionary.md), [demo](docs/demo.md), and [remaining work](docs/roadmap.md).

Research support tool. Not a certified fire safety assessment.
