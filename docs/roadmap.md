# Scope and remaining dependencies

The research MVP and English presentation are implemented. See [delivery status](completion-status.md), [presentation guide](presentation.md) and [testing](testing.md).

## Delivered core workflow

Discover investigations → inspect observations and sources → compare actual configurations → evaluate scenario relevance → retrieve cited findings → export evidence.

The standalone presentation supports this read-only workflow from its versioned snapshot. The full workspace additionally supports validated import, persistence, API access and optional model-based evidence selection.

## External data work

Expand the inspected PSI subset by downloading accessible original files, validating their schema, units and configuration definitions, and independently reviewing imported measurements. A source archive listing is not evidence that its contents have been downloaded or ingested.

## Optional extensions

- Video extraction and analysis with validated measurement methods.
- A knowledge graph distinguishing investigations, runs, sources and findings.
- Independently evaluated predictive models with appropriate uncertainty.
- Recurring source synchronization with review before ingestion.
- Multi-user authentication and deployment hardening before public write access.

These extensions require separate data, validation or infrastructure work. Relevance intervals are not a prediction model or a safety certification.

## Flamels research actions

Use the core workspace or snapshot as follows. The application applies changes only through its dedicated controls and API operations.

| Action | Workspace or API |
| --- | --- |
| Select and evaluate a scenario | **Scenario** in `/` or **Scenario explorer** in `/present#research`; `POST /api/scenarios/evaluate` |
| Review readiness and gaps | Brief and Gap Map after evaluation; `POST /api/scenarios/coverage` |
| Find and compare investigations | **Explore** and **Compare**; `GET /api/investigations` and `POST /api/compare` with 2–4 investigation IDs |
| Investigate a research question | **Evidence search**, **Ask the evidence** or a planner question’s search button; `POST /api/assistant/query` with `question` |
| Export the evidence | **Export coverage JSON** for the exact filtered view; `POST /api/export` for selected investigations |
| Open a conceptual 3D scene | Use the existing routes in the [extended edition](../research-platform/README.md) |

The core atlas model workbench remains unavailable. The FLEX core import contains atmosphere conditions, and its input–outcome pairs and grouped model validation are pending. Voice remains pending a verified microphone workflow, interruption controls and a provider privacy review.
