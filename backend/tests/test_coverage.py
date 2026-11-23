import unittest

from backend.app.coverage import METHOD, coverage_report
from backend.app.models import Investigation, Scenario
from pydantic import ValidationError


class CoverageTests(unittest.TestCase):
    def test_only_linked_joint_ambient_pairs_count_as_reported(self):
        source = 'https://example.com/table'
        documented = {
            'oxygen_fraction': .21, 'pressure_kpa': 101.325, 'oxygen_context': 'ambient',
            'atmosphere_basis': 'measured', 'gravity': 'microgravity', 'material_phase': 'solid',
            'material': 'PMMA', 'source_locator': 'Table 1',
        }
        runs = [
            {'id': 'measured', **documented},
            {'id': 'matrix', **documented, 'atmosphere_basis': 'test_matrix'},
            {'id': 'stream', **documented, 'oxygen_context': 'oxidizer_stream'},
            {'id': 'assumed', **documented, 'atmosphere_basis': 'assumed'},
            {'id': 'unlinked', **documented, 'source_locator': ''},
            {'id': 'split-oxygen', **documented, 'pressure_kpa': None},
            {'id': 'split-pressure', **documented, 'oxygen_fraction': None},
            {'id': 'other-gravity', **documented, 'gravity': 'normal', 'atmosphere_basis': 'source_reported'},
            {'id': 'outside', **documented, 'pressure_kpa': 60},
        ]
        items = [{'id': 'study', 'acronym': 'TEST', 'verification': 'unverified',
                  'sources': [{'url': source}], 'runs': runs}]
        report = coverage_report(items, Scenario(material='pmma'))
        self.assertEqual(report['methodology']['version'], METHOD['version'])
        self.assertEqual({r['run_id'] for r in report['runs'] if r['oxygen_fraction'] is not None},
                         {'measured', 'matrix', 'other-gravity', 'outside'})
        checks = {check['id']: check for check in report['checks']}
        self.assertEqual(checks['recorded_atmosphere']['count'], 3)
        self.assertEqual(checks['nearby_atmosphere']['evidence_ids'], [['study', 'measured'], ['study', 'other-gravity']])
        self.assertEqual(checks['solid_material']['evidence_ids'], [['study', 'measured']])
        self.assertEqual(checks['solid_material']['status'], 'thin')
        self.assertEqual(report['runs'][0]['source_url'], source)
        self.assertEqual(len(report['data_version']), 64)

    def test_run_source_must_belong_to_its_investigation(self):
        payload = {
            'id': 'study', 'acronym': 'TEST', 'title': 'Test', 'objectives': 'Test', 'theme': 'prevention',
            'sources': [{'url': 'https://example.com/table', 'title': 'Table', 'locator': '1',
                         'summary': 'Data', 'retrieved_at': '2026-11-19'}],
            'runs': [{'id': 'run', 'source_locator': 'Table 1', 'source_url': 'https://example.org/other'}],
        }
        with self.assertRaisesRegex(ValidationError, 'Run must cite an investigation source URL'):
            Investigation.model_validate(payload)
