const KEY='propella.pending-client-invitation';
export function rememberClientInvitation(token:string) {
 if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Invalid invitation link.');
 localStorage.setItem(KEY,JSON.stringify({token,expires:Date.now()+7*86400000}));
}
export function pendingClientInvitation():string|null {
 try {const item=JSON.parse(localStorage.getItem(KEY)||'null');if(item?.expires>Date.now()&&/^[a-f0-9]{64}$/.test(item.token))return item.token;}catch{}
 return null;
}
export function clearClientInvitation(){localStorage.removeItem(KEY);}
