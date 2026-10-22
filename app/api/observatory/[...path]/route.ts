import {ownerSession} from '@/lib/observatory/auth'
import {backendFetch} from '@/lib/observatory/backend'
import type {NextRequest} from 'next/server'

export const dynamic='force-dynamic'
const safeHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
async function proxy(request:NextRequest,context:{params:Promise<{path:string[]}>}) {
  if(!await ownerSession())return Response.json({error:'Owner sign-in required.'},{status:401,headers:safeHeaders})
  const {path}=await context.params
  if(path.some(p=>p==='.'||p==='..'||p.includes('/')||p.includes('\\')))return Response.json({error:'Invalid path.'},{status:400,headers:safeHeaders})
  const operation=path.join('/'),permitted=['state','pipeline','records','observatory','action']
  if(!permitted.includes(operation)&&!operation.startsWith('legacy/'))return Response.json({error:'Not found.'},{status:404,headers:safeHeaders})
  if(request.method!=='GET'&&request.method!=='HEAD') {
    const origin=request.headers.get('origin'),site=process.env.OBSERVATORY_SITE_ORIGIN??'https://www.maxma.me'
    if(origin!==site||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Same-origin request required.'},{status:403,headers:safeHeaders})
  }
  try {
    const body=request.method==='POST'?await request.text():undefined
    if(body&&new TextEncoder().encode(body).length>1_500_000)return Response.json({error:'Request too large.'},{status:413,headers:safeHeaders})
    const response=await backendFetch('/v1/'+operation+request.nextUrl.search,{method:request.method,body,headers:body?{'Content-Type':'application/json'}:undefined})
    const headers=new Headers(safeHeaders)
    for(const key of ['content-type','content-disposition','content-security-policy'])if(response.headers.has(key))headers.set(key,response.headers.get(key)!)
    return new Response(response.body,{status:response.status,headers})
  } catch { return Response.json({error:'The research service is temporarily unavailable.'},{status:503,headers:safeHeaders}) }
}
export {proxy as GET,proxy as POST,proxy as HEAD}
