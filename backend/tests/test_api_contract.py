"""Non-network regression checks against the existing FastAPI source.
Copy this file into the project's backend/tests/ folder.
"""
import ast
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / 'main.py'


def test_original_api_source_is_present():
    assert SOURCE.exists(), 'Existing backend/main.py must not be deleted'
    ast.parse(SOURCE.read_text(encoding='utf-8'))


def test_health_and_track_endpoints_are_preserved():
    tree = ast.parse(SOURCE.read_text(encoding='utf-8'))
    routes = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for d in node.decorator_list:
                if (isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute)
                        and d.func.attr == 'get' and d.args and isinstance(d.args[0], ast.Constant)):
                    routes.append(d.args[0].value)
    assert '/api/health' in routes
    assert '/api/track' in routes
