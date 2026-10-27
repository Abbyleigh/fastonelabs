import sys,unittest
from pathlib import Path
from datetime import datetime,timezone
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import pitwall
class PitWallTests(unittest.TestCase):
 def tearDown(self):pitwall.bundle.cache_clear()
 def test_radio_host_restrictions(self):
  self.assertIsNone(pitwall.safe_radio('https://evil.example/clip.mp3'))
  self.assertIsNone(pitwall.safe_radio('http://livetiming.formula1.com/a.mp3'))
  self.assertEqual(pitwall.safe_radio('https://livetiming.formula1.com/a.mp3'),'https://livetiming.formula1.com/a.mp3')
 def test_timestamps_reject_future_and_bad_dates(self):
  rows=pitwall.timed_rows([{'date':'2024-01-01T00:00:01Z'},{'date':'2024-01-01T00:02:00Z'},{'date':None}],datetime(2024,1,1,tzinfo=timezone.utc),60)
  self.assertEqual([r['time'] for r in rows],[1])
 def test_channel_failure_does_not_remove_other_channels(self):
  def fetch(channel,params):
   if channel=='team_radio':raise RuntimeError('offline')
   return [{'date':'2024-01-01T00:00:01Z','driver_number':44,'speed':200}]
  c={'origin':datetime(2024,1,1,tzinfo=timezone.utc),'session_key':1,'total_duration':120,'drivers':{44:{}}}
  with patch.object(pitwall,'context',return_value=c):
   result=pitwall.bundle(fetch,None,2024,12,0,44)
   self.assertEqual(result['channels']['car_data'][0]['speed'],200)
   self.assertIn('team_radio',result['errors'])
   with self.assertRaises(ValueError):pitwall.bundle(fetch,None,2024,12,0,99)
 def test_radio_exact_driver_only(self):
  c={'origin':datetime(2024,1,1,tzinfo=timezone.utc),'session_key':1,'total_duration':120,'drivers':{44:{},1:{}}}
  def fetch(channel,params):return [{'date':'2024-01-01T00:00:01Z','driver_number':n,'recording_url':'https://livetiming.formula1.com/a.mp3'}for n in (1,44)] if channel=='team_radio' else []
  with patch.object(pitwall,'context',return_value=c):self.assertEqual([r['driver_number']for r in pitwall.bundle(fetch,None,2024,12,0,44)['channels']['team_radio']],[44])
