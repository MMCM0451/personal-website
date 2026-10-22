'use client'
import {signIn,signOut} from 'next-auth/react'
export default function SignIn({signedIn=false}:{signedIn?:boolean}) {
  return <button className="observatory-button" onClick={()=>signedIn?signOut({callbackUrl:'/observatory'}):signIn('github',{callbackUrl:'/observatory'})}>{signedIn?'Sign out':'Sign in with GitHub'}</button>
}
