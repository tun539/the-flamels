import data from './data.generated.json';
export type Scenario = {environment:string;theme:string;oxygen_fraction:number;pressure_kpa:number;airflow_m_s:number;gravity:string;material:string;geometry:string;measurement:string};
type Run={id?:string;oxygen_fraction?:number|null;pressure_kpa?:number|null;airflow_m_s?:number|null;material?:string|null;geometry?:string|null;gravity?:string|null;measurement?:string|null};
type Investigation={id:string;theme:string;gravity?:string|null;verification:string;runs:Run[]};
type Component=keyof typeof data.methodology.weights;
export const defaultScenario:Scenario={environment:'spacecraft',theme:'prevention',oxygen_fraction:.21,pressure_kpa:101.325,airflow_m_s:.1,gravity:'microgravity',material:'',geometry:'',measurement:''};
const equal=(a:string,b:string)=>Number(a.toLowerCase()===b.toLowerCase());
/** Matches the backend policy on jointly observed runs; no synthetic combinations. */
export function rankSnapshot<T extends Investigation>(item:T,scenario:Scenario) {
  const evaluate=(run:Run)=>{
    const atmosphere=Object.entries(data.methodology.tolerances).map(([field,tolerance])=>{
      const value=run[field as 'oxygen_fraction'|'pressure_kpa'|'airflow_m_s'];
      return value==null?null:Number(Math.abs(value-scenario[field as 'oxygen_fraction'|'pressure_kpa'|'airflow_m_s'])<=tolerance);
    });
    const components:Record<Component,number|null>={theme:equal(item.theme,scenario.theme),atmosphere:atmosphere.includes(0)?0:atmosphere.includes(null)?null:1,material:null,gravity:null,measurement:null};
    for(const field of ['material','gravity','measurement'] as const) {
      const actual=run[field],requested=scenario[field];
      components[field]=actual&&requested?equal(actual,requested):null;
    }
    if(!run.geometry||!scenario.geometry)components.material=null;
    else if(components.material!==null)components.material*=equal(run.geometry,scenario.geometry);
    const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
    let lower=0,missing=0;
    for(const key of Object.keys(components) as Component[]) {
      const value=components[key],weight=data.methodology.weights[key]*100;
      if(value===null)missing+=weight;else lower+=weight*value;
    }
    const mismatches=(Object.keys(components) as Component[]).filter(key=>components[key]===0);
    return {lower:round(lower),upper:round(lower+missing),coverage:round(100-missing),components,run_id:run.id??null,mismatches};
  };
  const candidates=(item.runs.length?item.runs:[{gravity:item.gravity}]).map(evaluate);
  const result=candidates.reduce((best,candidate)=>candidate.lower>best.lower?candidate:best);
  return {investigation:item,...result,outside_coverage:result.coverage<100||result.mismatches.length>0};
}
export function evaluateSnapshot(scenario:Scenario) {
  return data.studies.filter(s=>s.verification!=='synthetic').map(s=>rankSnapshot(s,scenario))
    .sort((a,b)=>b.lower-a.lower||(a.investigation.id<b.investigation.id?-1:a.investigation.id>b.investigation.id?1:0));
}
