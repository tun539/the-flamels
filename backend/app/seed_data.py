"""Shared source ingestion for the local seed and offline presentation snapshot."""

import csv
import hashlib
import io
import json
import math
from pathlib import Path

from .curation import record_hash

ROOT = Path(__file__).resolve().parents[2]
SOURCE_PATH = 'data/sources/psi69-flex-experimental-table.csv'
SOURCE_SHA256 = '74addb771d6ec6765d285721bd35ec1ce3936d104e265f363aeba18c6c25743b'
SOURCE_URL = 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69'
MMHG_TO_KPA = 101.325 / 760  # kPa per mmHg, using the conventional atmosphere equivalence.
OXYGEN = 'O initial ambient composition; mole fraction'
PRESSURE = 'Ambient pressure; mmHg'
SEED_PATHS = ('data/seed.json', 'data/psi-seed.json', SOURCE_PATH)


def flex_conditions(study):
    raw = (ROOT / SOURCE_PATH).read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise ValueError('FLEX experimental table differs from the reviewed source snapshot')
    rows = csv.DictReader(io.StringIO(raw.decode('cp1252'), newline=''))
    expected_fields = {'FLEX Test #', 'FLEX Identifier', 'Fuel', OXYGEN, PRESSURE}
    if not expected_fields.issubset(rows.fieldnames or []):
        raise ValueError('Missing required columns in FLEX experimental table')
    previous_hash = record_hash(study)
    study['platform'] = 'ISS'
    study['limitations'] = (
        'FLEX environment conditions describe liquid droplet chamber runs. The reviewed import covers '
        'initial oxygen and ambient pressure only. Diluent mixtures vary and are outside the matching rule. '
        'Test 114 reports zero pressure, so canonical pressure is unknown for that row.'
    )
    study['sources'].append({
        'url': SOURCE_URL, 'title': 'NASA PSI-69 FLEX Experimental Table',
        'locator': 'Version 5 · FLEX experimental table',
        'summary': 'NASA PSI experimental table of FLEX liquid droplet runs with source-reported initial oxygen and ambient pressure.',
        'retrieved_at': '2026-11-19', 'checksum': SOURCE_SHA256,
    })
    seen = set()
    for row_number, row in enumerate(rows, start=2):
        test = row['FLEX Test #']
        oxygen, pressure = float(row[OXYGEN]), float(row[PRESSURE])
        if not test.isascii() or not test.isdecimal() or test in seen:
            raise ValueError(f'Invalid or duplicate FLEX test number at CSV line {row_number}')
        if not (0 <= oxygen <= 1) or not math.isfinite(pressure) or (pressure <= 0 and (test, pressure) != ('114', 0)):
            raise ValueError(f'Unexpected FLEX atmosphere value at CSV line {row_number}')
        seen.add(test)
        study['runs'].append({
            'id': f'psi69-test-{test}',
            'source_locator': f"Version 5; FLEX Experimental Table; test {test}; {row['FLEX Identifier']}; CSV line {row_number}",
            'source_url': SOURCE_URL, 'oxygen_context': 'ambient', 'atmosphere_basis': 'source_reported',
            'oxygen_fraction': oxygen, 'pressure_kpa': pressure * MMHG_TO_KPA if pressure > 0 else None,
            'airflow_m_s': None, 'gravity': 'microgravity', 'material': row['Fuel'],
            'geometry': 'liquid droplet', 'material_phase': 'liquid', 'measurement': None, 'measurements': [],
            'original_values': {
                'oxygen_fraction': {'value': row[OXYGEN], 'unit': 'fraction', 'factor': 1, 'header': OXYGEN},
                'pressure_kpa': {'value': row[PRESSURE], 'unit': 'mmHg', 'factor': MMHG_TO_KPA, 'header': PRESSURE},
            },
        })
    return previous_hash


def read_seed_studies():
    studies = [
        *json.loads((ROOT / SEED_PATHS[0]).read_text()),
        *json.loads((ROOT / SEED_PATHS[1]).read_text()),
    ]
    flex = next(study for study in studies if study['id'] == 'flex')
    return studies, {'flex': flex_conditions(flex)}
