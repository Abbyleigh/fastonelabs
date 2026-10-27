from careers import summarize, load_career


def race(year, round_num, position, points=0, team='Team'):
    return {'season': str(year), 'round': str(round_num), 'raceName': f'Race {round_num}', 'date': f'{year}-03-01', 'Results': [{'position': str(position), 'positionText': str(position), 'grid': '3', 'points': str(points), 'Constructor': {'name': team}}]}


def test_chronological_milestones_and_season_aggregation():
    data = summarize([race(2025, 3, 1, 25, 'B'), race(2024, 2, 3, 15), race(2024, 1, 12)], {2024: {'position_text': '4'}, 2025: {'position_text': '1'}}, 2026)
    assert data['wins'] == 1 and data['podiums'] == 2
    assert data['titles'] == [2025]
    assert data['teams'] == ['Team', 'B']
    assert data['milestones'][0]['round'] == 1
    assert next(m for m in data['milestones'] if m['label'] == 'First Grand Prix victory')['season'] == 2025
    assert data['seasons'][1]['points'] == 15


def test_current_lead_not_title_and_missing_standings_not_zero_coverage():
    data = summarize([race(2026, 1, 1), race(2025, 1, 2)], {2026: {'position_text': '1'}, 2025: None}, 2026)
    assert data['titles'] == []
    assert not data['championship_coverage_complete']
    assert not data['seasons'][0]['complete']


def test_excluded_championship_position_is_not_a_title():
    data = summarize([race(1997, 1, 1)], {1997: {'position': '1', 'position_text': 'D'}}, 2026)
    assert data['titles'] == []


def test_pagination_uses_result_count_and_stops_at_provider_total():
    calls = []
    def fetch(path, params, **kwargs):
        calls.append((path, params))
        if path.endswith('/results'):
            return {'total': '2', 'RaceTable': {'Races': [race(2025, params['offset'] + 1, 1)]}}
        if path.endswith('/qualifying/1'):
            return {'total': '3'}
        return {'StandingsTable': {'StandingsLists': [{'round': '2', 'DriverStandings': [{'position': '1', 'positionText': '1', 'points': '50'}]}]}}
    data = load_career(fetch, 'test')
    assert data['result_records'] == 2
    assert data['qualifying_poles_recorded'] == 3
    assert [p['offset'] for path, p in calls if path.endswith('/results')] == [0, 1]


def test_empty_career_has_no_fabricated_debut_or_milestones():
    data = summarize([], {}, 2026)
    assert data['milestones'] == [] and data['first_season'] is None and data['best_finish'] is None
