import math


def oxygen_partial_pressure(oxygen_fraction: float, total_pressure_kpa: float) -> float:
    """Return descriptive pO2 in kPa; not a flammability prediction."""
    if not math.isfinite(oxygen_fraction) or not 0 <= oxygen_fraction <= 1:
        raise ValueError("oxygen_fraction must be finite and between 0 and 1")
    if not math.isfinite(total_pressure_kpa) or total_pressure_kpa <= 0:
        raise ValueError("total_pressure_kpa must be finite and positive")
    return oxygen_fraction * total_pressure_kpa
