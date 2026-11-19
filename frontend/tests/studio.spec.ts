import {expect, test} from '@playwright/test';
import {platformLink} from '../app/studio/platform-links';

test('airliner and solid shortcut carries its research context across the studio', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/studio?env=airliner&fuel=solid#studies');
  const navigation = page.getByRole('navigation', {name: 'Studio tools'});
  await expect(navigation.getByRole('button', {name: 'Studies'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', {name: 'Fuel class'})).toHaveValue('solid');
  const context = page.getByRole('complementary', {name: 'Active research context'});
  await expect(context).toContainText('airliner cabin');
  await expect(context).toContainText('78.0 kPa');
  await expect(page.getByText('4 matching records · 0 / 4 selected')).toBeVisible();
  await page.getByRole('checkbox', {name: 'Compare BASS', exact: true}).check();
  await page.getByRole('checkbox', {name: 'Compare Saffire-I', exact: true}).check();
  await page.getByRole('button', {name: 'Compare selected'}).click();
  await expect(page.getByRole('region', {name: 'Selected investigation comparison'})).toBeVisible();
  await navigation.getByRole('button', {name: 'Coverage'}).click();
  await expect(page.getByRole('heading', {name: 'Evidence Gap Map'})).toBeVisible();
  await expect(page.getByText(/0 plotted runs \/ 13 filtered runs/)).toBeVisible();
  await navigation.getByRole('button', {name: 'Model review'}).click();
  await expect(page.getByText(/outside the FLEX droplet model domain/)).toBeVisible();
  await page.getByRole('button', {name: 'Share research view'}).click();
  const link = await page.getByRole('textbox', {name: 'Research-view link'}).inputValue();
  await page.goto(link);
  await expect(navigation.getByRole('button', {name: 'Model review'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', {name: 'Fuel class'})).toHaveValue('solid');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('the 3D lab routes into cited evidence and voice transcription requires explicit submission', async ({page}) => {
  await page.addInitScript(() => {
    class TestRecognition {
      onresult?: (event: {results: {transcript: string}[][]}) => void;
      onend?: () => void;
      start() {}
      stop() {
        this.onresult?.({results: [[{transcript: 'PSI-99'}]]});
        this.onend?.();
      }
      abort() {}
    }
    Object.defineProperty(window, 'SpeechRecognition', {value: TestRecognition});
  });
  await page.goto('/studio#hardware');
  await expect(page.getByRole('heading', {name: 'Experimental hardware'})).toBeVisible();
  await expect(page.getByRole('link', {name: 'Open setup guide'})).toHaveCount(5);
  await page.getByRole('article').filter({has: page.getByRole('heading', {name: 'Droplet extinction'})})
    .getByRole('button', {name: 'Find related evidence'}).click();
  const question = page.getByRole('textbox', {name: 'Research question'});
  await expect(question).toHaveValue('FLEX');
  await page.getByRole('button', {name: 'Dictate question'}).click();
  await page.getByRole('button', {name: 'Stop dictation'}).click();
  await expect(question).toHaveValue('PSI-99');
  await expect(page.getByText('Query: FLEX')).toBeVisible();
  await page.getByRole('button', {name: 'Retrieve evidence'}).click();
  await expect(page.getByText('Query: PSI-99')).toBeVisible();
});

test('unknown shortcuts receive a safe fallback', async ({page}) => {
  await page.goto('/studio?env=unknown&fuel=constructor#studies');
  await expect(page.getByText('Unknown environment or fuel filter was skipped.')).toBeVisible();
  await expect(page.getByRole('combobox', {name: 'Fuel class'})).toHaveValue('all');
});


test('the configured platform origin links to the expected modeling route', () => {
  expect(platformLink('http://127.0.0.1:3200', '/modeling')).toBe('http://127.0.0.1:3200/modeling');
  expect(platformLink('javascript:alert(1)', '/modeling')).toBe('/platform#install');
  expect(platformLink('https://user:secret@example.org', '/modeling')).toBe('/platform#install');
});

test('FLEX run browser exposes original units, rejects an invalid pressure and exports selected records', async ({page}) => {
  await page.goto('/studio?env=iss&fuel=liquid#runs');
  await expect(page.getByRole('heading', {name:'Experiment runs'})).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'274 matching runs'})).toBeVisible();
  await page.getByRole('textbox',{name:'Find runs'}).fill('psi69-test-114');
  const table=page.getByRole('region',{name:'Experiment run results'});
  await expect(table.getByRole('cell',{name:'Not available',exact:true})).toHaveCount(1);
  await table.getByRole('button',{name:'FLEX · psi69-test-114'}).click();
  await expect(page.getByText('0 mmHg',{exact:true})).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export selected runs'}).click()]);
  const stream=await download.createReadStream();
  const bytes=await stream.toArray();
  const report=JSON.parse(Buffer.concat(bytes).toString());
  expect(report.records[0].row.pressure_kpa).toBeNull();
  expect(report.records[0].record.original_values.pressure_kpa.value).toBe('0');
  await page.getByRole('textbox',{name:'Find runs'}).clear();
  await page.getByRole('checkbox',{name:'Within the scenario window'}).check();
  await expect(page.getByRole('status').filter({hasText:/matching runs/})).not.toContainText('274 matching runs');
});
