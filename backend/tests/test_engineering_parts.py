import unittest,json,struct,hashlib
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]/'frontend/public/models/cars'
PARTS=['body','frontWing','rearWing','floor','power','wheels','wheels','wheels','wheels','suspension']
class EngineeringParts(unittest.TestCase):
 def test_every_source_triangle_has_one_valid_inspection_group(self):
  manifests=list(ROOT.glob('*/*/engineering-parts.json'));self.assertEqual(len(manifests),9)
  for path in manifests:
   with self.subTest(model=str(path.parent)):
    mapping=json.loads(path.read_text());raw=(path.parent/mapping['source']).read_bytes();glb=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
    self.assertEqual(hashlib.sha256(raw).hexdigest(),mapping['source_sha256'])
    count=sum(glb['accessors'][p['indices']]['count']//3 if 'indices'in p else glb['accessors'][p['attributes']['POSITION']]['count']//3 for mesh in glb['meshes']for p in mesh['primitives'])
    labels=(path.parent/'engineering-parts.bin').read_bytes();self.assertEqual(len(labels),count);self.assertEqual(count,mapping['triangle_count']);self.assertTrue(all(code<len(PARTS)for code in labels))
    offset=0
    for entry in mapping['entries']:
     self.assertEqual(entry['offset'],offset);offset+=entry['triangles']
    self.assertEqual(offset,len(labels))
 def test_groups_match_counts_and_keep_four_wheel_regions(self):
  for path in ROOT.glob('*/*/engineering-parts.json'):
   with self.subTest(model=str(path.parent)):
    mapping=json.loads(path.read_text());labels=(path.parent/'engineering-parts.bin').read_bytes();actual=Counter(PARTS[code]for code in labels)
    self.assertEqual({k:v for k,v in mapping['counts'].items()if v},dict(actual));self.assertEqual(set(mapping['available']),set(actual))
    for code in (5,6,7,8):self.assertIn(code,labels)
    self.assertGreater(actual['body'],0);self.assertNotIn('power',actual)
 def test_mapping_bounds_are_finite_and_source_nodes_exist(self):
  import math
  for path in ROOT.glob('*/*/engineering-parts.json'):
   mapping=json.loads(path.read_text());raw=(path.parent/mapping['source']).read_bytes();glb=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]]);names={node.get('name')for node in glb['nodes']if 'mesh'in node}
   self.assertEqual({entry['name']for entry in mapping['entries']},names)
   for entry in mapping['entries']:
    for bound in entry['bounds'].values():
     self.assertTrue(all(math.isfinite(v)for v in bound['min']+bound['max']));self.assertTrue(all(a<=b for a,b in zip(bound['min'],bound['max'])))
if __name__=='__main__':unittest.main()
