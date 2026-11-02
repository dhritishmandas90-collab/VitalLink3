
class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
function createBackend(env=process.env, fetcher=fetch) {
 const base=env.SUPABASE_URL, key=env.SUPABASE_SERVICE_ROLE_KEY, anon=env.SUPABASE_ANON_KEY;
 if(!base || !key || !anon || !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/.test(base)) throw new Error('Configure HTTPS SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY');
 async function call(path,{method='GET',body,auth=false,accessToken}={}) {
  let response;
  try { response=await fetcher(base+path,{method,headers:{apikey:auth?anon:key,Authorization:`Bearer ${accessToken||(auth?anon:key)}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)}); }
  catch {throw new HttpError(503,'Service temporarily unavailable. Please try again.');}
  const data=await response.json().catch(()=>null);
  if(!response.ok){
   const code=data?.code;
   if(auth && response.status===429){
    const emailRequest=['/auth/v1/otp','/auth/v1/recover','/auth/v1/signup'].includes(path);
    const error=new HttpError(429,emailRequest?'No new email was sent. Supabase has reached its email sending limit.':'Supabase has temporarily limited sign-in attempts. Try again later.');
    const retry=Number(response.headers.get('retry-after'));
    if(Number.isFinite(retry)&&retry>0)error.windowSeconds=Math.ceil(retry);
    throw error;
   }
   if(['PT401','PT403','PT404','PT409','PT422'].includes(code)) throw new HttpError(Number(code.slice(2)),data.message);
   if(code==='23505') throw new HttpError(409,'A matching record already exists. Refresh and check your records.');
   if(['23514','23502','23503','22P02','22007','22008'].includes(code)) throw new HttpError(422,'Invalid data or unavailable related record.');
   throw new HttpError(auth ? (response.status===429?429:400) : 503,auth?'Unable to complete authentication. Check your details and confirm your email.':'Service temporarily unavailable. Please try again.');
  }
  return data;
 }
 return {call,user:(token,method='GET',body)=>call('/auth/v1/user',{auth:true,accessToken:token,method,body}),table:(name,query='',options)=>call(`/rest/v1/vl_${name}${query?'?'+query:''}`,options),rpc:(name,body)=>call(`/rest/v1/rpc/vl_${name}`,{method:'POST',body}),auth:(path,body)=>call(`/auth/v1/${path}`,{method:'POST',body,auth:true})};
}



import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {Buffer} from 'node:buffer';



const OWNER_EMAIL='dhritishmandas90@gmail.com';
const BLOOD=['O-','O+','A-','A+','B-','B+','AB-','AB+'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const digest=value=>createHash('sha256').update(value).digest('hex');
function normalize(value){ const s=String(value||'').trim().toLowerCase();return /^[+\d\s().-]+$/.test(s)?s.replace(/\D/g,''):s; }
function assert(ok,message,status=422){if(!ok)throw new HttpError(status,message);}
function profile(p,appointments=[]) {return {id:p.id,name:p.name,blood:p.blood,scopeId:p.scope_id,sector:p.scope_id,donorId:`VL-${p.id}`,status:p.verified?'Verified':'Pending Check',date:p.created_at?.slice(0,10),unitsDonated:p.units_donated,appointments:appointments.filter(a=>a.owner_id===p.id).map(a=>({facilityId:a.facility_id,date:a.date}))};}
async function body(req) {
 assert((req.headers['content-type']||'').split(';')[0]==='application/json','JSON required',415);
 if(req.body!==undefined){
  let parsed=req.body;
  if(typeof parsed==='string'||Buffer.isBuffer(parsed)){assert(Buffer.byteLength(parsed)<=16384,'Request too large',413);try{parsed=JSON.parse(parsed.toString());}catch{throw new HttpError(400,'Invalid JSON');}}
  assert(parsed && !Array.isArray(parsed)&&typeof parsed==='object','JSON object required');
  assert(Buffer.byteLength(JSON.stringify(parsed))<=16384,'Request too large',413);return parsed;
 }
 let chunks=[],length=0;for await(const chunk of req){length+=chunk.length;assert(length<=16384,'Request too large',413);chunks.push(chunk);}
 try {const result=JSON.parse(Buffer.concat(chunks).toString());assert(result && !Array.isArray(result)&&typeof result==='object','JSON object required');return result;} catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'Invalid JSON');}
}
function createApp({backend,env=process.env,root='',logger=console}) {
 const origin=env.APP_ORIGIN;
 assert(origin && new URL(origin).origin===origin,'APP_ORIGIN must be an exact origin',500);
 const secure=origin.startsWith('https://');
 assert(secure || (env.NODE_ENV!=='production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)),'HTTPS is required in production',500);
 const cookieName=secure?'__Host-vl_session':'vl_session';
 function cookie(res,token='',maxAge=28800){res.setHeader('Set-Cookie',`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`);}
 function token(req){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';}
 async function session(req){
  const t=token(req);assert(/^[a-f0-9]{64}$/.test(t),'Please sign in.',401);
  const sessions=await backend.table('sessions',`token_hash=eq.${digest(t)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=user_id`);
  assert(sessions.length===1,'Your session expired. Please sign in.',401);
  const users=await backend.table('profiles',`id=eq.${sessions[0].user_id}&select=*`);
  assert(users.length===1,'Please sign in.',401);return users[0];
 }
 async function rate(category,limit,seconds,subject) {
  const ok=await backend.rpc('rate_limit',{p_key:digest(`${category}:${subject}`),p_limit:limit,p_seconds:seconds});
  if(!ok){
   const error=new HttpError(429,'Too many attempts for this account. Please try again later.');
   error.windowSeconds=seconds;
   throw error;
  }
 }
 async function all(name,query) {
  const rows=[];for(let offset=0;offset<10000;offset+=500){const batch=await backend.table(name,`${query}&limit=500&offset=${offset}`);rows.push(...batch);if(batch.length<500)return rows;}
  throw new HttpError(503,'Record limit reached. Configure pagination before expanding this deployment.');
 }
 async function snapshot(user){
  const admin=['admin','super_admin'].includes(user.role);
  const [profiles,appointments,inventory,facilities,requests,dispatches,fleet]=await Promise.all([
   admin?all('profiles','role=eq.citizen&select=*&order=created_at.desc,id'):[user],
   user.role==='citizen'?all('appointments',`owner_id=eq.${user.id}&select=*&order=id`):[],
   all('inventory','select=*&order=blood'),all('facilities','active=eq.true&select=data&order=id'),
   all('requests',`${admin?'':`owner_id=eq.${user.id}&`}select=*&order=id.desc`),
   admin?all('dispatches','status=in.(queued,accepted)&select=*&order=id'):[],
   admin?all('fleet','select=*&order=id'):[]
  ]);
  return {user:{id:user.id,name:user.name,email:user.email,role:user.role,verified:user.verified},citizens:profiles.filter(p=>p.role==='citizen').map(p=>profile(p,appointments)),inventory:inventory.map(i=>({type:i.blood,count:i.units})),facilities:facilities.map(f=>f.data),requests:requests.map(r=>({...r,hospital:user.name})),dispatches,fleet};
 }
 async function startSession(req,res,account){
    const state=await snapshot(account);
    const t=randomBytes(32).toString('hex');
    await backend.table('sessions','',{method:'POST',body:{token_hash:digest(t),user_id:account.id,expires_at:new Date(Date.now()+28800000).toISOString()}});
    if(token(req))await backend.table('sessions',`token_hash=eq.${digest(token(req))}`,{method:'DELETE'});
    cookie(res,t);return state;
 }
 async function requestOwnerEmail(){
  const key=digest('owner-email:designated-owner:2min');
  const allowed=await backend.rpc('rate_limit',{p_key:key,p_limit:1,p_seconds:120});
  if(!allowed){
   const [limit]=await backend.table('rate_limits',`key=eq.${key}&select=reset_at`);
   const remaining=Math.max(1,Math.ceil((Date.parse(limit.reset_at)-Date.now())/1000));
   const error=new HttpError(429,`No new email was sent. VitalLink will allow another request in ${Math.ceil(remaining/60)} min. Supabase may still be limiting email delivery then.`);
   error.windowSeconds=remaining;
   throw error;
  }
  await backend.auth('otp',{email:OWNER_EMAIL,create_user:false});
  return {message:'Open the newest confirmation email to choose your password. Requesting another link can invalidate this one.'};
 }
 return async function handler(req,res){
  const requestId=randomUUID();res.setHeader('X-Request-ID',requestId);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Cache-Control','no-store');
  if(secure)res.setHeader('Strict-Transport-Security','max-age=31536000');
  // Existing inline event handlers are preserved. No eval, arbitrary connect origins or framing.
  res.setHeader('Content-Security-Policy',"default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://tile.openstreetmap.org https://server.arcgisonline.com; connect-src 'self' https://tile.openstreetmap.org https://server.arcgisonline.com https://demotiles.maplibre.org; worker-src 'self' blob:");
  function json(data,status=200){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
  try {
   const url=new URL(req.url,origin),route=url.pathname;
   if(route==='/healthz' && req.method==='GET')return json({status:'ok'});
   if(route==='/readyz' && req.method==='GET'){await backend.table('settings','key=eq.registration_enabled&select=key');return json({status:'ready'});}
   assert(route.startsWith('/api/'),'Not found',404);
   assert(['GET','POST'].includes(req.method),'Method not allowed',405);
   if(req.method==='POST')assert(req.headers.origin===origin && req.headers['sec-fetch-site']!=='cross-site','Request origin rejected',403);
   if(route==='/api/session' && req.method==='GET')return json(await snapshot(await session(req)));
   if(route==='/api/audit' && req.method==='GET'){const u=await session(req);assert(u.role==='super_admin','Super Admin required',403);return json(await backend.table('audit','select=*&order=id.desc&limit=200'));}
   assert(req.method==='POST','Not found',404);
   const data=await body(req);
   if(route==='/api/login'){
    assert(typeof data.identifier==='string' && data.identifier.length<=254 && typeof data.password==='string' && data.password.length<=128,'Invalid sign-in details');
    const identifier=normalize(data.identifier);assert(identifier,'Enter your account details.');
    const matches=await backend.table('identifiers',`identifier=eq.${encodeURIComponent(identifier)}&select=user_id`);
    await rate('login-account',10,900,matches.length===1?matches[0].user_id:identifier);
    // Always call the password endpoint, including unknown identifiers, to avoid a fast account oracle.
    const users=matches.length===1?await backend.table('profiles',`id=eq.${matches[0].user_id}&select=*`):[];
    let auth;try{auth=await backend.auth('token?grant_type=password',{email:users[0]?.email||'nonexistent@invalid.example',password:data.password});}catch(e){if(e.status===503||e.status===429)throw e;throw new HttpError(401,'Incorrect details or unconfirmed email.');}
    assert(users.length===1 && auth?.user?.id===users[0].id && auth.user.email_confirmed_at,'Incorrect details or unconfirmed email.',401);
    return json(await startSession(req,res,users[0]));
   }
   if(route==='/api/register'){
    assert(typeof data.email==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && data.email.length<=254,'Enter a valid email.');
    assert(typeof data.password==='string' && data.password.length>=12 && Buffer.byteLength(data.password)<=72,'Use at least 12 characters and no more than 72 bytes.');
    assert(typeof data.name==='string' && data.name.trim().length>=1 && data.name.trim().length<=80,'Enter a name up to 80 characters.');
    assert(['citizen','hospital'].includes(data.role),'Invalid account type.');
    assert(typeof data.phone==='string' && /^[0-9]{7,15}$/.test(normalize(data.phone)),'Enter a phone number including country code.');
    assert(typeof data.scopeId==='string' && /^[a-z0-9_-]{1,40}$/.test(data.scopeId),'Choose a region.');
    assert(data.role==='hospital'||BLOOD.includes(data.blood),'Choose a blood group.');
    await rate('register',5,3600,data.email.trim().toLowerCase());
    await backend.auth('signup',{email:data.email.trim().toLowerCase(),password:data.password,data:{name:data.name.trim(),phone:normalize(data.phone),blood:data.blood,scope_id:data.scopeId,account_type:data.role}});
    return json({message:'Check your email to confirm your account, then sign in.'},202);
   }
   if(route==='/api/owner-prepare'){
    const lookup='email=eq.'+encodeURIComponent(OWNER_EMAIL)+'&select=id';
    if(!(await backend.table('profiles',lookup)).length){
     await rate('owner-provision',5,3600,'designated-owner');
     const [reservation]=await backend.table('settings','key=eq.owner_uuid&select=value');
     assert(reservation&&uuid.test(reservation.value),'Owner setup is unavailable.',503);
     try {
      await backend.call('/auth/v1/admin/users',{method:'POST',body:{
       id:reservation.value,email:OWNER_EMAIL,password:randomBytes(32).toString('hex'),email_confirm:false,
       app_metadata:{vitallink_owner:true}
      }});
     } catch(error){if(!(await backend.table('profiles',lookup)).length)throw error;}
    }
    return json({ready:true});
   }
   if(route==='/api/owner-password'){
    return json(await requestOwnerEmail(),202);
   }
   if(route==='/api/owner-link'){
    assert(typeof data.accessToken==='string'&&data.accessToken.length<=8000,'Invalid email link.');
    const u=await backend.user(data.accessToken);
    return json({owner:u?.email?.toLowerCase()===OWNER_EMAIL && u.app_metadata?.vitallink_owner===true && !!u.email_confirmed_at});
   }
   if(route==='/api/recover'){
    assert(typeof data.email==='string'&&data.email.length<=254,'Invalid email.');
    const email=data.email.trim().toLowerCase();
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Invalid email.');
    if(email===OWNER_EMAIL)return json(await requestOwnerEmail(),202);
    await rate('recover',5,3600,email);
    await backend.auth('recover',{email});return json({message:'If the account exists, recovery instructions have been sent.'},202);
   }
   if(route==='/api/reset-password'){
    assert(typeof data.accessToken==='string' && data.accessToken.length<=8000,'Invalid recovery link.');
    assert(typeof data.password==='string' && data.password.length>=12 && Buffer.byteLength(data.password)<=72,'Use at least 12 characters and no more than 72 bytes.');
    const user=await backend.user(data.accessToken);
    assert(user?.id,'Invalid recovery link.',401);
    await rate('reset',5,900,user.id);
    await backend.user(data.accessToken,'PUT',{password:data.password});
    await backend.table('sessions',`user_id=eq.${user.id}`,{method:'DELETE'});
    if(user.email?.toLowerCase()===OWNER_EMAIL && user.app_metadata?.vitallink_owner===true && user.email_confirmed_at){
     const role=async()=>(await backend.table('profiles',`id=eq.${user.id}&select=role`))[0]?.role;
     if(await role()!=='super_admin'){
      try{await backend.rpc('bootstrap_owner',{p_user:user.id});}
      catch(error){if(await role()!=='super_admin')throw error;}
     }
     const [owner]=await backend.table('profiles',`id=eq.${user.id}&select=*`);
     assert(owner?.role==='super_admin','Administrator activation is incomplete.',503);
     return json({session:await startSession(req,res,owner)});
    }
    cookie(res,'',0);return json({message:'Password saved. Sign in with your username or email.'});
   }
   if(route==='/api/logout'){
    const t=token(req);if(t)await backend.table('sessions',`token_hash=eq.${digest(t)}`,{method:'DELETE'});cookie(res,'',0);return json({ok:true});
   }
   if(route==='/api/action'){
    const u=await session(req);await rate('action',120,60,u.id);
    assert(uuid.test(req.headers['idempotency-key']||''),'An Idempotency-Key UUID is required.');
    assert(typeof data.action==='string' && data.data && typeof data.data==='object'&&!Array.isArray(data.data),'Invalid action.');
    const d=data.data;
    if(d.force)assert(u.role==='super_admin' && typeof d.reason==='string' && d.reason.trim().length>=5,'Owner override requires a reason.',403);
    // SQL independently enforces every role and ownership rule.
    const result=await backend.rpc('action',{p_actor:u.id,p_action:data.action,p_data:d,p_key:req.headers['idempotency-key']});
    return json(result);
   }
   throw new HttpError(404,'Not found');
  }catch(e){
   const status=e instanceof HttpError?e.status:500;
   if(status>=500)logger.error(JSON.stringify({requestId,status,event:'request_failed'}));
   if(status===429 && e.windowSeconds)res.setHeader('Retry-After',String(e.windowSeconds));
   json({error:status===500?'Unexpected error. Please try again.':e.message,requestId},status);
  }
 };
}



export default {
 async fetch(request, bindings) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/') && !['/healthz', '/readyz'].includes(url.pathname)) {
   return bindings.ASSETS.fetch(request);
  }
  const env = { ...bindings, NODE_ENV: 'production' };
  let app;
  try {
   app = createApp({ backend: createBackend(env), env });
  } catch {
   return Response.json({ error: 'Configure APP_ORIGIN and the Supabase keys in Worker settings.' }, { status: 503 });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.body || []) {
   size += chunk.byteLength;
   if (size > 16384) return Response.json({ error: 'Request too large' }, { status: 413 });
   chunks.push(chunk);
  }
  const headers = new Headers();
  let status = 200;
  let payload;
  await app({
   url: url.pathname + url.search, method: request.method,
   headers: Object.fromEntries(request.headers),
   body: Buffer.concat(chunks).toString('utf8'), socket: {}
  }, {
   setHeader(name, value) { headers.set(name, value); },
   set statusCode(value) { status = value; },
   end(value) { payload = value; }
  });
  return new Response(request.method === 'HEAD' ? null : payload, { status, headers });
 }
};
