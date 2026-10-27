import unittest,json,re
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
class PhotoCatalogue(unittest.TestCase):
    def test_current_grid_uses_credited_racing_photos(self):
        catalog=json.loads((ROOT/'driver_photo_catalog.json').read_text())
        self.assertEqual(len(catalog),22)
        self.assertTrue({'hamilton','norris','max_verstappen','sainz','perez','albon'}.issubset(catalog))
        for id,entry in catalog.items():
            self.assertTrue(entry['photos'],id)
            for photo in entry['photos']:
                self.assertIn(urlsplit(photo['url']).hostname,{'upload.wikimedia.org','thumb.wikimedia.org'})
                self.assertEqual(urlsplit(photo['source']).hostname,'commons.wikimedia.org')
                self.assertTrue(photo['artist']);self.assertTrue(photo['license'])
                self.assertRegex(photo['title'].lower(),r'fp[123]|qualifying')
                self.assertNotRegex(photo['title'].lower(),r'portrait|podium|dakar|fan zone|award')
if __name__=='__main__':unittest.main()
