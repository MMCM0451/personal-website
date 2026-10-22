import {ownerSession} from '@/lib/observatory/auth'
import {backendFetch} from '@/lib/observatory/backend'
export const dynamic='force-dynamic'
export async function GET() {
  if(!await ownerSession())return new Response('Owner sign-in required.',{status:401,headers:{'Cache-Control':'private, no-store'}})
  try {
    const response=await backendFetch('/v1/legacy/')
    // fetch decodes the upstream body. Compression and length headers no longer describe it.
    const headers=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'})
    for(const key of ['content-type','content-disposition','content-security-policy'])if(response.headers.has(key))headers.set(key,response.headers.get(key)!)
    return new Response(response.body,{status:response.status,headers})
  }
  catch {return new Response('The research service is temporarily unavailable.',{status:503,headers:{'Cache-Control':'private, no-store'}})}
}
