import csv
import hashlib
import html
import io
import json
from typing import Literal
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field, ValidationError
from .catalogue import all_items, connect, put
from .models import Investigation, Scenario
from .ranking import rank, VERSION, TOLERANCES
from .science import oxygen_partial_pressure
from .coverage import METHOD as COVERAGE_METHOD, coverage_report
from .library import resources, search_evidence
from .ai import select_evidence, semantic_rerank
from .ingestion import normalize

app=FastAPI(title='FlameAtlas',version='0.3.0')
from .limits import RequestLimits
app.add_middleware(RequestLimits)

class Selection(BaseModel):
    ids: list[str] = Field(min_length=2,max_length=4)
class CoverageFilters(BaseModel):
    investigation: str = Field(default='', max_length=80)
    material: str = Field(default='', max_length=500)
    basis: Literal['', 'measured', 'source_reported', 'test_matrix', 'assumed', 'derived', 'model_output', 'unknown'] = ''
    oxygen_percentage_points: float = Field(default=COVERAGE_METHOD['window']['oxygen_percentage_points'], ge=0, le=100)
    pressure_kpa: float = Field(default=COVERAGE_METHOD['window']['pressure_kpa'], ge=0, le=1000)

class CoverageRequest(Scenario):
    filters: CoverageFilters = Field(default_factory=CoverageFilters)

class Question(BaseModel):
    question: str = Field(min_length=2,max_length=2000)
class ImportPayload(BaseModel):
    mapping: dict[str,str] = Field(default_factory=dict)
    units: dict[str,str] = Field(default_factory=dict)
    records: list[dict] = Field(max_length=100)
class ExportPayload(BaseModel):
    ids: list[str] | None = Field(default=None,max_length=1000)
    format: str = 'json'
    scenario: Scenario | None = None

@app.get('/api/health')
def health(): return {'status':'ok','version':'0.3.0'}

@app.get('/api/investigations')
def investigations(q: str='',theme: str='',gravity: str='',verified: bool=False):
    items=all_items(q)
    items=[i for i in items if (not theme or i['theme']==theme) and (not gravity or i.get('gravity') in [gravity,None]) and (not verified or i['verification']=='metadata_verified')]
    return {'items':items,'total':len(items)}

@app.get('/api/overview')
def overview():
    all_records=all_items();items=[i for i in all_records if i['verification']!='synthetic']
    return {'synthetic_records':len(all_records)-len(items),'investigations':len(items),'runs':sum(len(i['runs']) for i in items),'sources':len({s['url'] for i in items for s in i['sources']}),'verified':sum(i['verification']=='metadata_verified' for i in items),'themes':{t:sum(i['theme']==t for i in items) for t in ['prevention','detection','suppression','fundamental']}}

@app.get('/api/investigations/{id}')
def detail(id: str):
    item=next((i for i in all_items() if i['id']==id),None)
    if item is None: raise HTTPException(404,'Investigation not found')
    return item

@app.post('/api/compare')
def compare(selection: Selection):
    if len(set(selection.ids))!=len(selection.ids): raise HTTPException(422,'Select distinct investigations')
    return {'items':[detail(id) for id in selection.ids], 'limitations':['Different hardware, geometry and measurement methods may prevent direct comparison. Missing conditions are not matches.']}

@app.post('/api/scenarios/evaluate')
def evaluate(scenario: Scenario):
    items = all_items()
    results=sorted([rank(i,scenario) for i in items if i['verification']!='synthetic'],key=lambda r:(-r['lower'],r['investigation']['id']))
    return {'results':results,'evidence_coverage':coverage_report(items, scenario),'methodology_version':VERSION,'oxygen_partial_pressure_kpa':oxygen_partial_pressure(scenario.oxygen_fraction,scenario.pressure_kpa),'tolerances':TOLERANCES,'limitations':['Relevance is not fire hazard. Weights and tolerances are design assumptions, not validated safety thresholds.','Outside available evidence coverage means the complete requested combination has not been matched.']}

@app.post('/api/scenarios/coverage')
def scenario_coverage(scenario: CoverageRequest):
    return coverage_report(all_items(), scenario, scenario.filters.model_dump())

@app.post('/api/assistant/query')
def assistant(question: Question):
    citations=search_evidence(question.question)
    if not citations:
        for item in all_items(question.question):
            if item['verification']=='metadata_verified':
                citations.extend({'id':f"{item['id']}-{index}",**source} for index,source in enumerate(item['sources']))
    warning=None
    try: citations=semantic_rerank(question.question,citations[:12])
    except Exception: warning='Semantic search unavailable; keyword retrieval used.'
    citations,mode,ai_warning=select_evidence(question.question,citations[:6])
    limitations=['Curated source summaries; not certified safety guidance.','Read source conditions and limitations before applying results.']
    limitations.extend(x for x in [warning,ai_warning] if x)
    return {'mode':mode,'answer':'Relevant evidence is listed below with source locators and applicability limits.' if citations else 'Insufficient evidence in the current dataset.',
            'claims':[{'text':c['summary'],'evidence_ids':[c['id']],'type':c.get('kind','source_summary')} for c in citations],
            'citations':citations,'limitations':limitations,'applicable_conditions':[c.get('limitations','See source') for c in citations],
            'evidence_gaps':['The imported PSI summary rows cover only part of the source archive. Paper-level findings are not complete experimental runs; unimported raw files remain outside this evidence set.'],
            'suggested_next_steps':['Open the source at the cited section.']}


def validate(records,mapping=None,units=None):
    valid=[];errors=[];seen={i['id'] for i in all_items()}
    for index,record in enumerate(records):
        try:
            item=Investigation.model_validate(normalize(record,mapping or {},units or {})).model_dump(mode='json')
            if item['id'] in seen: raise ValueError('Duplicate investigation id')
            # Uploaded evidence is not automatically certified by the application.
            if item['verification']=='metadata_verified': item['verification']='unverified'
            seen.add(item['id']);valid.append(item)
        except (ValidationError,ValueError) as exc: errors.append({'row':index+1,'error':str(exc)})
    return valid,errors

@app.post('/api/import/preview')
def preview(payload: ImportPayload):
    valid,errors=validate(payload.records,payload.mapping,payload.units)
    return {'valid':valid,'errors':errors,'count':len(valid)}

@app.post('/api/import/commit')
def commit(payload: ImportPayload):
    valid,errors=validate(payload.records,payload.mapping,payload.units)
    if errors: raise HTTPException(422,errors)
    checksum=hashlib.sha256(json.dumps(payload.records,sort_keys=True).encode()).hexdigest()
    try:
        with connect() as db:
            for item in valid: put(db,item)
            db.execute('INSERT INTO imports(checksum,count) VALUES (?,?)',(checksum,len(valid)))
    except Exception as exc:
        import sqlite3
        if isinstance(exc,sqlite3.IntegrityError): raise HTTPException(409,'Duplicate import; refresh preview') from exc
        raise
    return {'imported':len(valid),'checksum':checksum}

@app.post('/api/export')
def export(payload: ExportPayload):
    items=[i for i in all_items() if payload.ids is None or i['id'] in payload.ids]
    bundle={'investigations':items,'scenario':payload.scenario.model_dump() if payload.scenario else None,'methodology_version':VERSION,'ranking':[rank(i,payload.scenario) for i in items if i['verification']!='synthetic'] if payload.scenario else [],'limitations':['Research support tool. Not a certified fire safety assessment.']}
    if payload.scenario and payload.format in {'json', 'html'}:
        bundle['evidence_coverage'] = coverage_report(items, payload.scenario)
    if payload.format=='json': content=json.dumps(bundle,ensure_ascii=False,indent=2);mime='application/json';suffix='json'
    elif payload.format=='csv':
        stream=io.StringIO(); writer=csv.DictWriter(stream,fieldnames=['id','acronym','title','objectives','theme','platform','material','gravity','hardware','verification','sources','runs','limitations']);writer.writeheader()
        for item in items: writer.writerow({k:json.dumps(item[k],ensure_ascii=False) if isinstance(item.get(k),list) else ("'"+str(item[k]) if str(item.get(k,'')).startswith(('=','+','-','@')) else item.get(k)) for k in writer.fieldnames})
        content=stream.getvalue();mime='text/csv';suffix='csv'
    elif payload.format=='html':
        content='<!doctype html><html lang="en"><meta charset="utf-8"><title>FlameAtlas evidence report</title><style>body{max-width:1000px;margin:40px auto;font:16px Arial;line-height:1.6}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>FlameAtlas evidence report</h1><p>Research support tool. Not a certified fire safety assessment.</p><pre>'+html.escape(json.dumps(bundle,ensure_ascii=False,indent=2))+'</pre></html>';mime='text/html';suffix='html'
    else: raise HTTPException(422,'Supported formats: json, csv, html')
    return Response(content,media_type=mime,headers={'Content-Disposition':f'attachment; filename="flameatlas.{suffix}"'})

class CsvInput(BaseModel):
    content: str = Field(max_length=2_000_000)

@app.post('/api/import/csv')
def parse_csv(payload: CsvInput):
    try:
        rows=list(csv.DictReader(io.StringIO(payload.content)))
        if len(rows)>100: raise ValueError('Maximum 100 records')
        for row in rows:
            for field in ['sources','runs']:
                row[field]=json.loads(row.get(field) or '[]')
            for field in ['platform','material','gravity','hardware']:
                if not row.get(field): row[field]=None
            row.setdefault('objectives',row.get('title',''))
        return {'records':rows}
    except (ValueError,csv.Error) as exc:
        raise HTTPException(422,str(exc)) from exc

@app.get('/api/sources/{source_id}')
def source_detail(source_id: str):
    for item in all_items():
        for index, source in enumerate(item['sources']):
            if source_id == f"{item['id']}-{index}": return {'id':source_id, **source}
    raise HTTPException(404,'Source not found')

@app.get('/api/library')
def list_library(q: str='',kind: str=''):
    items=resources(q,kind)
    return {'items':items,'total':len(items),'data_links':sum(r['id'].startswith('data-') for r in items)}

@app.get('/api/library/{document_id}')
def read_document(document_id: str):
    item=next((r for r in resources() if r['id']==document_id),None)
    if not item:raise HTTPException(404,'Document not found')
    return item

@app.get('/api/coverage')
def coverage():
    fields=['oxygen_fraction','pressure_kpa','airflow_m_s','material','gravity','geometry','measurement']
    items=[i for i in all_items() if i['verification']!='synthetic']
    return {'fields':fields,'rows':[{'id':i['id'],'acronym':i['acronym'],'runs':len(i['runs']),
      'known':{f:sum(r.get(f) is not None and r.get(f)!='' for r in i['runs']) for f in fields}} for i in items],
      'measurements':sum(len(r.get('measurements',[])) for i in items for r in i['runs']),
      'note':'Counts exclude synthetic records and describe imported run metadata, not experimental safety coverage.'}

@app.get('/api/measurements/{investigation_id}')
def measurements(investigation_id: str):
    item=detail(investigation_id)
    return {'verification':item['verification'],'items':[dict(run_id=r['id'],**m) for r in item['runs'] for m in r.get('measurements',[])]}
