"""Versioned read-only consumer state. Provider coordinates are never assumed metres."""
from __future__ import annotations
from datetime import datetime,timedelta
from functools import lru_cache
from typing import Literal
from pydantic import BaseModel,ConfigDict,Field,model_validator
import hashlib,json,math
from race_replay import load_replay,context,LOCK,timestamp

class Frozen(BaseModel):
    model_config=ConfigDict(frozen=True,extra='forbid',allow_inf_nan=False,json_schema_serialization_defaults_required=True)
class Pose(Frozen):
    x:float;y:float;z:float
    headingRad:float
    quality:Literal['sampled','interpolated','estimated']
class Telemetry(Frozen):
    speedMps:float|None=Field(default=None,ge=0)
    rpm:float|None=Field(default=None,ge=0)
    gear:int|None=Field(default=None,ge=0,le=8)
    throttlePercent:float|None=Field(default=None,ge=0,le=100)
    brakePressed:bool|None=None
    legacyDrsCode:int|None=None
    sampleAgeS:float|None=Field(default=None,ge=0)
class Tyre(Frozen):
    compound:str
    ageLaps:float=Field(ge=0)
    wearFraction:float|None=Field(default=None,ge=0,le=1)
    quality:Literal['recorded','estimated']
class Energy(Frozen):
    fraction:float=Field(ge=0,le=1)
    aero:str
    boost:bool
    overtakeEligible:bool
    overtakeActive:bool
    quality:Literal['estimated']='estimated'
class CarState(Frozen):
    id:str
    driverNumber:int|None
    code:str
    name:str
    color:str
    position:int|None=Field(ge=1)
    classificationQuality:Literal['recorded','estimated','missing']
    classificationAgeS:float|None=Field(ge=0)
    pose:Pose|None
    lap:int|None=Field(ge=0)
    trackDistanceM:float|None=Field(ge=0)
    lateralOffsetM:float|None
    gapToLeaderS:float|None=Field(ge=0)
    gapLabel:str|None
    telemetry:Telemetry
    tyre:Tyre|None
    pitPhase:Literal['unknown','track','entry','box','exit']
    energy:Energy|None
class Provenance(Frozen):
    provider:Literal['OpenF1','FastF1','prototype']
    adapterVersion:Literal['race-state-v1']='race-state-v1'
    coordinateUnits:Literal['provider_units','metres']
    maxInterpolationGapS:float=Field(ge=0)
    elevationVerified:bool=False
    limitations:tuple[str,...]
class UnifiedRaceState(Frozen):
    schemaVersion:Literal[1]=1
    sourceKind:Literal['recorded','simulated']
    raceId:str
    sessionId:str
    event:str
    timestampS:float=Field(ge=0)
    timestampUtc:str|None
    windowStartS:float=Field(ge=0)
    trackLengthM:float|None=Field(ge=1)
    totalLaps:int|None=Field(ge=1)
    status:Literal['recorded','running','finished']
    cars:tuple[CarState,...]
    flags:tuple[str,...]|None=None
    events:tuple[str,...]|None=None
    provenance:Provenance
    @model_validator(mode='after')
    def unique_ids(self):
        if len({c.id for c in self.cars})!=len(self.cars):raise ValueError('Duplicate car IDs')
        if self.sourceKind=='recorded' and self.provenance.provider=='prototype':raise ValueError('Prototype output cannot be recorded data')
        if self.sourceKind=='simulated' and any(c.classificationQuality=='recorded' for c in self.cars):raise ValueError('Simulation classification cannot be labelled recorded')
        return self

LIMITATIONS=('OpenF1 coordinates are provider units, not verified metres or road elevation.','Linear interpolation only within two seconds; missing positions remain null.','Classification is the last reported update; tyre, pit and energy state are unknown unless supplied.')

def latest(rows,time,driver=None):
    eligible=[r for r in rows if isinstance(r.get('time'),(float,int)) and r['time']<=time and (driver is None or r.get('driver_number')==driver)]
    return max(eligible,key=lambda r:r['time']) if eligible else None

def number(row,key):
    value=row.get(key) if row else None
    return value if isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value) else None

def sample_pose(samples,time):
    if len(samples)<2 or time<samples[0]['time'] or time>samples[-1]['time']:return None
    # Binary search matches the browser adapter's boundary convention.
    lo=0;hi=len(samples)-1
    while lo<hi:
        mid=(lo+hi)//2
        if samples[mid]['time']<time:lo=mid+1
        else:hi=mid
    i=max(0,min(lo-1,len(samples)-2));a,b=samples[i:i+2];span=b['time']-a['time']
    if not 0<span<=2:return None
    f=max(0,min(1,(time-a['time'])/span))
    return Pose(x=a['x']+(b['x']-a['x'])*f,y=a['y']+(b['y']-a['y'])*f,z=a.get('z',0)+(b.get('z',0)-a.get('z',0))*f,headingRad=math.atan2(b['x']-a['x'],-(b['y']-a['y'])),quality='sampled' if f in (0,1) else'interpolated')

def from_replay(replay,time,channels=None):
    if not math.isfinite(time) or not 0<=time<=replay['duration']:raise ValueError('Seek within the loaded recorded window.')
    channels=channels or {};cars=[]
    for d in replay['drivers']:
        n=d['driver_number'];position=latest(channels.get('position',[]),time,n);interval=latest(channels.get('intervals',[]),time,n)
        car=latest(channels.get('car_data',[]),time,n)
        if car and time-car['time']>2:car=None
        speed=number(car,'speed');gear=number(car,'n_gear');brake=number(car,'brake');gap=number(interval,'gap_to_leader')
        cars.append(CarState(id=str(n),driverNumber=n,code=d['code'],name=d['name'],color=d['color'],position=number(position,'position'),classificationQuality='recorded'if position else'missing',classificationAgeS=time-position['time']if position else None,pose=sample_pose(d['samples'],time),lap=None,trackDistanceM=None,lateralOffsetM=None,gapToLeaderS=gap if gap is not None and gap>=0 else None,gapLabel=str(interval['gap_to_leader'])if interval and isinstance(interval.get('gap_to_leader'),str)else None,telemetry=Telemetry(speedMps=speed/3.6 if speed is not None else None,rpm=number(car,'rpm'),gear=int(gear)if gear is not None else None,throttlePercent=number(car,'throttle'),brakePressed=brake>0 if brake is not None else None,legacyDrsCode=number(car,'drs'),sampleAgeS=time-car['time']if car else None),tyre=None,pitPhase='unknown',energy=None))
    cars.sort(key=lambda c:(c.position if c.position is not None else 99999,c.driverNumber or 0))
    return UnifiedRaceState(sourceKind='recorded',raceId=f"{replay['year']}:{replay['round']}",sessionId=f"OpenF1:{replay['session_key']}",event=replay['event'],timestampS=replay['window_start']+time,timestampUtc=(timestamp(replay['window_start_utc'])+timedelta(seconds=time)).isoformat(timespec='milliseconds').replace('+00:00','Z'),windowStartS=replay['window_start'],trackLengthM=None,totalLaps=None,status='recorded',cars=tuple(cars),provenance=Provenance(provider='OpenF1',coordinateUnits='provider_units',maxInterpolationGapS=2,limitations=LIMITATIONS))

@lru_cache(maxsize=32)
def state_channels(fetch,archive,year,round_num,start):
    from pitwall import timed_rows
    c=context(fetch,archive,year,round_num);origin=c['origin']+timedelta(seconds=start);channels={}
    for name in ('position','intervals'):
        try:channels[name]=timed_rows(fetch(name,{'session_key':c['session_key']}),origin,min(60,c['total_duration']-start))
        except Exception:channels[name]=[]
    return channels

def load_state(fetch,archive,year,round_num,start,time,driver=None):
    with LOCK:
        replay=load_replay(fetch,archive,year,round_num,start)
        channels=dict(state_channels(fetch,archive,year,round_num,start))
        if driver is not None:
            from pitwall import load_pitwall
            channels['car_data']=load_pitwall(fetch,archive,year,round_num,start,driver)['channels']['car_data']
        return from_replay(replay,time,channels)

def fingerprint(state):
    return hashlib.sha256(json.dumps(state.model_dump(mode='json'),sort_keys=True,separators=(',',':')).encode()).hexdigest()

def verify(state):
    positions=[c.position for c in state.cars if c.position is not None]
    return {'schemaVersion':1,'stateHash':fingerprint(state),'cars':len(state.cars),'visiblePositions':sum(c.pose is not None for c in state.cars),'missingPositions':sum(c.pose is None for c in state.cars),'classificationUnique':len(positions)==len(set(positions)),'source':state.provenance.provider,'fastf1CrossChecked':False,'limitations':['Schema/seek consistency does not validate accuracy against official timing.','FastF1 import and cross-provider reconciliation are Gate 2 work.']}
