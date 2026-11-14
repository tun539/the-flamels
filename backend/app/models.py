from typing import Literal
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

class Source(BaseModel):
    url: HttpUrl
    title: str = Field(min_length=1, max_length=500)
    locator: str = Field(min_length=1, max_length=500)
    summary: str = Field(min_length=1, max_length=3000)
    retrieved_at: str
    checksum: str | None = None

class Run(BaseModel):
    id: str
    oxygen_fraction: float | None = Field(default=None, ge=0, le=1, allow_inf_nan=False)
    pressure_kpa: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    airflow_m_s: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    gravity: str | None = None
    material: str | None = None
    geometry: str | None = None
    measurement: str | None = None
    source_locator: str

class Investigation(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(pattern=r'^[a-zA-Z0-9_-]{1,80}$')
    acronym: str
    title: str
    objectives: str
    theme: Literal['prevention','detection','suppression','fundamental']
    platform: str | None = None
    material: str | None = None
    gravity: str | None = None
    hardware: str | None = None
    verification: Literal['metadata_verified','unverified','synthetic'] = 'unverified'
    sources: list[Source] = Field(min_length=1, max_length=20)
    runs: list[Run] = Field(default_factory=list, max_length=1000)
    limitations: str = 'Metadata does not establish quantitative experimental outcomes.'

class Scenario(BaseModel):
    environment: str = 'spacecraft'
    theme: Literal['prevention','detection','suppression'] = 'prevention'
    oxygen_fraction: float = Field(default=.21, ge=0, le=1, allow_inf_nan=False)
    pressure_kpa: float = Field(default=101.325, gt=0, allow_inf_nan=False)
    airflow_m_s: float = Field(default=.1, ge=0, allow_inf_nan=False)
    gravity: str = 'microgravity'
    material: str = ''
    measurement: str = ''
    geometry: str = ''
