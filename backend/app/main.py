import csv
import hashlib
import html
import io
import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field, ValidationError
from .catalogue import all_items, connect, put
from .models import Investigation, Scenario
from .ranking import rank, VERSION
from .science import oxygen_partial_pressure

app=FastAPI(title='FlameAtlas',version='0.2.0')

class Selection(BaseModel):
    ids: list[str] = Field(min_length=2,max_length=4)
class Question(BaseModel):
    question: str = Field(min_length=2,max_length=2000)
class ImportPayload(BaseModel):
    records: list[dict] = Field(max_length=100)
class ExportPayload(BaseModel):
    ids: list[str] = Field(default_factory=list,max_length=1000)
    format: str = 'json'
    scenario: Scenario | None = None

@app.get('/api/health')
def health(): return {'status':'ok','version':'0.2.0'}

@app.get('/api/investigations')
def investigations(q: str='',theme: str='',gravity: str='',verified: bool=False):
    items=all_items(q)
    items=[i for i in items if (not theme or i['theme']==theme) and (not gravity or i.get('gravity') in [gravity,None]) and (not verified or i['verification']=='metadata_verified')]
    return {'items':items,'total':len(items)}

@app.get('/api/overview')
def overview():
    items=all_items()
    return {'investigations':len(items),'runs':sum(len(i['runs']) for i in items),'sources':len({s['url'] for i in items for s in i['sources']}),'verified':sum(i['verification']=='metadata_verified' for i in items),'themes':{t:sum(i['theme']==t for i in items) for t in ['prevention','detection','suppression','fundamental']}}

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
    results=sorted([rank(i,scenario) for i in all_items() if i['verification']!='synthetic'],key=lambda r:(-r['lower'],r['investigation']['id']))
    return {'results':results,'methodology_version':VERSION,'oxygen_partial_pressure_kpa':oxygen_partial_pressure(scenario.oxygen_fraction,scenario.pressure_kpa),'tolerances':{'oxygen_fraction':.01,'pressure_kpa':5,'airflow_m_s':.05},'limitations':['Relevance is not fire hazard. Weights and tolerances are design assumptions, not validated safety thresholds.','Outside available evidence coverage means the complete requested combination has not been matched.']}

@app.post('/api/assistant/query')
def assistant(question: Question):
    candidates=all_items(question.question)
    candidates=[i for i in candidates if i['verification']=='metadata_verified'][:5]
    citations=[]
    for item in candidates:
        for index,source in enumerate(item['sources']):
            citations.append({'id':f"{item['id']}-{index}",**source})
    return {'mode':'Evidence retrieval mode','answer':'Các nguồn liên quan được liệt kê dưới đây; nội dung mô tả không chứng minh kết quả định lượng.' if citations else 'Chưa đủ bằng chứng trong bộ dữ liệu hiện tại. Hãy tìm theo mã nghiên cứu hoặc bổ sung tài liệu có liên quan.','claims':[{'text':s['summary'],'evidence_ids':[s['id']],'type':'source_summary'} for s in citations],'citations':citations,'applicable_conditions':['Only the conditions explicitly reported in each source apply.'],'limitations':['Template-based retrieval; no LLM-generated answer.','This catalogue contains metadata, not a complete run-level measurement database.'],'evidence_gaps':['Quantitative conclusions require experimental runs and measurement provenance.'],'suggested_next_steps':['Open the cited source and inspect its methods and conditions.']}

def validate(records):
    valid=[];errors=[];seen={i['id'] for i in all_items()}
    for index,record in enumerate(records):
        try:
            item=Investigation.model_validate(record).model_dump(mode='json')
            if item['id'] in seen: raise ValueError('Duplicate investigation id')
            # Uploaded evidence is not automatically certified by the application.
            if item['verification']=='metadata_verified': item['verification']='unverified'
            seen.add(item['id']);valid.append(item)
        except (ValidationError,ValueError) as exc: errors.append({'row':index+1,'error':str(exc)})
    return valid,errors

@app.post('/api/import/preview')
def preview(payload: ImportPayload):
    valid,errors=validate(payload.records)
    return {'valid':valid,'errors':errors,'count':len(valid)}

@app.post('/api/import/commit')
def commit(payload: ImportPayload):
    valid,errors=validate(payload.records)
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
    items=[i for i in all_items() if not payload.ids or i['id'] in payload.ids]
    bundle={'investigations':items,'scenario':payload.scenario.model_dump() if payload.scenario else None,'methodology_version':VERSION,'ranking':[rank(i,payload.scenario) for i in items if i['verification']!='synthetic'] if payload.scenario else [],'limitations':['Research support tool. Not a certified fire safety assessment.']}
    if payload.format=='json': content=json.dumps(bundle,ensure_ascii=False,indent=2);mime='application/json';suffix='json'
    elif payload.format=='csv':
        stream=io.StringIO(); writer=csv.DictWriter(stream,fieldnames=['id','acronym','title','objectives','theme','platform','material','gravity','verification','sources','runs','limitations']);writer.writeheader()
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
