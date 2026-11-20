import {defaultScenario,environmentOptions,type Scenario} from './scenario';

import {isFuelFilter, studioTabs, type FuelFilter, type StudioTool} from './studio-context';
import {basisOptions,type GapFilters} from '../components/coverage';

export const SESSION_KEY='flameatlas.research-session.v1';
export type ScenarioSession={draft:Scenario;evaluated:Scenario|null;gapFilters?:GapFilters};
export type ResearchView={tool:StudioTool|'scenario';fuel?:FuelFilter;query:string;theme:string;availability:string;selected:string[];compare:boolean;question:string;submitted:string;scenario:ScenarioSession};
export function initialResearchView(studio=false):ResearchView {
  return {tool:studio?'brief':'explore',query:'',theme:'all',availability:'all',selected:[],compare:false,question:'',submitted:'',scenario:{draft:{...defaultScenario},evaluated:null}};
}
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const text=(value:unknown,max:number)=>typeof value==='string'&&value.length<=max;
const oneOf=(value:unknown,choices:readonly string[])=>typeof value==='string'&&choices.includes(value);
function validScenario(value:unknown):value is Scenario {
  if(!record(value))return false;
  return oneOf(value.environment,environmentOptions)&&
    oneOf(value.theme,['prevention','detection','suppression'])&&
    oneOf(value.gravity,['microgravity','lunar','martian','normal'])&&
    ['material','geometry','measurement'].every(k=>text(value[k],200))&&
    ['oxygen_fraction','pressure_kpa','airflow_m_s'].every(k=>typeof value[k]==='number'&&Number.isFinite(value[k]))&&
    Number(value.oxygen_fraction)>=0&&Number(value.oxygen_fraction)<=1&&Number(value.pressure_kpa)>0&&Number(value.airflow_m_s)>=0;
}
function cleanScenario(value:Scenario):Scenario {
  return {environment:value.environment,theme:value.theme,gravity:value.gravity,oxygen_fraction:value.oxygen_fraction,pressure_kpa:value.pressure_kpa,airflow_m_s:value.airflow_m_s,material:value.material,geometry:value.geometry,measurement:value.measurement};
}
function validGapFilters(value: unknown): value is GapFilters {
  if (!record(value)) return false;
  const {investigation, material, basis, oxygen_percentage_points, pressure_kpa} = value;
  return text(investigation, 80) && text(material, 500) && oneOf(basis, ['', ...basisOptions]) &&
    typeof oxygen_percentage_points === 'number' && oxygen_percentage_points >= 0 && oxygen_percentage_points <= 100 &&
    typeof pressure_kpa === 'number' && pressure_kpa >= 0 && pressure_kpa <= 1000;
}
/** Whitelist known state fields. URL/storage data can never supply evidence or results. */
export function validateResearchView(value:unknown,studyIds:string[]):ResearchView|null {
  if(!record(value)||!oneOf(value.tool,['scenario',...studioTabs.map(tab=>tab.id)])||
    (value.fuel!==undefined&&!isFuelFilter(value.fuel))||
    !text(value.query,240)||!text(value.question,2000)||!text(value.submitted,2000)||
    !oneOf(value.theme,['all','prevention','detection','suppression','fundamental'])||
    !oneOf(value.availability,['all','runs','metadata'])||
    !Array.isArray(value.selected)||value.selected.length>4||!value.selected.every(id=>typeof id==='string')||
    typeof value.compare!=='boolean'||!record(value.scenario)||!validScenario(value.scenario.draft)||
    !(value.scenario.evaluated===null||validScenario(value.scenario.evaluated))||
    (value.scenario.gapFilters!==undefined&&!validGapFilters(value.scenario.gapFilters)))return null;
  const selected=[...new Set(value.selected as string[])].filter(id=>studyIds.includes(id));
  const gapFilters = value.scenario.gapFilters as GapFilters | undefined;
  const cleanFilters = gapFilters && {
    investigation: studyIds.includes(gapFilters.investigation) ? gapFilters.investigation : '',
    material: gapFilters.material, basis: gapFilters.basis, oxygen_percentage_points: gapFilters.oxygen_percentage_points,
    pressure_kpa: gapFilters.pressure_kpa,
  };
  return {tool:value.tool as ResearchView['tool'],...(isFuelFilter(value.fuel)?{fuel:value.fuel}:{}),query:value.query as string,theme:value.theme as string,availability:value.availability as string,selected,compare:value.compare&&selected.length>=2,question:value.question as string,submitted:value.submitted as string,scenario:{draft:cleanScenario(value.scenario.draft),evaluated:value.scenario.evaluated===null?null:cleanScenario(value.scenario.evaluated),...(cleanFilters?{gapFilters:cleanFilters}:{})}};
}
export function serializeSession(view:ResearchView,dataVersion:string,studyIds:string[]) {
  const validated=validateResearchView(view,studyIds);
  if(!validated)throw Error('Complete valid scenario inputs before saving or sharing this view.');
  return JSON.stringify({version:1,data_version:dataVersion,view:validated});
}
export function restoreSession(raw:string,dataVersion:string,studyIds:string[]) {
  if(raw.length>12000)throw Error('This research session exceeds the supported size.');
  let parsed:unknown;try{parsed=JSON.parse(raw)}catch{throw Error('The research session could not be read.')}
  if(!record(parsed)||parsed.version!==1||typeof parsed.data_version!=='string')throw Error('Unsupported research-session format.');
  const view=validateResearchView(parsed.view,studyIds);
  if(!view)throw Error('The research session contains invalid settings.');
  return {view,stale:parsed.data_version!==dataVersion};
}
