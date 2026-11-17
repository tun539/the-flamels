import copy
import json
import tempfile
import unittest
from pathlib import Path
from backend.app import catalogue
from backend.app.curation import record_hash, sync_seed_record
from backend.app.models import Investigation


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
