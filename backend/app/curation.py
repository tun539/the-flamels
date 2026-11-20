"""Upgrade a known seed revision without overwriting edited or imported records."""
import hashlib
import json
from .catalogue import put


def record_hash(item):
    return hashlib.sha256(json.dumps(item, sort_keys=True).encode()).hexdigest()


def sync_seed_record(db, item, previous_sha256=None, *, append_conditions=False):
    row = db.execute('SELECT payload FROM investigations WHERE id=?', (item['id'],)).fetchone()
    if row is None:
        put(db, item)
        return 'created'
    previous = json.loads(row['payload'])
    if previous == item:
        return 'unchanged'
    accepted = (previous_sha256,) if isinstance(previous_sha256, str) else previous_sha256 or ()
    if record_hash(previous) not in accepted:
        return 'preserved'
    # Measurements are stored separately; an editorial upgrade must not change them.
    old_measurements = [(r['id'], r.get('measurements', [])) for r in previous.get('runs', [])]
    new_measurements = [(r['id'], r.get('measurements', [])) for r in item.get('runs', [])]
    if append_conditions and not any(m for _, m in new_measurements[len(old_measurements):]):
        new_measurements = new_measurements[:len(old_measurements)]
    if old_measurements != new_measurements:
        raise ValueError('Editorial seed refresh cannot change measured observations')
    db.execute('UPDATE investigations SET payload=? WHERE id=?', (json.dumps(item), item['id']))
    db.execute('DELETE FROM search WHERE id=?', (item['id'],))
    db.execute('INSERT INTO search VALUES (?,?)', (item['id'], ' '.join(str(item.get(k, '')) for k in ['acronym', 'title', 'objectives', 'material', 'theme'])))
    return 'updated'
