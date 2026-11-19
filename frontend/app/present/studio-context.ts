import {illustrativeScenario} from './scenario';

export const studioTabs = [
  {id: 'brief', label: 'Scenario brief', hint: 'Set the research conditions'},
  {id: 'explore', label: 'Studies', hint: 'Inspect and compare investigations'},
  {id: 'gaps', label: 'Coverage', hint: 'Map available evidence'},
  {id: 'evidence', label: 'Ask evidence', hint: 'Retrieve cited findings'},
  {id: 'model', label: 'Model review', hint: 'Check model applicability'},
  {id: 'hardware', label: '3D lab', hint: 'Explore experimental hardware'},
] as const;
export type StudioTool = typeof studioTabs[number]['id'];

export const fuelLabels = {
  all: 'All fuel classes',
  solid: 'Solid materials',
  liquid: 'Liquid fuels',
  gas: 'Gaseous fuels',
  aerosol: 'Aerosol fuels',
  unknown: 'Unclassified',
} as const;
export type FuelFilter = keyof typeof fuelLabels;

const environmentAliases = {
  airliner: 'airliner cabin',
  iss: 'station',
  transit: 'Gateway / transit',
  moon: 'lunar habitat',
  rover: 'pressurized rover',
  mars: 'Mars habitat',
  suit: 'suit',
} as const;

const studioAnchors: Record<string, StudioTool> = {
  brief: 'brief', studies: 'explore', atlas: 'explore', gaps: 'gaps', gap: 'gaps',
  ask: 'evidence', model: 'model', landscape: 'model', hardware: 'hardware', explorer: 'hardware',
};

export function isFuelFilter(value: unknown): value is FuelFilter {
  return typeof value === 'string' && Object.hasOwn(fuelLabels, value);
}

export function studioShortcut(url: URL) {
  const requestedEnvironment = url.searchParams.get('env');
  const requestedFuel = url.searchParams.get('fuel');
  const hash = url.hash.slice(1);
  const tool = Object.hasOwn(studioAnchors, hash) ? studioAnchors[hash] : undefined;
  if (!tool && requestedEnvironment === null && requestedFuel === null) return null;

  const environment = requestedEnvironment && Object.hasOwn(environmentAliases, requestedEnvironment)
    ? environmentAliases[requestedEnvironment as keyof typeof environmentAliases]
    : undefined;
  const fuel = isFuelFilter(requestedFuel) ? requestedFuel : undefined;
  const ignored = (requestedEnvironment !== null && !environment) || (requestedFuel !== null && !fuel);
  return {
    tool: tool ?? 'brief',
    scenario: environment ? illustrativeScenario(environment) : null,
    fuel: fuel ?? 'all',
    ignored,
  } as const;
}
