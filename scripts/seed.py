"""Seed curated evidence and refresh known editorial revisions without replacing user edits."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backend.app.catalogue import connect
from backend.app.curation import sync_seed_record
from backend.app.models import Investigation
root=Path(__file__).resolve().parents[1]
records=json.loads((root/'data/seed.json').read_text())+json.loads((root/'data/psi-seed.json').read_text())
revisions={r['id']:r['previous_sha256'] for r in json.loads((root/'data/seed-revisions.json').read_text())['accepted_previous_records']}
with connect() as db:
 for record in records:
  item=Investigation.model_validate(record).model_dump(mode='json')
  sync_seed_record(db,item,revisions.get(item['id']))
print(f"Seeded {len(records)} investigations, {sum(len(i['runs']) for i in records)} runs and {sum(len(r.get('measurements',[])) for i in records for r in i['runs'])} observations.")

from backend.app.library import seed_library
print(f'Indexed {len(seed_library())} source documents.')
