import {test,expect} from '@playwright/test';
import {initialResearchView,restoreSession,serializeSession,SESSION_KEY,validateResearchView} from '../app/present/workspace-state';
import data from '../app/present/data.generated.json';
const ids=data.studies.map(s=>s.id);

test('research sessions validate shared inputs and ignore untrusted evidence fields',()=>{
 const view=initialResearchView();view.selected=[ids[0],ids[1]];view.compare=true;
 const raw=serializeSession(view,data.data_version,ids);
 expect(restoreSession(raw,data.data_version,ids).view.selected).toEqual(view.selected);
 expect(restoreSession(raw,'new-snapshot',ids).stale).toBeTruthy();
 expect(restoreSession(raw,data.data_version,ids.slice(0,1)).view.compare).toBeFalsy();
 expect(validateResearchView({...view,tool:['scenario']},ids)).toBeNull();
 expect(validateResearchView({...view,scenario:{...view.scenario,draft:{...view.scenario.draft,gravity:['lunar']}}},ids)).toBeNull();
 expect(validateResearchView({...view,scenario:{...view.scenario,draft:{...view.scenario.draft,pressure_kpa:0}}},ids)).toBeNull();
 const cleaned=validateResearchView({...view,citations:[{text:'Unsupported claim'}],ranking:[{lower:100}]},ids);
 expect(cleaned).not.toHaveProperty('citations');expect(cleaned).not.toHaveProperty('ranking');
 expect(()=>restoreSession('{',data.data_version,ids)).toThrow('could not be read');
 expect(()=>restoreSession(JSON.stringify({version:99}),data.data_version,ids)).toThrow('Unsupported');
});

test('saved comparison reloads and a shared view restores independently of browser storage',async({page})=>{
 await page.goto('/present');
 await page.getByLabel('Data availability',{exact:true}).selectOption('runs');
 await page.getByRole('checkbox',{name:'Compare CFI-G',exact:true}).check();
 await page.getByRole('checkbox',{name:'Compare Saffire-II',exact:true}).check();
 await page.getByRole('button',{name:'Compare selected',exact:true}).click();
 await page.getByRole('button',{name:'Save session',exact:true}).click();
 await page.reload();
 await expect(page.getByRole('region',{name:'Selected investigation comparison'})).toBeVisible();
 await page.getByRole('button',{name:'Share research view',exact:true}).click();
 const link=await page.getByLabel('Research-view link',{exact:true}).inputValue();
 expect(new URL(link).hash).toBe('#research');
 await page.evaluate(key=>localStorage.removeItem(key),SESSION_KEY);
 await page.goto(link);
 await expect(page.getByText('Shared research view restored.',{exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Selected investigation comparison'})).toBeVisible();
 await page.getByRole('button',{name:'Reset view',exact:true}).click();
 expect(new URL(page.url()).searchParams.has('view')).toBeFalsy();
 await expect(page.getByRole('region',{name:'Selected investigation comparison'})).toHaveCount(0);
});

test('scenario state survives tool changes and clearly separates edited inputs from evaluated results',async({page})=>{
 await page.goto('/present');await page.getByRole('button',{name:'Scenario explorer',exact:true}).click();
 await page.getByRole('button',{name:'Evaluate scenario',exact:true}).click();
 await page.getByLabel('Scenario Total pressure (kPa)',{exact:true}).fill('200');
 await expect(page.getByText('Scenario inputs have changed.',{exact:false})).toBeVisible();
 await page.getByRole('link',{name:'Methodology',exact:true}).click();
 await page.getByRole('link',{name:'Research tools',exact:true}).click();
 await expect(page.getByLabel('Scenario Total pressure (kPa)',{exact:true})).toHaveValue('200');
 await page.getByRole('button',{name:'Evidence search',exact:true}).click();
 await page.getByRole('button',{name:'Scenario explorer',exact:true}).click();
 await expect(page.getByLabel('Scenario Total pressure (kPa)',{exact:true})).toHaveValue('200');
 await expect(page.getByText('pO₂ = 21.278 kPa',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Save session',exact:true}).click();await page.reload();
 await expect(page.getByLabel('Scenario Total pressure (kPa)',{exact:true})).toHaveValue('200');
 await expect(page.getByText('Scenario inputs have changed.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Evaluate scenario',exact:true}).click();
 await expect(page.getByText('pO₂ = 42.000 kPa',{exact:false})).toBeVisible();
 await expect(page.getByText('Scenario inputs have changed.',{exact:false})).toHaveCount(0);
 await page.getByRole('button',{name:'Delete saved session',exact:true}).click();
 await expect(page.getByLabel('Scenario Total pressure (kPa)',{exact:true})).toHaveValue('200');
 await page.reload();await expect(page.getByRole('button',{name:'Explore & compare',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('mobile sharing supports clipboard denial and malformed links fail safely',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Clipboard unavailable')}}}));
 await page.goto('/present');await page.getByRole('button',{name:'Share research view',exact:true}).click();
 await expect(page.getByText('Research-view link ready. Select and copy the link below.',{exact:true})).toBeVisible();
 await expect(page.getByLabel('Research-view link',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/present?view='+encodeURIComponent('{"version":1,"data_version":"test","view":{"tool":["scenario"]}}'));
 await expect(page.getByText('The research session contains invalid settings.',{exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Evidence first. Interpretation follows.'})).toBeVisible();
});

test('saved evidence queries preserve submitted results separately from unsubmitted edits',async({page})=>{
 await page.goto('/present');await page.getByRole('button',{name:'Evidence search',exact:true}).click();
 await page.getByLabel('Research question',{exact:true}).fill('PSI-99');
 await page.getByRole('button',{name:'Retrieve evidence',exact:true}).click();
 await expect(page.getByText('Query: PSI-99',{exact:true})).toBeVisible();
 await page.getByLabel('Research question',{exact:true}).fill('zzzzqwertyz');
 await expect(page.getByText('The research question has changed.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Save session',exact:true}).click();await page.reload();
 await expect(page.getByLabel('Research question',{exact:true})).toHaveValue('zzzzqwertyz');
 await expect(page.getByText('Query: PSI-99',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Retrieve evidence',exact:true}).click();
 await expect(page.getByText('Insufficient evidence in the current dataset.',{exact:false})).toBeVisible();
 await expect(page.getByText('The research question has changed.',{exact:false})).toHaveCount(0);
});
