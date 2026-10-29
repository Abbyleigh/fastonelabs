"""Exercise the existing local demo proxy without exposing any public service."""
import importlib.util
import io
import json
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
from urllib.error import HTTPError
from unittest.mock import patch
from http.server import ThreadingHTTPServer

spec = importlib.util.spec_from_file_location('fastone_demo', Path(__file__).resolve().parents[2]/'demo/server.py')
demo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demo)


def test_demo_allows_bounded_heritage_routes_and_rejects_others():
    server = ThreadingHTTPServer(('127.0.0.1',0),demo.Handler)
    thread = Thread(target=server.serve_forever,daemon=True)
    thread.start()
    class Upstream(io.BytesIO):
        status = 200
        headers = {'Content-Type':'application/json'}
    def fake(url, **kwargs):
        assert url.startswith('http://127.0.0.1:8001/api/heritage/entities')
        return Upstream(json.dumps({'ok':True}).encode())
    try:
        with patch.object(demo,'urlopen',side_effect=fake) as upstream:
            base = f'http://127.0.0.1:{server.server_port}'
            for route in ['/api/heritage/entities?kind=vehicle','/api/heritage/entities/alfa-158']:
                with urlopen(base+route) as response:
                    assert json.load(response) == {'ok':True}
            assert upstream.call_count == 2
            for route in ['/api/heritage/admin','/api/heritage/entities/UPPER','/api/heritage/entities/a/b','/api/heritage/entities/'+'a'*81]:
                try:
                    urlopen(base+route)
                    assert False, 'Unsupported proxy path is exposed'
                except HTTPError as error:
                    assert error.code == 404
            assert upstream.call_count == 2
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
