# Delivery status — 2026-11-15

## Implemented

- Library with exactly ten display columns, ten source-data links, five paper summaries and PSI-117.
- Source reader with nine curated findings, section/page locators, DOI links, verification/access state and applicability limits.
- Private Drive PDFs are not redistributed. Original files open using the reader's existing Drive access.
- SQLite migrations for source documents, evidence chunks, measurements and embedding cache.
- Vietnamese/English keyword evidence search; optional OpenAI Responses evidence selection and cached embedding reranking. Only known evidence IDs can be returned; displayed claim text is taken from curated evidence, not generated scientific assertions.
- Explicit field mapping and canonical unit conversion retaining original values; preview and commit use the same validation.
- Run metadata coverage table and measurement plots grouped by run, quantity, unit and method; missing data has an explicit empty state.
- Existing investigation search/detail, 2–4 study comparison, conservative ranking, scenario evaluation and CSV/JSON/HTML export remain available.
- Comparison displays actual run combinations and warns about differing quantities, units or methods. Exported JSON bundles can be imported directly without converting canonical units again.

Synthetic records are excluded from overview metrics, evidence coverage and scenario ranking. They remain visibly labeled when inspected or compared.

## External data limits

PSI's search/detail pages did not provide readable run files during retrieval. The YouTube source could not be fetched. These resources stay marked external-only/unavailable. There are six verified investigation metadata records and zero raw experimental runs. Paper aggregate findings are never relabeled as complete runs. No raw data, DOI, measurement or time series was invented.

## Configuration and scope

Copy .env.example to .env. With no keys, the complete local workflow runs in retrieval mode. Set OPENAI_API_KEY and OPENAI_MODEL to enable model-based evidence selection; optionally set OPENAI_EMBEDDING_MODEL for semantic reranking. Calls have timeouts and fall back to keyword retrieval. Enabling AI transmits the question and the displayed curated summaries to OpenAI. API keys remain in the backend. Real paid-provider calls require the user's configured key; tests use mocked provider responses.

This is a local research MVP. Services bind to loopback. FLAMEATLAS_WRITE_TOKEN optionally protects direct backend import commits; the frontend forwards it server-side. It is not a substitute for per-user authentication in a public deployment. Video analysis, predictive models and shared workspaces remain post-MVP extensions.
