'use client'
import {useState} from 'react'
const components=['change','magnitude','audience','maturity','evidence','relevance','uncertainty']
export default function Review({revisionId,disabled}:{revisionId:string;disabled:boolean}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function submit(form:FormData){
  setBusy(true);setMessage('')
  const decision=String(form.get('decision')),ranking:Record<string,{value:number;reason:string}>={}
  for(const key of components){const value=form.get(key),reason=String(form.get(key+'-reason')??'').trim();if(value!==''&&value!==null){if(!reason){setMessage('Each selection score needs an explanation.');setBusy(false);return}ranking[key]={value:Number(value),reason}}}
  try{const response=await fetch('/api/observatory/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review_observatory_event',args:{revisionId,decision,reason:String(form.get('reason')),ranking}})});if(!response.ok)throw new Error((await response.json()).error??'Review could not be saved.');setMessage('Review saved as a new revision. Refresh this view to see it.')}catch(error){setMessage(error instanceof Error?error.message:'Review failed.')}finally{setBusy(false)}
 }
 return <details className="observatory-review"><summary>Review this proposal</summary><form action={submit}><p>Check the quoted evidence before accepting. Claims retain their stated verification level. Selection scores are optional; all seven components are needed for ranked briefs. A higher uncertainty score reduces selection priority.</p><label>Review reason<textarea name="reason" required minLength={8} maxLength={2000}/></label><fieldset><legend>Selection components · 0–5</legend>{components.map(key=><div className="observatory-score" key={key}><label>{key}<input name={key} type="number" min="0" max="5" step="1"/></label><label>Evidence and reasoning<input name={key+'-reason'} maxLength={2000}/></label></div>)}</fieldset><div className="observatory-event-actions"><button type="submit" name="decision" value="accept" disabled={disabled||busy}>Accept with this review</button><button type="submit" name="decision" value="reject" disabled={disabled||busy}>Reject with this review</button></div><p role="status">{message}</p></form></details>
}
