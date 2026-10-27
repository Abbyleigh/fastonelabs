import copy,json,math,sys,unittest
from pathlib import Path
from pydantic import ValidationError
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from race_state import UnifiedRaceState,from_replay,verify,fingerprint,sample_pose
FIXTURE=Path(__file__).parent/'fixtures/race_state_contract.json'
class UnifiedStateTests(unittest.TestCase):
 def setUp(self):self.fixture=json.loads(FIXTURE.read_text());self.replay=self.fixture['replay'];self.channels=self.fixture['channels']
 def test_shared_fixture_matches_backend_and_is_repeatable(self):
  a=from_replay(self.replay,.5,self.channels);b=from_replay(self.replay,.5,self.channels)
  self.assertEqual(a.model_dump(mode='json'),self.fixture['expected']);self.assertEqual(fingerprint(a),fingerprint(b));self.assertEqual([c.id for c in a.cars],['1','44'])
 def test_immutable_input_and_nested_snapshot(self):
  before=copy.deepcopy(self.fixture);s=from_replay(self.replay,.5,self.channels)
  with self.assertRaises(ValidationError):s.cars[0].name='Changed'
  self.assertEqual(self.fixture,before)
 def test_unknown_fields_and_no_derived_coordinate_speed(self):
  s=from_replay(self.replay,.5);self.assertTrue(all(c.position is None and c.telemetry.speedMps is None and c.tyre is None and c.energy is None for c in s.cars));self.assertIsNone(s.trackLengthM);self.assertIsNone(s.flags);self.assertFalse(s.provenance.elevationVerified)
 def test_no_future_or_stale_telemetry(self):
  s=from_replay(self.replay,.5,self.channels);self.assertIsNone(s.cars[0].telemetry.speedMps);self.assertEqual(s.cars[1].telemetry.speedMps,50)
  later=from_replay(self.replay,3.1,self.channels);self.assertTrue(all(c.telemetry.speedMps is None for c in later.cars))
 def test_gap_policy_and_repeated_seeks(self):
  self.assertIsNone(sample_pose(self.replay['drivers'][0]['samples'],5));a=from_replay(self.replay,.5,self.channels);from_replay(self.replay,5,self.channels);self.assertEqual(a,from_replay(self.replay,.5,self.channels))
  self.assertEqual(sample_pose(self.replay['drivers'][0]['samples'],1).quality,'sampled')
 def test_invalid_times_and_duplicate_ids_rejected(self):
  for t in (-1,61,float('nan'),float('inf')):
   with self.assertRaises(ValueError):from_replay(self.replay,t)
  s=from_replay(self.replay,.5).model_dump(mode='json');s['cars'][1]['id']=s['cars'][0]['id']
  with self.assertRaises(ValidationError):UnifiedRaceState.model_validate(s)
 def test_nonfinite_and_negative_values_rejected(self):
  for value in (-1,float('nan'),float('inf')):
   d=copy.deepcopy(self.fixture['expected']);d['cars'][0]['telemetry']['speedMps']=value
   with self.assertRaises(ValidationError):UnifiedRaceState.model_validate(d)
 def test_verification_does_not_claim_accuracy(self):
  r=verify(from_replay(self.replay,.5,self.channels));self.assertFalse(r['fastf1CrossChecked']);self.assertTrue(r['classificationUnique']);self.assertEqual(r['cars'],2)

class SimulationContractTests(unittest.TestCase):
 def test_browser_simulation_checkpoint_validates_against_backend_contract(self):
  f=json.loads((FIXTURE.parent/'simulation_state_contract.json').read_text());s=UnifiedRaceState.model_validate(f['expected'])
  self.assertEqual(s.sourceKind,'simulated');self.assertEqual(s.provenance.provider,'prototype');self.assertTrue(all(c.classificationQuality=='estimated' and c.energy.quality=='estimated' for c in s.cars))
 def test_simulation_cannot_label_classification_recorded(self):
  f=json.loads((FIXTURE.parent/'simulation_state_contract.json').read_text());f['expected']['cars'][0]['classificationQuality']='recorded'
  with self.assertRaises(ValidationError):UnifiedRaceState.model_validate(f['expected'])
