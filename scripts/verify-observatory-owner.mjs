// Signed test sessions verify server boundaries. They do not replace browser OAuth consent.
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {writeFile} from 'node:fs/promises'
import {readFileSync} from 'node:fs'
import {spawn} from 'node:child_process'
const {encode}=createRequire(import.meta.url)('next-auth/jwt')
let phase='configuration'
process.on('uncaughtException',error=>{const causeCode=error.cause?.code;console.error(JSON.stringify({passed:false,phase,errorType:error.name,...(typeof causeCode==='string'&&/^[A-Z0-9_]+$/.test(causeCode)?{causeCode}:{})}));process.exitCode=1})
const config=JSON.parse(readFileSync(0,'utf8')),origin=new URL(config.origin)
assert.equal(origin.protocol,'https:');assert.equal(origin.pathname,'/')
assert.ok(origin.hostname==='www.maxma.me'||origin.hostname.endsWith('-mingchuanlife-6670s-projects.vercel.app'))
const owner=await encode({secret:config.secret,token:{sub:config.ownerId,observatoryOwner:config.ownerId,name:'Owner verification fixture'},maxAge:300})
const other=await encode({secret:config.secret,token:{sub:'synthetic-other-owner',observatoryOwner:'synthetic-other-owner'},maxAge:300})
const expired=await encode({secret:config.secret,token:{sub:config.ownerId,observatoryOwner:config.ownerId},maxAge:-60})
const cookie=token=>'__Host-observatory-session='+token
const checks=[]
async function request(path,{method='GET',headers={},body}={}){
 phase=method+' '+path
 if(!config.vercelEntry){const response=await fetch(new URL(path,origin),{method,headers,body,redirect:'manual',signal:AbortSignal.timeout(60000)});return {status:response.status,headers:response.headers,text:await response.text()}}
 const lines=['silent','show-error','include','max-time = 60','request = '+JSON.stringify(method),'write-out = "\\n__OBS_STATUS__%{http_code}"',...Object.entries(headers).map(([name,value])=>'header = '+JSON.stringify(name+': '+value)),...(body?['data = '+JSON.stringify(body)]:[])]
 const args=[config.vercelEntry,'curl',new URL(path,origin).href,'--scope','mingchuanlife-6670s-projects','--','--config','-']
 const output=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:['pipe','pipe','pipe'],windowsHide:true});let stdout='',size=0;child.stdout.on('data',part=>{size+=part.length;if(size>10_000_000){child.kill();reject(new Error('Bounded test response exceeded'));}stdout+=part});child.stderr.on('data',()=>{});child.on('error',()=>reject(new Error('Supported Vercel HTTP check could not start')));child.on('exit',code=>code===0?resolve(stdout):reject(new Error('Supported Vercel HTTP check failed')));child.stdin.end(lines.join('\n')+'\n')})
 const marker=output.lastIndexOf('\n__OBS_STATUS__');assert.ok(marker>=0,'HTTP receipt missing');const status=Number(output.slice(marker+15)),content=output.slice(0,marker);let remaining=content,responseHeaders=new Headers()
 while(/^HTTP\/\S+ \d{3}/.test(remaining)){const match=remaining.match(/\r?\n\r?\n/);assert.ok(match);const block=remaining.slice(0,match.index).split(/\r?\n/);responseHeaders=new Headers();for(const line of block.slice(1)){const index=line.indexOf(':');if(index>0)responseHeaders.append(line.slice(0,index),line.slice(index+1).trim())}remaining=remaining.slice(match.index+match[0].length)}
 return {status,headers:responseHeaders,text:remaining}
}
function check(name,response,status,privateCache=true){phase=name;assert.equal(response.status,status,name);if(privateCache)assert.match(response.headers.get('cache-control')??'',/private.*no-store/,name);checks.push({name,status,passed:true})}
const html=await request('/observatory',{headers:{Cookie:cookie(owner)}});check('owner private page',html,200);assert.match(html.text,/PRIVATE RESEARCH WORKSPACE/);assert.match(html.text,/Read-only migration checkpoint/)
const state=await request('/api/observatory/state',{headers:{Cookie:cookie(owner)}});check('owner state',state,200);const research=JSON.parse(state.text);assert.ok(research.companies.length>0);assert.ok(research.fundingEvents.length>0)
const ai=await request('/api/observatory/observatory?topic=ai',{headers:{Cookie:cookie(owner)}});check('owner AI intake',ai,200);const view=JSON.parse(ai.text);assert.equal(view.readOnly,true);assert.ok(view.intake.length>0);assert.ok(view.intake.every(document=>document.source_id.startsWith('ai-')))
for(const [name,token]of [['other signed account',other],['expired session',expired],['forged session','forged']])check(name,await request('/api/observatory/state',{headers:{Cookie:cookie(token)}}),401)
for(const path of ['/observatory/legacy','/api/observatory/legacy/assets/app.js']){check('owner '+path,await request(path,{headers:{Cookie:cookie(owner)}}),200);check('anonymous '+path,await request(path),401)}
const data=JSON.stringify({action:'save_read_state',args:{eventId:'synthetic-fixture-never-written',read:true}})
check('authenticated cross-origin POST',await request('/api/observatory/action',{method:'POST',headers:{Cookie:cookie(owner),Origin:'https://untrusted.example','Content-Type':'application/json'},body:data}),403)
check('read-only authenticated mutation',await request('/api/observatory/action',{method:'POST',headers:{Cookie:cookie(owner),Origin:origin.origin,'Content-Type':'application/json'},body:data}),409)
phase='GitHub authorization redirect'
const csrf=await request('/api/auth/csrf'),csrfBody=JSON.parse(csrf.text),csrfCookies=csrf.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ')
assert.ok(csrfBody.csrfToken&&csrfCookies)
const redirect=await request('/api/auth/signin/github',{method:'POST',headers:{Cookie:csrfCookies,Origin:origin.origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrfBody.csrfToken,callbackUrl:origin.origin+'/observatory'}).toString()})
assert.equal(redirect.status,302);const authorization=new URL(redirect.headers.get('location'));assert.equal(authorization.hostname,'github.com');assert.equal(authorization.searchParams.get('redirect_uri'),origin.origin+'/api/auth/callback/github');assert.deepEqual(new Set(authorization.searchParams.get('scope').split(/[ ,]+/)),new Set(['read:user','user:email']));assert.ok(authorization.searchParams.get('state'));checks.push({name:'GitHub authorization redirect, state and scopes',status:302,passed:true})
const receipt={completedAt:new Date().toISOString(),origin:origin.origin,checks,companies:research.companies.length,fundingEvents:research.fundingEvents.length,aiIntakeVisible:view.intake.length,readOnly:true,browserOAuthCompleted:false,note:'Signed fixture sessions test the deployed server; GitHub browser consent and logout remain a separate check.'}
await writeFile(config.receipt,JSON.stringify(receipt,null,2));console.log(JSON.stringify({passed:true,checks:checks.length,receipt:config.receipt,browserOAuthCompleted:false}))
