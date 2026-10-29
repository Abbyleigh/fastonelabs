"""Offline integration, provenance, ingestion and abuse-boundary tests."""
import json
from pathlib import Path
import sqlite3
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
import main
from heritage.models import Dataset
from heritage.store import read_dataset, SEED
from heritage.ingest import ingest
from heritage.router import get_store

client = TestClient(main.app)


def test_seed_proves_the_selected_vertical_slice():
    data = read_dataset()
    assert len(data.entities) == 10
    assert len(data.classifications) == 7
    assert len(data.sources) == 5
    assert {s.reuse for s in data.sources} == {'unreviewed'}
    assert next(e for e in data.entities if e.id == 'silverstone-1950').claims[0].value is None
    assert not any(c.status == 'simulated' for e in data.entities for c in e.claims)
    assert 'not' in data.coverage.lower()


def test_search_filter_pagination_and_literal_user_input():
    result = client.get('/api/heritage/entities?kind=driver&year=1950&limit=2').json()
    assert result['total'] == 4 and len(result['items']) == 2
    following = client.get('/api/heritage/entities?kind=driver&limit=2&offset=2').json()
    assert not {e['id'] for e in result['items']} & {e['id'] for e in following['items']}
    for term in ["' OR 1=1 --", '%', '_', 'not-a-known-name']:
        response = client.get('/api/heritage/entities', params={'q': term})
        assert response.status_code == 200 and response.json()['items'] == []
    assert client.get('/api/heritage/entities?q=  aLfEtTa  ').json()['total'] == 1
    assert client.get('/api/heritage/entities?year=1951').json()['total'] == 0


def test_race_and_vehicle_keep_evidence_and_missing_data():
    result = client.get('/api/heritage/entities/british-gp-1950')
    assert result.status_code == 200
    body = result.json()
    assert len(body['classifications']) == 4
    assert {r['category'] for r in body['classifications']} == {'race', 'qualifying'}
    assert next(r for r in body['classifications'] if r['id'] == 'race-farina')['points'] == 9
    assert len([r for r in body['classifications'] if r['category'] == 'qualifying']) == 1
    assert any(l['target'] == 'silverstone-1950' for l in body['links'])
    alfa = client.get('/api/heritage/entities/alfa-158').json()['entity']
    weight = next(c for c in alfa['claims'] if c['key'] == 'weight')
    assert weight['value'] == 620 and 'unspecified' in weight['context']
    model = next(c for c in alfa['claims'] if c['key'] == 'model')
    assert model['value'] is None and model['status'] == 'missing'
    assert client.get('/api/heritage/entities/not-here').status_code == 404


@pytest.mark.parametrize('query', ['limit=0','limit=51','offset=-1','offset=100001','year=1949','year=2101','kind=unknown','q='+'x'*101])
def test_invalid_queries_are_rejected(query):
    assert client.get('/api/heritage/entities?' + query).status_code == 422


def test_representation_specific_etags_and_conditional_gets():
    url = '/api/heritage/entities?kind=driver'
    first = client.get(url)
    assert first.headers['cache-control'] == 'public, max-age=300'
    assert first.headers['x-content-type-options'] == 'nosniff'
    tag = first.headers['etag']
    for value in [tag, 'W/'+tag, '"other", '+tag, '*']:
        cached = client.get(url, headers={'If-None-Match': value})
        assert cached.status_code == 304 and cached.content == b''
    assert client.get('/api/heritage/entities/alfa-158', headers={'If-None-Match':tag}).status_code == 200


@pytest.mark.parametrize('mutation', ['duplicate','source','missing','period','relation','race-season','nonfinite','url','extra'])
def test_invalid_batches_fail_before_database_creation(tmp_path, mutation):
    value = json.loads(SEED.read_text())
    if mutation == 'duplicate': value['entities'].append(value['entities'][0])
    if mutation == 'source': value['entities'][0]['sources'] = ['unknown']
    if mutation == 'missing': value['entities'][0]['claims'][0]['value'] = None
    if mutation == 'period': value['entities'][0]['coverage_end'] = 1949
    if mutation == 'relation': value['links'][0]['target'] = 'alfa-158'
    if mutation == 'race-season': value['classifications'][0]['season_id'] = 'alfa-158'
    if mutation == 'nonfinite': value['classifications'][0]['points'] = float('inf')
    if mutation == 'url': value['sources'][0]['url'] = 'javascript:alert(1)'
    if mutation == 'extra': value['entities'][0]['invented'] = True
    source = tmp_path/'bad.json'
    source.write_text(json.dumps(value))
    with pytest.raises((ValidationError, ValueError)):
        ingest(source, tmp_path/'must-not-exist.sqlite')
    assert not (tmp_path/'must-not-exist.sqlite').exists()


def test_atomic_ingestion_foreign_keys_and_no_overwrite(tmp_path):
    target = tmp_path/'catalog.sqlite'
    result = ingest(SEED, target)
    assert result['entities'] == 10
    before = target.read_bytes()
    with pytest.raises(FileExistsError): ingest(SEED, target)
    assert target.read_bytes() == before
    with sqlite3.connect(target) as db:
        # Fresh projections include the new exhibit table even for the unchanged 1950 batch.
        assert db.execute('PRAGMA user_version').fetchone()[0] == 2
        assert db.execute('PRAGMA foreign_key_check').fetchall() == []
        assert db.execute('SELECT count(*) FROM claim_sources').fetchone()[0] > 0


def test_shared_drives_and_tied_positions_do_not_collapse_entries():
    value = json.loads(SEED.read_text())
    value['classifications'][0]['driver_ids'].append('fangio')
    value['classifications'][1]['position'] = 1
    value['classifications'][1]['position_text'] = '1'
    assert Dataset.model_validate(value).classifications[0].driver_ids == ['farina','fangio']


def test_store_is_read_only_and_concurrent_reads_work():
    store = get_store()
    with pytest.raises(sqlite3.OperationalError): store.query('DELETE FROM entities')
    with ThreadPoolExecutor(max_workers=4) as pool:
        assert list(pool.map(lambda _: store.search(kind='driver')[1], range(12))) == [4]*12


def test_existing_api_and_openapi_contracts_remain_available():
    assert client.get('/api/health').json() == {'status':'ok','provider':'OpenF1'}
    paths = client.get('/openapi.json').json()['paths']
    assert '/api/replay/multi' in paths and '/api/race-state' in paths
    assert paths['/api/heritage/entities']['get']['responses']['200']['content']['application/json']['schema']['$ref'].endswith('SearchResponse')
