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
 def test_ten_links_five_papers_psi(self):
  items=resources();self.assertEqual(len(items),23)
  self.assertEqual(sum(r['id'].startswith('data-') for r in items),10)
  self.assertEqual(sum(r['kind']=='paper' for r in items),5)
  self.assertEqual(self.client.get('/api/library/paper-03').status_code,200)
  self.assertEqual(self.client.get('/api/library/missing').status_code,404)
 def test_idempotent_seed(self):
  seed_library()
  with catalogue.connect() as db:
   self.assertEqual(db.execute('SELECT count(*) FROM source_documents').fetchone()[0],23)
   self.assertEqual(db.execute('SELECT count(*) FROM schema_migrations').fetchone()[0],1)
 def test_vietnamese_retrieval_and_unknown(self):
  self.assertTrue(search_evidence('thông lượng PMMA'))
  result=self.client.post('/api/assistant/query',json={'question':'PMMA'}).json()
  ids={c['id'] for c in result['citations']};self.assertTrue(ids)
  for claim in result['claims']:self.assertTrue(set(claim['evidence_ids'])<=ids)
  self.assertFalse(self.client.post('/api/assistant/query',json={'question':'zzzzqwertyz'}).json()['citations'])
 def test_inaccessible_sources_not_claims(self):
  self.assertFalse(search_evidence('PSI-117'))
  self.assertEqual(resources('PSI-117')[0]['status'],'external_only')
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
  self.assertEqual(sum(bool(r.get('parent_ids')) for r in items),7)
  for item in items:
   for parent in item.get('parent_ids',[]):self.assertIn(parent,by_id)
  citations=search_evidence('Saffire VI')
  self.assertTrue(any(c['document_id']=='nasa-saffire-vi' for c in citations))
  self.assertFalse(any(c['document_id']=='psi-25' for c in search_evidence('PSI-25')))
  self.assertEqual(self.client.get('/api/library/nasa-bass-report').json()['publisher'],'NASA')
