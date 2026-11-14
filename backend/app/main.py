from fastapi import FastAPI
from pydantic import BaseModel, Field
from .science import oxygen_partial_pressure

app = FastAPI(title="FlameAtlas", version="0.1.0")


class Atmosphere(BaseModel):
    oxygen_fraction: float = Field(ge=0, le=1, allow_inf_nan=False)
    total_pressure_kpa: float = Field(gt=0, allow_inf_nan=False)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/investigations")
def investigations():
    return {"items": [], "total": 0, "status": "awaiting_verified_data",
            "message": "No experimental data has been imported or verified."}


@app.post("/api/atmosphere/describe")
def describe_atmosphere(atmosphere: Atmosphere):
    return {"oxygen_partial_pressure_kpa": oxygen_partial_pressure(
        atmosphere.oxygen_fraction, atmosphere.total_pressure_kpa),
        "interpretation": "Atmosphere descriptor only; not a fire hazard prediction."}
