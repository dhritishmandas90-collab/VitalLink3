/* Server-backed behavior for the existing VitalLink interface. No credentials or bearer tokens are persisted in browser storage. */
(() => {
 'use strict';
 let activeUser=null, recoveryToken=null, busy=new Set();
 const value=id=>entryEl(id)?.value||'';
 async function api(path,body,key) {
  const response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await response.json();
  if(!response.ok){if(response.status===401 && activeUser)clearSession();throw new Error(data.error||'Unable to complete the request.');}return data;
 }
 async function run(key,fn,entry=false){
  if(busy.has(key))return false;busy.add(key);
  try {return await fn();}catch(error){const message=error.name==='TimeoutError'?'Request timed out. Refresh to check whether it was saved before trying again.':error.message;entry?setEntryFeedback(message,true):showToast(message,'critical');return false;}finally{busy.delete(key);}
 }
 function clearSession(){
  activeUser=null;appState.adminLoggedIn=false;appState.citizenLoggedIn=false;appState.currentCitizenDonor=null;hospitalSession=null;hospitalRequests=[];
  appState.registeredUsers=[];appState.totalCitizenCount=0;appState.inventory=[];appState.dispatchedFacilityIds.clear();appState.dispatchStatuses=new Map();GLOBAL_FACILITIES.splice(0);GLOBAL_DONORS.splice(0);
  const h=entryEl('hospitalWorkspace');if(h){h.hidden=true;h.replaceChildren();}
  entryEl('donorsAuditTableBody')?.replaceChildren();entryEl('inventoryGrid')?.replaceChildren();entryEl('fleetRows')?.replaceChildren();
  renderCitizenPortalState();
  showEntryView('login','',true);
 }
 function apply(data,navigate=true){
  activeUser=data.user;appState.registeredUsers=data.citizens;appState.totalCitizenCount=data.citizens.length;
  appState.inventory=data.inventory;appState.inventory.forEach(applyInventoryStatus);
  GLOBAL_FACILITIES.splice(0,GLOBAL_FACILITIES.length,...data.facilities);
  appState.dispatchedFacilityIds=new Set(data.dispatches.map(d=>d.facility_id));
  appState.dispatchStatuses=new Map(data.dispatches.map(d=>[d.facility_id,d.status]));
  hospitalRequests=data.requests;
  appState.adminLoggedIn=['admin','super_admin'].includes(activeUser.role);appState.citizenLoggedIn=activeUser.role==='citizen';
  appState.currentCitizenDonor=null;hospitalSession=null;
  if(activeUser.role==='hospital'){
   hospitalSession=activeUser;if(navigate)showHospitalDashboard();
  }else if(activeUser.role==='citizen'){
   const record=data.citizens.find(u=>u.id===activeUser.id);
   if(!record)throw new Error('Your profile could not be loaded.');
   appState.currentCitizenDonor={userId:record.id,name:record.name,blood:record.blood,scopeId:record.scopeId,sector:record.sector,id:record.donorId,donations:record.unitsDonated,livesSaved:0,xp:0,verified:activeUser.verified,appointments:record.appointments};
   if(navigate)enterCitizenDashboard();renderCitizenPortalState();
  }else if(navigate){switchPortal('admin');}
  document.querySelectorAll('[data-owner-name]').forEach(el=>{el.textContent=activeUser.name;});
  if(entryEl('fleetRows'))entryEl('fleetRows').innerHTML=data.fleet?.length ? data.fleet.map(f=>`<tr><td>${escapeHTML(f.name)}</td><td>${escapeHTML(f.type)}</td><td><span class="status-badge ${f.status==='enroute'?'enroute':'standby'}">${escapeHTML(f.status)}</span><small> ${escapeHTML(new Date(f.updated_at).toLocaleString())}</small></td><td>${f.temperature===null?'—':Number(f.temperature)+'°C'}</td><td>${f.battery===null?'—':Number(f.battery)+'%'}</td></tr>`).join('') : '<tr><td colspan="5">No fleet telemetry has been received.</td></tr>';
  if(entryEl('kpiFacilitiesCount'))entryEl('kpiFacilitiesCount').textContent=data.facilities.length;
  if(entryEl('kpiTransportsCount'))entryEl('kpiTransportsCount').textContent=data.dispatches.filter(d=>d.status==='accepted').length;
  if(entryEl('kpiDeliveryStatus'))entryEl('kpiDeliveryStatus').textContent=data.dispatches.some(d=>d.status==='queued')?'Pending':'Idle';
  if(entryEl('matchAccuracy'))entryEl('matchAccuracy').textContent='Updated '+new Date().toLocaleTimeString();
  renderAdminKPIs();renderDonorsAuditTable();renderInventoryGrid();populateAdminHospitalSelect();populateScheduleOptions();renderContextualEmergencies();renderRegionalStockMatrix();renderFacilityDirectoryList();
  if(typeof filterMapFacilities==='function')filterMapFacilities();
 }
 async function refresh(){apply(await api('session'),false);if(hospitalSession)showHospitalDashboard();}
 // Keep the same idempotency key for an uncertain network outcome, including a retry click.
 const uncertain=new Map();
 async function action(name,data={}){
  const signature=JSON.stringify([activeUser?.id,name,data]);const key=uncertain.get(signature)||crypto.randomUUID();uncertain.set(signature,key);
  const result=await api('action',{action:name,data},key);uncertain.delete(signature);return result;
 }
 const originalShowEntry=showEntryView;
 showEntryView=function(...args){originalShowEntry(...args);entryEl('entryDemoPanel').hidden=true;};
 function recoveryMode(token){
  recoveryToken=token;entryEl('entryTitle').textContent='Choose a new password.';
  entryEl('entrySubtitle').textContent='Use at least 12 characters.';
  entryEl('entryIdentifier').required=false;entryEl('entryIdentifier').hidden=true;
  document.querySelector('label[for="entryIdentifier"]').hidden=true;
  entryEl('entryPassword').autocomplete='new-password';entryEl('entryPassword').minLength=12;
  document.querySelector('#entryLoginForm button[type="submit"]').textContent='Update password';
 }
 function finishRecovery(){
  recoveryToken=null;entryEl('entryIdentifier').required=true;entryEl('entryIdentifier').hidden=false;
  document.querySelector('label[for="entryIdentifier"]').hidden=false;
  entryEl('entryPassword').autocomplete='current-password';entryEl('entryPassword').minLength=0;
  document.querySelector('#entryLoginForm button[type="submit"]').textContent='Sign in →';
 }

 const unavailable=()=>{setEntryFeedback('Demo accounts are disabled. Sign in with your registered account.',true);return false;};
 const toLogin=()=>showEntryView('login');const toRegister=()=>showEntryView('register');
 Object.assign(window,{
  fillEntryDemo:unavailable,quickFillDemoAdmin:unavailable,quickFillDemoUser:unavailable,quickFillCitizen:unavailable,
  submitGateLogin:toLogin,submitUserLogin:toLogin,submitGateRegister:toRegister,submitUserRegister:toRegister,
  persistEntryAccounts:()=>{},restoreEntryAccounts:()=>{},persistHospitals:()=>{},
  requestOwnerSetup:()=>run('owner-setup',async()=>{
   const result=await api('owner-password',{});
   setEntryFeedback(result.message);
  },true),
  requestPasswordReset:()=>run('recover',async()=>{
   const email=value('entryIdentifier');if(!email.includes('@'))throw new Error('Enter your email address above, then select Forgot password.');
   const result=await api('recover',{email});setEntryFeedback(result.message);
  },true),
  submitEntryLogin:()=>run('login',async()=>{
   const password=value('entryPassword');entryEl('entryPassword').value='';
   if(recoveryToken){const result=await api('reset-password',{accessToken:recoveryToken,password});finishRecovery();if(result.session){apply(result.session);return true;}showEntryView('login',result.message);return true;}

   const data=await api('login',{identifier:value('entryIdentifier'),password});apply(data);setEntryFeedback();return true;
  },true),
  submitAdminLogin:()=>run('login',async()=>{
   const password=value('adminPassField');entryEl('adminPassField').value='';
   apply(await api('login',{identifier:value('adminUserField'),password}));closeAdminAuthModal();return true;
  },true),
  submitEntryRegister:()=>run('register',async()=>{
   if(value('entryNewPassword')!==value('entryConfirmPassword'))throw new Error('The passwords do not match.');
   const email=value('entryEmail'),password=value('entryNewPassword');entryEl('entryNewPassword').value='';entryEl('entryConfirmPassword').value='';
   const result=await api('register',{name:value('entryName'),email,phone:value('entryPhone'),blood:value('entryBlood'),scopeId:value('entryRegion'),role:value('entryAccountRole')||'citizen',password});
   entryEl('entryRegisterForm').reset();updateEntryAccountRole();showEntryView('login',result.message);entryEl('entryIdentifier').value=email;return true;
  },true),
  logoutEntry:()=>run('logout',async()=>{await api('logout',{});clearSession();setEntryFeedback('You have signed out.');}),
  initializeEntryFlow:async()=>{
   // Remove old prototype data without importing insecure credential hashes.
   try{sessionStorage.removeItem('vitallink-flow-accounts-v1');sessionStorage.removeItem('vitallink-hospitals-v1');}catch{}
   const select=entryEl('entryRegion');select.replaceChildren();
   Object.entries(GEOGRAPHIC_SCOPES).filter(([id])=>id!=='world').forEach(([id,s])=>{const o=document.createElement('option');o.value=id;o.textContent=s.label||s.name;select.appendChild(o);});select.value='guwahati';
   entryEl('entryNewPassword').minLength=12;
   document.querySelectorAll('[onclick*="quickFill"], [onclick*="fillEntryDemo"]').forEach(e=>{e.hidden=true;});
   const emailLink=new URLSearchParams(location.hash.slice(1));
   clearSession();
   if(emailLink.get('type')==='recovery' && emailLink.get('access_token')){recoveryMode(emailLink.get('access_token'));return;}
   // Email confirmation links can carry Auth tokens. They never become application sessions.
   if(['signup','magiclink','invite'].includes(emailLink.get('type')) && emailLink.get('access_token')){
    try{
     const token=emailLink.get('access_token');
     if((await api('owner-link',{accessToken:token})).owner){recoveryMode(token);return;}
    }catch(error){setEntryFeedback('This email link could not be verified. Request a fresh link.',true);return;}
   }
   if(emailLink.has('error')||emailLink.has('error_code')){
    setEntryFeedback('This email link is invalid or has expired. Open the newest confirmation email. If that also fails, request one new setup link when the cooldown ends.',true);return;
   }
   if(emailLink.has('access_token')){history.replaceState(null,'','#login');setEntryFeedback('Email link processed. Sign in to continue.');}
   try{apply(await api('session'));}catch(e){if(e.message && !/sign in|expired/i.test(e.message))setEntryFeedback(e.message,true);}
  },
  toggleUserVerify:id=>run('verify:'+id,async()=>{const u=appState.registeredUsers.find(x=>x.id===id);if(!u)return;await action('verify',{user_id:id,verified:u.status!=='Verified'});await refresh();showToast('Verification saved.');}),
  deleteUserData:id=>run('delete:'+id,async()=>{if(!confirm('Permanently delete this account, appointments and requests?'))return;await action('delete_user',{user_id:id});await refresh();showToast('Account deleted.');}),
  selfDeleteCitizenData:()=>run('self-delete',async()=>{if(!activeUser||!confirm('Permanently delete your account, appointments and requests?'))return;await action('delete_user',{user_id:activeUser.id});await api('logout',{});clearSession();setEntryFeedback('Your account has been deleted.');}),
  adjustStock:(index,delta)=>run('stock:'+index,async()=>{const item=appState.inventory[index];if(!item)return;await action('inventory_adjust',{blood:item.type,delta});await refresh();}),
  restockAll:()=>run('restock',async()=>{if(!confirm('Confirm that physical stock supports restoring all groups to the 250-unit baseline? This correction will be audited.'))return;await action('restock');await refresh();showToast('Inventory correction saved.');}),
  createHospitalRequest:()=>run('request-create',async()=>{await action('request_create',{blood:value('hospitalBlood'),units:Number(value('hospitalUnits')),note:value('hospitalNote')});await refresh();showToast('Request saved.');}),
  toggleHospitalRequest:id=>run('request:'+id,async()=>{const r=hospitalRequests.find(x=>x.id===id);if(!r)return;await action('request_status',{id,status:r.status==='Open'?'Closed':'Open'});await refresh();}),
  requestHospitalBlood:(ref,blood)=>run('blood-request:'+ref,async()=>{const f=resolveFacility(ref);if(!f)throw new Error('Choose a facility.');await action('request_create',{facility_id:f.id,blood,units:1,note:''});showToast('Blood request saved for coordination. Supply is not yet confirmed.');}),
  bookAppointment:()=>run('appointment',async()=>{await action('appointment',{facility_id:value('schedFacility'),date:value('schedDate')});await refresh();showToast('Donation appointment saved. Confirm availability with the centre.');}),
  dispatchRequest:(ref,blood)=>run('dispatch:'+ref,async()=>{const f=resolveFacility(ref);if(!f)throw new Error('Choose a facility.');await action('dispatch',{facility_id:f.id,blood,units:2});await refresh();focusFacility(f.id);showToast('Dispatch queued. Courier acceptance is pending.');}),
  adminBroadcastSos:()=>run('sos',async()=>{await action('sos',{facility_id:value('sosHospitalSelect'),blood:value('sosBloodGroupSelect'),units:Number(value('sosUnitsInput')),note:value('sosNotes')});showToast('SOS queued for delivery. Delivery is not yet confirmed.');}),
  simulateEmergency:()=>{switchPortal('admin');entryEl('sosHospitalSelect')?.focus();}
 });
 adminLogout=logoutEntry;logoutHospital=logoutEntry;registerHospital=submitEntryRegister;
 // Existing alternate login routes cannot create a local session.
 loginHospital=toLogin;startCitizenSession=toLogin;
 // Keep long-lived tabs honest about expiry, revocation and external updates without interrupting typing.
 window.addEventListener('focus',()=>{if(activeUser)run('refresh',refresh);});
 window.addEventListener('pageshow',e=>{if(e.persisted){clearSession();initializeEntryFlow();}});
})();
