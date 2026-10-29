"""Validate the existing editorial export without changing its content or licence."""
from datetime import date
import json
from pathlib import Path
from urllib.parse import urlsplit


def validate_corpus(value):
    if not isinstance(value, dict) or type(value.get('version')) is not int or value['version'] != 1:
        raise ValueError('Unsupported museum corpus version')
    for key in ('references','events','cars'):
        if not isinstance(value.get(key), list) or len(value[key]) > 10000:
            raise ValueError('Invalid museum corpus collection')
    refs = set()
    for row in value['references']:
        if not isinstance(row,dict) or any(not isinstance(row.get(k),str) or not row[k].strip() for k in ('id','publisher','title','url','checked')):
            raise ValueError('Invalid museum reference')
        parsed = urlsplit(row['url'])
        if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError('Museum sources require HTTPS without credentials')
        date.fromisoformat(row['checked'])
        if row['id'] in refs:
            raise ValueError('Duplicate museum reference')
        refs.add(row['id'])

    def citations(row):
        ids = row.get('refs')
        if not isinstance(ids,list) or not ids or any(not isinstance(i,str) or i not in refs for i in ids):
            raise ValueError('Unknown or missing museum citation')

    for key,fields in [('events',('id','title','fact','why')),('cars',('id','name','story','problem','legacy'))]:
        ids = set()
        for row in value[key]:
            if not isinstance(row,dict) or any(not isinstance(row.get(k),str) or not row[k].strip() for k in fields):
                raise ValueError('Invalid museum record')
            if row['id'] in ids:
                raise ValueError('Duplicate museum record')
            ids.add(row['id'])
            if type(row.get('year')) is not int or not 1800 <= row['year'] <= 2100:
                raise ValueError('Invalid museum year')
            citations(row)
            if key == 'cars':
                if not isinstance(row.get('specs'),list):
                    raise ValueError('Invalid museum specifications')
                for spec in row['specs']:
                    if not isinstance(spec,dict) or any(not isinstance(spec.get(k),str) or not spec[k].strip() for k in ('label','text')):
                        raise ValueError('Invalid museum specification')
                    citations(spec)
    car_ids = {c['id'] for c in value['cars']}
    if any(e.get('car') is not None and e['car'] not in car_ids for e in value['events']):
        raise ValueError('Unknown museum car link')
    return value


def load_corpus(path):
    with Path(path).open('rb') as stream:
        raw = stream.read(2_000_001)
    if len(raw) > 2_000_000:
        raise ValueError('Museum corpus exceeds the reviewed size limit')
    return validate_corpus(json.loads(raw))
