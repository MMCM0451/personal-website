'use client'
import {useState} from 'react'

const defaults={change:1,magnitude:1,audience:1,maturity:1,evidence:1,relevance:1,uncertainty:-1}
export type Preference={kind:string;target_id:string;body:{followed?:boolean;weights?:Record<string,number>};recorded_at:string}
export default function Preferences({values,disabled}:{values:Preference[];disabled:boolean}){
 const [topic,setTopic]=useState('ai'),[reason,setReason]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[current,setCurrent]=useState(values)
 const saved=current.find(p=>p.kind==='ranking'&&p.target_id===topic),followed=current.find(p=>p.kind==='follow_topic'&&p.target_id===topic)?.body.followed??false
 const [weights,setWeights]=useState<Record<string,number>>({...defaults,...saved?.body.weights})
 function choose(value:string){setTopic(value);setWeights({...defaults,...current.find(p=>p.kind==='ranking'&&p.target_id===value)?.body.weights})}
 async function save(kind:string){
  setBusy(true);setMessage('')
  const args={kind,targetId:topic,reason,...(kind==='ranking'?{weights}:{followed:!followed})}
  try{const response=await fetch('/api/observatory/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_preference',args})});if(!response.ok)throw new Error((await response.json()).error??'Preference could not be saved.');setCurrent(list=>[...list.filter(p=>p.kind!==kind||p.target_id!==topic),{kind,target_id:topic,body:args,recorded_at:new Date().toISOString()}]);setMessage('Saved with your reason. Future briefs use these weights; saved briefs keep their original selection.')}catch(error){setMessage(error instanceof Error?error.message:'Preference could not be saved.')}finally{setBusy(false)}
 }
 return <details className="observatory-preferences"><summary>Following and selection preferences</summary><p>Following records your interests. It does not establish personal fit. Selection weights apply to future briefs.</p><label>Field<select value={topic} onChange={e=>choose(e.target.value)}><option value="ai">AI</option><option value="ventures">Venture</option></select></label><label>Reason for this change<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000} required/></label><button className="observatory-button" disabled={disabled||busy||!reason.trim()} onClick={()=>save('follow_topic')}>{followed?'Unfollow':'Follow'} {topic==='ai'?'AI':'Venture'}</button><fieldset disabled={disabled||busy}><legend>Selection weights</legend>{Object.entries(weights).map(([key,value])=><label key={key}>{key}<input type="number" min={-5} max={5} step={0.25} value={value} onChange={e=>setWeights(w=>({...w,[key]:Number(e.target.value)}))}/></label>)}<button className="observatory-button" disabled={!reason.trim()||Object.values(weights).some(v=>!Number.isFinite(v)||v<-5||v>5)} onClick={()=>save('ranking')}>Save weights</button></fieldset><p role="status">{message}</p></details>
}
