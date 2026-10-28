from model_assets import read_model_bytes
import unittest,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]/'frontend/public/models'
def read_glb(path):
    raw=read_model_bytes(path);assert raw[:4]==b'glTF';assert struct.unpack_from('<I',raw,8)[0]==len(raw)
    return json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
class Models(unittest.TestCase):
    def test_car_has_named_assemblies_and_licence(self):
        data=read_glb(ROOT/'cars/f1-assembly.glb');names={node.get('name') for node in data['nodes']}
        self.assertTrue({'front-wing','rear-wing','floor','chassis','front-left-wheel','rear-right-wheel'}.issubset(names))
        self.assertEqual(len(data['nodes']),16)
        self.assertIn('Qvist_designs',(ROOT/'cars/ATTRIBUTION.md').read_text())
    def test_driver_is_valid_embedded_glb(self):
        data=read_glb(ROOT/'drivers/racing-driver.glb');names={node.get('name')for node in data['nodes']}
        self.assertTrue(data.get('skins'))
        self.assertTrue(any('Head' in (name or '') for name in names))
        self.assertEqual(json.loads((ROOT/'drivers/model-info.json').read_text())['author'],'BELAZ')
        self.assertTrue(all('uri' not in b for b in data.get('buffers',[])))
    def test_archive_models_have_embedded_textures_and_identity(self):
        for team,year,file in [('ferrari',2023,'sf23.glb')]+[(team,2026,'car.glb') for team in ['ferrari','mercedes','mclaren','aston-martin','cadillac','audi','red-bull','haas']]:
            folder=ROOT/f'cars/{team}/{year}';data=read_glb(folder/file)
            self.assertTrue(data.get('meshes'))
            self.assertTrue(all(not entry.get('uri') or entry['uri'].startswith('data:') for entry in data.get('buffers',[])+data.get('images',[])))
            credit=json.loads((folder/'model-info.json').read_text())
            self.assertEqual(credit['season'],year)
            self.assertTrue(credit['team'])
            self.assertTrue(credit['source'].startswith('https://sketchfab.com/'))
    def test_hamilton_portrait_is_separate_from_full_body(self):
        self.assertTrue(read_glb(ROOT/'drivers/portraits/hamilton.glb')['meshes'])
        self.assertFalse((ROOT/'drivers/hamilton.glb').exists())
        self.assertEqual(json.loads((ROOT/'drivers/portraits/hamilton-info.json').read_text())['author'],'Sroxyn')
if __name__=='__main__' :unittest.main()
