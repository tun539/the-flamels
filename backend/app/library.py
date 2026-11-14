"""Versioned source catalogue and searchable, curated evidence, with no remote fetching."""
import json
import re
from pathlib import Path
from .catalogue import connect
ROOT=Path(__file__).resolve().parents[2]

def seed_library():
    records=json.loads((ROOT/'data/resources.json').read_text())
    with connect() as db:
        for record in records:
            db.execute('INSERT INTO source_documents VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',(record['id'],json.dumps(record)))
            for old in db.execute('SELECT id FROM evidence_chunks WHERE document_id=?',(record['id'],)).fetchall():
                db.execute('DELETE FROM evidence_search WHERE id=?',(old['id'],))
            db.execute('DELETE FROM evidence_chunks WHERE document_id=?',(record['id'],))
            chunks=[{'id':record['id']+'-summary','text':record['summary'],'locator':record['locator'],'type':'source_summary'},*record['findings']] if record['status']=='reviewed' else []
            for chunk in chunks:
                db.execute('INSERT INTO evidence_chunks VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET text=excluded.text,locator=excluded.locator,kind=excluded.kind',(chunk['id'],record['id'],chunk['text'],chunk['locator'],chunk['type']))
                db.execute('DELETE FROM evidence_search WHERE id=?',(chunk['id'],))
                db.execute('INSERT INTO evidence_search VALUES (?,?)',(chunk['id'],record['title']+' '+str(record['material'] or '')+' '+chunk['text']))
    return records

def resources(q='',kind=''):
    with connect() as db:
        records=[json.loads(r['payload']) for r in db.execute('SELECT payload FROM source_documents ORDER BY id')]
    return [r for r in records if (not kind or r['kind']==kind) and (not q or q.casefold() in json.dumps(r,ensure_ascii=False).casefold())]

def search_evidence(question):
    # Avoid stop words dominating OR retrieval. Preserve Unicode (including Vietnamese).
    stop={'the','and','what','which','how','does','can','is','in','of','to','a','có','là','và','nào','cho','của','về','trong','các','những','tôi','hãy','thì','để','cần','không'}
    terms=[t for t in re.findall(r'[^\W_]+',question.casefold()) if t not in stop][:24]
    if not terms:return []
    query=' OR '.join('"'+t+'"' for t in terms)
    with connect() as db:
        rows=db.execute('SELECT c.*,s.payload FROM evidence_search f JOIN evidence_chunks c ON c.id=f.id JOIN source_documents s ON s.id=c.document_id WHERE evidence_search MATCH ? ORDER BY bm25(evidence_search),c.id LIMIT 12',(query,)).fetchall()
    return [dict(id=r['id'],title=(d:=json.loads(r['payload']))['title'],url=d['url'],summary=r['text'],locator=r['locator'],kind=r['kind'],limitations=d['limitations'],document_id=r['document_id']) for r in rows]
