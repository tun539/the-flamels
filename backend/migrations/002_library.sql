CREATE TABLE IF NOT EXISTS source_documents(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence_chunks(id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES source_documents(id), text TEXT NOT NULL, locator TEXT NOT NULL, kind TEXT NOT NULL);
CREATE VIRTUAL TABLE IF NOT EXISTS evidence_search USING fts5(id UNINDEXED, text, tokenize='unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS embedding_cache(cache_key TEXT PRIMARY KEY, vector TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS measurements(id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL REFERENCES investigations(id), run_id TEXT NOT NULL, payload TEXT NOT NULL);
