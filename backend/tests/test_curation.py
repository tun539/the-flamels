import copy
import json
import tempfile
import unittest
from pathlib import Path
from backend.app import catalogue
from backend.app.curation import record_hash, sync_seed_record
from backend.app.models import Investigation
from backend.app.seed_data import read_seed_studies


class CurationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.previous_db = catalogue.DB
        catalogue.DB = Path(self.temp.name) / 'curation.db'
        self.record = Investigation.model_validate(json.loads(Path('data/seed.json').read_text())[0]).model_dump(mode='json')

    def tearDown(self):
        catalogue.DB = self.previous_db
        self.temp.cleanup()

    def test_editorial_revision_updates_search_and_preserves_user_changes(self):
        original = copy.deepcopy(self.record)
        original['objectives'] = 'Prior curated editorial description'
        checksum = record_hash(original)
        with catalogue.connect() as db:
            catalogue.put(db, original)
            self.assertEqual(sync_seed_record(db, self.record, checksum), 'updated')
            self.assertEqual(sync_seed_record(db, self.record, checksum), 'unchanged')
        self.assertEqual(catalogue.all_items()[0]['objectives'], self.record['objectives'])
        with catalogue.connect() as db:
            edited = copy.deepcopy(self.record)
            edited['objectives'] = 'User-edited description'
            db.execute('UPDATE investigations SET payload=?', (json.dumps(edited),))
            self.assertEqual(sync_seed_record(db, self.record, checksum), 'preserved')
        self.assertEqual(catalogue.all_items()[0]['objectives'], 'User-edited description')

    def test_editorial_refresh_rejects_measurement_changes(self):
        revised = copy.deepcopy(self.record)
        revised['runs'] = [{'id':'new-run','measurements':[]}]
        with catalogue.connect() as db:
            catalogue.put(db, self.record)
            with self.assertRaisesRegex(ValueError, 'cannot change measured observations'):
                sync_seed_record(db, revised, record_hash(self.record))


    def test_flex_conditions_upgrade_preserves_id_and_raw_invalid_pressure(self):
        revision, hashes = read_seed_studies()
        old = next(s for s in json.loads(Path('data/seed.json').read_text()) if s['id'] == 'flex')
        original = Investigation.model_validate(old).model_dump(mode='json')
        item = Investigation.model_validate(next(s for s in revision if s['id'] == 'flex')).model_dump(mode='json')
        with catalogue.connect() as db:
            catalogue.put(db, original)
            self.assertEqual(sync_seed_record(db, item, hashes['flex'], append_conditions=True), 'updated')
            self.assertEqual(sync_seed_record(db, item, hashes['flex'], append_conditions=True), 'unchanged')
            db.execute('UPDATE investigations SET payload=?', (json.dumps(dict(original, objectives='Reviewed locally')),))
            self.assertEqual(sync_seed_record(db, item, hashes['flex'], append_conditions=True), 'preserved')
        self.assertEqual(len(item['runs']), 274)
        invalid = next(run for run in item['runs'] if run['id'] == 'psi69-test-114')
        self.assertIsNone(invalid['pressure_kpa'])
        self.assertEqual(invalid['original_values']['pressure_kpa']['value'], '0')
        self.assertEqual(item['runs'][0]['original_values']['pressure_kpa']['unit'], 'mmHg')
