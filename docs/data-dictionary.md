# Data dictionary and import

Canonical schemas: backend/app/models.py; interactive schema: http://localhost:8000/docs.

Investigation: stable id, acronym, title, objectives, editorial theme, platform, material, gravity, hardware, verification, sources, runs, limitations.

Source: HTTPS/HTTP URL, title, section/page locator, summary, retrieval timestamp, optional SHA-256 checksum. Each seed source refers to data/sources/nasa-combustion.html.

Run: stable id, oxygen_fraction (0–1), pressure_kpa (>0), airflow_m_s (>=0), gravity, material, geometry, measurement name, source_locator. Missing values are null. Input units are canonical; convert external units before import and retain original documentation.

CSV uses the export column names. Sources and runs cells contain JSON arrays. JSON accepts an array of investigation records. Uploads are capped at 100 records and the frontend gateway limits request bodies to 2 MB. Imported records cannot self-certify verification status. No URL-fetch import is exposed.

SQLite tables: investigations (JSON payload keyed by id), search (FTS5), imports (timestamp, checksum, count). Schema is initialized idempotently in catalogue.py. Seed is idempotent and never overwrites user records.

## Version 0.3 additions

SourceDocument and EvidenceChunk are stored in separate migrated tables. data/resources.json contains the 16-resource manifest and nine findings; reviewed denotes source reading, not scientific certification. Measurement stores quantity, value, unit, time_s, uncertainty, method, source_url and source_locator, attached to a run. Source URLs must belong to the containing investigation. Imported records remain unverified.

Import mapping maps incoming top-level column names to canonical fields. Unit choices apply to run oxygen fraction, pressure and airflow; original_values records the supplied value, unit and conversion factor. Default canonical units are fraction, kPa and m/s. No combinations of conditions are generated.

Source archive: data/sources/nasa-combustion.html.gz; checksum refers to decompressed bytes. Paper checksums refer to connector-extracted text, which is not publicly redistributed.
