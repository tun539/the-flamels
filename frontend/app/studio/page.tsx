import Link from 'next/link';
import ResearchTools from '../present/ResearchTools';
import data from '../present/data.generated.json';
import {platformLink} from './platform-links';
import styles from './studio.module.css';

export const metadata = {
  title: 'Research Studio | FlameAtlas',
  description: 'Trace combustion research from a scenario to source-linked experimental evidence.',
};

export default function StudioPage() {
  const configuredPlatform = platformLink(process.env.NEXT_PUBLIC_FLAMEATLAS_PLATFORM_URL, '/', '');
  return <main className={styles.page}>
    <a className={styles.skip} href="#research">Skip to research tools</a>
    <header className={styles.masthead}>
      <Link href="/" className={styles.brand}>Flame<span>Atlas</span><small>THE FLAMELS</small></Link>
      <nav aria-label="Project navigation">
        <Link href="/present">Presentation</Link>
        <Link href="/platform">Extended platform</Link>
        <a href="https://github.com/tun539/the-flamels">GitHub ↗</a>
      </nav>
    </header>
    <div className={styles.intro}>
      <div><p className={styles.kicker}>MICROGRAVITY COMBUSTION</p><h1>Research Studio</h1>
        <p>Trace a research scenario to experimental conditions, compare the relevant studies and inspect the evidence.</p></div>
      <dl className={styles.metrics} aria-label="Catalogue inventory">
        <div><dt>Investigations</dt><dd>{data.counts.investigations}</dd></div>
        <div><dt>Imported runs</dt><dd>{data.counts.runs}</dd></div>
        <div><dt>Source records</dt><dd>{data.counts.resources}</dd></div>
      </dl>
    </div>
    <div id="studies" />
    <div id="research" className={styles.research}>
      <ResearchTools studio platformUrl={configuredPlatform || undefined}/>
    </div>
    <footer className={styles.footer}><p>Research support tool. Not a certified fire safety assessment.</p><span>Snapshot {data.data_version.slice(0, 12)}</span></footer>
  </main>;
}
