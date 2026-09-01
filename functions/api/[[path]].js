const encoder = new TextEncoder();
const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const cookies = request => Object.fromEntries((request.headers.get('Cookie')||'').split(';').filter(Boolean).map(x=>x.trim().split(/=(.*)/s).slice(0,2)));
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const timingSafeEqual = (a,b) => { if(a.length!==b.length)return false;let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0; };
async function hmac(value,secret){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return base64url(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));}
async function sessionValid(request,env){const token=cookies(request).esd_admin;if(!token||!env.SESSION_SECRET)return false;const [expires,signature]=token.split('.');if(!expires||!signature||Number(expires)<Date.now())return false;return timingSafeEqual(signature,await hmac(expires,env.SESSION_SECRET));}
async function defaultContent(env){if(env.SITE_CONTENT){const saved=await env.SITE_CONTENT.get('content','json');if(saved)return saved;}return null;}
async function fallbackContent(request){const url=new URL('/assets/content.json',request.url);return fetch(new Request(url,request)).then(r=>r.json());}
function validContent(data){return data&&typeof data==='object'&&data.site&&data.home&&data.menu&&Array.isArray(data.menu.categories)&&data.sections;}

export async function onRequest(context){
  const {request,env,params}=context; const path=Array.isArray(params.path)?params.path.join('/'):params.path;
  if(path==='login'&&request.method==='POST'){
    if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return json({error:'Admin environment variables are not configured.'},503);
    const body=await request.json().catch(()=>({}));if(!timingSafeEqual(String(body.password||''),String(env.ADMIN_PASSWORD)))return json({error:'Invalid password'},401);
    const expires=String(Date.now()+1000*60*60*12);const token=`${expires}.${await hmac(expires,env.SESSION_SECRET)}`;
    return json({ok:true},200,{'Set-Cookie':`esd_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`});
  }
  if(path==='logout'&&request.method==='POST')return json({ok:true},200,{'Set-Cookie':'esd_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
  if(path==='content'&&request.method==='GET'){
    const stored=await defaultContent(env);return json(stored||await fallbackContent(request),200,{'Cache-Control':'public, max-age=30'});
  }
  if(path==='content'&&request.method==='PUT'){
    if(!await sessionValid(request,env))return json({error:'Please sign in again.'},401);
    if(!env.SITE_CONTENT)return json({error:'Content storage is not configured.'},503);
    const data=await request.json().catch(()=>null);if(!validContent(data))return json({error:'The content data is incomplete.'},400);
    data.meta={...(data.meta||{}),updatedAt:new Date().toISOString()};await env.SITE_CONTENT.put('content',JSON.stringify(data));return json(data);
  }
  return json({error:'Not found'},404);
}
