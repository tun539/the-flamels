"""Build a reproducible presentation snapshot from the curated repository data."""
import hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from backend.app.coverage import METHOD, coverage_runs
from backend.app.seed_data import SEED_PATHS, read_seed_studies
paths=['data/seed.json','data/psi-seed.json','data/resources.json','data/ranking-methodology.json','data/publication-policy.json']
version=hashlib.sha256(b''.join((ROOT/p).read_bytes() for p in [*paths, SEED_PATHS[-1]])).hexdigest()
studies, _ = read_seed_studies()
studies=[s for s in studies if s['verification']!='synthetic']
resources=json.loads((ROOT/paths[2]).read_text())
fields=['oxygen_fraction','pressure_kpa','airflow_m_s','material','gravity','geometry','measurement']
payload={'schema_version':2,'methodology':json.loads((ROOT/paths[3]).read_text()),'publication_policy':json.loads((ROOT/paths[4]).read_text()),'editorial_language':'en','data_version':version,'source_checked_at':max(r['checked_at'] for r in resources),'mode':'curated_repository_snapshot','counts':{'resources':len(resources),'investigations':len(studies),'runs':sum(len(s['runs']) for s in studies),'observations':sum(len(r.get('measurements',[])) for s in studies for r in s['runs'])},'source_groups':[{'label':'NASA PSI','value':sum(r['id'].startswith('psi-') for r in resources)},{'label':'Spreadsheet data links','value':sum(r['id'].startswith('data-') for r in resources)},{'label':'Spreadsheet articles','value':sum(r['id'].startswith('paper-') for r in resources)},{'label':'Related NASA sources','value':sum(not r['id'].startswith(('psi-','data-','paper-')) for r in resources)}],'fields':fields,'studies':studies,'resources':[{'id':r['id'],'title':r['title'],'url':r['url'],'kind':r['kind'],'doi':r.get('doi'),'status':r['status'],'scope':r.get('research_scope','source_context'),'summary':r['summary'],'limitations':r['limitations'],'version':r.get('version'),'locator':r['locator'],'findings':r['findings'],'publisher':r.get('publisher','Not reported')} for r in resources]}
payload['coverage']={'methodology':METHOD,'runs':coverage_runs(studies)}
payload['source_groups']=[g for g in payload['source_groups'] if g['value']>0]
assert not any('drive.google.com' in r['url'] or 'docs.google.com' in r['url'] for r in resources),'Private document URL in public source catalogue'
text=json.dumps(payload,ensure_ascii=False,indent=2)+'\n'
target=ROOT/'frontend/app/present/data.generated.json'
if '--check' in __import__('sys').argv:
 assert target.read_text()==text,'Presentation snapshot is stale: run python scripts/build_presentation_data.py'
 print('Presentation snapshot matches curated source data.')
else:target.write_text(text);print('Generated presentation snapshot:',payload['counts'])
