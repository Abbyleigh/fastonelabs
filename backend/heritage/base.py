"""Shared metadata contract primitives; independent of simulator contracts."""
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field
Identifier = Annotated[str, Field(pattern=r'^[a-z0-9][a-z0-9-]{0,79}$')]
class Contract(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
