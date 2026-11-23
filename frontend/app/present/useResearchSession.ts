'use client';
import {useEffect,useRef,useState} from 'react';
import data from './data.generated.json';
import {initialResearchView,restoreSession,serializeSession,SESSION_KEY,type ResearchView} from './workspace-state';
import {studioShortcut} from './studio-context';
const studyIds=data.studies.map(s=>s.id);
export default function useResearchSession(studio=false){
  const storageKey=studio?SESSION_KEY+'.studio':SESSION_KEY;
  const [view,setView]=useState<ResearchView>(()=>initialResearchView(studio)),[message,setMessage]=useState(''),[link,setLink]=useState(''),[ready,setReady]=useState(false),[dirty,setDirty]=useState(false);
  const observedView=useRef<string|undefined>(undefined);
  function restore(raw:string,shared=false){
    const restored=restoreSession(raw,data.data_version,studyIds);
    const tool=studio?(restored.view.tool==='scenario'?'brief':restored.view.tool):
      (['explore','scenario','evidence'].includes(restored.view.tool)?restored.view.tool:'scenario');
    setView({...restored.view,tool});setLink('');setDirty(false);
    setMessage(restored.stale?'This view refers to an earlier evidence snapshot. Results are recomputed against the current dataset.':shared?'Shared research view restored.':'Saved research session restored from this browser.');
  }
  useEffect(()=>{
    function readLocation(){
      try{
        const url=new URL(window.location.href);
        const shared=url.searchParams.get('view');
        const locationKey=studio?url.search+url.hash:shared??'';
        if(locationKey===observedView.current)return;
        observedView.current=locationKey;
        if(shared!==null){restore(shared,true);return}
        const shortcut=studio?studioShortcut(url):null;
        if(shortcut){
          const view=initialResearchView(true);
          setView({...view,tool:shortcut.tool,fuel:shortcut.fuel,
            scenario:shortcut.scenario?{draft:shortcut.scenario,evaluated:shortcut.scenario}:view.scenario});
          setDirty(false);setLink('');
          setMessage(shortcut.ignored?'Unknown environment or fuel filter was skipped.':'');
          return;
        }
        const saved=localStorage.getItem(storageKey);
        if(saved)restore(saved);else setView(initialResearchView(studio));
      }catch(e){setMessage(e instanceof Error?e.message:'Research session could not be restored.')}
      finally{setReady(true)}
    }
    readLocation();
    window.addEventListener('popstate',readLocation);
    if(studio)window.addEventListener('hashchange',readLocation);
    return()=>{
      window.removeEventListener('popstate',readLocation);
      if(studio)window.removeEventListener('hashchange',readLocation);
    };
  },[studio,storageKey]);
  function update(patch:Partial<ResearchView>){setView(old=>({...old,...patch}));setLink('');setMessage('');setDirty(true)}
  function save(){try{localStorage.setItem(storageKey,serializeSession(view,data.data_version,studyIds));setDirty(false);setMessage('Research session saved in this browser. It will be restored on your next visit.')}catch(e){setMessage(e instanceof Error?e.message:'Browser storage is unavailable. Use a research-view link instead.')}}
  function load(){try{const saved=localStorage.getItem(storageKey);if(!saved){setMessage('No research session has been saved in this browser.');return}restore(saved)}catch(e){setMessage(e instanceof Error?e.message:'Saved session is unavailable.')}}
  function reset(){setView(initialResearchView(studio));setDirty(true);setLink('');setMessage('Current view reset. Your saved session is retained.');const url=new URL(window.location.href);url.searchParams.delete('view');if(studio){url.searchParams.delete('env');url.searchParams.delete('fuel');url.hash='research'}window.history.replaceState(null,'',url);observedView.current=studio?url.search+url.hash:''}
  function removeSaved(){try{localStorage.removeItem(storageKey);setDirty(true);setMessage('Saved research session deleted from this browser. The current view is retained.')}catch{setMessage('The saved session could not be deleted because browser storage is unavailable.')}}
  async function share(){
    try{
      const url=new URL(window.location.href);if(studio){url.searchParams.delete('env');url.searchParams.delete('fuel')}url.searchParams.set('view',serializeSession(view,data.data_version,studyIds));url.hash='research';const href=url.toString();setLink(href);
      try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(href);setMessage('Research-view link copied. Recipients use the site’s existing access permissions.')}catch{setMessage('Research-view link ready. Select and copy the link below.')}
    }catch(e){setMessage(e instanceof Error?e.message:'This research view could not be shared.')}
  }
  return {view,setView,update,save,load,reset,removeSaved,share,message,link,ready,dirty};
}
