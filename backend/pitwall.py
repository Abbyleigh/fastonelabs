"""Recorded pit-wall channels sharing the replay's event and time origin."""
from datetime import timedelta
from functools import lru_cache
from urllib.parse import urlparse
import math
from race_replay import context, timestamp, LOCK


def safe_radio(url):
    try:
        parsed=urlparse(url or '')
        return url if parsed.scheme=='https' and parsed.hostname=='livetiming.formula1.com' and parsed.path.lower().endswith('.mp3') else None
    except (ValueError,TypeError):return None


def timed_rows(rows,origin,end):
    result=[]
    for row in rows:
        try:
            time=(timestamp(row['date'])-origin).total_seconds()
            if not math.isfinite(time) or time>end:continue
            result.append(dict(row,time=time))
        except (ValueError,TypeError,KeyError):continue
    return sorted(result,key=lambda row:row['time'])

@lru_cache(maxsize=48)
def bundle(fetch,archive,year,round_num,start,driver):
    c=context(fetch,archive,year,round_num)
    if not math.isfinite(start) or not 0<=start<c['total_duration']:raise ValueError('Choose a recorded race minute.')
    if driver not in c['drivers']:raise ValueError('Choose a driver from this race.')
    origin=c['origin']+timedelta(seconds=start)
    duration=min(60,c['total_duration']-start)
    base={'session_key':c['session_key']}
    result={'driver_number':driver,'window_start':start,'channels':{},'errors':{}}
    for channel in ('car_data','position','intervals','race_control','team_radio','weather'):
        params=dict(base)
        if channel=='car_data':
            params.update({'driver_number':driver,'date>':(origin-timedelta(seconds=3)).isoformat(),'date<':(origin+timedelta(seconds=duration)).isoformat()})
        try:
            rows=timed_rows(fetch(channel,params),origin,duration)
            if channel=='team_radio':
                rows=[dict(row,recording_url=safe_radio(row.get('recording_url'))) for row in rows if row.get('driver_number')==driver and safe_radio(row.get('recording_url'))]
            if channel in ('position','intervals'):
                rows=[row for row in rows if row.get('driver_number') in c['drivers']]
                # Keep the last state per driver before this excerpt, plus changes within it.
                previous={row['driver_number']:row for row in rows if row['time']<0}
                rows=list(previous.values())+[row for row in rows if row['time']>=0]
            result['channels'][channel]=rows
        except Exception:
            result['channels'][channel]=[]
            result['errors'][channel]='This recorded channel is unavailable. Try another minute or event.'
    return result


def load_pitwall(fetch,archive,year,round_num,start,driver):
    with LOCK:
        result=bundle(fetch,archive,year,round_num,float(start),driver)
        if result["errors"]:bundle.cache_clear()
        return result
