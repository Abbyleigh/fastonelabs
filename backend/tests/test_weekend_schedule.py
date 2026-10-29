from weekend_schedule import sessions_for_race

def test_weekend_times_preserve_source_utc_and_include_sprint():
    rows=sessions_for_race({'date':'2026-11-01','time':'20:00:00Z','FirstPractice':{'date':'2026-10-30','time':'18:00:00Z'},'Sprint':{'date':'2026-10-31','time':'17:00:00Z'}})
    assert [r['name'] for r in rows]==['Practice 1','Sprint','Race']
    assert rows[0]['start']=='2026-10-30T18:00:00+00:00'
    assert all(r['time_confirmed'] for r in rows)

def test_missing_timezone_or_time_is_never_noon():
    rows=sessions_for_race({'date':'1950-05-13','Qualifying':{'date':'1950-05-12','time':'13:00:00'}})
    assert all(r['start'] is None and not r['time_confirmed'] for r in rows)

def test_bad_dates_and_duplicate_qualifying_aliases():
    same={'date':'2026-10-31','time':'10:00:00Z'}
    rows=sessions_for_race({'date':'invalid','FirstPractice':None,'SprintShootout':same,'SprintQualifying':same})
    assert len(rows)==1 and rows[0]['name']=='Sprint qualifying'
