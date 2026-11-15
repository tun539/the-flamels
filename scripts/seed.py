"""Seed curated metadata only. Never fabricate experiment runs."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backend.app.catalogue import connect,put
from backend.app.models import Investigation
root=Path(__file__).resolve().parents[1]
records=json.loads((root/'data/seed.json').read_text())+json.loads((root/'data/psi-seed.json').read_text())
with connect() as db:
 for record in records:
  item=Investigation.model_validate(record).model_dump(mode='json')
  if not db.execute('SELECT 1 FROM investigations WHERE id=?',(item['id'],)).fetchone():put(db,item)
print('Seeded investigation metadata and partial PSI-159 experimental rows (5 runs, 10 observations).')

from backend.app.library import seed_library
print(f'Indexed {len(seed_library())} source documents.')
