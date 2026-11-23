'use client';

import {useState} from 'react';
import {downloadFile} from '../present/exports';
import type {Scenario} from '../present/scenario';
import {basisOptions, evaluateCoverage, initialGapFilters, type CoverageInput, type EvidenceRun, type GapFilters} from './coverage';
import styles from './EvidenceCoverage.module.css';

const checks = [
  {label: 'Recorded atmosphere', denominator: 'filtered runs', question: 'Which source tables report ambient oxygen and total pressure together?'},
  {label: 'Runs within the matching window', denominator: 'reported ambient pairs', question: 'Which documented runs report conditions within this scenario’s matching window?'},
  {label: 'Gravity regime', denominator: 'source-linked runs with gravity reported', question: 'Which additional source-linked runs report the selected gravity regime?'},
  {label: 'Applicable solid materials', denominator: 'nearby runs with matching gravity and material phase reported', question: 'Which nearby runs in the selected gravity regime document solid specimens or the target material?'},
];
const statusLabels: Record<string, string> = {
  missing: 'Missing evidence', thin: 'Thin evidence', documented: 'Documented',
  outside_coverage: 'Outside coverage', not_applicable: 'No runs match these filters',
};
const format = (value: number) => Number(value.toPrecision(6)).toString();
const readable = (value: string) => value.replaceAll('_', ' ');
const runKey = (run: EvidenceRun) => JSON.stringify([run.investigation_id, run.run_id]);

function AtmospherePlot({scenario, filters, points}: {
  scenario: Scenario; filters: GapFilters;
  points: ReturnType<typeof evaluateCoverage>['points'];
}) {
  const left = 65, right = 550, top = 20, bottom = 205;
  const targetWindowTop = scenario.pressure_kpa + filters.pressure_kpa;
  const maxPressure = points.reduce((max, point) => Math.max(max, point.pressure_kpa),
    Math.max(1, Number.isFinite(targetWindowTop) ? targetWindowTop : scenario.pressure_kpa));
  const pressureScale = maxPressure > Number.MAX_VALUE / 1.1 ? maxPressure : maxPressure * 1.1;
  const x = (oxygen: number) => left + oxygen * (right - left);
  const y = (pressure: number) => bottom - pressure / pressureScale * (bottom - top);
  const maxX = x(Math.min(1, scenario.oxygen_fraction + filters.oxygen_percentage_points / 100));
  const minX = x(Math.max(0, scenario.oxygen_fraction - filters.oxygen_percentage_points / 100));
  const maxY = y(Math.max(0, scenario.pressure_kpa - filters.pressure_kpa));
  const minY = y(Math.min(pressureScale, scenario.pressure_kpa + filters.pressure_kpa));

  return <>
    <svg className={styles.plot} viewBox="0 0 570 257" role="img"
      aria-label={`Oxygen and pressure chart. ${points.length} plotted runs. Target ${format(scenario.oxygen_fraction * 100)} percent oxygen and ${format(scenario.pressure_kpa)} kilopascals. Exact values are in the run table.`}>
      <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} className={styles.window}/>
      <path d={`M ${left} ${top} V ${bottom} H ${right}`} fill="none" stroke="currentColor"/>
      {[0, .25, .5, .75, 1].map(tick => <g key={tick}>
        <text x={x(tick)} y={bottom + 18} textAnchor="middle">{tick * 100}</text>
        <text x={left - 7} y={y(tick * pressureScale) + 4} textAnchor="end">{format(tick * pressureScale)}</text>
      </g>)}
      <text x={(left + right) / 2} y={249} textAnchor="middle">Ambient oxygen (%)</text>
      <text x={15} y={113} transform="rotate(-90 15 113)" textAnchor="middle">Pressure (kPa)</text>
      {points.map(point => <a key={runKey(point)} href={point.source_url ?? undefined}
        target="_blank" rel="noreferrer" tabIndex={-1} className={styles.pointLink}>
        <title>{point.acronym} · {point.run_id} · {point.source_locator}</title>
        {point.basis === 'test_matrix'
          ? <rect x={x(point.oxygen_fraction) - 4} y={y(point.pressure_kpa) - 4} width={8} height={8} className={styles.matrix}/>
          : <circle cx={x(point.oxygen_fraction)} cy={y(point.pressure_kpa)} r={4} className={styles.observed}/>}
      </a>)}
      <circle cx={x(scenario.oxygen_fraction)} cy={y(scenario.pressure_kpa)} r={8} className={styles.target}/>
    </svg>
    <p className={styles.legend}><span className={styles.targetKey}/> Scenario target and shaded matching window
      <span className={styles.observedKey}/> Reported or measured run
      <span className={styles.matrixKey}/> Test-matrix entry</p>
  </>;
}

export default function EvidenceCoverage({input, scenario, dataVersion, filters, onChange, onAsk, section = 'all'}: {
  input: CoverageInput; scenario: Scenario; dataVersion: string; filters?: GapFilters;
  onChange?: (filters: GapFilters) => void; onAsk?: (question: string) => void; section?: 'brief'|'gaps'|'all';
}) {
  const [localFilters, setLocalFilters] = useState(() => initialGapFilters(input.methodology));
  const [showPlanner, setShowPlanner] = useState(false);
  const [slots, setSlots] = useState(3);
  const [constraint, setConstraint] = useState('');
  const current = filters ?? localFilters;
  const update = (patch: Partial<GapFilters>) => (onChange ?? setLocalFilters)({...current, ...patch});
  const report = evaluateCoverage(input, scenario, current);
  const pointsByRun = new Map(report.points.map(point => [runKey(point), point]));
  const investigations = [...new Map(input.runs.map(run => [run.investigation_id, run.acronym]))];
  const materials = [...new Set(input.runs.flatMap(run => run.material ? [run.material] : []))].sort();
  const windowLabel = `±${current.oxygen_percentage_points} O₂ percentage points and ±${format(current.pressure_kpa)} kPa`;
  const plan = report.runs.length ? report.checks
    .map((check, index) => ({check, ...checks[index], order: index}))
    .filter(({check}) => check.status !== 'documented')
    .sort((a, b) => a.check.count - b.check.count || a.order - b.order).slice(0, slots) : [];
  const exportContext = {data_version: dataVersion, methodology: input.methodology, scenario, filters: current};

  return <div className={styles.panel}>
    <div className={styles.heading}>
      <h3>{section === 'gaps' ? 'Evidence Gap Map' : 'Scenario Readiness Brief'}</h3>
      <button onClick={() => downloadFile('flameatlas-evidence-coverage.json', JSON.stringify({...exportContext, ...report}, null, 2))}>Export coverage JSON</button>
    </div>
    <p>Research coverage for {scenario.environment} · {scenario.gravity} · {input.methodology.version}</p>
    {section !== 'gaps' && <>
    <ul className={styles.checks}>
      {report.checks.map((check, index) => {
        const supporting = new Set(check.evidence_ids.map(id => JSON.stringify(id)));
        return <li key={check.id}>
        <strong>{checks[index].label}</strong>
        <span className={styles.status}>{statusLabels[check.status]}</span>
        <span>{check.count} / {check.total} {checks[index].denominator}</span>
        {check.count > 0 && <details><summary>Supporting runs</summary><ul>{report.runs
          .filter(run => supporting.has(runKey(run)))
          .map(run => <li key={runKey(run)}><a href={run.source_url ?? undefined} target="_blank" rel="noreferrer">{run.acronym} · {run.run_id}</a><small>{run.source_locator}</small></li>)}</ul></details>}
      </li>})}
    </ul>
    <p>Coverage with fewer than {input.methodology.minimum_runs} supporting runs is marked thin. Solid-material coverage uses the selected gravity regime and target material when specified.</p>
    </>}
    {section !== 'brief' && <>
    {section === 'all' && <h3>Evidence Gap Map</h3>}
    <div className={styles.controls}>
      <label>Investigation<select value={current.investigation} onChange={e => update({investigation: e.target.value})}>
        <option value="">All investigations</option>{investigations.map(([id, acronym]) => <option key={id} value={id}>{acronym}</option>)}
      </select></label>
      <label>Run material<select value={current.material} onChange={e => update({material: e.target.value})}>
        <option value="">All materials</option>{materials.map(material => <option key={material}>{material}</option>)}
      </select></label>
      <label>Atmosphere evidence basis<select value={current.basis} onChange={e => update({basis: e.target.value})}>
        <option value="">All bases</option>{basisOptions.map(basis => <option key={basis} value={basis}>{readable(basis)}</option>)}
      </select></label>
      <label>Oxygen window (percentage points)<input type="number" min={0} max={100} step="any" value={current.oxygen_percentage_points} onChange={e => {
        const value = e.target.valueAsNumber;
        if (value >= 0 && value <= 100) update({oxygen_percentage_points: value});
      }}/></label>
      <label>Pressure window (kPa)<input type="number" min={0} max={1000} step="any" value={current.pressure_kpa} onChange={e => {
        const value = e.target.valueAsNumber;
        if (value >= 0 && value <= 1000) update({pressure_kpa: value});
      }}/></label>
    </div>
    <p aria-live="polite">{report.points.length} plotted runs / {report.runs.length} filtered runs · {report.checks[1].count} reported pairs within {windowLabel}.</p>
    {report.points.length === 0 && <p className={styles.status}>No source-linked ambient oxygen and pressure pairs qualify under these filters.</p>}
    <AtmospherePlot scenario={scenario} filters={current} points={report.points}/>
    <details open={report.points.length > 0 || undefined}>
      <summary>Run evidence table</summary>
      <div className={styles.scroll} tabIndex={0} role="region" aria-label="Run evidence table">
        <table><caption>Filtered runs and source locators</caption>
          <thead><tr><th>Investigation / run</th><th>O₂ (%)</th><th>Pressure (kPa)</th><th>Basis / context</th><th>Window</th><th>Source locator</th></tr></thead>
          <tbody>{report.runs.map(run => {
            const point = pointsByRun.get(runKey(run));
            return <tr key={runKey(run)}>
              <th scope="row">{run.acronym} · {run.run_id}</th>
              <td>{point ? format(point.oxygen_fraction * 100) : '—'}</td><td>{point ? format(point.pressure_kpa) : '—'}</td>
              <td>{readable(run.basis)} / {readable(run.oxygen_context)}</td>
              <td>{point ? point.within_window ? 'Within' : 'Outside' : 'No eligible pair'}</td>
              <td>{run.source_url ? <a href={run.source_url} target="_blank" rel="noreferrer">{run.source_locator} ↗</a> : run.source_locator || 'Unavailable'}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </details>
    <details><summary>Coverage methodology</summary><ul>{input.methodology.limitations.map(note => <li key={note}>{note}</li>)}</ul></details>
    <div className={styles.planner}>
      <button aria-expanded={showPlanner} onClick={() => setShowPlanner(!showPlanner)}>Campaign planner</button>
      {showPlanner && <div>
        <h4>Research questions to investigate</h4>
        <div className={styles.controls}>
          <label>Study slots<select value={slots} onChange={e => setSlots(Number(e.target.value))}>{[1, 2, 3, 4].map(count => <option key={count}>{count}</option>)}</select></label>
          <label>Review constraints<input maxLength={240} value={constraint} onChange={e => setConstraint(e.target.value)} placeholder="e.g. published data only"/></label>
        </div>
        <p>Questions are ordered by supporting-run count and inherit the scenario and filters. Review constraints are saved with the plan.</p>
        {plan.length ? <ol>{plan.map(({check, label, question}) => <li key={check.id}><strong>{question}</strong><br/>{label} · {check.count} / {check.total} supporting runs. Resolving this question could improve coverage for this check.
          {onAsk && <div><button onClick={() => onAsk(question)}>Search evidence for this question</button></div>}</li>)}</ol> : <p>No coverage questions were generated for this selection.</p>}
        <button disabled={!plan.length} onClick={() => downloadFile('flameatlas-campaign-plan.json', JSON.stringify({...exportContext, type: 'proposed_research', study_slots: slots, constraint, questions: plan.map(({check, question}) => ({check, question}))}, null, 2))}>Export research plan</button>
      </div>}
    </div>
    </>}
  </div>;
}
