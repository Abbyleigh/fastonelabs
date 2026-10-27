"""Career summaries from recorded Grand Prix results and season standings."""
from datetime import datetime, timezone
from collections import defaultdict


def summarize(races, standings, current_year):
    rows = []
    for race in races:
        for result in race.get('Results', []):
            rows.append({'season': int(race['season']), 'round': int(race['round']), 'race': race.get('raceName', ''), 'date': race.get('date', ''), 'position': int(result.get('position', 999)), 'position_text': result.get('positionText', ''), 'grid': int(result.get('grid', 0)), 'points': float(result.get('points', 0)), 'team': result.get('Constructor', {}).get('name', 'Unknown'), 'status': result.get('status', '')})
    rows.sort(key=lambda r: (r['season'], r['round']))
    seasons = defaultdict(list)
    for row in rows:
        seasons[row['season']].append(row)
    summaries = []
    for year, results in sorted(seasons.items(), reverse=True):
        standing = standings.get(year)
        summaries.append({'season': year, 'results': len(results), 'wins': sum(r['position'] == 1 for r in results), 'podiums': sum(r['position'] <= 3 for r in results), 'points': sum(r['points'] for r in results), 'best_finish': min(r['position'] for r in results), 'teams': list(dict.fromkeys(r['team'] for r in results)), 'standing': standing, 'complete': year < current_year})
    titles = [s['season'] for s in summaries if s['complete'] and s['standing'] and s['standing'].get('position_text') == '1']
    milestones = []
    if rows:
        milestones.append({'label': 'First recorded Grand Prix result', **rows[0]})
        for label, predicate in [('First points finish', lambda r: r['points'] > 0), ('First podium', lambda r: r['position'] <= 3), ('First Grand Prix victory', lambda r: r['position'] == 1)]:
            row = next((r for r in rows if predicate(r)), None)
            if row:
                milestones.append({'label': label, **row})
        for year in titles:
            milestones.append({'label': 'World Drivers’ Champion', 'season': year, 'race': 'Final season standings', 'round': None})
    return {'seasons': summaries, 'titles': titles, 'championship_coverage_complete': all(s['standing'] is not None for s in summaries if s['complete']), 'milestones': sorted(milestones, key=lambda r: (r['season'], r.get('round') or 100)), 'recent_results': list(reversed(rows[-12:])), 'best_finish': min((r['position'] for r in rows), default=None), 'teams': list(dict.fromkeys(r['team'] for r in rows)), 'first_season': rows[0]['season'] if rows else None, 'latest_season': rows[-1]['season'] if rows else None, 'result_records': len(rows), 'wins': sum(r['position'] == 1 for r in rows), 'podiums': sum(r['position'] <= 3 for r in rows)}


def load_career(fetch, driver_id):
    races, offset = [], 0
    for _ in range(60):
        data = fetch(f'drivers/{driver_id}/results', {'limit': 100, 'offset': offset}, cache_seconds=86400)
        batch = data.get('RaceTable', {}).get('Races', [])
        count = sum(len(r.get('Results', [])) for r in batch)
        races.extend(batch)
        offset += count
        if not count or offset >= int(data.get('total', 0)):
            break
    else:
        raise ValueError('Career archive exceeds the supported result window')
    years = sorted({int(r['season']) for r in races}, reverse=True)
    standings = {}
    failures = 0
    for year in years:
        if failures >= 2:
            standings[year] = None
            continue
        try:
            data = fetch(f'{year}/drivers/{driver_id}/driverstandings', {'limit': 1}, cache_seconds=86400 if year == datetime.now(timezone.utc).year else 2592000)
            lists = data.get('StandingsTable', {}).get('StandingsLists', [])
            row = lists[0]['DriverStandings'][0] if lists and lists[0].get('DriverStandings') else None
            standings[year] = {'position': row.get('position'), 'position_text': row.get('positionText'), 'points': row.get('points'), 'wins': row.get('wins'), 'round': lists[0].get('round')} if row else None
        except Exception:
            failures += 1
            standings[year] = None
    try:
        qualifying = fetch(f'drivers/{driver_id}/qualifying/1', {'limit': 1}, cache_seconds=86400)
        poles = int(qualifying.get('total', 0))
    except Exception:
        poles = None
    return {'qualifying_poles_recorded': poles, **summarize(races, standings, datetime.now(timezone.utc).year), 'updated_at': datetime.now(timezone.utc).isoformat(), 'source': 'https://api.jolpi.ca/ergast/f1/', 'limitations': 'Grand Prix result records are not race starts. Sprint results and junior-series achievements are excluded. Historical points systems differ; season standings points may include adjustments. Current-season standings are provisional. Missing championship records are unknown, not zero titles. Targets below are suggested statistical milestones, not statements of a driver’s personal ambitions.'}
