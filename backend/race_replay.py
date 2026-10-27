"""Resolve an archived event to its recorded session; never substitute another race."""
from datetime import datetime,timedelta,timezone
from functools import lru_cache
from threading import RLock
import math,re
LOCK=RLock()
class Unavailable(ValueError):pass

def timestamp(value):
    if not isinstance(value,str):raise ValueError('A recorded timestamp must be text.')
    result=datetime.fromisoformat(value.replace('Z','+00:00'))
    return result if result.tzinfo else result.replace(tzinfo=timezone.utc)

def select_session(sessions,race_date,now=None):
    now=now or datetime.now(timezone.utc)
    day=timestamp(race_date+'T00:00:00Z').date()
    candidates=[]
    for row in sessions:
        if row.get('session_name')!='Race' or row.get('is_cancelled'):continue
        try:
            start=timestamp(row['date_start']);end=timestamp(row['date_end'])
        except (ValueError,TypeError,KeyError):continue
        distance=abs((start.date()-day).days)
        if distance<=1:candidates.append((distance,start,row,end))
    candidates.sort(key=lambda item:(item[0],item[1]))
    if not candidates:raise Unavailable('No matching recorded race session was found for this event.')
    if len(candidates)>1 and candidates[0][0]==candidates[1][0]:raise Unavailable('The race session could not be matched unambiguously.')
    _,_,row,end=candidates[0]
    if now<end+timedelta(minutes=30):raise Unavailable('Historical replay is available only after the race has ended and the provider has released its data. Try again later.')
    return row

def samples_for_window(positions,origin,duration):
    grouped={}
    for point in positions:
        try:
            number=int(point['driver_number']);elapsed=(timestamp(point['date'])-origin).total_seconds()
            x=float(point['x']);y=float(point['y']);z=float(point.get('z') or 0)
            if not all(math.isfinite(v) for v in (elapsed,x,y,z))or not 0<=elapsed<=duration:continue
            grouped.setdefault(number,{})[round(elapsed,3)]={'time':round(elapsed,3),'x':x,'y':y,'z':z}
        except (ValueError,TypeError,KeyError,OverflowError):continue
    return {n:[points[t] for t in sorted(points)]for n,points in grouped.items()if len(points)>=2}

@lru_cache(maxsize=16)
def context(fetch,archive,year,round_num):
    if year<2023:raise Unavailable('Recorded position telemetry starts in 2023. Earlier seasons have race results but no replay in this data source.')
    data=archive(f'{year}/{round_num}/races',{'limit':1},cache_seconds=21600)
    races=data.get('RaceTable',{}).get('Races',[])
    if not races:raise Unavailable('This Grand Prix was not found in the selected season.')
    race=races[0]
    if int(race['season'])!=year or int(race['round'])!=round_num:raise Unavailable('The archive returned a different race. No replay was loaded.')
    session=select_session(fetch('sessions',{'year':year,'session_name':'Race'}),race['date'])
    key=session['session_key']
    laps=fetch('laps',{'session_key':key})
    valid=[]
    for lap in laps:
        try:
            duration=float(lap['lap_duration']);start=timestamp(lap['date_start'])
            if math.isfinite(duration) and 40<duration<300 and not lap.get('is_pit_out_lap',False):valid.append((lap,duration,start))
        except (ValueError,TypeError,KeyError):continue
    if not valid:raise Unavailable('This race has no usable recorded timed laps yet.')
    # Long red-flag laps are unsuitable as circuit references, but must not
    # disappear from the race clock. Keep timeline timing separate from lap quality.
    first_starts=[];ends=[]
    for lap in laps:
        try:
            lap_start=timestamp(lap['date_start'])
            if lap.get('lap_number')==1:first_starts.append(lap_start)
            lap_duration=float(lap['lap_duration'])
            if math.isfinite(lap_duration)and 0<lap_duration<21600:ends.append(lap_start+timedelta(seconds=lap_duration))
        except (ValueError,TypeError,KeyError):continue
    origin=min(first_starts)if first_starts else min(row[2] for row in valid)
    finish=max(ends)if ends else max(row[2]+timedelta(seconds=row[1])for row in valid)
    total=(finish-origin).total_seconds()
    if total<=0:raise Unavailable('The recorded race timeline is incomplete.')
    fastest,duration,start=min(valid,key=lambda row:row[1])
    points=fetch('location',{'session_key':key,'driver_number':fastest['driver_number'],'date>':start.isoformat(),'date<':(start+timedelta(seconds=duration)).isoformat()})
    samples=samples_for_window(points,start,duration).get(int(fastest['driver_number']),[])
    if len(samples)<20:raise Unavailable('Circuit position samples are unavailable for this race. Results and strategy planning remain available.')
    step=max(1,len(samples)//400)
    drivers=fetch('drivers',{'session_key':key});by_number={int(d['driver_number']):d for d in drivers if d.get('driver_number')is not None}
    if not by_number:raise Unavailable('The recorded race driver roster is unavailable. Try this event again later.')
    track={'year':year,'event':race['raceName'],'circuit':race.get('Circuit',{}).get('circuitName',session.get('circuit_short_name','')),'session':'Race','session_key':key,'fastest_lap_driver':by_number.get(int(fastest['driver_number']),{}).get('name_acronym',str(fastest['driver_number'])),'coordinates':[[p['x'],p['y']]for p in samples[::step]],'sample_count':len(samples[::step])}
    return {'session_key':key,'origin':origin,'total_duration':total,'drivers':by_number,'track':track,'event':race['raceName'],'year':year,'round':round_num}

@lru_cache(maxsize=32)
def bundle(fetch,archive,year,round_num,start):
    c=context(fetch,archive,year,round_num)
    if not math.isfinite(start)or start<0 or start>=c['total_duration']:raise ValueError('Choose a replay offset within the recorded race duration.')
    duration=min(60.,c['total_duration']-start);origin=c['origin']+timedelta(seconds=start)
    positions=fetch('location',{'session_key':c['session_key'],'date>':origin.isoformat(),'date<':(origin+timedelta(seconds=duration)).isoformat()})
    drivers=[]
    for number,samples in sorted(samples_for_window(positions,origin,duration).items()):
        if number not in c['drivers']:continue  # Exclude safety/medical-car tracking IDs.
        d=c['drivers'].get(number,{})
        colour=d.get('team_colour')or'8A9CB5';colour=colour if re.fullmatch('[0-9a-fA-F]{6}',colour)else'8A9CB5'
        drivers.append({'driver_number':number,'code':d.get('name_acronym')or str(number),'name':d.get('full_name')or f'Driver {number}','color':'#'+colour,'samples':samples,'sample_count':len(samples)})
    return {k:c[k]for k in ('session_key','event','year','round','total_duration','track')}|{'duration':duration,'window_start':start,'window_start_utc':origin.isoformat(),'drivers':drivers,'notice':''if drivers else'No recorded car positions in this window. Choose another minute; no movement has been fabricated.'}

def load_replay(fetch,archive,year,round_num,start=0):
    # Serialise cold requests so React retries do not duplicate provider downloads.
    with LOCK:return bundle(fetch,archive,year,round_num,float(start))
