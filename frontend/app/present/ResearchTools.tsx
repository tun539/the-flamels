'use client';
import useResearchSession from './useResearchSession';
import data from './data.generated.json';
import ScenarioExplorer from './ScenarioExplorer';
import {retrieveEvidence, type EvidenceResult} from './evidence';
import {downloadFile} from './exports';
import Dictation from '../studio/Dictation';
import EvidenceCoverage from '../components/EvidenceCoverage';
import {StudioHardware, StudioModel, StudioReadout} from '../studio/StudioPanels';
import {studioCollection, studyFuel} from '../studio/collection';
import {fuelLabels, isFuelFilter, studioTabs} from './studio-context';
import studioStyles from '../studio/studio.module.css';
import styles from './presentation.module.css';

type Study = (typeof data.studies)[number];
const fields = [
  ['objectives','Research objectives'], ['theme','Research theme'], ['platform','Platform'],
  ['material','Investigation-level material'], ['gravity','Gravity regime'], ['hardware','Hardware'],
  ['verification','Record status'], ['limitations','Applicability and limitations']
] as const;
const runFields = [
  ['id','Run'], ['oxygen_fraction','Exact O₂ fraction'], ['pressure_kpa','Pressure (kPa)'],
  ['airflow_m_s','Airflow (m/s)'], ['material','Material'], ['gravity','Gravity'], ['geometry','Geometry']
] as const;
const display = (value: unknown) => value === null || value === undefined || value === '' ? 'Not reported' : String(value).replaceAll('_',' ');

function RunTable({study}:{study:Study}) {
  if (!study.runs.length) return <p className={styles.researchNote}>No run-level conditions have been imported for this record.</p>;
  return <div className={styles.tableScroll} tabIndex={0} aria-label={`${study.acronym} imported run conditions`}>
    <table><caption>{study.acronym} · Actual imported run combinations</caption><thead><tr>{runFields.map(([key,label])=><th key={key}>{label}</th>)}<th>Observations and source</th></tr></thead>
      <tbody>{study.runs.map(run=><tr key={run.id}>{runFields.map(([key])=><td key={key}>{display(run[key as keyof typeof run])}</td>)}<td>
        {run.measurements.length ? run.measurements.map(m=><div key={m.id}>{m.quantity}: {m.value} {m.unit}<small>{m.method}</small></div>) : 'No numerical observations reported'}
        <a href={('source_url' in run && typeof run.source_url === 'string' ? run.source_url : study.sources.length === 1 ? study.sources[0].url : undefined)} target="_blank" rel="noreferrer">{run.source_locator} ↗</a>
      </td></tr>)}</tbody>
    </table>
  </div>;
}
function Comparison({studies}:{studies:Study[]}) {
  const signatures=new Set(studies.flatMap(s=>s.runs.flatMap(r=>r.measurements.map(m=>[m.quantity,m.unit,m.method].join(' | ')))));
  return <div className={styles.comparisonPanel} role="region" aria-label="Selected investigation comparison">
    <h3>Compare investigation scope</h3>
    <p className={styles.researchNote}>Investigation-level metadata is descriptive. Each run table preserves an actual stored configuration; unknown conditions do not establish equivalence.</p>
    <div className={styles.tableScroll} tabIndex={0}><table><caption>Selected investigation metadata</caption><thead><tr><th>Field</th>{studies.map(s=><th key={s.id}>{s.acronym}</th>)}</tr></thead><tbody>
      {fields.map(([key,label])=><tr key={key}><th>{label}</th>{studies.map(s=><td key={s.id}>{display(s[key])}</td>)}</tr>)}
      <tr><th>Imported observations</th>{studies.map(s=><td key={s.id}>{s.runs.reduce((n,r)=>n+r.measurements.length,0)}</td>)}</tr>
      <tr><th>Primary sources</th>{studies.map(s=><td key={s.id}>{s.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</td>)}</tr>
    </tbody></table></div>
    {signatures.size>1&&<p className={styles.warning}>Different quantities, units or measurement methods are present. A shared hardware platform does not establish comparable experimental conditions.</p>}
    {studies.map(s=><RunTable key={s.id} study={s}/>) }
  </div>;
}
export default function ResearchTools({studio=false,platformUrl}:{studio?:boolean;platformUrl?:string} = {}) {
  const {view,update,save,load,reset,removeSaved,share,message,link,ready,dirty}=useResearchSession(studio);
  const {tool,query,theme,availability,selected,compare,question,submitted}=view;
  const fuel = studio ? view.fuel ?? 'all' : 'all';
  const collection = studioCollection(fuel);
  const evidence:EvidenceResult[]=submitted?retrieveEvidence(submitted,data.resources):[];
  const studies=collection.studies.filter(s=>(theme==='all'||s.theme===theme)&&(availability==='all'||(availability==='runs'?s.runs.length>0:s.runs.length===0))&&[s.id,s.acronym,s.title,s.objectives,s.material].join(' ').toLowerCase().includes(query.toLowerCase()));
  const selection=data.studies.filter(s=>selected.includes(s.id));
  function toggle(id:string) {update({selected:selected.includes(id)?selected.filter(x=>x!==id):selected.length<4?[...selected,id]:selected,compare:false})}
  function search(text:string) {update({submitted:text,question:text})}
  function exportComparison() {downloadFile('flameatlas-investigation-comparison.json',JSON.stringify({schema_version:2,mode:'curated_repository_snapshot',data_version:data.data_version,investigations:selection,limitations:['Descriptive comparison of imported evidence, not a fire-hazard ranking. Missing fields remain unknown.']},null,2))}
  function askFromStudio(question:string) {update({tool:'evidence',question,submitted:question})}
  function openStudy(id:string) {update({tool:'explore',query:id,theme:'all',availability:'all',compare:false})}
  return <div className={studio ? studioStyles.workspace : undefined}>
    {studio&&<nav className={studioStyles.navigation} aria-label="Studio tools">
      {studioTabs.map(tab=><button key={tab.id} aria-pressed={tool===tab.id} onClick={()=>update({tool:tab.id})}>
        {tab.label}<small aria-hidden="true">{tab.hint}</small>
      </button>)}
    </nav>}
    <div className={studioStyles.workspaceContent}>
    {studio&&<StudioReadout scenario={view.scenario} fuel={fuel} coverage={collection.coverage} studies={collection.studies.length}/>}
    <div className={styles.researchCard}>
    <div className={styles.sessionToolbar} aria-label="Research session controls"><div><strong>Research session {dirty&&<span className={styles.unsaved}>· Unsaved changes</span>}</strong><small>Save settings in this browser or share an explicit view link. Links include search terms and scenario inputs.</small></div><button disabled={!ready} onClick={save}>Save session</button><button disabled={!ready} onClick={load}>Restore saved</button><button disabled={!ready} onClick={()=>void share()}>Share research view</button><button disabled={!ready} onClick={reset}>Reset view</button><button disabled={!ready} onClick={removeSaved}>Delete saved session</button></div>
    {message&&<p role="status" className={styles.sessionMessage}>{message}</p>}
    {link&&<label className={styles.shareLink}>Research-view link<input aria-label="Research-view link" readOnly value={link} onFocus={e=>e.target.select()}/></label>}

    {studio ? <div className={styles.chartControls}>
      <label>Fuel class<select aria-label="Fuel class" value={fuel} onChange={e=>{
        if(isFuelFilter(e.target.value))update({fuel:e.target.value,compare:false,
          scenario:{...view.scenario,gapFilters:undefined}});
      }}>{Object.entries(fuelLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <small>Fuel class describes the collection’s research subject. Check each run for its reported material.</small>
    </div> : <div className={styles.toolTabs} role="group" aria-label="Research tools">
      <button aria-pressed={tool==='explore'} onClick={()=>update({tool:'explore'})}>Explore & compare</button>
      <button aria-pressed={tool==='scenario'} onClick={()=>update({tool:'scenario'})}>Scenario explorer</button>
      <button aria-pressed={tool==='evidence'} onClick={()=>update({tool:'evidence'})}>Evidence search</button>
      <span>REPOSITORY SNAPSHOT · NO API KEY REQUIRED</span>
    </div>}
    {tool==='explore'?<div>
      <div className={styles.chartControls}>
        <label className={styles.searchLabel}>Search investigations<input aria-label="Search investigations" maxLength={240} value={query} onChange={e=>update({query:e.target.value})} placeholder="BASS, CFI-G, smoke…"/></label>
        <label>Research theme<select aria-label="Filter research theme" value={theme} onChange={e=>update({theme:e.target.value})}><option value="all">All themes</option>{['prevention','detection','suppression','fundamental'].map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label>
        <label>Data availability<select aria-label="Data availability" value={availability} onChange={e=>update({availability:e.target.value})}><option value="all">All records</option><option value="runs">Imported runs available</option><option value="metadata">Metadata only</option></select></label>
      </div>
      <div className={styles.selectionBar}><p aria-live="polite">{studies.length} matching records · {selected.length} / 4 selected</p>
        <button className={styles.primaryButton} disabled={selected.length<2} onClick={()=>update({compare:true})}>Compare selected</button>
        <button className={styles.textButton} disabled={!selected.length} onClick={()=>update({selected:[],compare:false})}>Clear selection</button>
        <button className={styles.textButton} disabled={selected.length<2} onClick={exportComparison}>Export comparison JSON ↓</button>
      </div>
      {compare?<><Comparison studies={selection}/><button className={styles.textButton} onClick={()=>update({compare:false})}>← Back to investigation selection</button></>:<div className={styles.investigationCards}>
        {studies.map(s=><article key={s.id}>
          <div className={styles.investigationMeta}><span>{s.theme.toUpperCase()}</span><label><input type="checkbox" aria-label={`Compare ${s.acronym}`} checked={selected.includes(s.id)} disabled={!selected.includes(s.id)&&selected.length>=4} onChange={()=>toggle(s.id)}/>Compare</label></div>
          <h3>{s.acronym}</h3><h4>{s.title}</h4><p>{s.objectives}</p>
          <small>{studio&&<>{fuelLabels[studyFuel(s.id)]} · </>}{s.runs.length} imported runs · {s.runs.reduce((n,r)=>n+r.measurements.length,0)} numerical observations · {display(s.verification)}</small>
          <details><summary>Inspect investigation and sources</summary><p className={styles.researchNote}>{s.limitations}</p><RunTable study={s}/>{s.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗<small>{source.locator}</small></a>)}</details>
        </article>)}
      </div>}
      {!studies.length&&!compare&&<p className={styles.researchNote}>No investigations match these filters. Change the search, theme or data-availability filter.</p>}
    </div>:tool==='scenario'||tool==='brief'?<ScenarioExplorer value={view.scenario}
      onChange={scenario=>update({scenario})} onAsk={askFromStudio} brief={studio}
      studies={collection.studies} coverage={collection.coverage} onStudy={studio?openStudy:undefined}/>
    :tool==='gaps'?view.scenario.evaluated?<EvidenceCoverage section="gaps" scenario={view.scenario.evaluated}
      input={collection.coverage} dataVersion={data.data_version} filters={view.scenario.gapFilters}
      onChange={gapFilters=>update({scenario:{...view.scenario,gapFilters}})} onAsk={askFromStudio}/>
      :<div><h2>Evidence Gap Map</h2><p>Evaluate a scenario to define the target atmosphere and matching window.</p>
        <button onClick={()=>update({tool:'brief'})}>Open Scenario brief</button></div>
    :tool==='model'?<StudioModel scenario={view.scenario} fuel={fuel} coverage={collection.coverage} platformUrl={platformUrl}/>
    :tool==='hardware'?<StudioHardware platformUrl={platformUrl} onAsk={askFromStudio}/>
    :<div>
      <h3>Ask the curated evidence</h3><p className={styles.researchNote}>Deterministic keyword retrieval across reviewed summaries and published findings. Context-only sources are excluded. Results are cited summaries and findings, not model-generated answers or safety recommendations.</p>
      <form onSubmit={e=>{e.preventDefault();search(question)}} className={styles.evidenceForm}>
        <label>Research question<input aria-label="Research question" required minLength={2} maxLength={2000} value={question} onChange={e=>update({question:e.target.value})} placeholder="PMMA burning rate, smoke detection, PSI-99…"/></label>
        <button className={styles.primaryButton}>Retrieve evidence</button>
      </form>
      {studio&&<Dictation onTranscript={question=>update({question})}/>}
      <div className={styles.questionExamples}>{['heat-release rate','smoke detection','PSI-99'].map(q=><button key={q} className={styles.textButton} onClick={()=>search(q)}>{q} ↗</button>)}</div>
      {submitted&&question!==submitted&&<p role="status" className={styles.sessionMessage}>The research question has changed. Retrieve evidence again to update the cited results.</p>}
      {submitted&&<div aria-live="polite"><div className={styles.evidenceResultHead}><p>{evidence.length} cited passages · Evidence retrieval mode<br/><strong>Query: {submitted}</strong></p><button className={styles.textButton} onClick={()=>downloadFile('flameatlas-evidence-search.json',JSON.stringify({question:submitted,mode:'Evidence retrieval mode',data_version:data.data_version,citations:evidence,limitations:['Lexical retrieval from curated sources; not an exhaustive literature review or a generated scientific conclusion.']},null,2))}>Export cited results ↓</button></div>
        {!evidence.length?<p className={styles.emptyPlot}>Insufficient evidence in the current dataset. Try an investigation accession or a more specific material or measurement term. A missing search result does not establish the absence of evidence in the wider literature.</p>:<div className={styles.evidenceResults}>{evidence.map(c=><article key={c.id}><span className={styles.sourceTag}>{c.type.replaceAll('_',' ').toUpperCase()}</span><p>{c.text}</p><a href={c.url} target="_blank" rel="noreferrer">{c.title} ↗</a><small>{c.locator} · Evidence ID: {c.id}</small><details><summary>Applicability and limitations</summary><p>{c.limitations}</p></details></article>)}</div>}
      </div>}
    </div>}
    </div>
    </div>
  </div>;
}
