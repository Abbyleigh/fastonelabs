"""Read-only SQLite projection and deterministic offline ingestion."""
import hashlib
import json
import sqlite3
from pathlib import Path
from threading import RLock
from .models import Dataset, Entity, Source, Link, Classification

ROOT = Path(__file__).resolve().parent
SEED = ROOT / 'data' / 'silverstone-1950.json'
MAX_BYTES = 20 * 1024 * 1024


def read_dataset(path=SEED):
    path = Path(path)
    with path.open('rb') as stream:
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError('Dataset exceeds 20 MiB ingestion limit; split into reviewed batches')
    return Dataset.model_validate_json(raw)


def populate(connection, dataset):
    connection.executescript((ROOT / 'migrations' / '001_catalog.sql').read_text())
    with connection:
        connection.executemany('INSERT INTO metadata VALUES (?,?)', [
            ('revision', dataset.revision), ('coverage', dataset.coverage), ('schema_version', '1')])
        connection.executemany('INSERT INTO sources VALUES (?,?)',
                               [(s.id, s.model_dump_json()) for s in dataset.sources])
        connection.executemany('INSERT INTO entities VALUES (?,?,?,?,?,?)',
                               [(e.id, e.kind, e.name, e.coverage_start, e.coverage_end, e.model_dump_json()) for e in dataset.entities])
        for e in dataset.entities:
            connection.executemany('INSERT INTO entity_sources VALUES (?,?)', [(e.id, s) for s in e.sources])
            connection.executemany('INSERT INTO claims VALUES (?,?,?,?)',
                                   [(e.id, c.key, c.status, c.model_dump_json()) for c in e.claims])
            connection.executemany('INSERT INTO claim_sources VALUES (?,?,?)',
                                   [(e.id, c.key, s) for c in e.claims for s in c.sources])
        connection.executemany('INSERT INTO links(subject,target,predicate,payload) VALUES (?,?,?,?)',
                               [(l.subject, l.target, l.predicate, l.model_dump_json()) for l in dataset.links])
        for row in dataset.classifications:
            connection.execute('INSERT INTO classifications VALUES (?,?,?,?,?,?,?)',
                               (row.id, row.category, row.season_id, row.race_id, row.constructor_id, row.position, row.model_dump_json()))
            connection.executemany('INSERT INTO classification_drivers VALUES (?,?)',
                                   [(row.id, d) for d in row.driver_ids])
    if connection.execute('PRAGMA foreign_key_check').fetchall():
        raise ValueError('Foreign key validation failed')


class Store:
    def __init__(self, dataset):
        self.db = sqlite3.connect(':memory:', check_same_thread=False)
        self.lock = RLock()
        populate(self.db, dataset)
        self.db.execute('PRAGMA query_only=ON')
        self.revision = dataset.revision
        self.coverage = dataset.coverage
        self.digest = hashlib.sha256(dataset.model_dump_json().encode()).hexdigest()

    def query(self, sql, params=()):
        with self.lock:
            return self.db.execute(sql, params).fetchall()

    def search(self, query='', kind=None, year=None, limit=20, offset=0):
        # instr treats %, _ and quotes literally; all values stay bound parameters.
        where, params = ['instr(lower(name), lower(?)) > 0'], [query.strip()]
        if kind:
            where.append('kind = ?')
            params.append(kind)
        if year is not None:
            where.append('coverage_start <= ? AND coverage_end >= ?')
            params.extend([year, year])
        clause = ' AND '.join(where)
        total = self.query('SELECT count(*) FROM entities WHERE ' + clause, params)[0][0]
        rows = self.query('SELECT payload FROM entities WHERE ' + clause + ' ORDER BY coverage_start, name, id LIMIT ? OFFSET ?', [*params, limit, offset])
        return [Entity.model_validate_json(row[0]) for row in rows], total

    def detail(self, identifier):
        rows = self.query('SELECT payload FROM entities WHERE id=?', (identifier,))
        if not rows:
            return None
        entity = Entity.model_validate_json(rows[0][0])
        links = [Link.model_validate_json(row[0]) for row in self.query(
            'SELECT payload FROM links WHERE subject=? OR target=? ORDER BY id LIMIT 100', (identifier, identifier))]
        ids = {l.subject for l in links} | {l.target for l in links}
        related = [Entity.model_validate_json(row[0]) for i in sorted(ids - {identifier})
                   for row in self.query('SELECT payload FROM entities WHERE id=?', (i,))]
        classifications = [Classification.model_validate_json(row[0]) for row in self.query('''
            SELECT c.payload FROM classifications c WHERE c.race_id=? OR c.season_id=? OR c.constructor_id=?
            OR c.id IN (SELECT classification_id FROM classification_drivers WHERE driver_id=?)
            ORDER BY c.category, c.position, c.id LIMIT 100''', (identifier,) * 4)]
        # Bound detail responses as the collection grows. Only referenced names are sent.
        ids.update(d for c in classifications for d in c.driver_ids)
        ids.update(c.constructor_id for c in classifications)
        names = {i: row[0] for i in sorted(ids | {identifier})
                 for row in self.query('SELECT name FROM entities WHERE id=?', (i,))}
        links_total = self.query('SELECT count(*) FROM links WHERE subject=? OR target=?', (identifier, identifier))[0][0]
        classifications_total = self.query('''SELECT count(*) FROM classifications c
            WHERE c.race_id=? OR c.season_id=? OR c.constructor_id=?
            OR c.id IN (SELECT classification_id FROM classification_drivers WHERE driver_id=?)''', (identifier,) * 4)[0][0]
        return entity, links, related, classifications, names, links_total, classifications_total

    def sources(self):
        return [Source.model_validate_json(row[0]) for row in self.query('SELECT payload FROM sources ORDER BY id')]

    def facets(self):
        return {'kinds': [row[0] for row in self.query('SELECT DISTINCT kind FROM entities ORDER BY kind')],
                'years': sorted({y for start, end in self.query('SELECT coverage_start,coverage_end FROM entities') for y in range(start, end + 1)})}
