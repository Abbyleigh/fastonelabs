import json,sys
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
import main
from race_state import from_replay
client=TestClient(main.app)
fixture=json.loads((Path(__file__).parent/'fixtures/race_state_contract.json').read_text())
state=from_replay(fixture['replay'],.5,fixture['channels'])
def test_original_health_shape_and_detailed_source_honesty():
 assert client.get('/api/health').json()=={'status':'ok','provider':'OpenF1'}
 details=client.get('/api/health?details=true').json();assert details['fastf1']['version']=='3.9.0';assert details['fastf1']['importerConnected'] is False

def test_schema_and_snapshot_and_repeat_seek_routes():
 assert client.get('/api/race-state/schema').json()['properties']['schemaVersion']['const']==1
 with patch('race_state.load_state',return_value=state)as load:
  result=client.get('/api/race-state?year=2024&round=12&time=.5&driver=44');assert result.status_code==200;assert result.json()==fixture['expected'];assert load.call_args.args[-1]==44
  check=client.get('/api/race-state/verify?year=2024&round=12&time=.5').json();assert check['repeatSeekIdentical'];assert not check['fastf1CrossChecked']

def test_invalid_state_request_fails_before_provider_io():
 with patch('race_state.load_state')as load:
  assert client.get('/api/race-state?year=2022&round=12').status_code==400;load.assert_not_called()

def test_existing_replay_response_is_not_replaced_by_new_contract():
 with patch('race_replay.load_replay',return_value=fixture['replay']):
  assert client.get('/api/replay/multi?year=2024&round=12').json()==fixture['replay']

def test_bad_seek_times_are_rejected_before_provider_io():
 with patch('race_state.load_state')as load:
  for t in ('nan','inf','-1','61'):
   assert client.get('/api/race-state?year=2024&round=12&time='+t).status_code==400
  load.assert_not_called()
