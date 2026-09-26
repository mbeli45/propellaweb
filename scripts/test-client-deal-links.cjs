const fs=require('node:fs'),assert=require('node:assert/strict');
const ts=require('typescript');
function moduleFrom(file, replacements=[]) {
 let source=fs.readFileSync(file,'utf8');for(const [a,b] of replacements)source=source.replace(a,b);
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const m={exports:{}};new Function('exports','module',js)(m.exports,m);return m.exports;
}
const memory=new Map();global.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const invite=moduleFrom('src/lib/clientInvitation.ts');
const token='a'.repeat(64);invite.rememberClientInvitation(token);assert.equal(invite.pendingClientInvitation(),token);
assert.throws(()=>invite.rememberClientInvitation('invalid'));
const key=[...memory.keys()][0];memory.set(key,JSON.stringify({token,expires:Date.now()-1}));assert.equal(invite.pendingClientInvitation(),null);
invite.rememberClientInvitation(token);invite.clearClientInvitation();assert.equal(invite.pendingClientInvitation(),null);
const deals=moduleFrom('src/lib/deals.ts',[["import { supabase } from './supabase';","const supabase = {rpc:async (_name,args)=>({data:args,error:null})};"]]);
(async()=>{
 const id='11111111-1111-4111-8111-111111111111';
 const form={action:'link_property',id:'deal',title:'Attach',fields:[{key:'property_id',label:'Property'}]};
 assert.equal((await deals.submitDealForm(form,{property_id:'https://propellacam.com/property/'+id+'?action=book'})).p_data.property_id,id);
 await assert.rejects(()=>deals.submitDealForm(form,{property_id:'invalid'}),/valid Propella property/);
 const invitation={id:'invite',updated_at:'2026-09-26T00:00:00Z',platform_bps:1000};
 assert.equal(deals.invitationForm(invitation).data.invited_at,invitation.updated_at);
 console.log('PASS: invitation persistence, expiry, invalid token rejection, cleanup, property-link normalization and invitation version forwarding.');
})().catch(e=>{console.error(e);process.exitCode=1;});
