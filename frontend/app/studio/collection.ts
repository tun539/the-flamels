import data from '../present/data.generated.json';
import type {FuelFilter} from '../present/studio-context';

// Classifies the source-described subject of a study, separately from individual-run evidence.
const studyFuels: Readonly<Record<string, FuelFilter>> = {
  bass: 'solid',
  'psi-98-saffire': 'solid',
  'psi-99-saffire': 'solid',
  'psi-100-saffire': 'solid',
  'psi-159-cfi-g': 'gas',
  flex: 'liquid',
};
export const studyFuel = (id: string) => studyFuels[id] ?? 'unknown';

export function studioCollection(fuel: FuelFilter) {
  const studies = data.studies.filter(study => fuel === 'all' || studyFuel(study.id) === fuel);
  const ids = new Set(studies.map(study => study.id));
  return {
    studies,
    coverage: {
      methodology: data.coverage.methodology,
      runs: data.coverage.runs.filter(run => ids.has(run.investigation_id)),
    },
  };
}
