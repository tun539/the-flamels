"""Explicit field mapping and unit conversion with original-value provenance."""
import copy
import math
CONVERSIONS={
 'oxygen_fraction':{'fraction':1,'%':.01},
 'pressure_kpa':{'kPa':1,'Pa':.001,'psi':6.894757293168,'atm':101.325},
 'airflow_m_s':{'m/s':1,'cm/s':.01,'mm/s':.001},
}

def normalize(record,mapping,units):
    item=copy.deepcopy(record)
    for source,target in mapping.items():
        if source not in item:continue
        if target in item and target!=source:raise ValueError('Field mapping would overwrite '+target)
        item[target]=item.pop(source)
    runs=item.get('runs',[])
    if not isinstance(runs,list):raise ValueError('runs must be a list')
    for run in runs:
        if not isinstance(run,dict):raise ValueError('Each run must be an object')
        original=run.setdefault('original_values',{})
        if not isinstance(original,dict):raise ValueError('original_values must be an object')
        for key,factors in CONVERSIONS.items():
            value=run.get(key)
            if value is None or value=='':run[key]=None;continue
            unit=units.get(key,next(iter(factors)))
            if unit not in factors:raise ValueError('Unsupported unit for '+key)
            if isinstance(value,(dict,list,bool)):raise ValueError('Invalid numeric value for '+key)
            numeric=float(value)
            if not math.isfinite(numeric):raise ValueError('Non-finite value for '+key)
            if key not in original:original[key]={'value':value,'unit':unit,'factor':factors[unit]}
            run[key]=numeric*factors[unit]
    return item
