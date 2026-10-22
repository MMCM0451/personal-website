import assert from 'node:assert/strict'
const origin=process.env.OBSERVATORY_TEST_URL??'http://127.0.0.1:3000'
for(const path of ['/observatory','/observatory/ai','/observatory/ventures','/observatory/timeline','/observatory/sources']){
 const response=await fetch(origin+path,{redirect:'manual'})
 assert.equal(response.status,200,path)
 assert.match(response.headers.get('cache-control')??'',/private.*no-store/,path)
 assert.match(await response.text(),/Sign in to open your private workspace/,path)
}
for(const path of ['/observatory/legacy','/api/observatory/state','/api/observatory/pipeline','/api/observatory/records','/api/observatory/observatory','/api/observatory/legacy/api/export','/api/observatory/legacy/api/pipeline/export','/api/observatory/legacy/api/migration/object?key=fixture','/api/observatory/legacy/assets/app.js']){
 for(const headers of [{},{'oai-authenticated-user-id':'forged-owner','oai-sites-authorization':'Bearer forged'},{cookie:'__Host-observatory-session=forged'}]){
  const response=await fetch(origin+path,{headers,redirect:'manual'});assert.equal(response.status,401,path);assert.match(response.headers.get('cache-control')??'',/private.*no-store/);assert.match(await response.text(),/Owner sign-in required\./)
 }
}
const write=await fetch(origin+'/api/observatory/action',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({action:'save_read_state',args:{eventId:'fixture',read:true}})})
assert.equal(write.status,401)
console.log('Anonymous pages are private entry points; research, exports, assets and mutations reject anonymous and forged identities.')
