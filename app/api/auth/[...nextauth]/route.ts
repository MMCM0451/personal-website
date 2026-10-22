import NextAuth from 'next-auth'
import { NextRequest } from 'next/server'
import { authenticationReady,authOptions } from '@/lib/observatory/auth'

const handler=NextAuth(authOptions)
async function auth(request:NextRequest,context:{params:Promise<{nextauth:string[]}>}) {
  if(!authenticationReady())return Response.json({error:'Owner sign-in is not configured.'},{status:503,headers:{'Cache-Control':'private, no-store'}})
  const response=await handler(request,context)
  response.headers.set('Cache-Control','private, no-store')
  return response
}
export {auth as GET,auth as POST}
