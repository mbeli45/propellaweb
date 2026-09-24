import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '@/hooks/useDeals';
import { DealForm, dealForms, requestForm, partnerForm, money, statusLabel, requestActions, configurePartner, resolveReport } from '@/lib/deals';
import SectionSwitch from '@/components/SectionSwitch';
import './Deals.css';
import { ListItemSkeleton } from '@/components/skeletons'

export default function Deals({workspace='customer'}: {workspace?: 'admin' | 'agent' | 'customer'}) {
 const loaded=useDeals();
 const admin=workspace==='admin'&&loaded.admin;
 const visibleDeals=loaded.deals.filter(d=>admin||(workspace==='agent'?d.agent_id===loaded.userId:d.customer_id===loaded.userId));
 const state={...loaded,admin,deals:visibleDeals,
  partners:loaded.partners.filter(p=>admin||p.owner_id===loaded.userId||visibleDeals.some(d=>d.partner_id===p.id)),
  requests:loaded.requests.filter(r=>admin||(workspace==='agent'?visibleDeals.some(d=>d.request_id===r.id):r.customer_id===loaded.userId))};
 const navigate=useNavigate(); const [tab,setTab]=useState('deals'),[query,setQuery]=useState(''),[form,setForm]=useState<DealForm|null>(null);
 const [values,setValues]=useState<Record<string,string|boolean>>({});
 const dialogRef=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!form)return;
  const previous=document.activeElement as HTMLElement|null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  dialogRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus();
  return ()=>{document.body.style.overflow=previousOverflow;previous?.focus();};
 },[form]);
 const dialogKeys=(e:React.KeyboardEvent)=>{
  if(e.key==='Escape'&&!state.busy){e.preventDefault();setForm(null);}
  if(e.key!=='Tab')return;
  const controls=dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)');
  if(!controls?.length)return;
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 };
 const open=(f:DealForm)=>{setValues(Object.fromEntries(f.fields.map(field=>[field.key,field.type==='checkbox'?false:field.value??field.options?.[0]?.value??''])));setForm(f);};
 const actions=(forms:DealForm[])=>forms.map(f=><button key={`${f.action}-${f.id}`} disabled={state.busy} onClick={()=>open(f)} className={['pay','accept_quote','confirm_closing'].includes(f.action)?'deal-primary':''}>{f.title}</button>);
 const reservation=new URLSearchParams(window.location.search).get('reservation');
 const filtered=state.deals.filter(d=>`${d.title} ${d.status} ${d.id}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Number(b.reservation_id===reservation)-Number(a.reservation_id===reservation));
 return <div className={`deal-page deal-workspace deal-workspace-${workspace}`}>
  {workspace==='agent'&&<SectionSwitch label="Bookings" items={[{to:'/agent/reservations',label:'Bookings'},{to:'/agent/deals',label:'Deals'}]}/>}
  <header className="deal-heading"><div><p className="deal-eyebrow">{workspace==='admin'?'Administration':workspace==='agent'?'Agent workspace':'My property journey'}</p><h1>{workspace==='admin'?'Requests & deals':workspace==='agent'?'Agency deals':'My property deals'}</h1><p>{workspace==='admin'?'Manage enquiries, assign agencies, and track commission collection.':workspace==='agent'?'Manage your referrals, prepare quotes, and follow each customer through closing.':'Track your property search, review your agency fee, and confirm your next step.'}</p></div><div className="deal-actions"><button onClick={()=>void state.refresh()} disabled={state.loading}>Refresh</button>{(admin||workspace==='customer')&&<button className="deal-primary" onClick={()=>open(requestForm(admin))}>{admin?'Record enquiry':'Request a property'}</button>}{workspace==='agent'&&!state.partners.some(p=>p.owner_id===state.userId)&&<button className="deal-primary" onClick={()=>open(partnerForm)}>Become a partner</button>}</div></header>
  {workspace!=='admin'&&<p className="deal-context-note">Agency commission is payable only after a successful rental or purchase. Viewing fees are separate.</p>}
  <nav className="deal-tabs" aria-label="Property journey sections">{['deals','requests',...(state.partners.length?['partners']:[])].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)} <span>{t==='deals'?state.deals.length:t==='requests'?state.requests.length:state.partners.length}</span></button>)}</nav>
  {state.error&&<p className="deal-error" role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}{state.loading&&(state.deals.length?<p role="status">Loading property journey…</p>:<ListItemSkeleton count={3} lines={3} appearance="card" flush/>)}
  {tab==='deals'&&<><label className="deal-search">Search deals<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Property, status or deal reference"/></label>
   {!state.loading&&!filtered.length&&<section className="deal-card"><h2>{query?'No matching deals':'No deals yet'}</h2><p>{query?'Try another property name, status or reference.':workspace==='admin'?'Record an enquiry or review property requests to get started.':workspace==='agent'?'Your assigned referrals will appear here.':'Request a property or complete a viewing to start your journey.'}</p></section>}
   <div className="deal-grid">{filtered.map(d=><article className="deal-card" key={d.id}>
    <div className="deal-card-top"><span className="deal-status">{statusLabel(d.status)}</span><small>{d.request_id?'Agency referral':'Listed property'}</small></div><h2>{d.title}</h2><small>Deal {d.id.slice(0,8)} · {d.purpose} · {d.interest==='proceed'?'Customer wants to proceed':d.interest==='searching'?'Customer is still searching':'Customer is deciding'}</small>
    <details className="deal-expanded" open={reservation===d.reservation_id || undefined}><summary>View details & actions</summary><div className="deal-expanded-body"><div className="deal-actions" style={{marginTop:12}}>
     {d.property_id&&<button onClick={()=>navigate(`/property/${d.property_id}`)}>View property</button>}
     {workspace==='customer'&&d.agency_accepted_at&&d.customer_id===state.userId&&d.agent_id&&<button onClick={()=>navigate(`/chat/${d.agent_id}`)}>Message agency</button>}
     {workspace==='agent'&&d.agency_accepted_at&&d.agent_id===state.userId&&d.customer_id&&<button onClick={()=>navigate(`/chat/${d.customer_id}`)}>Message customer</button>}
    </div>
    {!!d.requirements&&<p className="deal-multiline">{d.requirements}</p>}{!!d.proposal&&<p className="deal-multiline">{d.proposal}</p>}{!!d.sourcing_agency&&<p>Supplying agency: {d.sourcing_agency}</p>}
    {d.commission_amount!=null&&<div className="deal-invoice"><span>Agency commission · quote {d.quote_version}</span><strong>{money(d.commission_amount)}</strong><p>{d.fee_basis}</p><small>Property amount: {money(d.transaction_amount)}. Rent / purchase funds are separate.</small>{(d.agent_id===state.userId||state.admin)&&<small>Propella share: {(d.platform_bps??0)/100}% of commission</small>}</div>}
    {!!d.closing_note&&<p className="deal-multiline"><b>Closing details:</b> {d.closing_note}</p>}
    {d.paid_at&&<p>Payment verified {new Date(d.paid_at).toLocaleDateString()}. Receipt: <code>{d.id}</code></p>}
    {!d.agency_accepted_at&&<p className="deal-notice">Waiting for an approved partner to accept the referral terms.</p>}
    {state.admin&&<p className={new Date(d.follow_up_at)<new Date()?'deal-notice':''}>Follow-up: {new Date(d.follow_up_at).toLocaleDateString()}</p>}
    <div className="deal-actions">{actions(dealForms(d,state.userId,state.admin,state.partners,workspace))}</div>
    {state.reports.filter(r=>r.deal_id===d.id).map(r=><div className="deal-report" key={r.id}><b>Report · {r.status}</b><p>{r.description}</p>{r.resolution&&<p>Resolution: {r.resolution}</p>}{state.admin&&r.status==='open'&&actions([resolveReport(r)])}</div>)}
    <details><summary>Deal history</summary><ol className="deal-history">{state.events.filter(e=>e.deal_id===d.id).map(e=><li key={e.id}><span>{e.action.replace(/_/g,' ')}</span><small>{new Date(e.created_at).toLocaleString()}</small>{e.action==='quote'&&<p>Commission: {money(Number(e.detail.commission_amount))} · {String(e.detail.fee_basis||'')}</p>}</li>)}</ol></details></div></details>
   </article>)}</div></>}
  {tab==='requests'&&<div className="deal-grid">{!state.requests.length&&<p>No property requests yet.</p>}{state.requests.map(r=><article className="deal-card" key={r.id}><span className="deal-status">{state.deals.some(d=>d.request_id===r.id&&d.status!=='cancelled')?'Assigned · see Deals':'Awaiting assignment'}</span><h2>{r.location} · {r.purpose}</h2><p className="deal-multiline">{r.requirements}</p><p>Budget: {money(r.budget)}</p>{state.admin&&<p>{r.source} · {r.contact_note}</p>}<div className="deal-actions">{state.admin&&actions(requestActions(r,state.partners,state.deals.some(d=>d.request_id===r.id&&d.status!=='cancelled')))}</div></article>)}</div>}
  {tab==='partners'&&<div className="deal-grid">{state.partners.map(p=><article className="deal-card" key={p.id}><span className="deal-status">{p.status}</span><h2>{p.name}</h2><p>{p.regions}</p><p>Propella share for new referrals: {p.platform_bps/100}%</p>{state.admin&&actions([configurePartner(p)])}</article>)}</div>}
  {workspace==='customer'&&state.userId&&<p className="deal-account">Your account ID for linking a Facebook or other enquiry: <code>{state.userId}</code></p>}
  {form&&<div className="deal-overlay"><section ref={dialogRef} onKeyDown={dialogKeys} role="dialog" aria-modal="true" aria-labelledby="deal-form-title" className="deal-dialog"><header><h2 id="deal-form-title">{form.title}</h2><button disabled={state.busy} aria-label="Close form" onClick={()=>setForm(null)}>×</button></header><p>{form.description}</p><form onSubmit={async e=>{e.preventDefault();if(await state.submit(form,values))setForm(null);}}>
   {form.fields.map(f=><label key={f.key} className={f.type==='checkbox'?'deal-checkbox':''}>{f.type==='checkbox'?<><input type="checkbox" checked={values[f.key]===true} required={!f.optional} onChange={e=>setValues({...values,[f.key]:e.target.checked})}/><span>{f.label}</span></>:<><span>{f.label}</span>{f.type==='select'?<select autoFocus={form.fields[0]===f} required={!f.optional} value={String(values[f.key]??'')} onChange={e=>setValues({...values,[f.key]:e.target.value})}>{!f.options?.length&&<option value="">No eligible options</option>}{f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:f.type==='multiline'?<textarea required={!f.optional} maxLength={4000} rows={4} value={String(values[f.key]??'')} onChange={e=>setValues({...values,[f.key]:e.target.value})}/>:<input autoFocus={form.fields[0]===f} required={!f.optional} type={f.type==='number'?'number':'text'} min={f.type==='number'?1:undefined} step={f.type==='number'?1:undefined} value={String(values[f.key]??'')} onChange={e=>setValues({...values,[f.key]:e.target.value})}/>}</>}</label>)}
   {state.error&&<p className="deal-error" role="alert">{state.error}</p>}<footer><button type="button" disabled={state.busy} onClick={()=>setForm(null)}>Cancel</button><button className="deal-primary" disabled={state.busy}>{state.busy?'Saving…':form.action==='pay'?'Request mobile-money payment':'Confirm'}</button></footer>
  </form></section></div>}
 </div>;
}
