import type {Scenario} from '../present/scenario';

export type EvidenceRun = {
  investigation_id: string; acronym: string; run_id: string;
  material: string | null; material_phase: string | null; gravity: string | null;
  basis: string; oxygen_context: string; oxygen_fraction: number | null; pressure_kpa: number | null;
  source_url: string | null; source_locator: string;
};
export type CoverageInput = {
  runs: EvidenceRun[];
  methodology: {version: string; minimum_runs: number; window: Window; limitations: string[]};
};
type Window = {oxygen_percentage_points: number; pressure_kpa: number};
export type GapFilters = {investigation: string; material: string; basis: string} & Window;
type PairedRun = EvidenceRun & {oxygen_fraction: number; pressure_kpa: number};

export const basisOptions = ['measured', 'source_reported', 'test_matrix', 'assumed', 'derived', 'model_output', 'unknown'];
export const initialGapFilters = (method: CoverageInput['methodology']): GapFilters =>
  ({investigation: '', material: '', basis: '', ...method.window});
const same = (value: string | null, requested: string) => value?.trim().toLowerCase() === requested.trim().toLowerCase();
const paired = (run: EvidenceRun): run is PairedRun => run.oxygen_fraction !== null && run.pressure_kpa !== null;

export function evaluateCoverage(input: CoverageInput, scenario: Scenario, filters = initialGapFilters(input.methodology)) {
  const runs = input.runs.filter(run =>
    (!filters.investigation || run.investigation_id === filters.investigation) &&
    (!filters.material || run.material === filters.material) &&
    (!filters.basis || run.basis === filters.basis));
  const pairs = runs.filter(paired);
  const observed = pairs.filter(run => run.basis !== 'test_matrix');
  const inWindow = (run: PairedRun) =>
    Math.abs(run.oxygen_fraction - scenario.oxygen_fraction) <= filters.oxygen_percentage_points / 100 + 1e-12 &&
    Math.abs(run.pressure_kpa - scenario.pressure_kpa) <= filters.pressure_kpa + 1e-12;
  const nearby = observed.filter(inWindow);
  const reportedGravity = runs.filter(run => run.source_url && run.gravity);
  const gravity = reportedGravity.filter(run => same(run.gravity, scenario.gravity));
  const classified = nearby.filter(run => same(run.gravity, scenario.gravity) && run.material_phase);
  const solid = classified.filter(run => run.material_phase === 'solid' && (!scenario.material.trim() || same(run.material, scenario.material)));

  function check(id: string, matches: EvidenceRun[], total: number) {
    const count = matches.length;
    const status = !runs.length ? 'not_applicable' : !total || (!count && id === 'recorded_atmosphere') ? 'missing'
      : !count ? 'outside_coverage' : count < input.methodology.minimum_runs ? 'thin' : 'documented';
    return {id, status, count, total, evidence_ids: matches.map(run => [run.investigation_id, run.run_id])};
  }

  return {
    runs,
    points: pairs.map(run => ({...run, within_window: inWindow(run)})),
    checks: [
      check('recorded_atmosphere', observed, runs.length),
      check('nearby_atmosphere', nearby, observed.length),
      check('gravity', gravity, reportedGravity.length),
      check('solid_material', solid, classified.length),
    ],
  };
}
