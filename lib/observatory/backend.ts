import 'server-only'
import { SignJWT } from 'jose'

export async function backendFetch(path:string,init:RequestInit={}) {
  const configured=process.env.OBSERVATORY_API_URL,secret=process.env.OBSERVATORY_SERVICE_SECRET,owner=process.env.OBSERVATORY_OWNER_GITHUB_ID
  if(!configured||!secret||secret.length<32||!owner)throw new Error('Observatory storage is not configured.')
  const base=new URL(configured)
  if(base.protocol!=='https:'&&!(process.env.NODE_ENV==='development'&&['127.0.0.1','localhost'].includes(base.hostname)))throw new Error('The backend requires HTTPS.')
  if(!path.startsWith('/v1/')||path.startsWith('//'))throw new Error('Unknown backend operation.')
  const token=await new SignJWT({role:'owner'}).setProtectedHeader({alg:'HS256'}).setSubject(owner).setIssuer('maxma-observatory').setAudience(process.env.OBSERVATORY_API_AUDIENCE??'observatory-api').setIssuedAt().setExpirationTime('2m').sign(new TextEncoder().encode(secret))
  const headers=new Headers(init.headers);headers.set('authorization','Bearer '+token)
  const response=await fetch(new URL(path,base),{...init,headers,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(60000)})
  return response
}
