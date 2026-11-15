'use client';
import {useEffect,useState} from 'react';
type Study={id:string;acronym:string;runs:Record<string,unknown>[];[key:string]:unknown};
const fields=[['id','Run'],['oxygen_fraction','O₂ fraction'],['pressure_kpa','Pressure (kPa)'],['airflow_m_s','Airflow (m/s)'],['gravity','Gravity'],['material','Material'],['geometry','Geometry'],['measurement','Measurement'],['source_locator','Source locator']];
const display=(value:unknown)=>value===null||value===undefined||value===''?'Not reported':String(value);
export default function Comparison({ids}:{ids:string[]}){
 const [items,setItems]=useState<Study[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');
  fetch('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})}).then(async r=>{if(!r.ok)throw Error('Comparison unavailable. Please retry.');return r.json()}).then(data=>{if(active)setItems(data.items)}).catch(e=>{if(active)setError(String(e))}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[ids,attempt]);
 if(loading)return <p role="status">Loading comparison…</p>;
 if(error)return <p role="alert">{error}<button onClick={()=>setAttempt(v=>v+1)}>Retry comparison</button></p>;
 const signatures=new Set(items.flatMap(i=>i.runs.flatMap(r=>Array.isArray(r.measurements)?r.measurements.map((m:{quantity:string;unit:string;method:string})=>JSON.stringify([m.quantity,m.unit,m.method])):[])));
 return <><div className="tablewrap"><table><caption>Investigation metadata</caption><thead><tr><th>Condition</th>{items.map(i=><th key={i.id}>{i.acronym}</th>)}</tr></thead><tbody>{['objectives','theme','platform','material','gravity','hardware','verification','limitations'].map(k=><tr key={k}><th>{k}</th>{items.map(i=><td key={i.id}>{display(i[k])}</td>)}</tr>)}</tbody></table></div>
 <h3>Run conditions by record</h3><p>Each row preserves one stored combination; synthetic records remain labeled. Missing values do not establish equivalence.</p>
 {signatures.size>1&&<p className="notice" role="status">Different quantities, units or measurement methods are present. Review each method before comparing numerical outcomes.</p>}
 {items.map(i=><div key={i.id}><h4>{i.acronym} · {display(i.verification)}</h4>{i.runs.length?<div className="tablewrap" tabIndex={0} aria-label={`${i.acronym} run conditions`}><table><thead><tr>{fields.map(([key,label])=><th key={key}>{label}</th>)}</tr></thead><tbody>{i.runs.map(r=><tr key={String(r.id)}>{fields.map(([key])=><td key={key}>{display(r[key])}</td>)}</tr>)}</tbody></table><p>Measurement methods and outcomes (quantity · unit · method):</p><ul>{i.runs.flatMap(r=>Array.isArray(r.measurements)?r.measurements.map((m:{id:string;quantity:string;unit:string;method:string;source_url:string;source_locator:string})=><li key={`${r.id}-${m.id}`}>{display(r.id)}: {m.quantity} · {m.unit} · {m.method} — <a href={m.source_url} target="_blank" rel="noreferrer">{m.source_locator}</a></li>):[])}</ul></div>:<p>No measured runs available for this investigation.</p>}</div>)}</>;
}
