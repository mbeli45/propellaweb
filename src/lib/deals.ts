import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// The generated database snapshot predates the deal migration. Keep new schema access here.
export const dealDb = supabase as unknown as SupabaseClient;
export interface Deal {
  id: string; customer_id: string | null; agent_id: string | null; partner_id: string | null;
  reservation_id: string | null; property_id: string | null; request_id: string | null; title: string; requirements: string;
  purpose: string; status: string; interest: string; platform_bps: number | null;
  agency_accepted_at: string | null; proposal: string; sourcing_agency: string;
  transaction_amount: number | null; commission_amount: number | null; fee_basis: string;
  quote_version: number; accepted_version: number | null; closing_note: string;
  customer_closed_at: string | null; platform_amount: number | null; agent_amount: number | null;
  paid_at: string | null; provider_fee: number; follow_up_at: string; updated_at: string;
}
export interface Partner { id: string; owner_id: string | null; name: string; regions: string; status: string; platform_bps: number }
export interface PropertyRequest { id: string; customer_id: string | null; source: string; location: string; requirements: string; purpose: string; budget: number; contact_note: string; consent_at: string | null }
export interface DealEvent { id: string; deal_id: string; action: string; detail: Record<string, unknown>; created_at: string }
export interface DealReport { id: string; deal_id: string; description: string; status: string; resolution: string | null }
export interface Field { key: string; label: string; type?: 'number' | 'multiline' | 'checkbox' | 'select'; options?: { value: string; label: string }[]; optional?: boolean; value?: string }
export interface DealForm { action: string; id?: string; title: string; description?: string; fields: Field[]; data?: Record<string, unknown> }
export const money = (value: number | null) => value == null ? 'Not quoted' : `${Number(value).toLocaleString()} XAF`;
export const statusLabel = (status: string) => ({searching:'Finding a property',proposed:'Property proposed',quoted:'Review commission quote',accepted:'Quote accepted',closing:'Confirm rental or purchase',payment_pending:'Payment awaiting verification',paid:'Commission paid · awaiting settlement',settled:'Agency balance credited',cancelled:'Closed without a deal'}[status] || status);
export const requestForm = (admin = false): DealForm => ({action:'request',title:admin ? 'Record a property enquiry' : 'Request a property',description:'Tell us what you need. Propella will review your request and find a suitable partner. A request does not create a commission charge.', fields:[
  {key:'location',label:'Preferred town / neighbourhood'}, {key:'purpose',label:'Looking to',type:'select',options:[{value:'rent',label:'Rent'},{value:'buy',label:'Buy'}]},
  {key:'budget',label:'Maximum property budget (XAF)',type:'number'}, {key:'requirements',label:'Property type, bedrooms, moving date and other requirements',type:'multiline'},
  ...(admin ? [{key:'source',label:'Enquiry source',type:'select' as const,options:['facebook','referral','other','app'].map(value=>({value,label:value}))},{key:'customer_id',label:'Customer account ID (optional until linked)',optional:true},{key:'contact_note',label:'Private contact / follow-up notes',type:'multiline' as const,optional:true}] : []),
  {key:'consent',label:admin ? 'The customer agreed to share their requirements with a partner agency' : 'I agree to share my requirements with a partner agency',type:'checkbox'}]});
export const partnerForm: DealForm = {action:'register_partner',title:'Apply as an agency partner',description:'Propella reviews applications before enabling referrals. Your commission is set per deal and payable only on a successful rental or purchase.',fields:[{key:'name',label:'Agency / professional name'},{key:'regions',label:'Areas you serve'}]};
export function requestActions(r: PropertyRequest, partners: Partner[], assigned: boolean): DealForm[] {
 const forms: DealForm[]=[];
 if(!r.customer_id) forms.push({action:'link_customer',id:r.id,title:'Link customer account',description:'Ask the customer to sign in and share their account ID from My Deals. Check their identity and consent before linking.',fields:[{key:'customer_id',label:'Customer account ID'},{key:'consent',label:'Customer identity and sharing consent confirmed',type:'checkbox'}]});
 if(!assigned && r.consent_at) forms.push({action:'assign',id:r.id,title:'Assign agency',fields:[{key:'partner_id',label:'Approved partner',type:'select',options:partners.filter(p=>p.status==='active' && p.owner_id).map(p=>({value:p.id,label:`${p.name} · ${p.regions}`}))}]});
 return forms;
}
export const configurePartner = (p: Partner): DealForm => ({action:'configure_partner',id:p.id,title:`Manage ${p.name}`,description:'This rate applies to new referrals. Already accepted deals keep their agreed rate.',fields:[{key:'status',label:'Partner status',type:'select',value:p.status,options:['pending','active','suspended'].map(value=>({value,label:value}))},{key:'platform_bps',label:'Propella share in basis points (1000 = 10%)',type:'number',value:String(p.platform_bps)}]});
export const resolveReport = (r: DealReport): DealForm => ({action:'resolve_report',id:r.deal_id,title:'Resolve report',description:r.description,data:{report_id:r.id},fields:[{key:'resolution',label:'Findings and resolution',type:'multiline'}]});
export function dealForms(d: Deal, userId: string, admin: boolean, partners: Partner[], workspace?: 'admin' | 'agent' | 'customer'): DealForm[] {
 const customer=d.customer_id===userId && (!workspace || workspace==='customer'), agent=d.agent_id===userId && (!workspace || workspace==='agent');
 const forms: DealForm[]=[]; const editable=!['payment_pending','paid','settled','cancelled'].includes(d.status);
 const add=(f: Omit<DealForm,'id'>)=>forms.push({...f,id:d.id});
 if(agent&&editable&&!d.customer_closed_at) add({action:'decline_referral',title:'Unable to serve this request',description:'Propella will be notified so the customer can be reassigned. Use this only when no rental or purchase has completed.',fields:[{key:'reason',label:'Reason and useful handover details',type:'multiline'}]});
 if(agent && editable && !d.agency_accepted_at) {
  const partner=partners.find(p=>p.owner_id===userId && p.status==='active');
  if(partner) add({action:'accept_referral',title:'Accept referral terms',description:`Propella receives ${(d.platform_bps??partner.platform_bps)/100}% of the agency commission earned from this introduction. Collect that commission through Propella only when the customer rents or buys. You remain responsible if another agency supplies the property. No successful transaction means no commission charge.`,fields:[{key:'acknowledge',label:'I accept these referral and collection terms',type:'checkbox'}]});
 }
 if(agent && editable && !d.customer_closed_at && d.agency_accepted_at) {
  add({action:'propose',title:'Propose / change property',description:'Changing the proposal requires a new commission quote and customer acceptance.',fields:[{key:'proposal',label:'Property details, location and viewing arrangements',type:'multiline',value:d.proposal},{key:'sourcing_agency',label:'Supplying agency (if another agency is involved)',optional:true,value:d.sourcing_agency}]});
  add({action:'quote',title:'Set / revise commission quote',description:'Set your fee for a successful transaction. A revision requires fresh customer acceptance. No payment is due for viewing alone.',fields:[{key:'purpose',label:'Transaction',type:'select',value:d.purpose,options:[{value:'rent',label:'Rent'},{value:'buy',label:'Buy'}]},{key:'transaction_amount',label:'Agreed rent / purchase amount (XAF)',type:'number',value:d.transaction_amount?.toString()},{key:'commission_amount',label:'Total agency commission (XAF)',type:'number',value:d.commission_amount?.toString()},{key:'fee_basis',label:'Explain fee calculation, rent period and what it covers',type:'multiline',value:d.fee_basis}]});
  if(d.status==='accepted') add({action:'request_closing',title:'Request closing confirmation',description:'Only request this when the rental or purchase is succeeding and the agreed commission is becoming payable.',fields:[{key:'note',label:'Agreement reference, completion date and closing details',type:'multiline'}]});
 }
 if(customer && editable) {
  if(!d.customer_closed_at) add({action:'interest',title:'Update my decision',fields:[{key:'interest',label:'My decision',type:'select',value:d.interest,options:[{value:'proceed',label:'Proceed with this property'},{value:'deciding',label:'Still deciding'},{value:'searching',label:'Keep searching'}]}]});
  if(d.status==='quoted') add({action:'accept_quote',title:'Accept commission quote',description:`Agency commission: ${money(d.commission_amount)}. ${d.fee_basis}. This becomes payable through Propella only if you rent or buy. Accepting is not a payment.`,data:{version:d.quote_version},fields:[{key:'acknowledge',label:'I agree to this fee and to paying it through Propella on a successful transaction',type:'checkbox'}]});
  if(d.status==='closing' && !d.customer_closed_at) add({action:'confirm_closing',title:'Confirm successful rental / purchase',description:d.closing_note,fields:[{key:'acknowledge',label:'I confirm I have rented or purchased this property and the agreed agency commission is due',type:'checkbox'}]});
  if(d.status==='closing' && d.customer_closed_at) add({action:'pay',title:`Pay commission · ${money(d.commission_amount)}`,description:'This pays the agency commission only. Do not send a separate commission payment to the agency. Check the mobile-money prompt before authorising.',fields:[{key:'phone',label:'Mobile-money number (Cameroon)'},{key:'service',label:'Network',type:'select',options:[{value:'MTN',label:'MTN'},{value:'ORANGE',label:'Orange'}]},{key:'acknowledge',label:'I have not already paid this commission elsewhere',type:'checkbox'}]});
 }
 if((customer||admin) && d.status==='payment_pending') add({action:'check_payment',title:'Check payment status',description:'This checks the existing payment; it does not charge again.',fields:[]});
 if(customer||agent) add({action:'report',title:'Report direct payment / a problem',description:'Describe what happened, including any message, payment reference or evidence link. Propella will review it. Reporting is not an automatic refund.',fields:[{key:'description',label:'Details and evidence',type:'multiline'}]});
 if((customer||admin) && editable && !d.customer_closed_at) add({action:'cancel',title:'Close without a transaction',description:'Use this only if no rental or purchase took place. It does not cancel or refund a viewing.',fields:[{key:'acknowledge',label:'No rental or purchase completed through this deal',type:'checkbox'}]});
 if(admin) {
  add({action:'follow_up',title:'Schedule follow-up',fields:[{key:'date',label:'Follow-up date (YYYY-MM-DD)',value:d.follow_up_at.slice(0,10)},{key:'note',label:'Follow-up note',type:'multiline'}]});
  if(d.status==='paid') add({action:'settle',title:'Release agency balance',description:`Credit ${money(d.agent_amount)} to the agency wallet and ${money(d.platform_amount)} to Propella. Open reports block release. The agency can then use the existing withdrawal process.`,fields:[{key:'acknowledge',label:'I reviewed completion and any reports',type:'checkbox'}]});
 }
 return forms;
}
export async function submitDealForm(form: DealForm, values: Record<string, string | boolean>) {
 for(const f of form.fields) {
  const v=values[f.key];
  if(!f.optional && (f.type==='checkbox' ? v!==true : !String(v??'').trim())) throw new Error(`Required: ${f.label}`);
  if(f.type==='number' && (!Number.isSafeInteger(Number(v)) || Number(v)<(f.key==='platform_bps'?0:1))) throw new Error(`${f.label}: enter a valid whole number`);
 }
 if(form.action==='pay'||form.action==='check_payment') {
  const {data,error}=await dealDb.functions.invoke('deal-payment',{body:{action:form.action==='pay'?'collect':'check',dealId:form.id,...values}});
  if(error) {
   const body=await error.context?.json?.().catch(()=>null);
   throw new Error(body?.error||error.message);
  }
  return data;
 }
 const {data,error}=await dealDb.rpc('deal_command',{p_action:form.action,p_id:form.id??null,p_data:{...values,...form.data}});
 if(error) throw error;
 return data;
}
