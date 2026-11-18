# FlameAtlas Research Platform — The Flamels edition

A complete, separately runnable adaptation of [COngtuthien/SpaceFire-AI](https://github.com/COngtuthien/SpaceFire-AI), pinned to source commit `9817452c3effdf03864dea65f23d1f767b33251b`.

The installation clones **the entire reference source repository and its committed NASA files**, verifies 48 immutable source/curation files, and applies `flamels-edition.patch`. It retains the original README and authorship. The full materialized application lives in `.runtime/research-platform`; it is not a reduced UI mockup. The pin, file manifest and patch make the edition reproducible without duplicating a second large research archive in this repository.

## Quick start — Windows

Install Git, Python 3.11–3.13 and Node.js 20 or newer. Use a short path, such as `C:\Flamels`.

```bat
git clone https://github.com/tun539/the-flamels.git C:\Flamels
cd /d C:\Flamels
setup.cmd
launch.cmd
```

Open `http://127.0.0.1:3000`. Keep the terminal open; Ctrl+C stops both servers. Setup downloads dependencies and the complete reference source. Its duration depends on your connection.

If a port is busy, run `launch.cmd --frontend-port 3001 --api-port 8001`. The launcher rebuilds the frontend proxy when the backend port changes. It does not terminate unrelated processes.

## Linux / macOS

```sh
python3 scripts/research_platform.py setup
python3 scripts/research_platform.py start
```

`prepare` downloads and verifies the complete source without installing or running dependencies. `status` checks the running full-stack application. `start --background --host 0.0.0.0` is available for private Codespaces; logs go to `.runtime/research-platform.log`.

## Included routes

| Route | Function |
| --- | --- |
| `/` | The Flamels home, NASA media and guided research entry points |
| `/demo` | Guided presentation journey |
| `/safety-explorer` | Research questions, transparent relevance ranking and evidence |
| `/experiments` | Domain and collection browsing, filters, record details and compatible comparison |
| `/phenomena/flame-extinction` | Droplet-flame analysis and conceptual 3D studio |
| `/phenomena/flame-spread` | Solid-material analysis and conceptual 3D studio |
| `/phenomena/spacecraft-fire` | Spacecraft fire context and conceptual 3D studio |
| `/phenomena/gaseous-flames` | CFI-G, Flame Design, BRE and conceptual 3D studio |
| `/phenomena/smoke-detection` | SAME smoke results and conceptual 3D studio |
| `/copilot` | Cited evidence retrieval and optional model-written synthesis |
| `/intelligence/similar` | Starting-condition similarity within compatible datasets |
| `/evidence`, `/evidence/literature`, `/evidence/media` | Local documents, external literature and credited NASA media |
| `/reliability`, `/methodology` | Quality flags and scientific limitations |
| `/modeling` | Exploratory FLEX estimator with its upstream validation limits |
| `/about` | The Flamels identity, software attribution and source scope |

## AI configuration

No provider key is included, inherited from another account or needed for evidence retrieval. Add your own key only to `.runtime/research-platform/.env` to enable model-written answers. Its default provider is OpenAI; the source also retains optional Gemini/Anthropic adapters. Provider names do not imply that those services were called during delivery. Tests mock all external model calls.

## Containers and hosting

```sh
docker compose -f research-platform/compose.yml up --build
```

The single application container runs FastAPI and Next.js, keeps the API on loopback, and publishes the frontend at `http://127.0.0.1:3000`. A named volume retains processed data and caches. Supply provider environment variables on the host if needed. Keep the app behind authentication before enabling paid model calls on shared hosting.

The existing [public evidence presentation](https://flameatlas-evidence-studio.kh-ng-gian-l-5063.chatgpt.site/) remains separate. It does not serve the extended Python backend. The full platform can run locally, in the dedicated private Codespaces configuration or on your own Docker host. A Docker definition is provided; building a container is a separate check from the tested local Python/Node setup.

## Relationship to the original FlameAtlas MVP

The original `frontend/`, `backend/`, `data/` and their research sessions are retained. Run that application using its existing [instructions](../docs/legacy-mvp.md). The extended edition uses its own SQLite schema and catalogue; counts are never pooled between the two systems.

The default Codespaces configuration continues to run the original workspace. For the full platform choose **New with options → Dev container configuration → FlameAtlas Research Platform**, then open port 3000. Port visibility must remain private.

## Provenance and limits

- The reference repository explicitly supplies no license file. Upstream authorship, original README, data attribution and media usage notes are retained; this edition assigns no new license to upstream materials.
- Committed raw NASA files and curated source derivatives remain byte-identical. Some additional NASA reports referenced by the source are **not committed upstream**. A full clone cannot supply those absent files.
- Curated values from those reports retain their source file/table/page and upstream verification status. Missing reports are not indexed as though they had been read locally; the app provides a source-availability page and NASA investigation link.
- 3D scenes are conceptual illustrations, not CFD output or measured experimental timelines. Similarity and relevance scores are not fire-risk scores.
- The exploratory estimator retains its original evaluation caveats. This adaptation does not independently validate it for spacecraft engineering.
- The five private Drive-derived references excluded from the existing public FlameAtlas release are not introduced into this edition.

Run release-integrity checks with `python scripts/test_research_platform.py`. After setup, run the reference backend suite from `.runtime/research-platform/backend` with `.venv/bin/python -m pytest` (Windows: `.venv\Scripts\python -m pytest`). Check the frontend with `npm run typecheck` and `npm run build`.
