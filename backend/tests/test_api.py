import os,tempfile,unittest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app import catalogue
from backend.app.main import app
from backend.app.models import Scenario
from backend.app.ranking import rank
import json

class ApiTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();catalogue.DB=Path(self.temp.name)/'test.db';self.client=TestClient(app)
  self.record=json.loads(Path('data/seed.json').read_text())[0]
  with catalogue.connect() as db:catalogue.put(db,self.record)
 def tearDown(self):self.temp.cleanup()
 def test_search_and_detail(self):
  self.assertEqual(self.client.get('/api/investigations?q=BASS').json()['total'],1)
  self.assertEqual(self.client.get('/api/investigations/absent').status_code,404)
 def test_unknown_not_match(self):
  result=rank(self.record,Scenario(theme='suppression'))
  self.assertEqual(result['lower'],45);self.assertEqual(result['upper'],100)
  self.assertTrue(result['outside_coverage'])
 def test_no_fictional_combined_run(self):
  item={**self.record,'runs':[{'id':'a','oxygen_fraction':.21,'pressure_kpa':50,'airflow_m_s':.1},{'id':'b','oxygen_fraction':.4,'pressure_kpa':101.325,'airflow_m_s':.1}]}
  self.assertEqual(rank(item,Scenario())['components']['atmosphere'],0)
 def test_import_duplicate_and_validation(self):
  self.assertEqual(self.client.post('/api/import/preview',json={'records':[self.record]}).json()['errors'][0]['row'],1)
  self.assertEqual(self.client.post('/api/import/commit',json={'records':[self.record]}).status_code,422)
 def test_citations(self):
  answer=self.client.post('/api/assistant/query',json={'question':'BASS'}).json()
  ids={c['id'] for c in answer['citations']}
  self.assertTrue(ids)
  self.assertTrue(all(set(c['evidence_ids'])<=ids for c in answer['claims']))
 def test_export(self):
  for format in ['json','csv','html']:
   response=self.client.post('/api/export',json={'format':format})
   self.assertEqual(response.status_code,200);self.assertIn('nasa.gov',response.text)
 def test_invalid_scenario(self):
  self.assertEqual(self.client.post('/api/scenarios/evaluate',json={'oxygen_fraction':21}).status_code,422)
 def test_synthetic_excluded(self):
  item={**self.record,'id':'synthetic','verification':'synthetic'}
  with catalogue.connect() as db:catalogue.put(db,item)
  self.assertEqual(len(self.client.post('/api/scenarios/evaluate',json={}).json()['results']),1)
