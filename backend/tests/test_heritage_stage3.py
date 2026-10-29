"""Cooper slice, collection isolation, layout evidence and future-model release gates."""
from copy import deepcopy
import json
import sqlite3
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from main import app
from heritage.models import Dataset
from heritage.store import COLLECTIONS, read_dataset, Store
from heritage.ingest import ingest

client=TestClient(app)
COOPER='cooper-1959-1960'


def test_cooper_batch_and_selected_history_are_explicit():
    data=read_dataset(COLLECTIONS[COOPER])
    assert len(data.entities)==19 and len(data.classifications)==8 and len(data.sources)==14
    assert len(data.exhibits)==2 and all(e.state=='not-supplied' for e in data.exhibits)
    assert all(s.reuse=='unreviewed' for s in data.sources)
    assert all(c.value is None for e in data.entities if e.kind=='layout' for c in e.claims)
    rows={r.id:r for r in data.classifications}
    assert rows['aintree-1959-mclaren'].points==4.5
    assert rows['monaco-gp-1959-brabham'].points==9
    assert rows['1959-driver-standing-champion'].points==31
    assert rows['1960-constructor-standing-champion'].points==48
    assert next(l.target for l in data.links if l.subject=='british-gp-1959' and l.predicate=='held-at')=='aintree'
    assert next(l.target for l in data.links if l.subject=='british-gp-1960' and l.predicate=='held-at')=='silverstone'


def test_explicit_collection_does_not_replace_original():
    original=client.get('/api/heritage/entities').json()
    cooper=client.get('/api/heritage/entities',params={'collection':COOPER}).json()
    assert original['total']==10 and original['revision']=='silverstone-1950-v1'
    assert cooper['total']==19 and cooper['revision']=='cooper-1959-1960-v1'
    assert client.get('/api/heritage/entities',params={'collection':COOPER,'kind':'engine'}).json()['total']==1
    assert client.get('/api/heritage/entities',params={'collection':COOPER,'year':1960,'kind':'vehicle'}).json()['items'][0]['id']=='cooper-t53'
    assert client.get('/api/heritage/entities/cooper-t51').status_code==404
    assert client.get('/api/heritage/entities/cooper-t51?collection='+COOPER).json()['exhibit']['state']=='not-supplied'
    assert client.get('/api/heritage/entities?collection=../../etc').status_code==422


def test_same_venue_layouts_preserve_event_years_without_geometry():
    detail=client.get('/api/heritage/entities/silverstone?collection='+COOPER).json()
    assert [e['id'] for e in detail['layouts']]==['silverstone-1950','silverstone-1960']
    assert all(c['status']=='missing' for e in detail['layouts'] for c in e['claims'])
    nested=client.get('/api/heritage/entities/silverstone-1960?collection='+COOPER).json()
    assert [e['id'] for e in nested['layouts']]==['silverstone-1950','silverstone-1960']
    assert len(client.get('/api/heritage/entities/silverstone').json()['layouts'])==1


def test_collection_etags_cannot_cross_validate():
    url='/api/heritage/entities'
    original=client.get(url)
    cooper=client.get(url,params={'collection':COOPER},headers={'If-None-Match':original.headers['etag']})
    assert cooper.status_code==200 and cooper.headers['etag']!=original.headers['etag']
    assert client.get(url,params={'collection':COOPER},headers={'If-None-Match':cooper.headers['etag']}).status_code==304


def test_new_batch_ingests_atomically_and_keeps_exhibits(tmp_path):
    output=tmp_path/'cooper.sqlite'
    result=ingest(COLLECTIONS[COOPER],output)
    assert result['entities']==19
    with sqlite3.connect(output) as db:
        assert db.execute('SELECT count(*) FROM exhibits').fetchone()[0]==2
        assert db.execute('SELECT kind FROM entities WHERE id=?',('climax-25',)).fetchone()[0]=='engine'
        assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
        assert db.execute('PRAGMA user_version').fetchone()[0]==2
    with pytest.raises(FileExistsError):ingest(COLLECTIONS[COOPER],output)
    store=Store(read_dataset(COLLECTIONS[COOPER]))
    with pytest.raises(sqlite3.OperationalError):store.query('DELETE FROM exhibits')


def supplied_batch():
    data=read_dataset(COLLECTIONS[COOPER]).model_dump(mode='json')
    source=deepcopy(data['sources'][0]);source['id']='test-model-grant';source['reuse']='permitted'
    source['notes']='Synthetic test-only permission fixture, not a real model or licence grant.'
    data['sources'].append(source)
    data['exhibits'][0].update(state='supplied',asset=dict(path='/models/heritage/cooper/t51.glb',sha256='a'*64,bytes=100,creator='Test fixture',attribution='Test fixture',licence='Test fixture grant',reuse='permitted',sources=['test-model-grant'],fidelity='approximate',modifications='None',permitted_uses=['private-exhibit']))
    return data


def test_future_exhibit_contract_accepts_only_consistent_metadata():
    assert Dataset.model_validate(supplied_batch()).exhibits[0].asset.fidelity=='approximate'


@pytest.mark.parametrize('change',[
    {'path':'https://third-party.invalid/model.glb'}, {'path':'/models/heritage/../secret.glb'},
    {'sha256':'invalid'}, {'reuse':'unreviewed'}, {'sources':['goodwood-t51']},
    {'fidelity':'validated','measurement_sources':[]}, {'supports_exploded':True},
    {'permitted_uses':['commercial'],'commercial_reviewed':False}, {'bytes':0},
    {'measurement_sources':['not-a-source']},
])
def test_asset_rights_identity_and_fidelity_fail_closed(change):
    data=supplied_batch();data['exhibits'][0]['asset'].update(change)
    with pytest.raises(ValidationError):Dataset.model_validate(data)


@pytest.mark.parametrize('mutation',['pending-asset','missing-asset','duplicate','unknown-vehicle','assembly-without-map'])
def test_exhibit_release_states_cannot_be_invented(mutation):
    data=supplied_batch();exhibit=data['exhibits'][0]
    if mutation=='pending-asset':exhibit['state']='not-supplied'
    if mutation=='missing-asset':exhibit['asset']=None
    if mutation=='duplicate':data['exhibits'].append(deepcopy(exhibit))
    if mutation=='unknown-vehicle':exhibit['vehicle_id']='unknown'
    if mutation=='assembly-without-map':exhibit['assembly_labels']=['front-wing']
    with pytest.raises(ValidationError):Dataset.model_validate(data)
