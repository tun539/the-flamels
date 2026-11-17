'use client';
import {useEffect,useRef,useState} from 'react';
import data from './data.generated.json';
import {initialResearchView,restoreSession,serializeSession,SESSION_KEY,type ResearchView} from './workspace-state';
const studyIds=data.studies.map(s=>s.id);
export default function useResearchSession(){
  const [view,setView]=useState<ResearchView>(initialResearchView),[message,setMessage]=useState(''),[link,setLink]=useState(''),[ready,setReady]=useState(false),[dirty,setDirty]=useState(false);
  const observedView=useRef<string|null|undefined>(undefined);
  function restore(raw:string,shared=false){
    const restored=restoreSession(raw,data.data_version,studyIds);setView(restored.view);setLink('');setDirty(false);
    setMessage(restored.stale?'This view refers to an earlier evidence snapshot. Results are recomputed against the current dataset.':shared?'Shared research view restored.':'Saved research session restored from this browser.');
  }
  useEffect(()=>{
    function readLocation(){
      try{
        const shared=new URL(window.location.href).searchParams.get('view');
        if(shared===observedView.current)return;
        observedView.current=shared;
        if(shared!==null)restore(shared,true);
        else {const saved=localStorage.getItem(SESSION_KEY);if(saved)restore(saved)}
      }catch(e){setMessage(e instanceof Error?e.message:'Research session could not be restored.')}
      finally{setReady(true)}
    }
    readLocation();window.addEventListener('popstate',readLocation);return()=>window.removeEventListener('popstate',readLocation);
  },[]);
  function update(patch:Partial<ResearchView>){setView(old=>({...old,...patch}));setLink('');setMessage('');setDirty(true)}
  function save(){try{localStorage.setItem(SESSION_KEY,serializeSession(view,data.data_version,studyIds));setDirty(false);setMessage('Research session saved in this browser. It will be restored on your next visit.')}catch(e){setMessage(e instanceof Error?e.message:'Browser storage is unavailable. Use a research-view link instead.')}}
  function load(){try{const saved=localStorage.getItem(SESSION_KEY);if(!saved){setMessage('No research session has been saved in this browser.');return}restore(saved)}catch(e){setMessage(e instanceof Error?e.message:'Saved session is unavailable.')}}
  function reset(){setView(initialResearchView());setDirty(true);setLink('');setMessage('Current view reset. Your saved session is retained.');const url=new URL(window.location.href);url.searchParams.delete('view');window.history.replaceState(null,'',url);observedView.current=null}
  function removeSaved(){try{localStorage.removeItem(SESSION_KEY);setDirty(true);setMessage('Saved research session deleted from this browser. The current view is retained.')}catch{setMessage('The saved session could not be deleted because browser storage is unavailable.')}}
  async function share(){
    try{
      const url=new URL(window.location.href);url.searchParams.set('view',serializeSession(view,data.data_version,studyIds));url.hash='research';const href=url.toString();setLink(href);
      try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(href);setMessage('Research-view link copied. Recipients use the site’s existing access permissions.')}catch{setMessage('Research-view link ready. Select and copy the link below.')}
    }catch(e){setMessage(e instanceof Error?e.message:'This research view could not be shared.')}
  }
  return {view,setView,update,save,load,reset,removeSaved,share,message,link,ready,dirty};
}
