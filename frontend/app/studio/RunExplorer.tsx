'use client';

import {useMemo, useState} from 'react';
import {evaluateCoverage, type CoverageInput, type EvidenceRun} from '../components/coverage';
import data from '../present/data.generated.json';
import {downloadFile} from '../present/exports';
import type {ScenarioSession} from '../present/workspace-state';
import {platformLink} from './platform-links';
import styles from './studio.module.css';

const keyOf = (run: EvidenceRun) => `${run.investigation_id}/${run.run_id}`;
const format = (value: number | null, digits = 2) => value == null ? 'Not available' : Number(value.toFixed(digits)).toString();
const showRaw = (value: unknown): string => {
  if (value == null || value === '') return 'Not reported';
  if (typeof value !== 'object') return String(value);
  if ('value' in value && 'unit' in value) return `${showRaw(value.value)} ${String(value.unit)}`;
  return JSON.stringify(value);
};

export default function RunExplorer({input, scenario, platformUrl}: {
  input: CoverageInput; scenario: ScenarioSession; platformUrl?: string;
}) {
  const [campaign, setCampaign] = useState('');
  const [query, setQuery] = useState('');
  const [nearby, setNearby] = useState(false);
  const [limit, setLimit] = useState(15);
  const [selected, setSelected] = useState<string[]>([]);
  const assessed = scenario.evaluated;
  const campaignOptions = useMemo(() => [...new Map(input.runs.map(run => [run.investigation_id, run.acronym]))], [input]);
  const activeCampaign = campaignOptions.some(([id]) => id === campaign) ? campaign : '';
  const report = assessed ? evaluateCoverage(input, assessed, scenario.gapFilters) : null;
  const nearbyKeys = new Set(report?.points.filter(point => point.within_window && point.basis !== 'test_matrix').map(keyOf));
  const rows = input.runs.filter(run =>
    (!activeCampaign || run.investigation_id === activeCampaign) &&
    (!nearby || !assessed || nearbyKeys.has(keyOf(run))) &&
    [run.run_id, run.acronym, run.material, run.source_locator].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const openRows = input.runs.filter(run => selected.includes(keyOf(run)));
  const findRecord = (row: EvidenceRun) =>
    data.studies.find(study => study.id === row.investigation_id)?.runs.find(item => item.id === row.run_id);
  const details = openRows.map(row => ({row, record:findRecord(row)}));

  function toggle(run: EvidenceRun) {
    const key = keyOf(run);
    setSelected(openRows.some(r => keyOf(r) === key)
      ? openRows.filter(r => keyOf(r) !== key).map(keyOf)
      : [...openRows.map(keyOf).slice(-1), key]);
  }

  return <div>
    <h2>Experiment runs</h2>
    <p>Inspect records from the active fuel collection. The matching-window filter uses the last evaluated scenario and its Coverage settings.</p>
    <div className={styles.labControls}>
      <label>Run campaign<select value={activeCampaign} onChange={e=>{setCampaign(e.target.value);setLimit(15);}}>
        <option value="">All campaigns</option>{campaignOptions.map(([id, name])=><option key={id} value={id}>{name}</option>)}
      </select></label>
      <label>Find runs<input value={query} onChange={e=>{setQuery(e.target.value);setLimit(15);}} placeholder="Run ID, material, or source locator"/></label>
      <label className={styles.labCheck}><input type="checkbox" checked={nearby && !!assessed} disabled={!assessed}
        onChange={e=>{setNearby(e.target.checked);setLimit(15);}}/>Within the scenario window</label>
    </div>
    <p role="status">{rows.length} matching runs · {details.length} open for inspection</p>
    {rows.length ? <div className={styles.labTable} tabIndex={0} role="region" aria-label="Experiment run results">
      <table><caption>Source-linked run conditions</caption>
        <thead><tr><th scope="col">Run</th><th scope="col">Material</th><th scope="col">Ambient O₂ (%)</th><th scope="col">Total pressure (kPa)</th><th scope="col">Source</th></tr></thead>
        <tbody>{rows.slice(0,limit).map(run => {
          const reported = run.oxygen_context === 'ambient' && run.source_url &&
            (run.basis === 'measured' || run.basis === 'source_reported');
          const record = reported ? findRecord(run) : undefined;
          const oxygen = run.oxygen_fraction ?? record?.oxygen_fraction ?? null;
          return <tr key={keyOf(run)}>
          <th scope="row"><button aria-pressed={selected.includes(keyOf(run))} onClick={()=>toggle(run)}>{run.acronym} · {run.run_id}</button></th>
          <td>{run.material ?? 'Not reported'}</td>
          <td>{format(oxygen === null ? null : oxygen * 100)}</td>
          <td>{format(run.pressure_kpa ?? record?.pressure_kpa ?? null)}</td>
          <td>{run.source_url ? <a href={run.source_url} target="_blank" rel="noreferrer">{run.source_locator} ↗</a> : run.source_locator || 'Unavailable'}</td>
        </tr>})}</tbody>
      </table>
    </div> : <p>No runs match these filters. Clear the query or widen the collection.</p>}
    {rows.length>limit&&<button onClick={()=>setLimit(n=>n+15)}>Show more runs</button>}
    {details.length>0&&<div className={styles.labDetails}>
      <h3>Original records</h3>
      <p>Open up to two runs to compare the source fields and units.</p>
      <div className={styles.cards}>
        {details.map(({row,record}) => {
          const original=record?.original_values;
          const raw = original && 'source_row' in original && original.source_row ? original.source_row : original;
          return <article key={keyOf(row)}>
            <h4>{row.acronym} · {row.run_id}</h4>
            <p>{row.material ?? 'Material unreported'} · {row.gravity ?? 'Gravity unreported'}</p>
            <dl className={styles.rawFields}>{Object.entries(raw ?? {}).map(([field,value])=><div key={field}>
              <dt>{field.replaceAll('_',' ')}</dt><dd>{showRaw(value)}</dd>
            </div>)}</dl>
            <p>{row.source_locator}</p>
          </article>;
        })}
      </div>
      <button onClick={()=>downloadFile('flameatlas-run-records.json', JSON.stringify({
        data_version:data.data_version, scenario:assessed, records:details,
      },null,2))}>Export selected runs</button>
    </div>}
    <div className={styles.actions}>
      <a href={platformLink(platformUrl,'/experiments')}>{platformUrl?'Open full experiment browser ↗':'Set up the full experiment browser ↗'}</a>
      {platformUrl && <a href={platformLink(platformUrl,'/intelligence/similar')}>Open condition similarity ↗</a>}
    </div>
  </div>;
}
