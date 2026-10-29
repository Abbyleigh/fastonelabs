"""Provider-supplied session times. Missing times stay unknown rather than noon."""
from datetime import datetime, timezone
SESSION_FIELDS = [('FirstPractice','Practice 1'),('SecondPractice','Practice 2'),('ThirdPractice','Practice 3'),('SprintQualifying','Sprint qualifying'),('SprintShootout','Sprint qualifying'),('Sprint','Sprint'),('Qualifying','Qualifying')]
def sessions_for_race(race):
    sessions=[]; seen=set()
    for key,label in [*SESSION_FIELDS,('Race','Race')]:
        record=race if key=='Race' else race.get(key)
        if not isinstance(record,dict) or not record.get('date'): continue
        day=record['date']; time=record.get('time'); stamp=None
        try:
            datetime.strptime(day,'%Y-%m-%d')
            if time:
                value=datetime.fromisoformat(f"{day}T{time}".replace('Z','+00:00'))
                if value.tzinfo is not None: stamp=value.astimezone(timezone.utc).isoformat()
        except (ValueError,TypeError): continue
        identity=(label,day,stamp)
        if identity in seen: continue
        seen.add(identity)
        sessions.append({'name':label,'date':day,'start':stamp,'time_confirmed':stamp is not None})
    return sorted(sessions,key=lambda row:row['start'] or row['date'])
