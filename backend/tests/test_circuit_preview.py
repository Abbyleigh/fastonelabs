import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from circuit_preview import load_circuit_preview
from race_replay import Unavailable,timestamp

def race(year,round_num,circuit,date):
 return {'season':str(year),'round':str(round_num),'raceName':circuit+' Grand Prix','date':date,'Circuit':{'circuitId':circuit}}
class CircuitPreviews(unittest.TestCase):
 def setUp(self):load_circuit_preview.cache_clear()
 def test_null_provider_timestamp_is_recoverable(self):
  with self.assertRaises(ValueError):timestamp(None)
 def test_future_event_uses_same_circuit_and_labels_source(self):
  target=race(2026,19,'mexico','2999-11-01');past=race(2025,20,'mexico','2025-10-26');other=race(2025,12,'silverstone','2025-07-06');calls=[]
  def archive(path,params,**kw):return {'RaceTable':{'Races':[target] if path=='2026/19/races' else [target] if path=='2026/races' else [past,other] if path=='2025/races' else []}}
  def resolve(fetch,archive,y,r):calls.append((y,r));return {'track':{'coordinates':[[1,2],[3,4]],'year':y}}
  result=load_circuit_preview(None,archive,2026,19,resolve)
  self.assertEqual(calls,[(2025,20)]);self.assertEqual(result['reference_year'],2025);self.assertEqual(result['requested_year'],2026);self.assertEqual(result['circuit_id'],'mexico');self.assertNotIn('drivers',result)
 def test_never_substitutes_another_circuit(self):
  target=race(2026,19,'new-circuit','2999-11-01')
  def archive(path,params,**kw):return {'RaceTable':{'Races':[target] if path=='2026/19/races' else [race(2025,12,'silverstone','2025-07-06')]}}
  def resolve(*args):self.fail('An unrelated circuit must not resolve')
  with self.assertRaises(Unavailable):load_circuit_preview(None,archive,2026,19,resolve)
 def test_calendar_identity_mismatch_is_rejected(self):
  def archive(*args,**kw):return {'RaceTable':{'Races':[race(2026,18,'mexico','2026-10-25')]}}
  with self.assertRaises(Unavailable):load_circuit_preview(None,archive,2026,19,lambda *a:None)
 def test_missing_same_circuit_telemetry_remains_unavailable(self):
  target=race(2026,19,'mexico','2999-11-01')
  def archive(path,params,**kw):return {'RaceTable':{'Races':[target] if path=='2026/19/races' else [race(2025,20,'mexico','2025-10-26')] if path=='2025/races' else []}}
  def resolve(*args):raise Unavailable('missing')
  with self.assertRaises(Unavailable):load_circuit_preview(None,archive,2026,19,resolve)
if __name__=='__main__':unittest.main()
