"""Seed curated metadata only. Never fabricate experiment runs."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backend.app.catalogue import connect,put
from backend.app.models import Investigation
records=json.loads((Path(__file__).resolve().parents[1]/'data/seed.json').read_text())
with connect() as db:
 for record in records:
  item=Investigation.model_validate(record).model_dump(mode='json')
  if not db.execute('SELECT 1 FROM investigations WHERE id=?',(item['id'],)).fetchone():put(db,item)
print('Seeded verified metadata; experimental run count remains zero.')
