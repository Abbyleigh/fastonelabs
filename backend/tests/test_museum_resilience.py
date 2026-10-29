from copy import deepcopy
import io
import json
import pytest
import museum
from museum_validation import validate_corpus, load_corpus


@pytest.mark.parametrize('mutation',['version','ref-duplicate','bad-url','missing-ref','car-duplicate','car-link','year','spec'])
def test_editorial_corpus_rejects_invalid_evidence(mutation):
    value=deepcopy(museum.CORPUS)
    if mutation=='version': value['version']=2
    if mutation=='ref-duplicate': value['references'].append(value['references'][0])
    if mutation=='bad-url': value['references'][0]['url']='https://secret@example.org/page'
    if mutation=='missing-ref': value['events'][0]['refs']=['unknown']
    if mutation=='car-duplicate': value['cars'].append(value['cars'][0])
    if mutation=='car-link': value['events'][0]['car']='unknown'
    if mutation=='year': value['events'][0]['year']='1950'
    if mutation=='spec': value['cars'][0]['specs'][0]['refs']=[]
    with pytest.raises(ValueError): validate_corpus(value)


def test_oversized_corpus_is_rejected(tmp_path):
    path=tmp_path/'oversized.json';path.write_bytes(b' '*2_000_001)
    with pytest.raises(ValueError,match='size limit'): load_corpus(path)


def test_cache_is_bounded_normalized_and_cannot_be_poisoned_by_callers():
    museum._rank.cache_clear()
    first=museum.retrieve('carbon chassis')
    first[0]['fact']='mutated'
    first[0]['refs'].clear()
    second=museum.retrieve('CHASSIS carbon')
    assert second[0]['fact']!='mutated' and second[0]['refs']
    info=museum._rank.cache_info()
    assert info.hits==1 and info.maxsize==256
    answer=museum.answer('carbon chassis')
    answer['records'][0]['sources'][0]['title']='mutated source'
    assert museum.REFERENCES[answer['records'][0]['refs'][0]]['title']!='mutated source'


@pytest.mark.parametrize('content',[
    'null','[]','{"record_ids":["invented"],"abstain":false}',
    '{"record_ids":[],"abstain":"false"}',
    '{"record_ids":[],"abstain":false,"fact":"invented"}',
    '{"record_ids":[],"abstain":false',
])
def test_bad_ai_outputs_never_become_facts(monkeypatch,content):
    monkeypatch.setenv('GROQ_API_KEY','test-only-not-a-real-key')
    def transport(request,timeout):
        assert timeout==25.0
        return io.BytesIO(json.dumps({'choices':[{'finish_reason':'stop','message':{'content':content}}]}).encode())
    with pytest.raises(ValueError):museum.select_with_ai('carbon chassis',museum.retrieve('carbon chassis'),transport)


def test_ai_truncation_oversize_and_network_failure_use_curated_fallback(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY','test-only-not-a-real-key')
    monkeypatch.setenv('MUSEUM_AI_ENABLED','1')
    for raw in [b'x'*65537,json.dumps({'choices':[{'finish_reason':'length','message':{'content':'{}'}}]}).encode()]:
        with pytest.raises(ValueError):
            museum.select_with_ai('carbon chassis',museum.retrieve('carbon chassis'),lambda *a,**k:io.BytesIO(raw))
    def failed(*a,**k):raise TimeoutError('must never display provider internals or credentials')
    monkeypatch.setattr(museum,'select_with_ai',failed)
    result=museum.answer('carbon chassis',allow_ai=True)
    assert result['mode']=='curated-retrieval' and result['records']
    assert 'unavailable' in result['notice']
    assert 'credentials' not in json.dumps(result)


def test_provider_only_selects_candidates_and_deduplicates_ids(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY','test-only-not-a-real-key')
    candidates=museum.retrieve('carbon chassis');wanted=candidates[0]['id']
    def transport(request,timeout):
        payload=json.loads(request.data)
        assert payload['messages'][1]['role']=='user'
        assert 'test-only' not in request.data.decode()
        return io.BytesIO(json.dumps({'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'record_ids':[wanted,wanted],'abstain':False})}}]}).encode())
    assert museum.select_with_ai('carbon chassis',candidates,transport)==[museum.INDEX[wanted]]


def test_local_historian_bounds_streamed_bodies_and_rejects_invalid_json():
    from fastapi.testclient import TestClient
    from main import app
    client=TestClient(app,client=('127.0.0.1',12345))
    headers={'Content-Type':'application/json'}
    def chunks():
        yield b'{"question":"'
        yield b'a'*3000
        yield b'"}'
    assert client.post('/api/museum/historian',content=chunks(),headers=headers).status_code==413
    for body in ['null','[]','{"question":123}','not JSON','{"question":"ab"}']:
        response=client.post('/api/museum/historian',content=body,headers=headers)
        assert response.status_code==422
        assert 'Traceback' not in response.text
