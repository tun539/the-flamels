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
