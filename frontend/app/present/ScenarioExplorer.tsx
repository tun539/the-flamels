'use client';
import data from './data.generated.json';
import {environmentOptions,evaluateSnapshot,illustrativeScenario,type Scenario} from './scenario';
import type {ScenarioSession} from './workspace-state';
import {downloadFile} from './exports';
import EvidenceCoverage from '../components/EvidenceCoverage';
import {evaluateCoverage,initialGapFilters} from '../components/coverage';
import styles from './presentation.module.css';
const names={theme:'Research objective',atmosphere:'Atmosphere and airflow',material:'Material and geometry',gravity:'Gravity regime',measurement:'Measured quantity'};
export default function ScenarioExplorer({value,onChange,onAsk,onStudy,studies=data.studies,coverage=data.coverage,brief=false}:{
  value:ScenarioSession;onChange:(value:ScenarioSession)=>void;onAsk:(question:string)=>void;
  onStudy?:(id:string)=>void;studies?:typeof data.studies;coverage?:typeof data.coverage;brief?:boolean;
}){
  const {draft,evaluated,gapFilters}=value;
  const changed=evaluated!==null&&JSON.stringify(draft)!==JSON.stringify(evaluated);
  const results=evaluated?evaluateSnapshot(evaluated, studies):[];
  function update(field:keyof Scenario,input:string|number){onChange({...value,draft:{...draft,[field]:input}})}
  function exportResults(){if(!evaluated)return;downloadFile('flameatlas-scenario-evidence.json',JSON.stringify({scenario:evaluated,methodology_version:data.methodology.version,methodology:data.methodology,data_version:data.data_version,ranking:results,evidence_coverage:{methodology:coverage.methodology,filters:gapFilters??initialGapFilters(coverage.methodology),...evaluateCoverage(coverage,evaluated,gapFilters)},investigations:results.map(r=>r.investigation),limitations:[data.methodology.interpretation,'Hypothetical research scenario, not a NASA-approved habitat configuration.']},null,2))}
  return <div>
    <h3>Evaluate research relevance</h3><p className={styles.researchNote}>Define an editable hypothetical scenario. Relevance intervals expose missing conditions; they do not predict fire hazard or certify a habitat configuration.</p>
    <form onSubmit={e=>{e.preventDefault();onChange({...value,evaluated:{...draft}})}}>
      <div className={styles.scenarioForm}>
        <label>Environment<select aria-label="Scenario environment" value={draft.environment} onChange={e=>update('environment',e.target.value)}>{environmentOptions.map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Research objective<select aria-label="Scenario research objective" value={draft.theme} onChange={e=>update('theme',e.target.value)}>{['prevention','detection','suppression'].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Gravity regime<select aria-label="Scenario gravity" value={draft.gravity} onChange={e=>update('gravity',e.target.value)}>{['microgravity','lunar','martian','normal'].map(v=><option key={v}>{v}</option>)}</select></label>
        {([['oxygen_fraction','Oxygen fraction (0–1)'],['pressure_kpa','Total pressure (kPa)'],['airflow_m_s','Airflow (m/s)']] as const).map(([field,label])=><label key={field}>{label}<input aria-label={`Scenario ${label}`} type="number" required min={field==='pressure_kpa'?.001:0} max={field==='oxygen_fraction'?1:undefined} step="any" value={draft[field]} onChange={e=>update(field,Number(e.target.value))}/></label>)}
        {([['material','Target material'],['geometry','Sample geometry'],['measurement','Target measured quantity']] as const).map(([field,label])=><label key={field}>{label}<input aria-label={`Scenario ${label}`} value={draft[field]} onChange={e=>update(field,e.target.value)} placeholder="Not specified"/></label>)}
      </div>
      <button className={styles.primaryButton}>Evaluate scenario</button>
      <button type="button" className={styles.textButton} onClick={()=>onChange({...value,draft:illustrativeScenario(draft.environment)})}>Load illustrative preset</button>
    </form>
    {changed&&<p role="status" className={styles.sessionMessage}>Scenario inputs have changed. Results below use the last evaluated scenario. Evaluate again to update the results.</p>}
    {evaluated&&<div className={styles.scenarioResults} aria-live="polite">
      <div className={styles.evidenceResultHead}><p>pO₂ = {(evaluated.oxygen_fraction*evaluated.pressure_kpa).toFixed(3)} kPa · Descriptive atmosphere value, not a flammability prediction.</p><button className={styles.textButton} onClick={exportResults}>Export scenario JSON ↓</button></div>
      <EvidenceCoverage input={coverage} section={brief?'brief':'all'} scenario={evaluated} dataVersion={data.data_version}
        filters={gapFilters} onAsk={onAsk} onChange={filters=>onChange({...value,gapFilters:filters})}/>
      <p className={styles.researchNote}>Sorted by conservative lower relevance bound. Intervals describe unknown metadata, not statistical confidence. Environment is a scenario label; gravity is evaluated separately.</p>
      {results.length===0&&<p>No investigations match the selected fuel class.</p>}
      <div className={styles.intervalLegend}><span><i/>Supported relevance contribution</span><span><i/>Additional contribution if unknown fields matched</span></div>
      {results.map(r=><article key={r.investigation.id}>
        <div className={styles.rankHeader}><h4>{r.investigation.acronym}</h4><strong>{r.lower}–{r.upper} / 100</strong><span>{r.coverage}% weighted metadata coverage</span></div>
        <div className={styles.intervalTrack} role="img" aria-label={`${r.investigation.acronym} relevance interval ${r.lower} to ${r.upper} out of 100`}><span style={{width:r.lower+'%'}}/><i style={{left:r.lower+'%',width:(r.upper-r.lower)+'%'}}/></div>
        <p className={styles.researchNote}>{r.outside_coverage?'Outside available evidence coverage':'Requested conditions matched'} · {r.run_id?`Evaluated run: ${r.run_id}`:'Metadata-only evaluation'}</p>
        {onStudy&&<button className={styles.textButton} onClick={()=>onStudy(r.investigation.id)}>Open investigation</button>}
        <details><summary>Inspect relevance components and evidence</summary><div className={styles.componentGrid}>{Object.entries(r.components).map(([key,value])=><div key={key}><span>{names[key as keyof typeof names]}</span><strong>{value===null?'Unknown':value===1?'Match':'Mismatch'}</strong><small>{data.methodology.weights[key as keyof typeof names]*100}% weight</small></div>)}</div><p className={styles.researchNote}>{r.investigation.limitations}</p>{coverage.runs.filter(run=>run.investigation_id===r.investigation.id&&run.run_id===r.run_id&&run.source_url).map(run=>
          <p key={run.run_id}><a href={run.source_url!} target="_blank" rel="noreferrer">Evaluated run source ↗</a><small>{run.source_locator}</small></p>)}{r.investigation.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</details>
      </article>)}
      <details className={styles.methodDetail}><summary>Ranking methodology and tolerances</summary><p>{data.methodology.version} · Oxygen fraction ±{data.methodology.tolerances.oxygen_fraction}; pressure ±{data.methodology.tolerances.pressure_kpa} kPa; airflow ±{data.methodology.tolerances.airflow_m_s} m/s.</p><p>{data.methodology.interpretation} Best-run ties retain source order; investigation ties sort by ID. These weights and tolerances are product assumptions, not validated safety thresholds.</p></details>
    </div>}
  </div>;
}
