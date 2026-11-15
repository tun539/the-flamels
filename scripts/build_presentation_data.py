"""Build a reproducible presentation snapshot from the curated repository data."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
paths=['data/seed.json','data/psi-seed.json','data/resources.json']
version=hashlib.sha256(b''.join((ROOT/p).read_bytes() for p in paths)).hexdigest()
studies=[*json.loads((ROOT/paths[0]).read_text()),*json.loads((ROOT/paths[1]).read_text())]
studies=[s for s in studies if s['verification']!='synthetic']
resources=json.loads((ROOT/paths[2]).read_text())
fields=['oxygen_fraction','pressure_kpa','airflow_m_s','material','gravity','geometry','measurement']
payload={'schema_version':1,'data_version':version,'source_checked_at':max(r['checked_at'] for r in resources),'mode':'curated_repository_snapshot','counts':{'resources':len(resources),'investigations':len(studies),'runs':sum(len(s['runs']) for s in studies),'observations':sum(len(r.get('measurements',[])) for s in studies for r in s['runs'])},'source_groups':[{'label':'NASA PSI','value':sum(r['id'].startswith('psi-') for r in resources)},{'label':'Liên kết từ Sheet','value':sum(r['id'].startswith('data-') for r in resources)},{'label':'Tài liệu từ Sheet','value':sum(r['id'].startswith('paper-') for r in resources)},{'label':'NASA mở rộng','value':sum(not r['id'].startswith(('psi-','data-','paper-')) for r in resources)}],'fields':fields,'studies':studies,'resources':[{'id':r['id'],'title':r['title'],'url':r['url'],'kind':r['kind'],'doi':r.get('doi'),'status':r['status'],'scope':r.get('research_scope','source_context'),'summary':r['summary'],'limitations':r['limitations'],'version':r.get('version'),'locator':r['locator']} for r in resources]}
text=json.dumps(payload,ensure_ascii=False,indent=2)+'\n'
target=ROOT/'frontend/app/present/data.generated.json'
if '--check' in __import__('sys').argv:
 assert target.read_text()==text,'Presentation snapshot is stale: run python scripts/build_presentation_data.py'
 print('Presentation snapshot matches curated source data.')
else:target.write_text(text);print('Generated presentation snapshot:',payload['counts'])
