import {ownerSession} from '@/lib/observatory/auth'
import {backendFetch} from '@/lib/observatory/backend'
export const dynamic='force-dynamic'
export async function GET() {
  if(!await ownerSession())return new Response('Owner sign-in required.',{status:401,headers:{'Cache-Control':'private, no-store'}})
  try {const response=await backendFetch('/v1/legacy/');return new Response(response.body,{status:response.status,headers:response.headers})}
  catch {return new Response('The research service is temporarily unavailable.',{status:503,headers:{'Cache-Control':'private, no-store'}})}
}
