import Link from 'next/link'
import {ownerSession,authenticationReady} from '@/lib/observatory/auth'
import {backendFetch} from '@/lib/observatory/backend'
import SignIn from '../sign-in'
import Dashboard from '../workspace'
import '../observatory.css'

export const dynamic='force-dynamic'
export const metadata={title:'Observatory · Max Ma',robots:{index:false,follow:false}}
export default async function Observatory({params,searchParams}:{params:Promise<{view?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const session=await ownerSession()
  if(!session)return <section className="observatory page-wide"><p className="kicker">PRIVATE RESEARCH</p><h1>Observatory<span>.</span></h1><p className="observatory-intro">Follow what changes in Venture, AI, and the fields that matter to you. Read the evidence, explore the history, and decide what deserves a closer look.</p><div className="observatory-entry"><h2>Your research, in one place.</h2><p>Sign in to open your private workspace.</p>{authenticationReady()?<SignIn/>:<p role="status">Owner sign-in is being configured. Research remains private.</p>}</div><Link className="text-link" href="/">Back to Max Ma ↗</Link></section>
  const {view=[]}=await params,query=await searchParams,section=view[0]??'all'
  if(!['all','ventures','ai','timeline','sources'].includes(section)||view.length>1)return <section className="observatory page-wide"><h1>View not found.</h1><Link href="/observatory">Return to Observatory</Link></section>
  const filters=new URLSearchParams()
  if(['ventures','ai'].includes(section))filters.set('topic',section)
  for(const key of ['mode','cutoff','start','end','q','offset','since'])if(typeof query[key]==='string')filters.set(key,query[key] as string)
  let data:unknown=null,state:unknown=null,error=false
  try {const responses=await Promise.all([backendFetch('/v1/observatory?'+filters),backendFetch('/v1/state')]);if(responses.some(r=>!r.ok))throw new Error('Unavailable');[data,state]=await Promise.all(responses.map(r=>r.json()))}catch{error=true}
  return <section className="observatory page-wide"><div className="observatory-heading"><div><p className="kicker">PRIVATE RESEARCH WORKSPACE</p><h1>Observatory<span>.</span></h1></div><SignIn signedIn/></div><nav className="observatory-nav" aria-label="Observatory views">{[['all','Overview'],['ventures','Venture'],['ai','AI'],['timeline','Timeline'],['sources','Sources']].map(([key,label])=><Link key={key} href={key==='all'?'/observatory':'/observatory/'+key} aria-current={section===key?'page':undefined}>{label}</Link>)}<Link href="/observatory/legacy">Research library ↗</Link></nav>{error?<div className="observatory-entry" role="status"><h2>Research is temporarily unavailable.</h2><p>Your saved evidence remains in private storage. Try again shortly.</p></div>:<Dashboard key={section+filters.toString()} section={section} initial={data} research={state} filters={Object.fromEntries(filters)}/>}</section>
}
