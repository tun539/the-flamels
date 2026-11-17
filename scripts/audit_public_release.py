"""Check that the distributed catalogue and snapshot contain only public sources."""
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
resources = json.loads((ROOT/'data/resources.json').read_text())
snapshot = json.loads((ROOT/'frontend/app/present/data.generated.json').read_text())
policy = json.loads((ROOT/'data/publication-policy.json').read_text())
ids = {r['id'] for r in resources}
assert len(ids) == len(resources), 'Duplicate public source id'
assert not ids.intersection(policy['excluded_legacy_document_ids']), 'Excluded document in public catalogue'
for source in resources:
    url = urlsplit(source['url'])
    assert url.scheme == 'https' and url.hostname, 'Public source must use HTTPS'
    assert url.hostname == 'youtube.com' or url.hostname.endswith('.youtube.com') or url.hostname == 'nasa.gov' or url.hostname.endswith('.nasa.gov'), 'Unexpected public-source host'
    assert set(source.get('parent_ids', [])) <= ids, 'Unresolved source parent'
assert {r['id'] for r in snapshot['resources']} == ids, 'Snapshot and catalogue source sets differ'
for path in ['data/resources.json', 'frontend/app/present/data.generated.json', 'docs/sources.md', 'docs/source-expansion.md']:
    content = (ROOT/path).read_text().lower()
    assert 'drive.google.com' not in content and 'docs.google.com' not in content, f'Private document link in {path}'
assert snapshot['counts']['resources'] == len(resources)
print(f'Public-source audit passed: {len(resources)} resources; private reference content excluded.')
