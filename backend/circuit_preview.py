"""Historical circuit previews with an explicit source event; no future telemetry."""
from datetime import datetime, timezone
from functools import lru_cache
from race_replay import context, LOCK, Unavailable

@lru_cache(maxsize=24)
def load_circuit_preview(fetch, archive, year, round_num, resolve=context):
    target_rows=archive(f'{year}/{round_num}/races',{'limit':1},cache_seconds=21600).get('RaceTable',{}).get('Races',[])
    if not target_rows:raise Unavailable('This calendar event could not be found.')
    target=target_rows[0]
    if int(target['season'])!=year or int(target['round'])!=round_num:raise Unavailable('Calendar identity mismatch; no circuit preview loaded.')
    circuit_id=target.get('Circuit',{}).get('circuitId')
    if not circuit_id:raise Unavailable('This event has no circuit identity in the archive.')
    today=datetime.now(timezone.utc).date().isoformat()
    for source_year in range(year,2022,-1):
        races=archive(f'{source_year}/races',{'limit':100},cache_seconds=21600).get('RaceTable',{}).get('Races',[])
        candidates=[race for race in races if race.get('Circuit',{}).get('circuitId')==circuit_id and race.get('date','9999')<today and int(race.get('season',0))==source_year]
        candidates.sort(key=lambda race:race['date'],reverse=True)
        for race in candidates:
            try:
                with LOCK:recorded=resolve(fetch,archive,source_year,int(race['round']))
            except Unavailable:continue
            return {**recorded['track'],'preview':True,'requested_year':year,'requested_round':round_num,'requested_event':target['raceName'],'requested_date':target['date'], 'circuit_id':circuit_id,'reference_year':source_year,'reference_round':int(race['round']),'reference_date':race['date'], 'reference_event':race['raceName'],'limitations':'Historical recorded lap outline. Future layout changes and elevation are unverified. Surfaces, kerbs, barriers and scenery are illustrative. This preview contains no future race positions or results.'}
    raise Unavailable('No historical position outline is available for this circuit from 2023 onward. No other circuit has been substituted.')
