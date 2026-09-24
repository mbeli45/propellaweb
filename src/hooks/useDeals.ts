import { useCallback, useEffect, useRef, useState } from 'react';
import { dealDb, Deal, Partner, PropertyRequest, DealEvent, DealReport, DealForm, submitDealForm } from '@/lib/deals';

export function useDeals() {
 const [deals,setDeals]=useState<Deal[]>([]),[partners,setPartners]=useState<Partner[]>([]),[requests,setRequests]=useState<PropertyRequest[]>([]);
 const [events,setEvents]=useState<DealEvent[]>([]),[reports,setReports]=useState<DealReport[]>([]);
 const [userId,setUserId]=useState(''),[role,setRole]=useState(''),[admin,setAdmin]=useState(false);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const lock=useRef(false);
 const refresh=useCallback(async()=>{
  setError(''); setLoading(true);
  try {
   const {data:auth,error:authError}=await dealDb.auth.getUser();
   if(authError||!auth.user) throw new Error('Sign in to view your property deals.');
   setUserId(auth.user.id);
   const results=await Promise.all([
    dealDb.from('profiles').select('role,is_admin').eq('id',auth.user.id).single(),
    dealDb.from('property_deals').select('*').order('updated_at',{ascending:false}),
    dealDb.from('agency_partners').select('*').order('created_at',{ascending:false}),
    dealDb.from('property_requests').select('*').order('created_at',{ascending:false}),
    dealDb.from('deal_events').select('*').order('created_at',{ascending:false}).limit(300),
    dealDb.from('deal_reports').select('*').order('created_at',{ascending:false}),
   ]);
   const failure=results.find(r=>r.error); if(failure?.error) throw failure.error;
   if(!results[0].data)throw new Error('Your profile could not be loaded.');
   setRole(results[0].data.role);setAdmin(!!results[0].data.is_admin);
   setDeals(results[1].data as Deal[]);setPartners(results[2].data as Partner[]);setRequests(results[3].data as PropertyRequest[]);
   setEvents(results[4].data as DealEvent[]);setReports(results[5].data as DealReport[]);
  }catch(e:unknown){setError(e instanceof Error?e.message:(e as {message?:string}).message||'Unable to load deals.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const submit=async(form:DealForm,values:Record<string,string|boolean>)=>{
  if(lock.current)return false;lock.current=true;setBusy(true);setError('');setMessage('');
  try{
   const result=await submitDealForm(form,values);
   await refresh();setMessage(result?.message || 'Saved.');return true;
  }catch(e:unknown){setError(e instanceof Error?e.message:(e as {message?:string}).message||'Unable to save.');return false;}
  finally{lock.current=false;setBusy(false);}
 };
 return {deals,partners,requests,events,reports,userId,role,admin,loading,busy,error,message,refresh,submit};
}
