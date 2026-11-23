import {useState} from 'react';
import {evaluateCoverage, type CoverageInput} from '../components/coverage';
import type {ScenarioSession} from '../present/workspace-state';
import {fuelLabels, type FuelFilter} from '../present/studio-context';
import {platformLink} from './platform-links';
import styles from './studio.module.css';
import facilities from '../../public/lab-viewer/facilities.json';

const scenes = [
  {name: 'Droplet extinction', study: 'FLEX', route: '/phenomena/flame-extinction', detail: 'Explore the droplet and the optical diagnostics.'},
  {name: 'Solid flame spread', study: 'BASS-II', route: '/phenomena/flame-spread', detail: 'Inspect the glovebox and solid-material configuration.'},
  {name: 'Spacecraft fire', study: 'Saffire', route: '/phenomena/spacecraft-fire', detail: 'Explore the spacecraft-scale experiment enclosure.'},
  {name: 'Gaseous flames', study: 'ACME', route: '/phenomena/gaseous-flames', detail: 'Compare burner hardware and experimental configurations.'},
  {name: 'Smoke detection', study: 'SAME', route: '/phenomena/smoke-detection', detail: 'Inspect the smoke diagnostics and sampling setup.'},
];

export function StudioReadout({scenario, fuel, studies, coverage}: {
  scenario: ScenarioSession;
  fuel: FuelFilter;
  studies: number;
  coverage: CoverageInput;
}) {
  const assessed = scenario.evaluated;
  const report = assessed ? evaluateCoverage(coverage, assessed, scenario.gapFilters) : null;
  return <aside className={styles.readout} aria-label="Active research context">
    <div><span>Scenario</span><strong>{assessed?.environment ?? 'Awaiting evaluation'}</strong>
      {assessed && <small>{assessed.gravity} · {(assessed.oxygen_fraction * 100).toFixed(1)}% O₂ · {assessed.pressure_kpa.toFixed(1)} kPa</small>}
    </div>
    <div><span>Collection</span><strong>{fuelLabels[fuel]}</strong><small>{studies} investigations</small></div>
    <div><span>Evidence window</span><strong>{report ? report.checks[1].count : '—'} {report && 'reported pairs'}</strong>
      <small>{report ? `${report.checks[2].count} source-linked runs match the selected gravity` : 'Evaluate a scenario to compare conditions'}</small>
    </div>
  </aside>;
}

export function StudioHardware({platformUrl, onAsk}: {platformUrl?: string; onAsk: (study: string) => void}) {
  const [active, setActive] = useState('CIR');
  const [part, setPart] = useState(0);
  const ids: Record<string, string> = {FLEX:'flex', 'BASS-II':'bass', Saffire:'saffire', ACME:'gas', SAME:'smoke'};
  const facilityId = active.toLowerCase() as keyof typeof facilities;
  const facility = facilities[facilityId];
  const viewer = facility
    ? '/lab-viewer/station.html?scene='+facilityId+'&part='+part
    : '/lab-viewer/index.html?scene='+ids[active];
  return <div>
    <h2>Experimental hardware</h2>
    <div className={styles.cards} aria-label="ISS facilities">
      {Object.entries(facilities).map(([id, equipment]) => <article key={id}>
        <span>{id.toUpperCase()}</span>
        <h3>{equipment.name}</h3>
        <p>{equipment.parts.map(([label]) => label).join(' · ')}</p>
        <button aria-pressed={active === id.toUpperCase()} onClick={() => {setActive(id.toUpperCase()); setPart(0);}}>Inspect {id.toUpperCase()}</button>
      </article>)}
    </div>
    <label>3D scene <select value={active} onChange={event => {setActive(event.target.value); setPart(0);}}>
      <optgroup label="ISS facilities">{Object.entries(facilities).map(([id, equipment]) =>
        <option key={id} value={id.toUpperCase()}>{id.toUpperCase()} · {equipment.name}</option>
      )}</optgroup>
      {scenes.map(scene => <option key={scene.study} value={scene.study}>{scene.study} · {scene.name}</option>)}
    </select></label>
    {facility && <fieldset className={styles.parts}>
      <legend>Components of {facility.name}</legend>
      {facility.parts.map(([label], index) => <button key={label} aria-pressed={part === index} onClick={() => setPart(index)}>{label}</button>)}
      <p aria-live="polite">{facility.parts[part][1]} <a href={facility.source}>NASA facility documentation</a></p>
    </fieldset>}
    <iframe title={active+' interactive 3D model'} src={viewer} className={styles.hardwareViewer}/>
    <p>Facility cutaways use illustrative geometry. Select an experiment below to review its evidence.</p>
    <div className={styles.cards}>
      {scenes.map(scene => <article key={scene.route}>
        <span>{scene.study}</span><h3>{scene.name}</h3><p>{scene.detail}</p>
        <div className={styles.actions}>
          {platformUrl && <a href={platformLink(platformUrl, scene.route)}>Open extended studio ↗</a>}
          <button onClick={() => onAsk(scene.study)}>Find related evidence</button>
        </div>
      </article>)}
    </div>
  </div>;
}

export function StudioModel({scenario, fuel, coverage, platformUrl}: {
  scenario: ScenarioSession; fuel: FuelFilter; coverage: CoverageInput; platformUrl?: string;
}) {
  const assessed = scenario.evaluated;
  const report = assessed ? evaluateCoverage(coverage, assessed, scenario.gapFilters) : null;
  return <div>
    <h2>Model applicability</h2>
    <p>This review uses the current collection and the last evaluated scenario. The extended platform contains the experimental FLEX models and their validation details.</p>
    <div className={styles.cards}>
      <article><span>Atmosphere</span><h3>{report ? `${report.checks[1].count} nearby pairs` : 'Scenario required'}</h3><p>Jointly reported oxygen and pressure indicate which run conditions are available for review.</p></article>
      <article><span>Gravity</span><h3>{report ? `${report.checks[2].count} matching runs` : 'Scenario required'}</h3><p>Exact gravity labels keep partial-gravity inquiries visible as coverage gaps.</p></article>
      <article><span>Model domain</span><h3>Liquid droplets</h3><p>{fuel === 'all' || fuel === 'liquid' ? 'Review the FLEX workbench for its outcome definitions, training data and applicability limits.' : `The selected ${fuelLabels[fuel].toLowerCase()} collection falls outside the FLEX droplet model domain.`}</p></article>
    </div>
    <div className={styles.actions}>
      <a href={platformLink(platformUrl, '/modeling')}>{platformUrl ? 'Open model workbench ↗' : 'Set up the model workbench ↗'}</a>
      <a href={platformLink(platformUrl, '/methodology', '/present#method')}>Read methodology ↗</a>
    </div>
  </div>;
}
