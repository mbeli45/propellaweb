import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToString } from 'react-dom/server';

const require = createRequire(import.meta.url);
const hot = {data:{}};
let contextsCreated=0;
const source=readFileSync('src/contexts/AuthContext.tsx','utf8').replaceAll('import.meta.hot','testHot');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function load(testHot, overrides={}) {
  const exports={};
  vm.runInNewContext(compiled,{exports,testHot,console,queueMicrotask,require:name=>{
    if(name in overrides)return overrides[name];
    if(name==='react')return {...React,createContext(...args){contextsCreated++;return React.createContext(...args);}};
    if(name==='react-router-dom')return {useNavigate:()=>()=>{}};
    if(name==='@/lib/supabase')return {supabase:{}};
    if(name==='@/lib/identity')return {agentLandingRoute:()=>'/agent'};
    if(name==='@/lib/sentry')return {setUser(){}};
    return require(name);
  }});
  return exports;
}
const initial=load(hot);
const refreshed=load(hot);
assert.equal(contextsCreated,1,'Fast Refresh must reuse the context');
function Consumer(){const auth=refreshed.useAuth();return React.createElement('span',null,auth.loading?'loading':'ready');}
assert.equal(renderToString(React.createElement(initial.AuthProvider,null,React.createElement(Consumer))),'<span>loading</span>');
assert.throws(()=>renderToString(React.createElement(Consumer)),/within AuthProvider/,'Genuine missing providers must still fail');
load(undefined);
assert.equal(contextsCreated,2,'Production creates its own ordinary context');
let stateIndex=0,updatedProfile,signOuts=0;
const deletion=load(undefined,{
  react:{...React,useState:initial=>[stateIndex++===0?{id:'8ebd05ea-0b7c-4afd-9cda-414a63e46010'}:initial,()=>{}],useCallback:fn=>fn,useEffect(){}},
  '@/lib/supabase':{supabase:{from:()=>({update:payload=>({eq:async()=>{assert.ok(payload.email);updatedProfile=payload;return {error:null};}})}),auth:{signOut:async()=>{signOuts++;}}}},
});
const provider=deletion.AuthProvider({children:null});
await provider.props.value.deleteAccount();
assert.equal(updatedProfile.email,'deleted-8ebd05ea-0b7c-4afd-9cda-414a63e46010@account.invalid');
assert.equal(signOuts,1);
async function loginScenario(role, error=null) {
  const routes=[];let landingCalls=0;
  const module=load(undefined,{
    react:{...React,useState:initial=>[initial,()=>{}],useCallback:fn=>fn,useEffect(){}},
    'react-router-dom':{useNavigate:()=>route=>routes.push(route)},
    '@/lib/identity':{agentLandingRoute:async()=>{landingCalls++;return '/agent/identity?onboarding=1';}},
    '@/lib/supabase':{supabase:{auth:{signInWithPassword:async()=>({data:{user:error?null:{id:'test-user'}},error})},
      from:()=>({select:()=>({eq:()=>({single:async()=>({data:{id:'test-user',role},error:null})})})})}},
  });
  const auth=module.AuthProvider({children:null}).props.value;
  if(error)await assert.rejects(auth.signIn(' Agent@Example.test ','password'));
  else await auth.signIn('agent@example.test','password');
  return {routes,landingCalls};
}
for(const role of ['agent','landlord']) {
  const result=await loginScenario(role);assert.equal(result.routes[0],'/agent/identity?onboarding=1');assert.equal(result.landingCalls,1);
}
const normal=await loginScenario('normal');assert.equal(normal.routes[0],'/user');assert.equal(normal.landingCalls,0);
const recovery=await loginScenario('agent',{code:'email_not_confirmed',message:'Confirmation required'});
assert.equal(recovery.routes[0],'/auth/verify?email=agent%40example.test&resend=1');assert.equal(recovery.landingCalls,0);
assert.equal((await loginScenario('agent',{code:'invalid_credentials',message:'Invalid login credentials'})).routes.length,0);
// The auth layout must not send agents to the dashboard before their async ID
// check finishes; a stale result after unmount must not redirect another user.
let layoutEffects=[], layoutRoute=null, resolveLanding;
const layoutExports={};
const layoutCompiled=ts.transpileModule(readFileSync('src/layouts/AuthLayout.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
vm.runInNewContext(layoutCompiled,{exports:layoutExports,require:name=>{
  if(name==='react')return {...React,useState:initial=>[layoutRoute??initial,next=>{layoutRoute=next;}],useEffect:fn=>layoutEffects.push(fn)};
  if(name==='react-router-dom')return {useLocation:()=>({pathname:'/auth/login'}),Navigate:'navigate',Routes:'routes',Route:'route'};
  if(name==='@/contexts/AuthContext')return {useAuth:()=>({loading:false,user:{id:'agent-one',role:'agent'}})};
  if(name==='@/lib/identity')return {agentLandingRoute:()=>new Promise(resolve=>{resolveLanding=resolve;})};
  if(name==='react/jsx-runtime')return require(name);
  return {__esModule:true,default:()=>null};
}});
const landing=layoutExports.default();
assert.equal(typeof landing.type,'function');
const loadingLanding=landing.type(landing.props);assert.notEqual(loadingLanding.type,'navigate');
const cleanupLanding=layoutEffects[0]();resolveLanding('/agent/identity?onboarding=1');await Promise.resolve();
assert.equal(landing.type(landing.props).props.to,'/agent/identity?onboarding=1');cleanupLanding();
layoutRoute=null;layoutEffects=[];landing.type(landing.props);
layoutEffects[0]()();resolveLanding('/agent');await Promise.resolve();assert.equal(layoutRoute,null);
console.log('PASS: Auth refresh, account anonymization, agent/landlord login routing, email recovery, invalid credentials and async redirect lifecycle.');
