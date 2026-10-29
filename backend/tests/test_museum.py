import io,json
import museum
from fastapi.testclient import TestClient
from main import app

def test_retrieval_is_sourced_and_refuses_unknown_questions():
    answer=museum.answer('carbon chassis')
    assert answer['records'] and answer['mode']=='curated-retrieval'
    assert all(r['sources'] for r in answer['records'])
    assert museum.answer('private salary password secrets')['abstained']
    assert museum.answer('1950 championship')['records']
    rows=museum.retrieve('Lotus 79')
    assert len({r['fact']for r in rows})==len(rows)

def test_public_lookup_never_calls_ai_even_when_configured(monkeypatch):
    monkeypatch.setenv('MUSEUM_AI_ENABLED','1');monkeypatch.setenv('GROQ_API_KEY','test-secret');monkeypatch.setenv('MUSEUM_AI_MODEL','test-model')
    def forbidden(*args,**kwargs):raise AssertionError('Public lookup must never invoke AI')
    monkeypatch.setattr(museum,'select_with_ai',forbidden)
    client=TestClient(app)
    response=client.get('/api/museum/historian',params={'question':'carbon chassis'})
    assert response.status_code==200 and response.json()['mode']=='curated-retrieval'
    assert 'test-secret'not in response.text
    assert client.get('/api/museum/historian',params={'question':'x'*501}).status_code==422

def test_ai_selects_ids_without_generating_new_displayed_facts(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY','test-secret');monkeypatch.setenv('MUSEUM_AI_MODEL','test-model')
    candidates=museum.retrieve('carbon chassis');wanted=candidates[0]['id'];sent={}
    def transport(request,timeout):
        sent.update(json.loads(request.data));assert request.full_url=='https://api.groq.com/openai/v1/chat/completions'
        return io.BytesIO(json.dumps({'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'record_ids':[wanted],'abstain':False})}}]}).encode())
    rows=museum.select_with_ai('carbon chassis',candidates,transport)
    assert rows==[museum.INDEX[wanted]]
    assert sent['model']=='test-model' and sent['response_format']=={'type':'json_object'}
    assert sent['max_completion_tokens']==1500

def test_ai_hallucinated_ids_are_rejected(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY','test-secret');monkeypatch.setenv('MUSEUM_AI_MODEL','test-model')
    def bad(request,timeout):return io.BytesIO(json.dumps({'choices':[{'finish_reason':'stop','message':{'content':'{"record_ids":["invented"],"abstain":false}'}}]}).encode())
    import pytest
    with pytest.raises(ValueError):museum.select_with_ai('carbon chassis',museum.retrieve('carbon chassis'),bad)

def test_local_ai_route_is_not_a_public_paid_proxy(monkeypatch):
    monkeypatch.delenv('MUSEUM_AI_ENABLED',raising=False)
    remote=TestClient(app,client=('203.0.113.5',12345))
    assert remote.post('/api/museum/historian',json={'question':'carbon chassis'}).status_code==403
    local=TestClient(app,client=('127.0.0.1',12345))
    assert local.post('/api/museum/historian',content='{"question":"carbon chassis"}',headers={'Content-Type':'text/plain'}).status_code==415
    assert local.post('/api/museum/historian',json={'question':'carbon chassis'},headers={'Origin':'https://example.com'}).status_code==403
    assert local.post('/api/museum/historian',json={'question':'carbon chassis'}).json()['mode']=='curated-retrieval'
    assert local.post('/api/museum/historian',json={'question':'x'*501}).status_code==422

def test_every_corpus_record_preserves_known_sources_and_version():
    assert museum.CORPUS['version']==1
    assert len(museum.INDEX)==len(museum.RECORDS)
    assert all(r['refs']and all(id in museum.REFERENCES for id in r['refs'])for r in museum.RECORDS)

def test_common_historian_questions_retrieve_named_evidence():
    for query,expected in [('Why did Formula 1 begin in 1950?','1950'),('What made the Lotus 79 revolutionary?','Lotus 79'),('How did carbon fibre transform F1?','carbon'),('Why was active suspension restricted?','suspension')]:
        result=museum.answer(query)
        assert result['records'],query
        assert expected.lower()in json.dumps(result['records']).lower()
