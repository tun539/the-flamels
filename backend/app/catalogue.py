"""Persistent, provenance-aware investigation catalogue."""
import json
import os
import sqlite3
from pathlib import Path

DB = Path(os.getenv('FLAMEATLAS_DB', 'data/flameatlas.db'))

def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('CREATE TABLE IF NOT EXISTS investigations (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
    db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS search USING fts5(id UNINDEXED, text)')
    db.execute('CREATE TABLE IF NOT EXISTS imports (id INTEGER PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP, checksum TEXT, count INTEGER)')
    db.execute('CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY)')
    for migration in sorted((Path(__file__).resolve().parents[1]/'migrations').glob('*.sql')):
        if not db.execute('SELECT 1 FROM schema_migrations WHERE version=?',(migration.name,)).fetchone():
            db.executescript(migration.read_text())
            db.execute('INSERT INTO schema_migrations VALUES (?)',(migration.name,))
    db.commit()
    return db

def put(db, item):
    db.execute('INSERT INTO investigations VALUES (?,?)', (item['id'], json.dumps(item)))
    for run in item.get('runs',[]):
        for measurement in run.get('measurements',[]):
            db.execute('INSERT INTO measurements VALUES (?,?,?,?)',(item['id']+':'+run['id']+':'+measurement['id'],item['id'],run['id'],json.dumps(measurement)))
    db.execute('INSERT INTO search VALUES (?,?)', (item['id'], ' '.join(str(item.get(k,'')) for k in ['acronym','title','objectives','material','theme'])))

def all_items(query=''):
    with connect() as db:
        if query.strip():
            terms = ' OR '.join('"'+t.replace('"','""')+'"' for t in query.split()[:20])
            rows = db.execute('SELECT payload FROM investigations WHERE id IN (SELECT id FROM search WHERE search MATCH ?)', (terms,)).fetchall()
        else:
            rows = db.execute('SELECT payload FROM investigations ORDER BY id').fetchall()
        return [json.loads(r['payload']) for r in rows]
