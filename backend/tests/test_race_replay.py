import unittest,sys,math
from pathlib import Path
from datetime import datetime,timedelta,timezone
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from race_replay import select_session,samples_for_window,load_replay,context,bundle,Unavailable,timestamp
class ReplayTests(unittest.TestCase):
 def setUp(self):context.cache_clear();bundle.cache_clear()
 def fixtures(self):
  self.calls=[];dates={1:'2024-05-26',2:'2024-07-07'}
  def archive(path,params,cache_seconds):
   number=int(path.split('/')[1]);return {'RaceTable':{'Races':[{'season':'2024','round':str(number),'date':dates[number],'raceName':f'Event {number}','Circuit':{'circuitName':f'Track {number}'}}]}}
  def fetch(endpoint,params):
   self.calls.append((endpoint,params.copy()))
   if endpoint=='sessions':return [{'session_name':'Race','session_key':n,'date_start':day+'T12:00:00Z','date_end':day+'T14:00:00Z'}for n,day in dates.items()]
   n=params['session_key'];start=timestamp(dates[n]+'T12:00:00Z')
   if endpoint=='laps':return [{'driver_number':7,'date_start':start.isoformat(),'lap_number':1,'lap_duration':90},{'driver_number':7,'date_start':(start+timedelta(seconds=90)).isoformat(),'lap_number':2,'lap_duration':80}]
   if endpoint=='drivers':return [{'driver_number':7,'name_acronym':'ONE','full_name':'First Driver','team_colour':'FF8700'},{'driver_number':8,'name_acronym':'TWO','full_name':'Second Driver','team_colour':'bad colour'}]
   if endpoint=='location':
    begin=timestamp(params['date>']);end=timestamp(params['date<']);numbers=[params['driver_number']]if'driver_number'in params else[7,8,241]
    return [{'driver_number':driver,'date':(begin+(end-begin)*(i/40)).isoformat(),'x':n*100+math.cos(i),'y':math.sin(i),'z':0}for driver in numbers for i in range(41)]
   raise AssertionError(endpoint)
  return fetch,archive
 def test_event_selection_and_shared_clock(self):
  fetch,archive=self.fixtures();a=load_replay(fetch,archive,2024,1);b=load_replay(fetch,archive,2024,2)
  self.assertNotEqual(a['session_key'],b['session_key']);self.assertEqual(a['event'],'Event 1');self.assertEqual(b['track']['circuit'],'Track 2')
  self.assertEqual(len(a['drivers']),2);self.assertEqual(a['track']['session_key'],a['session_key']);self.assertEqual(a['total_duration'],170)
  for driver in a['drivers']:self.assertEqual(driver['samples'][0]['time'],0);self.assertEqual(driver['samples'][-1]['time'],60)
  self.assertEqual(a['drivers'][1]['color'],'#8A9CB5')
 def test_window_offset_and_caching(self):
  fetch,archive=self.fixtures();a=load_replay(fetch,archive,2024,1,60);calls=len(self.calls)
  self.assertEqual(a,load_replay(fetch,archive,2024,1,60));self.assertEqual(len(self.calls),calls)
  self.assertEqual(a['window_start'],60);self.assertIn('12:01:00',a['window_start_utc'])
  last=load_replay(fetch,archive,2024,1,120);self.assertEqual(last['duration'],50)
  for bad in [-1,170,float('nan'),float('inf')]:
   with self.assertRaises(ValueError):load_replay(fetch,archive,2024,1,bad)
 def test_red_flag_lap_is_kept_in_recorded_timeline(self):
  fetch,archive=self.fixtures()
  def with_red_flag(endpoint,params):
   if endpoint=='laps':return [{'driver_number':7,'date_start':'2024-05-26T12:00:00Z','lap_number':1,'lap_duration':600},{'driver_number':7,'date_start':'2024-05-26T12:10:00Z','lap_number':2,'lap_duration':80}]
   return fetch(endpoint,params)
  result=load_replay(with_red_flag,archive,2024,1)
  self.assertEqual(result['total_duration'],680);self.assertIn('12:00:00',result['window_start_utc'])
 def test_unsupported_seasons_and_missing_sessions_do_not_substitute(self):
  fetch,archive=self.fixtures()
  with self.assertRaises(Unavailable):load_replay(fetch,archive,2022,1)
  self.assertFalse(self.calls)
  with self.assertRaises(Unavailable):select_session([], '2024-05-26')
 def test_future_and_ambiguous_sessions_rejected(self):
  row={'session_name':'Race','session_key':1,'date_start':'2030-05-26T12:00:00Z','date_end':'2030-05-26T14:00:00Z'}
  with self.assertRaises(Unavailable):select_session([row],'2030-05-26',now=timestamp('2030-05-26T13:00:00Z'))
  with self.assertRaises(Unavailable):select_session([row,row],'2030-05-26',now=timestamp('2030-05-27T13:00:00Z'))
 def test_bad_samples_duplicates_and_timeline_gaps(self):
  start=timestamp('2024-05-26T12:00:00Z')
  points=[{'driver_number':1,'date':(start+timedelta(seconds=t)).isoformat(),'x':1,'y':2}for t in [0,0,10,61]]
  points+=[{'driver_number':1,'date':start.isoformat(),'x':float('nan'),'y':2},{'driver_number':1,'date':'bad','x':1,'y':2}]
  rows=samples_for_window(points,start,60)[1]
  self.assertEqual([r['time']for r in rows],[0,10]) # No interpolated/fabricated gap points.
if __name__=='__main__':unittest.main()
