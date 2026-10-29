"""Metadata-only historic exhibit contracts. Never download or render model bytes."""
from typing import Literal
from pydantic import Field, model_validator
from .base import Contract, Identifier


class HistoricAsset(Contract):
    path: str = Field(pattern=r'^/models/heritage/(?:[a-z0-9][a-z0-9_-]*/)*[a-z0-9][a-z0-9_-]*\.glb$')
    format: Literal['glb'] = 'glb'
    sha256: str = Field(pattern=r'^[a-f0-9]{64}$')
    bytes: int = Field(gt=0, le=200*1024*1024)
    creator: str = Field(min_length=1, max_length=200)
    attribution: str = Field(min_length=1, max_length=1000)
    licence: str = Field(min_length=1, max_length=200)
    reuse: Literal['permitted']
    sources: list[Identifier] = Field(min_length=1, max_length=20)
    fidelity: Literal['illustrative', 'approximate', 'validated']
    units: Literal['m'] = 'm'
    up_axis: Literal['Y'] = 'Y'
    measurement_sources: list[Identifier] = Field(default_factory=list, max_length=20)
    modifications: str = Field(min_length=1, max_length=1000)
    supports_exploded: bool = False
    assembly_mapping_sha256: str | None = Field(default=None, pattern=r'^[a-f0-9]{64}$')
    vehicle_library_id: Identifier | None = None
    permitted_uses: list[Literal['private-exhibit', 'public-exhibit', 'commercial']] = Field(min_length=1, max_length=3)
    commercial_reviewed: bool = False

    @model_validator(mode='after')
    def evidence_gates(self):
        if self.fidelity == 'validated' and not self.measurement_sources:
            raise ValueError('Validated fidelity requires dimensional evidence')
        if self.supports_exploded and not self.assembly_mapping_sha256:
            raise ValueError('Exploded views require a matched assembly map')
        if 'commercial' in self.permitted_uses and not self.commercial_reviewed:
            raise ValueError('Commercial use requires separate review')
        if len(self.permitted_uses) != len(set(self.permitted_uses)):
            raise ValueError('Duplicate permitted use')
        return self


class ExhibitPlan(Contract):
    vehicle_id: Identifier
    state: Literal['not-supplied', 'supplied']
    asset: HistoricAsset | None = None
    assembly_labels: list[Identifier] = Field(default_factory=list, max_length=30)
    sources: list[Identifier] = Field(min_length=1, max_length=20)
    notes: str = Field(min_length=1, max_length=1000)

    @model_validator(mode='after')
    def state_matches_asset(self):
        if (self.state == 'supplied') != (self.asset is not None):
            raise ValueError('Supplied state requires an asset; pending exhibits must not supply one')
        if self.assembly_labels and not (self.asset and self.asset.supports_exploded):
            raise ValueError('Assembly labels require a reviewed explodable asset')
        if len(set(self.assembly_labels)) != len(self.assembly_labels):
            raise ValueError('Duplicate assembly label')
        return self
