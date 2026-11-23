import rows from './flex-examples.json';
import styles from './learn.module.css';

const psi = 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69';
const flex = 'https://gipoc.grc.nasa.gov/wp/fcf-cir/flex/';
const bass = 'https://ntrs.nasa.gov/citations/20160000593';
const runs = '/studio/?env=iss&fuel=liquid#runs';

export const metadata = {
  title: 'Flame in Freefall | FlameAtlas',
  description: 'Follow two ISS combustion experiments and interpret original NASA FLEX records.',
};

export default function LearnPage() {
  return <main className={styles.page}>
    <nav aria-label="Lesson navigation"><a href="/">FlameAtlas</a><a href="#workflow">Experiment workflow</a><a href="#records">Read the data</a><a href="#review">Evidence review</a></nav>
    <header className={styles.hero}><div>
      <p className="eyebrow">THE FLAMELS · LEARNING LAB</p>
      <h1>Flame in Freefall</h1>
      <p className="intro">Follow two experiments aboard the International Space Station from hardware selection and observation to a source-linked evidence review.</p>
      <a href="/studio/#hardware">Explore the ISS hardware in 3D</a>
    </div></header>
    <section id="workflow">
      <h2>How a flight experiment becomes a data record</h2>
      <div className={styles.grid}>
        <article><h3>FLEX · Liquid droplets</h3><ol>
          <li><strong>Prepare.</strong> FLEX studied a liquid droplet in the Combustion Integrated Rack. Researchers specified the fuel, droplet size and chamber atmosphere as experimental conditions.</li>
          <li><strong>Observe.</strong> Once the run was underway, the observation record tracked the droplet and the visible flame. The published table records the initial diameter, visible flame extinction diameter, burn duration and test-end classification.</li>
          <li><strong>Review.</strong> Compare one row at a time. Check the test-end label alongside the diameter and duration before interpreting why the run ended.</li>
        </ol><a href={flex}>NASA FLEX experiment overview</a></article>
        <article><h3>BASS-II · Solid materials</h3><ol>
          <li><strong>Prepare.</strong> The experiment used a flow duct inside the Microgravity Science Glovebox. Researchers documented the solid sample and the flow configuration.</li>
          <li><strong>Observe.</strong> Cameras recorded flame growth and movement along the sample. The report distinguishes flow in the direction of flame spread from flow opposing it.</li>
          <li><strong>Review.</strong> Compare material, sample geometry and flow direction together before comparing reported spread behavior.</li>
        </ol><a href={bass}>NASA BASS-II results and apparatus description</a></article>
      </div>
    </section>
    <section id="records">
      <h2>Read three real FLEX records</h2>
      <p>Each row comes from the NASA PSI-69 Version 5 experimental table. Search the full browser by test ID to see its source locator.</p>
      <div className={styles.table} role="region" aria-label="FLEX example records" tabIndex={0}><table>
        <caption>Reported values with source units</caption>
        <thead><tr>{['Test ID','Fuel','Pressure (mmHg)','Ambient O₂ (%)','Initial diameter (mm)','Visible extinction diameter (mm)','Burn time (s)','Test end'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{rows.map(row=><tr key={row.test}>
          <th scope="row">psi69-test-{row.test}</th><td>{row.fuel}</td><td>{row.pressure}{row.pressure==='0' && <small>Raw entry · unavailable for comparison</small>}</td>
          <td>{Number(row.oxygen)*100}</td><td>{row.initial}</td><td>{row.visible}</td><td>{row.time}</td><td>{row.end}</td>
        </tr>)}</tbody>
      </table></div>
      <dl className={styles.terms}>
        <div><dt>Ambient oxygen</dt><dd>Oxygen mole fraction in the surrounding gas. A reported fraction of 0.21 is displayed as 21%.</dd></div>
        <div><dt>Total pressure</dt><dd>The pressure of the whole gas mixture. The run browser normalizes valid values to kPa and preserves the reported mmHg value.</dd></div>
        <div><dt>Droplet diameters</dt><dd>Both diameter columns describe the droplet. The second is its diameter at the visible-flame marker.</dd></div>
        <div><dt>Burn time and test end</dt><dd>Read the duration alongside the recorded endpoint. FLEX labels test 1 as Disruption and test 2 as Extinction.</dd></div>
      </dl>
      <a href={runs}>Open the full FLEX run browser</a> · <a href={psi}>NASA PSI-69 source record</a>
    </section>
    <section id="review">
      <h2>Review the evidence before applying it</h2>
      <div className={styles.grid}>
        <article><h3>Student exercise</h3><p>Tests 1 and 2 both report 21% oxygen. Can you use their two burn times to isolate the effect of droplet size?</p>
          <details><summary>Reveal the explanation</summary><p>The endpoint classifications and total pressures also differ. Use these runs to practice checking which conditions match and which variables would need to be held constant.</p></details></article>
        <article><h3>Crew and ground-team briefing</h3><p>Record the relevant material, geometry, oxygen fraction, total pressure, gravity and ventilation. Use the source locator to check the original setup and report mismatches or missing fields to the ground team.</p>
          <details><summary>What should you report for test 114?</summary><p>The source table contains 0 mmHg. FlameAtlas preserves that entry and treats pressure as unavailable in comparisons. State this gap explicitly when discussing transferability.</p></details></article>
      </div>
      <p>This lesson supports training and evidence review. Follow mission-approved procedures for onboard operations and incident response.</p>
      <a href="/studio/?env=iss&fuel=liquid#gaps">Review evidence coverage for an ISS scenario</a>
    </section>
  </main>;
}
