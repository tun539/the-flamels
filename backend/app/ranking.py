from .models import Scenario
import json
from pathlib import Path
METHODOLOGY = json.loads((Path(__file__).resolve().parents[2]/'data/ranking-methodology.json').read_text())
VERSION = METHODOLOGY['version']
WEIGHTS = METHODOLOGY['weights']
TOLERANCES = METHODOLOGY['tolerances']

def rank(item, scenario: Scenario):
    def evaluate(run):
        atmosphere = []
        for key, tolerance in TOLERANCES.items():
            value=run.get(key)
            atmosphere.append(None if value is None else float(abs(value-getattr(scenario,key)) <= tolerance))
        scores = {'theme':float(item['theme']==scenario.theme), 'atmosphere':0.0 if 0.0 in atmosphere else (None if None in atmosphere else min(atmosphere))}
        for key in ['material','gravity','measurement']:
            actual=run.get(key)
            requested=getattr(scenario,key)
            scores[key]=None if not actual or not requested else float(actual.casefold()==requested.casefold())
        # Material geometry is not available in a metadata-only record: never count it as a full match.
        if not run.get('geometry') or not scenario.geometry:
            scores['material']=None
        elif scores['material'] is not None:
            scores['material'] *= float(run['geometry'].casefold()==scenario.geometry.casefold())
        lower=sum(WEIGHTS[k]*v for k,v in scores.items() if v is not None)*100
        missing=sum(WEIGHTS[k] for k,v in scores.items() if v is None)*100
        return {'lower':round(lower,2),'upper':round(lower+missing,2),'coverage':round(100-missing,2),'components':scores,'run_id':run.get('id'), 'mismatches':[k for k,v in scores.items() if v==0]}
    candidates=[evaluate(r) for r in item.get('runs',[])] or [evaluate({'gravity':item.get('gravity')})]
    result=max(candidates,key=lambda r:r['lower'])
    return {'investigation':item, **result, 'outside_coverage':result['coverage']<100 or bool(result['mismatches'])}
