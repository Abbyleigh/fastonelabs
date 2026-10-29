"""No provider I/O, writes, or arbitrary upstream URLs on public requests."""
from functools import lru_cache
from typing import Annotated, Literal
from fastapi import APIRouter, HTTPException, Path, Query, Request, Response
from .models import Contract, Entity, Source, Link, Classification, Kind
from .store import Store, read_dataset

router = APIRouter(prefix='/api/heritage', tags=['Heritage'])


class Facets(Contract):
    kinds: list[Kind]
    years: list[int]


class SearchResponse(Contract):
    schema_version: Literal[1] = 1
    revision: str
    coverage: str
    facets: Facets
    items: list[Entity]
    total: int
    offset: int
    limit: int


class DetailResponse(Contract):
    schema_version: Literal[1] = 1
    revision: str
    entity: Entity
    links: list[Link]
    related: list[Entity]
    classifications: list[Classification]
    names: dict[str, str]
    links_total: int
    classifications_total: int
    sources: list[Source]


@lru_cache(maxsize=1)
def get_store():
    return Store(read_dataset())


def cached_headers(request, response, store):
    # Include representation URL: a detail ETag must never validate a search response.
    import hashlib
    tag = '"' + hashlib.sha256((store.digest + str(request.url)).encode()).hexdigest() + '"'
    headers = {'ETag': tag, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff'}
    response.headers.update(headers)
    candidates = [t.strip().removeprefix('W/') for t in request.headers.get('if-none-match', '').split(',')]
    if tag in candidates or '*' in candidates:
        return Response(status_code=304, headers=headers)
    return None


@router.get('/entities', response_model=SearchResponse)
def search(request: Request, response: Response,
           q: Annotated[str, Query(max_length=100)] = '',
           kind: Kind | None = None,
           year: Annotated[int | None, Query(ge=1950, le=2100)] = None,
           limit: Annotated[int, Query(ge=1, le=50)] = 20,
           offset: Annotated[int, Query(ge=0, le=100000)] = 0):
    store = get_store()
    cached = cached_headers(request, response, store)
    if cached is not None:
        return cached
    items, total = store.search(q, kind, year, limit, offset)
    return SearchResponse(revision=store.revision, coverage=store.coverage, facets=Facets(**store.facets()),
                          items=items, total=total, offset=offset, limit=limit)


@router.get('/entities/{identifier}', response_model=DetailResponse)
def detail(request: Request, response: Response,
           identifier: Annotated[str, Path(pattern=r'^[a-z0-9][a-z0-9-]{0,79}$')]):
    store = get_store()
    found = store.detail(identifier)
    if found is None:
        raise HTTPException(404, detail='No reviewed heritage record has this identifier')
    cached = cached_headers(request, response, store)
    if cached is not None:
        return cached
    entity, links, related, classifications, names, links_total, classifications_total = found
    return DetailResponse(revision=store.revision, entity=entity, links=links, related=related,
                          classifications=classifications, names=names, sources=store.sources(),
                          links_total=links_total, classifications_total=classifications_total)
