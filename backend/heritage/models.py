"""Versioned, bounded input contracts for the curated heritage collection."""
from datetime import date
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

Identifier = Annotated[str, Field(pattern=r'^[a-z0-9][a-z0-9-]{0,79}$')]
Kind = Literal['season', 'circuit', 'layout', 'constructor', 'driver', 'vehicle', 'race', 'regulation', 'development']
Status = Literal['verified', 'estimated', 'missing', 'simulated']


class Contract(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)


class Source(Contract):
    id: Identifier
    title: str = Field(min_length=1, max_length=250)
    publisher: str = Field(min_length=1, max_length=150)
    url: HttpUrl
    checked: date
    licence: str = Field(min_length=1, max_length=300)
    reuse: Literal['unreviewed', 'non-commercial', 'permitted']
    notes: str = Field(min_length=1, max_length=1000)

    @field_validator('url')
    @classmethod
    def safe_url(cls, value):
        if value.scheme != 'https' or value.username or value.password:
            raise ValueError('Sources require HTTPS without credentials')
        return value


class Claim(Contract):
    key: Identifier
    label: str = Field(min_length=1, max_length=100)
    value: str | int | float | bool | None
    unit: str | None = Field(default=None, max_length=30)
    status: Status
    context: str = Field(min_length=1, max_length=1500)
    sources: list[Identifier] = Field(max_length=20)

    @model_validator(mode='after')
    def honest_value(self):
        if (self.status == 'missing') != (self.value is None):
            raise ValueError('Only missing claims have null values')
        if self.status != 'missing' and not self.sources:
            raise ValueError('Every non-missing claim requires evidence')
        if isinstance(self.value, str) and len(self.value) > 2000:
            raise ValueError('Claim is too long')
        return self


class Entity(Contract):
    id: Identifier
    kind: Kind
    name: str = Field(min_length=1, max_length=200)
    coverage_start: int = Field(ge=1950, le=2100)
    coverage_end: int = Field(ge=1950, le=2100)
    summary: str = Field(min_length=1, max_length=1500)
    coverage: str = Field(min_length=1, max_length=1500)
    sources: list[Identifier] = Field(min_length=1, max_length=20)
    claims: list[Claim] = Field(max_length=100)

    @model_validator(mode='after')
    def ordered(self):
        if self.coverage_end < self.coverage_start:
            raise ValueError('Coverage years are reversed')
        if len({c.key for c in self.claims}) != len(self.claims):
            raise ValueError('Duplicate claim key')
        return self


# Relationships describe a reviewed period, never an entire implied career.
LINK_KINDS = {
    'part-of-season': ({'race'}, {'season'}),
    'held-at': ({'race'}, {'circuit'}),
    'uses-layout': ({'race'}, {'layout'}),
    'layout-of': ({'layout'}, {'circuit'}),
    'built-by': ({'vehicle'}, {'constructor'}),
    'drove-for': ({'driver'}, {'constructor'}),
    'raced-vehicle': ({'driver'}, {'vehicle'}),
    'illustrates': ({'vehicle'}, {'development', 'regulation'}),
}


class Link(Contract):
    subject: Identifier
    predicate: str
    target: Identifier
    start_year: int = Field(ge=1950, le=2100)
    end_year: int = Field(ge=1950, le=2100)
    sources: list[Identifier] = Field(min_length=1, max_length=20)
    context: str = Field(min_length=1, max_length=1000)


class Classification(Contract):
    id: Identifier
    category: Literal['race', 'qualifying', 'driver-standing', 'constructor-standing']
    season_id: Identifier
    race_id: Identifier | None = None
    entry: str = Field(min_length=1, max_length=100)
    driver_ids: list[Identifier] = Field(max_length=10)
    constructor_id: Identifier
    position: int | None = Field(default=None, ge=1)
    position_text: str = Field(min_length=1, max_length=30)
    laps: int | None = Field(default=None, ge=0)
    points: float | None = Field(default=None, ge=0)
    time: str | None = Field(default=None, max_length=40)
    sources: list[Identifier] = Field(min_length=1, max_length=20)
    context: str = Field(min_length=1, max_length=1000)


class Dataset(Contract):
    schema_version: Literal[1]
    revision: Identifier
    coverage: str = Field(min_length=1, max_length=2000)
    sources: list[Source] = Field(min_length=1, max_length=10000)
    entities: list[Entity] = Field(min_length=1, max_length=100000)
    links: list[Link] = Field(max_length=500000)
    classifications: list[Classification] = Field(max_length=1000000)

    @model_validator(mode='after')
    def references(self):
        sources = {s.id for s in self.sources}
        entities = {e.id: e for e in self.entities}
        if len(sources) != len(self.sources) or len(entities) != len(self.entities):
            raise ValueError('Duplicate source or entity identifier')

        def refs(ids):
            if len(ids) != len(set(ids)) or not set(ids) <= sources:
                raise ValueError('Duplicate or unknown source reference')

        def entity(identifier, kind):
            if identifier not in entities or entities[identifier].kind not in kind:
                raise ValueError(f'Invalid {kind} reference: {identifier}')

        for e in self.entities:
            refs(e.sources)
            for c in e.claims:
                refs(c.sources)
        seen_links = set()
        for link in self.links:
            if link.predicate not in LINK_KINDS:
                raise ValueError('Unknown relationship predicate')
            a, b = LINK_KINDS[link.predicate]
            entity(link.subject, a)
            entity(link.target, b)
            if link.start_year > link.end_year:
                raise ValueError('Reversed relationship period')
            key = (link.subject, link.predicate, link.target, link.start_year, link.end_year)
            if key in seen_links:
                raise ValueError('Duplicate relationship')
            seen_links.add(key)
            refs(link.sources)
        ids = set()
        for row in self.classifications:
            if row.id in ids:
                raise ValueError('Duplicate classification identifier')
            ids.add(row.id)
            entity(row.season_id, {'season'})
            entity(row.constructor_id, {'constructor'})
            for driver in row.driver_ids:
                entity(driver, {'driver'})
            if len(row.driver_ids) != len(set(row.driver_ids)):
                raise ValueError('Duplicate driver in shared entry')
            if row.category in ('race', 'qualifying'):
                entity(row.race_id, {'race'})
                if not row.driver_ids:
                    raise ValueError('Race entries require a driver')
                if not any(l.subject == row.race_id and l.predicate == 'part-of-season' and l.target == row.season_id for l in self.links):
                    raise ValueError('Race and season disagree')
            elif row.race_id is not None:
                raise ValueError('Final standings cannot have a race reference')
            if row.category == 'driver-standing' and len(row.driver_ids) != 1:
                raise ValueError('Driver standings require one driver')
            if row.category == 'constructor-standing' and row.driver_ids:
                raise ValueError('Constructor standings cannot have drivers')
            refs(row.sources)
        return self
