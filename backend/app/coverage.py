"""Evidence coverage over explicit, source-linked ambient run conditions."""
import hashlib
import json
from pathlib import Path

METHOD = json.loads((Path(__file__).resolve().parents[2] / 'data/coverage-methodology.json').read_text())
PLOT_BASES = {'measured', 'source_reported', 'test_matrix'}


def dataset_version(items):
    payload = json.dumps(items, sort_keys=True, separators=(',', ':')).encode()
    return hashlib.sha256(payload).hexdigest()


def coverage_runs(items):
    rows = []
    for item in sorted(items, key=lambda item: item['id']):
        if item['verification'] == 'synthetic':
            continue
        urls = {source['url'] for source in item['sources']}
        for run in item['runs']:
            source_url = run.get('source_url')
            locator = run['source_locator'].strip()
            if not source_url:
                if len(urls) == 1:
                    source_url = next(iter(urls))
            linked = source_url in urls and bool(locator)
            basis = run.get('atmosphere_basis') or 'unknown'
            context = run.get('oxygen_context') or 'unknown'
            oxygen, pressure = run.get('oxygen_fraction'), run.get('pressure_kpa')
            pair = linked and context == 'ambient' and oxygen is not None and pressure is not None and basis in PLOT_BASES
            rows.append({
                'investigation_id': item['id'], 'acronym': item['acronym'], 'run_id': run['id'],
                'material': run.get('material'), 'material_phase': run.get('material_phase'),
                'gravity': run.get('gravity'), 'basis': basis, 'oxygen_context': context,
                'oxygen_fraction': oxygen if pair else None, 'pressure_kpa': pressure if pair else None,
                'source_url': source_url if linked else None, 'source_locator': locator,
            })
    return rows


def readiness(rows, scenario, window=None):
    window = window or METHOD['window']
    observed = [row for row in rows if row['basis'] in {'measured', 'source_reported'} and row['oxygen_fraction'] is not None]
    nearby = [
        row for row in observed
        if abs(row['oxygen_fraction'] - scenario.oxygen_fraction) <= window['oxygen_percentage_points'] / 100 + 1e-12
        and abs(row['pressure_kpa'] - scenario.pressure_kpa) <= window['pressure_kpa'] + 1e-12
    ]
    gravity = [row for row in rows if row['source_url'] and (row['gravity'] or '').strip().lower() == scenario.gravity.strip().lower()]
    applicable = [row for row in nearby if row['gravity'] and row['gravity'].strip().lower() == scenario.gravity.strip().lower()]
    solid = [
        row for row in applicable if row['material_phase'] == 'solid'
        and (not scenario.material.strip() or (row['material'] or '').strip().lower() == scenario.material.strip().lower())
    ]

    def check(key, matches, cohort):
        count = len(matches)
        status = ('not_applicable' if not rows else 'missing' if not cohort or (not count and key == 'recorded_atmosphere') else
                  'outside_coverage' if not count else 'thin' if count < METHOD['minimum_runs'] else 'documented')
        return {'id': key, 'status': status, 'count': count, 'total': len(cohort),
                'evidence_ids': [[row['investigation_id'], row['run_id']] for row in matches]}

    return [
        check('recorded_atmosphere', observed, rows),
        check('nearby_atmosphere', nearby, observed),
        check('gravity', gravity, [row for row in rows if row['source_url'] and row['gravity']]),
        check('solid_material', solid, [row for row in applicable if row['material_phase']]),
    ]


def coverage_report(items, scenario, filters=None):
    filters = filters or {'investigation': '', 'material': '', 'basis': '', **METHOD['window']}
    rows = [
        row for row in coverage_runs(items)
        if (not filters['investigation'] or row['investigation_id'] == filters['investigation'])
        and (not filters['material'] or row['material'] == filters['material'])
        and (not filters['basis'] or row['basis'] == filters['basis'])
    ]
    return {
        'data_version': dataset_version(items), 'methodology': METHOD, 'filters': filters,
        'checks': readiness(rows, scenario, filters), 'runs': rows,
    }
