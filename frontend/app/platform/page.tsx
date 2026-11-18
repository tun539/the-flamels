"use client";

import { useState } from "react";
import styles from "./platform.module.css";

const commands = "git clone https://github.com/tun539/the-flamels.git C:\\Flamels\ncd /d C:\\Flamels\nsetup.cmd\nlaunch.cmd";
const domains = [
  ["01", "Droplet flames", "FLEX · FLEX-2 · PSI-117", "Extinction, burning dynamics and published experimental/model series."],
  ["02", "Solid flame spread", "BASS-II · PSI-62", "Material configurations, flow conditions and source-backed observations."],
  ["03", "Spacecraft fire", "SAFFIRE-I", "Spacecraft-scale context, burn records and source availability."],
  ["04", "Gaseous flames", "CFI-G · Flame Design · BRE", "Normal and inverse configurations remain separate throughout analysis."],
  ["05", "Smoke detection", "SAME", "Smoke-particle statistics, instrument context and reported limitations."],
];

export default function PlatformPage() {
  const [copy, setCopy] = useState("");
  async function copyCommands() {
    try { await navigator.clipboard.writeText(commands); setCopy("Commands copied."); }
    catch { setCopy("Select and copy the commands below."); }
  }
  return (
    <main className={styles.page}>
      <div className={styles.top}><a className={styles.brand} href="/">Flame<span>Atlas</span><small>BY THE FLAMELS</small></a><nav aria-label="Platform navigation"><a href="#domains">Research domains</a><a href="#install">Run the platform</a><a href="https://github.com/tun539/the-flamels">GitHub ↗</a></nav></div>
      <div className={styles.hero}>
        <div><p className={styles.eyebrow}>THE FLAMELS / EXTENDED RESEARCH PLATFORM</p><h1>Follow the evidence.<br/><em>Explore the physics.</em></h1><p className={styles.lead}>A dedicated FlameAtlas edition with scientific analysis, five conceptual 3D studios and a cited Research Copilot.</p><div className={styles.actions}><a className={styles.primary} href="#install">Run your research platform <span>↗</span></a><a href="/#research">Explore the public evidence atlas →</a></div><p className={styles.note}>Complete Python + Next.js application · Evidence-only mode works without a model key</p></div>
        <div className={styles.diagram} aria-label="Research workflow"><p className={styles.eyebrow}>A TRACEABLE RESEARCH WORKFLOW</p><div className={styles.workflow}><span>NASA source files<small>Immutable records & documents</small></span><b aria-hidden="true">↓</b><span>Scientific exploration<small>Conditions · collections · comparisons</small></span><b aria-hidden="true">↓</b><span>Interpretable research<small>Charts · conceptual 3D · cited evidence</small></span></div><p className={styles.diagramNote}>Measured evidence and conceptual illustrations retain distinct labels.</p></div>
      </div>
      <div className={styles.band}><span>FIVE SCIENTIFIC DOMAINS</span><span>CONDITION SIMILARITY</span><span>CITED RESEARCH ASSISTANCE</span><span>YOUR FLAMELS EDITION</span></div>
      <section id="domains" className={styles.section}><div className={styles.sectionHead}><p className={styles.eyebrow}>01 / SCIENTIFIC SCOPE</p><h2>Different phenomena.<br/>Distinct evidence.</h2><p>The complete reference application is retained. Each collection keeps its own evidence level, units, conditions and source locators.</p></div><div className={styles.cards}>{domains.map(([n,title,source,text])=><article key={n}><span>{n} / RESEARCH DOMAIN</span><h3>{title}</h3><small>{source}</small><p>{text}</p></article>)}</div></section>
      <section className={styles.section}><div className={styles.sectionHead}><p className={styles.eyebrow}>02 / RESEARCH CAPABILITIES</p><h2>From a question<br/>to inspectable evidence.</h2></div><div className={styles.capabilities}><article><h3>Explore & compare</h3><p>Browse experimental collections, inspect raw cells and compare compatible configurations. Find similar records using starting conditions.</p></article><article><h3>Understand & present</h3><p>Use scientific plots, credited NASA media, conceptual 3D studios and a guided presentation journey.</p></article><article><h3>Ask & verify</h3><p>Retrieve cited passages and structured evidence. Optional model-written answers use your own server-side provider configuration.</p></article></div></section>
      <section id="install" className={`${styles.section} ${styles.install}`}><div><p className={styles.eyebrow}>03 / RUN YOUR EDITION</p><h2>A complete application.<br/>A reproducible setup.</h2><p>Use Windows with Git, Python 3.11–3.13 and Node.js 20 or newer. The installer downloads the complete pinned reference source, verifies the committed research files and applies The Flamels edition.</p><p>The extended platform runs locally, in a private Codespace or on your Docker host. This public page introduces the platform; the FastAPI backend is hosted separately.</p><a href="https://github.com/tun539/the-flamels/tree/main/research-platform">Full setup & deployment guide ↗</a></div><div className={styles.terminal}><div><span>WINDOWS / COMMAND PROMPT</span><button onClick={copyCommands}>Copy commands</button></div><pre>{commands}</pre><p role="status">{copy || "After startup, open http://127.0.0.1:3000"}</p></div></section>
      <section className={`${styles.section} ${styles.provenance}`}><p className={styles.eyebrow}>SOURCE & SOFTWARE PROVENANCE</p><h2>Keep the origin visible.</h2><p>This edition adapts <a href="https://github.com/COngtuthien/SpaceFire-AI">SpaceFire-AI by COngtuthien</a> at commit <code>9817452c3eff</code>. Original authorship, scientific processing methods and NASA media credits are retained. The reference supplies no license file; this edition does not assign a new license to upstream materials.</p><p>Some supplementary reports are absent from the reference repository. Their curated records retain source locators and availability notices. Their original full text is not presented as locally indexed evidence.</p></section>
      <footer className={styles.footer}><span>THE FLAMELS / FLAMEATLAS</span><p>Research support tool. Not a certified fire safety assessment.</p><a href="/">← Return to the public evidence atlas</a></footer>
    </main>
  );
}
