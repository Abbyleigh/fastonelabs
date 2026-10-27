import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from forecast import build_forecast

def fixtures():
    return [{'round':str(r),'Results':[{'position':str(i+1),'grid':str(i+1),'Driver':{'driverId':f'driver{i}','givenName':'Driver','familyName':str(i)},'Constructor':{'constructorId':f'team{i//2}','name':f'Team {i//2}'}} for i in range(10)]}for r in range(1,10)]
class ForecastTests(unittest.TestCase):
    def test_no_future_result_leakage(self):
        races=fixtures();before=build_forecast(races,9)
        races[-1]['Results'].reverse()
        for row in races[-1]['Results']:row['position']='1'
        self.assertEqual(before,build_forecast(races,9))
        self.assertEqual(before['trained_through_round'],8)
        self.assertEqual(before['training_results'],80)
    def test_probabilities_ranges_and_holdout(self):
        result=build_forecast(fixtures(),9)
        self.assertAlmostEqual(sum(r['win_percent'] for r in result['drivers']),100,delta=1)
        self.assertAlmostEqual(sum(r['podium_percent'] for r in result['drivers']),300,delta=1)
        self.assertEqual(result['holdout_rows'],20)
        for row in result['drivers']:
            self.assertLessEqual(row['range'][0],row['range'][1]);self.assertTrue(1<=row['estimated_position']<=10)
        self.assertGreater(result['drivers'][0]['win_percent'],result['drivers'][-1]['win_percent'])
    def test_insufficient_history(self):
        with self.assertRaises(ValueError):build_forecast(fixtures(),3)
    def test_qualifying_inputs_restrict_entry_list(self):
        rows=[{'Driver':{'driverId':f'driver{i}','givenName':'Driver','familyName':str(i)},'position':str(i+1)}for i in range(6)]
        result=build_forecast(fixtures(),9,rows)
        self.assertEqual(len(result['drivers']),6);self.assertTrue(all(r['grid_known'] for r in result['drivers']))
if __name__=='__main__':unittest.main()
