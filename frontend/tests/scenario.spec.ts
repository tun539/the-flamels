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
