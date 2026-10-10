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
  vm.runInNewContext(compiled,{exports,testHot,console,require:name=>{
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
console.log('PASS: Auth Fast Refresh preserves provider identity and diagnostics; account anonymization respects email NOT NULL.');
