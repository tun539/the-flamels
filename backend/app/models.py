from typing import Literal
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, model_validator

class Source(BaseModel):
    url: HttpUrl
    title: str = Field(min_length=1, max_length=500)
    locator: str = Field(min_length=1, max_length=500)
    summary: str = Field(min_length=1, max_length=3000)
    retrieved_at: str
    checksum: str | None = None

class Measurement(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(pattern=r'^[a-zA-Z0-9_-]{1,80}$')
    quantity: str = Field(min_length=1,max_length=100)
    value: float = Field(allow_inf_nan=False)
    unit: str = Field(min_length=1,max_length=50)
    time_s: float | None = Field(default=None,ge=0,allow_inf_nan=False)
    uncertainty: float | None = Field(default=None,ge=0,allow_inf_nan=False)
    method: str = Field(min_length=1,max_length=500)
    source_url: HttpUrl
    source_locator: str = Field(min_length=1,max_length=500)

class Run(BaseModel):
    model_config = ConfigDict(extra='forbid')
    original_values: dict = Field(default_factory=dict)
    measurements: list[Measurement] = Field(default_factory=list,max_length=5000)
    id: str
    oxygen_fraction: float | None = Field(default=None, ge=0, le=1, allow_inf_nan=False)
    pressure_kpa: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    airflow_m_s: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    gravity: str | None = None
    material: str | None = None
    geometry: str | None = None
    measurement: str | None = None
    source_locator: str
    source_url: HttpUrl | None = None
    oxygen_context: Literal['ambient', 'oxidizer_stream', 'unknown'] = 'unknown'
    atmosphere_basis: Literal['measured', 'source_reported', 'test_matrix', 'assumed', 'derived', 'model_output', 'unknown'] = 'unknown'
    material_phase: Literal['solid', 'liquid', 'gas', 'aerosol'] | None = None

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
    @model_validator(mode='after')
    def consistent_runs(self):
        ids=[run.id for run in self.runs]
        if len(ids)!=len(set(ids)):raise ValueError('Duplicate run id')
        allowed={str(source.url) for source in self.sources}
        for run in self.runs:
            if run.source_url and str(run.source_url) not in allowed:
                raise ValueError('Run must cite an investigation source URL')
            mids=[m.id for m in run.measurements]
            if len(mids)!=len(set(mids)):raise ValueError('Duplicate measurement id within run')
            if any(str(m.source_url) not in allowed for m in run.measurements):raise ValueError('Measurement must cite an investigation source URL')
        return self

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
