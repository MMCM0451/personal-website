import 'server-only'
import type { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import { getServerSession } from 'next-auth'

export function authenticationReady() {
  return ['OBSERVATORY_OWNER_GITHUB_ID','OBSERVATORY_GITHUB_CLIENT_ID','OBSERVATORY_GITHUB_CLIENT_SECRET','NEXTAUTH_SECRET'].every(key=>Boolean(process.env[key]))
}
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [GitHubProvider({clientId:process.env.OBSERVATORY_GITHUB_CLIENT_ID??'',clientSecret:process.env.OBSERVATORY_GITHUB_CLIENT_SECRET??'',authorization:{params:{scope:'read:user user:email'}}})],
  session: {strategy:'jwt',maxAge:8*60*60},
  cookies: {
    sessionToken:{name:process.env.NODE_ENV==='production'?'__Host-observatory-session':'observatory-session',options:{httpOnly:true,sameSite:'lax',path:'/',secure:process.env.NODE_ENV==='production'}},
  },
  callbacks: {
    async signIn({account}) {
      return authenticationReady()&&account?.provider==='github'&&account.providerAccountId===process.env.OBSERVATORY_OWNER_GITHUB_ID
    },
    async jwt({token,account}) {
      if(account)token.observatoryOwner=account.provider==='github'&&account.providerAccountId===process.env.OBSERVATORY_OWNER_GITHUB_ID?account.providerAccountId:null
      return token
    },
    async session({session,token}) {
      if(token.observatoryOwner!==process.env.OBSERVATORY_OWNER_GITHUB_ID)return {...session,user:undefined}
      return {...session,ownerId:String(token.observatoryOwner)}
    },
    async redirect({url,baseUrl}) {
      if(url.startsWith('/')&&!url.startsWith('//'))return baseUrl+url
      try { if(new URL(url).origin===new URL(baseUrl).origin)return url } catch {}
      return baseUrl+'/observatory'
    },
  },
  pages:{error:'/observatory'},
}
export async function ownerSession() {
  if(!authenticationReady())return null
  const session=await getServerSession(authOptions) as ({ownerId?:string;user?:{name?:string|null}}|null)
  return session?.ownerId===process.env.OBSERVATORY_OWNER_GITHUB_ID?session:null
}
