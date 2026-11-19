import {test,expect} from '@playwright/test';
import data from '../app/present/data.generated.json';
import {defaultScenario,evaluateSnapshot,rankSnapshot} from '../app/present/scenario';
import {retrieveEvidence} from '../app/present/evidence';
import {toCsv} from '../app/present/exports';

test('snapshot ranking agrees with backend policy across missing and mismatched conditions',async({request})=>{
 for(const scenario of [defaultScenario,{...defaultScenario,gravity:'martian',theme:'suppression',oxygen_fraction:.3},{...defaultScenario,material:'ethane',geometry:'spherical porous burner',measurement:'burn duration'}]){
  const response=await request.post('/api/scenarios/evaluate',{data:scenario});expect(response.ok()).toBeTruthy();
  const server=(await response.json()).results;
  const browser=evaluateSnapshot(scenario);
  const compact=(r:any)=>({id:r.investigation.id,lower:r.lower,upper:r.upper,coverage:r.coverage,components:r.components,run_id:r.run_id??null,mismatches:r.mismatches,outside_coverage:r.outside_coverage});
  expect(browser.map(compact)).toEqual(server.map(compact));
 }
 const separate={id:'fixture',theme:'prevention',verification:'synthetic',runs:[{id:'a',oxygen_fraction:.21,pressure_kpa:50,airflow_m_s:.1,gravity:'microgravity'},{id:'b',oxygen_fraction:.4,pressure_kpa:101.325,airflow_m_s:.1,gravity:'microgravity'}]};
 const result=rankSnapshot(separate,defaultScenario);
 expect(result.components.atmosphere).toBe(0);expect(result.outside_coverage).toBeTruthy();
 expect(result.run_id).toBe('a');
});

test('snapshot retrieval excludes context sources and CSV neutralizes formula strings',()=>{
 expect(retrieveEvidence('PSI-181',data.resources)).toEqual([]);
 expect(retrieveEvidence('zzzzqwertyz',data.resources)).toEqual([]);
 expect(retrieveEvidence('PSI-99',data.resources).every(c=>c.document_id==='psi-99')).toBeTruthy();
 expect(toCsv([['=HYPERLINK("unsafe")',-1]])).toBe('"\'=HYPERLINK(""unsafe"")","-1"\r\n');
});

test('coverage counts and run locators agree across API, snapshot and JSON export',async({request})=>{
 const {evaluateCoverage}=await import('../app/components/coverage');
 for(const gravity of ['microgravity','lunar']){
  const scenario={...defaultScenario,gravity};
  const response=await request.post('/api/scenarios/coverage',{data:scenario});
  expect(response.ok()).toBeTruthy();
  const live=await response.json();
  const snapshot=evaluateCoverage(data.coverage,scenario);
  expect(live.checks).toEqual(snapshot.checks);
  expect(live.runs).toEqual(snapshot.runs);
  expect(snapshot.points).toHaveLength(0);
  expect(live.runs).toHaveLength(18);
  const exported=await request.post('/api/export',{data:{scenario,format:'json'}});
  expect((await exported.json()).evidence_coverage).toEqual(live);
 }
 const invalid=await request.post('/api/scenarios/coverage',{data:{oxygen_fraction:1.1}});
 expect(invalid.status()).toBe(422);
 const filtered=await request.post('/api/scenarios/coverage',{data:{...defaultScenario,filters:{investigation:'flex',basis:'measured',pressure_kpa:5}}});
 const report=await filtered.json();
 expect(report.filters.pressure_kpa).toBe(5);
 expect(report.runs).toHaveLength(0);
 expect(report.checks.every((check:{status:string})=>check.status==='not_applicable')).toBeTruthy();
});

test('coverage keeps the matching window, test matrix and measured filter distinct', async()=>{
 const {evaluateCoverage,initialGapFilters}=await import('../app/components/coverage');
 const input={...data.coverage,runs:[
   {...data.coverage.runs[0],oxygen_fraction:.25,pressure_kpa:101.325,basis:'measured',oxygen_context:'ambient'},
   {...data.coverage.runs[1],oxygen_fraction:.21,pressure_kpa:101.325,basis:'test_matrix',oxygen_context:'ambient'},
 ]};
 const filters=initialGapFilters(input.methodology);
 const report=evaluateCoverage(input, defaultScenario, filters);
 expect(report.points).toHaveLength(2);
 expect(report.checks[1].count).toBe(1);
 expect(evaluateCoverage(input,defaultScenario,{...filters,basis:'measured'}).points).toHaveLength(1);
 expect(evaluateCoverage(input,defaultScenario,{...filters,oxygen_percentage_points:3}).checks[1].count).toBe(0);
});

test('mobile scenario can inspect sources, share gap filters and export a campaign plan',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/present#research');
 await page.getByRole('button',{name:'Scenario explorer',exact:true}).click();
 await page.getByLabel('Scenario environment').selectOption('lunar habitat');
 await page.getByRole('button',{name:'Load illustrative preset'}).click();
 await expect(page.getByLabel('Scenario gravity')).toHaveValue('lunar');
 await page.getByRole('button',{name:'Evaluate scenario'}).click();
 await expect(page.getByText('0 plotted runs / 18 filtered runs', {exact:false})).toBeVisible();
 await page.getByRole('combobox',{name:'Investigation',exact:true}).selectOption('psi-159-cfi-g');
 await expect(page.getByText('0 plotted runs / 5 filtered runs', {exact:false})).toBeVisible();
 const table = page.getByRole('region',{name:'Run evidence table'});
 if (!await table.isVisible()) await page.locator('summary').filter({hasText:'Run evidence table'}).click();
 await expect(table.getByRole('link',{name:/Test 21088A1; row 1/})).toHaveAttribute('href',/PSI-159$/);
 expect(await page.locator('body').evaluate(el=>el.scrollWidth)).toBeLessThanOrEqual(390);
 await page.getByRole('button',{name:'Campaign planner',exact:true}).click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export research plan'}).click()]);
 const bytes=await (await download.createReadStream()).toArray();
 const plan=JSON.parse(Buffer.concat(bytes).toString());
 expect(plan.type).toBe('proposed_research');
 expect(plan.filters.investigation).toBe('psi-159-cfi-g');
 await page.getByRole('button',{name:'Share research view'}).click();
 await page.goto(await page.getByRole('textbox',{name:'Research-view link'}).inputValue());
 await expect(page.getByRole('combobox',{name:'Investigation',exact:true})).toHaveValue('psi-159-cfi-g');
});
