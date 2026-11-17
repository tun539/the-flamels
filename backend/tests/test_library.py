import json,os,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app import catalogue
from backend.app.main import app
from backend.app.library import seed_library,resources,search_evidence
from backend.app.ai import select_evidence,embeddings
from backend.app.ingestion import normalize
from backend.app.models import Investigation,Scenario
from backend.app.ranking import rank

class LibraryTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.previous=catalogue.DB;catalogue.DB=Path(self.temp.name)/'test.db'
  self.client=TestClient(app);seed_library()
 def tearDown(self):catalogue.DB=self.previous;self.temp.cleanup()
 def test_public_links_and_psi_catalogue(self):
  items=resources();self.assertEqual(len(items),42)
  self.assertEqual(sum(r['id'].startswith('data-') for r in items),10)
  self.assertEqual(sum(r['kind']=='paper' for r in items),0)
  self.assertEqual(self.client.get('/api/library/nasa-bass-report').status_code,200)
  self.assertEqual(self.client.get('/api/library/missing').status_code,404)
 def test_idempotent_seed(self):
  seed_library()
  with catalogue.connect() as db:
   self.assertEqual(db.execute('SELECT count(*) FROM source_documents').fetchone()[0],42)
   self.assertEqual(db.execute('SELECT count(*) FROM schema_migrations').fetchone()[0],1)
 def test_vietnamese_retrieval_and_unknown(self):
  self.assertTrue(search_evidence('thông lượng PMMA'))
  result=self.client.post('/api/assistant/query',json={'question':'PMMA'}).json()
  ids={c['id'] for c in result['citations']};self.assertTrue(ids)
  for claim in result['claims']:self.assertTrue(set(claim['evidence_ids'])<=ids)
  self.assertFalse(self.client.post('/api/assistant/query',json={'question':'zzzzqwertyz'}).json()['citations'])
 def test_browser_verified_psi_metadata_searchable(self):
  self.assertTrue(search_evidence('PSI-117'))
  self.assertEqual(resources('PSI-117')[0]['status'],'reviewed')
 def test_unit_conversion_and_missing(self):
  item=normalize({'runs':[{'oxygen_fraction':21,'pressure_kpa':100000,'airflow_m_s':None}]},{},{'oxygen_fraction':'%','pressure_kpa':'Pa'})
  run=item['runs'][0];self.assertEqual(run['oxygen_fraction'],.21);self.assertEqual(run['pressure_kpa'],100)
  self.assertIsNone(run['airflow_m_s']);self.assertEqual(run['original_values']['pressure_kpa']['unit'],'Pa')
  self.assertAlmostEqual(normalize({'runs':[{'pressure_kpa':1}]},{},{'pressure_kpa':'psi'})['runs'][0]['pressure_kpa'],6.894757293168)
 def test_mapping_collision(self):
  with self.assertRaises(ValueError):normalize({'id':'a','code':'b'},{'code':'id'},{})
 def test_partial_known_mismatch(self):
  item={'id':'x','theme':'prevention','runs':[{'id':'a','oxygen_fraction':.9}]}
  self.assertEqual(rank(item,Scenario())['components']['atmosphere'],0)
 def test_empty_export_not_entire_dataset(self):
  record=json.loads(Path('data/seed.json').read_text())[0]
  with catalogue.connect() as db:catalogue.put(db,record)
  self.assertEqual(self.client.post('/api/export',json={'ids':[]}).json()['investigations'],[])
 def test_measurement_provenance(self):
  record=json.loads(Path('data/seed.json').read_text())[0]
  record['runs']=[{'id':'x','source_locator':'fixture','measurements':[{'id':'m','quantity':'temperature','value':1,'unit':'K','method':'test fixture','source_url':'https://example.com','source_locator':'fixture'}]}]
  with self.assertRaises(ValueError):Investigation.model_validate(record)
 def test_ai_validation_and_fallback(self):
  citations=[{'id':'a','summary':'Verified summary','url':'https://nasa.gov','locator':'abstract'}]
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test','OPENAI_MODEL':'test'}):
   with patch('backend.app.ai.request',return_value={'output':[{'content':[{'type':'output_text','text':'{"evidence_ids":["fabricated"]}'}]}]}):
    selected,mode,warning=select_evidence('q',citations);self.assertEqual(selected,citations);self.assertTrue(warning)
   with patch('backend.app.ai.request',return_value={'output':[{'content':[{'type':'output_text','text':'{"evidence_ids":["a"]}'}]}]}):
    self.assertEqual(select_evidence('q',citations)[1],'AI-selected evidence')
 def test_embedding_cache(self):
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test','OPENAI_EMBEDDING_MODEL':'test'}):
   with patch('backend.app.ai.request',return_value={'data':[{'index':0,'embedding':[1.,0.]}]}) as mock:
    self.assertEqual(embeddings(['text']),[[1.,0.]])
    self.assertEqual(embeddings(['text']),[[1.,0.]])
    self.assertEqual(mock.call_count,1)
 def test_limits_and_write_token(self):
  self.assertEqual(self.client.post('/api/import/preview',content=b'x'*2_000_001).status_code,413)
  with patch.dict(os.environ,{'FLAMEATLAS_WRITE_TOKEN':'test-token'}):
   self.assertEqual(self.client.post('/api/import/commit',json={'records':[]}).status_code,403)
   self.assertEqual(self.client.post('/api/import/commit',json={'records':[]},headers={'X-Write-Token':'test-token'}).status_code,200)
 def test_invalid_run_shapes_are_preview_errors(self):
  record=json.loads(Path('data/seed.json').read_text())[0]
  for runs in [None,[None],[{'original_values':None}],[{'oxygen_fraction':[]}]]:
   record['runs']=runs
   response=self.client.post('/api/import/preview',json={'records':[record]})
   self.assertEqual(response.status_code,200);self.assertTrue(response.json()['errors'])
 def test_measurements_persist_and_csv_preserves_hardware(self):
  record=json.loads(Path('data/seed.json').read_text())[0]
  record['id']='test-fixture';record['verification']='synthetic';record['hardware']='Test fixture'
  record['runs']=[{'id':'fixture','source_locator':'Test only','measurements':[{'id':'m','quantity':'temperature','value':1,'unit':'K','method':'Test fixture, not experimental evidence','source_url':record['sources'][0]['url'],'source_locator':'Test only'}]}]
  self.assertEqual(self.client.post('/api/import/commit',json={'records':[record]}).status_code,200)
  self.assertEqual(self.client.get('/api/measurements/test-fixture').json()['items'][0]['value'],1)
  self.assertEqual(self.client.get('/api/coverage').json()['measurements'],0)
  overview=self.client.get('/api/overview').json();self.assertEqual(overview['runs'],0);self.assertEqual(overview['synthetic_records'],1)
  csv=self.client.post('/api/export',json={'format':'csv'}).text
  parsed=self.client.post('/api/import/csv',json={'content':csv}).json()['records'][0]
  self.assertEqual(parsed['hardware'],'Test fixture');self.assertEqual(parsed['runs'][0]['measurements'][0]['value'],1)
  with catalogue.connect() as db:self.assertEqual(db.execute('SELECT count(*) FROM measurements').fetchone()[0],1)

 def test_expanded_source_provenance_and_findings(self):
  items=resources();by_id={r['id']:r for r in items}
  self.assertTrue(all(r.get('parent_ids') for r in items if r['id'].startswith('nasa-')))
  for item in items:
   for parent in item.get('parent_ids',[]):self.assertIn(parent,by_id)
  citations=search_evidence('Saffire VI')
  self.assertTrue(any(c['document_id']=='nasa-saffire-vi' for c in citations))
  self.assertTrue(all(c['document_id']=='psi-25' for c in search_evidence('PSI-25')))
  self.assertTrue(search_evidence('PSI-25'))
  self.assertEqual(self.client.get('/api/library/nasa-bass-report').json()['publisher'],'NASA')

 def test_psi_rows_and_context_exclusion(self):
  records=json.loads(Path('data/psi-seed.json').read_text())
  item=Investigation.model_validate(records[0]).model_dump(mode='json')
  self.assertEqual(len(item['runs']),5)
  self.assertTrue(all(r['oxygen_fraction'] is None for r in item['runs']))
  self.assertEqual(item['runs'][0]['measurements'][0]['value'],50)
  self.assertEqual(item['runs'][0]['original_values']['chamber_pressure']['normalized_kpa'],94.43956)
  with catalogue.connect() as db:catalogue.put(db,item)
  self.assertEqual(len(self.client.get('/api/measurements/psi-159-cfi-g').json()['items']),10)
  self.assertFalse(any(c['document_id'] in ['psi-181','psi-108'] for c in search_evidence('silicone solders PSI-181 PSI-108')))
  for id in ['psi-117','psi-159','psi-10','psi-62','psi-60','psi-181','psi-142','psi-108']:
   self.assertEqual(self.client.get('/api/library/'+id).json()['status'],'reviewed')

 def test_batch_accessions_and_saffire_extraction(self):
  ids=[101,115,98,39,102,106,99,107,100,21,25,20,68,22,23,69,26,47]
  documents=resources();self.assertEqual(len({d['url'] for d in documents}),len(documents))
  for id in ids:self.assertEqual(len([d for d in documents if d['id']==f'psi-{id}']),1)
  self.assertFalse(search_evidence('PSI-999999'))
  self.assertTrue(all(c['document_id']=='psi-101' for c in search_evidence('PSI-101')))
  seeds=json.loads(Path('data/psi-seed.json').read_text())
  for record in seeds:Investigation.model_validate(record)
  self.assertEqual(sum(len(s['runs']) for s in seeds),18)
  self.assertEqual(sum(len(r['measurements']) for s in seeds for r in s['runs']),17)
  saffire=next(s for s in seeds if s['id']=='psi-99-saffire')
  self.assertEqual(len(saffire['runs']),9)
  self.assertIsNone(saffire['runs'][5]['material']);self.assertIsNone(saffire['runs'][8]['material'])
  self.assertEqual(saffire['runs'][0]['measurements'],[])
  self.assertEqual(saffire['runs'][0]['original_values']['source_row']['Burn Time (s)'],'Insignificant')
  self.assertTrue(all(r['oxygen_fraction'] is None for r in saffire['runs']))
  self.assertTrue(all(r['airflow_m_s']==.2 for r in saffire['runs']))
  self.assertEqual(next(s for s in seeds if s['id']=='psi-100-saffire')['runs'][0]['measurements'],[])
  import hashlib
  expected=hashlib.sha256(Path('data/saffire-observed-tables.json').read_bytes()).hexdigest()
  for record in seeds[1:]:self.assertEqual(record['sources'][0]['checksum'],expected)

 def test_excluded_legacy_sources_are_removed_from_existing_catalogues(self):
  with catalogue.connect() as db:
   db.execute('INSERT INTO source_documents VALUES (?,?)',('paper-01',json.dumps({'id':'paper-01','summary':'Private fixture, not a source finding'})))
   db.execute('INSERT INTO evidence_chunks VALUES (?,?,?,?,?)',('legacy-fixture','paper-01','Private fixture','Test fixture','source_summary'))
   db.execute('INSERT INTO evidence_search VALUES (?,?)',('legacy-fixture','privatefixtureterm'))
  seed_library()
  self.assertEqual(len(resources()),42)
  self.assertFalse(search_evidence('privatefixtureterm'))
  self.assertEqual(self.client.get('/api/library/paper-01').status_code,404)
  with catalogue.connect() as db:
   self.assertEqual(db.execute('SELECT count(*) FROM evidence_chunks WHERE document_id=?',('paper-01',)).fetchone()[0],0)
  self.assertNotIn('drive.google.com',json.dumps(resources()))
