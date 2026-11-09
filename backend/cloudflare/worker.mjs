import {generateSite} from "../../studio/generator.mjs";
const REPO="https://api.github.com/repos/Willn0tBill/Civora-News";
const KEYS="https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const enc=new TextEncoder(),dec=new TextDecoder();
const bad=(code,message)=>new Response(JSON.stringify({error:message}),{status:code,headers:{"content-type":"application/json"}});
function bytes(str){const b=str.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(b+"=".repeat((4-b.length%4)%4)),ch=>ch.charCodeAt(0));}
function pemBytes(s){return Uint8Array.from(atob(s.replace(/-----(BEGIN|END) CERTIFICATE-----/g,"").replace(/\s/g,"")),x=>x.charCodeAt(0));}
let keyCache={until:0,keys:{}};
async function verify(token,project){
 const parts=token.split(".");if(parts.length!==3)throw Error("Bad token");
 const h=JSON.parse(dec.decode(bytes(parts[0]))),p=JSON.parse(dec.decode(bytes(parts[1]))),now=Math.floor(Date.now()/1000);
 if(h.alg!=="RS256"||!h.kid||p.aud!==project||p.iss!=="https://securetoken.google.com/"+project||!p.sub||typeof p.exp!=="number"||p.exp<=now||p.iat>now+30||p.auth_time>now+30||p.email_verified!==true)throw Error("Invalid identity");
 if(Date.now()>keyCache.until){const r=await fetch(KEYS);if(!r.ok)throw Error("Unable to verify identity");const max=Number(r.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1]||300);keyCache={until:Date.now()+Math.min(3600,max)*1000,keys:await r.json()};}
 if(!keyCache.keys[h.kid])throw Error("Untrusted signing key");
 const pub=await crypto.subtle.importKey("spki",pemBytes(keyCache.keys[h.kid]),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",pub,bytes(parts[2]),enc.encode(parts[0]+"."+parts[1])))throw Error("Bad signature");
 return {uid:p.sub,email:p.email};
}
async function gh(env,path,method="GET",body){
 const r=await fetch(REPO+path,{method,headers:{"Authorization":"Bearer "+env.GITHUB_TOKEN,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"Civora-Publisher",...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw Error("GitHub returned "+r.status);return r.json();
}
async function library(env){
 const x=await gh(env,"/contents/content/articles.json?ref=main");
 const raw=atob(x.content.replace(/\s+/g,""));
 const doc=JSON.parse(dec.decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
 if(doc.schemaVersion!==1||!Array.isArray(doc.articles))throw Error("Invalid article library");
 return {doc,sha:x.sha};
}
function validate(articles){
 if(!Array.isArray(articles)||articles.length>250)throw Error("Invalid library size");
 const seen=new Set(),validSections=new Set(["U.S.","World","Technology","Business","Science","Culture"]),validVisual=new Set(["us","world","tech","business","science","culture"]);
 for(const a of articles){
  if(!a||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(a.id||"")||seen.has(a.id))throw Error("Duplicate or invalid slug");seen.add(a.id);
  if(!["published","sample"].includes(a.status)||!validSections.has(a.cat)||!validVisual.has(a.visual))throw Error("Invalid section or status");
  for(const k of ["title","summary","art","author"])if(typeof a[k]!=="string"||!a[k].trim()||a[k].length>1500)throw Error("Missing or oversized "+k);
  if(!Array.isArray(a.body)||!a.body.length||a.body.length>250||a.body.some(p=>typeof p!=="string"||!p.trim()||p.length>20000))throw Error("Invalid article paragraphs");
  if(!Array.isArray(a.sources)||a.sources.length>100||a.sources.some(s=>typeof s!=="string"||s.length>1500||!/^[^:]+: https:\/\/\S+$/.test(s)))throw Error("Invalid references");
  if(a.status==="published"&&(!/^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt||"")||!Number.isFinite(Date.parse(a.publishedAt))||!a.sources.length))throw Error("Published stories require a date and sources");
 }
}
async function publish(env,articles,expectedSha){
 const current=await library(env);if(current.sha!==expectedSha)throw Error("Another editor changed the library. Refresh first.");
 validate(articles);
 const doc={...current.doc,articles};
 const files=generateSite(articles);
 const changes=[{path:"content/articles.json",mode:"100644",type:"blob",content:JSON.stringify(doc,null,2)+"\n"},...Object.entries(files).map(([path,content])=>({path,mode:"100644",type:"blob",content}))];
 for(const a of current.doc.articles){const path="article/"+a.id+"/index.html";if(!files[path]&&a.status!=="draft")changes.push({path,mode:"100644",type:"blob",sha:null});}
 const head=(await gh(env,"/git/ref/heads/main")).object.sha;
 const base=(await gh(env,"/git/commits/"+head)).tree.sha;
 const tree=await gh(env,"/git/trees","POST",{base_tree:base,tree:changes});
 const commit=await gh(env,"/git/commits","POST",{message:"publish: update Civora articles",tree:tree.sha,parents:[head]});
 await gh(env,"/git/refs/heads/main","PATCH",{sha:commit.sha,force:false});
 return {commit:commit.sha};
}
export default {async fetch(req,env){
 const origin=req.headers.get("origin"),allowed=env.ALLOWED_ORIGIN||"https://willn0tbill.github.io";
 if(origin!==allowed)return bad(403,"Untrusted origin");
 const cors={ "Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Authorization,Content-Type","Vary":"Origin","Cache-Control":"no-store"};
 const respond=r=>{const h=new Headers(r.headers);for(const [k,v] of Object.entries(cors))h.set(k,v);return new Response(r.body,{status:r.status,headers:h});};
 if(req.method==="OPTIONS")return respond(new Response(null,{status:204}));
 if(req.method!=="POST")return respond(bad(405,"POST only"));
 if(!env.GITHUB_TOKEN||!env.STAFF_UIDS||!env.FIREBASE_PROJECT_ID)return respond(bad(503,"Backend not configured"));
 const bearer=req.headers.get("authorization")||"";if(!bearer.startsWith("Bearer "))return respond(bad(401,"Sign in"));
 let user;try{user=await verify(bearer.slice(7),env.FIREBASE_PROJECT_ID)}catch{return respond(bad(401,"Invalid or expired login"));}
 if(!env.STAFF_UIDS.split(",").map(s=>s.trim()).includes(user.uid))return respond(bad(403,"Not a Civora editor"));
 let body;try{const raw=await req.text();if(raw.length>750000)throw Error("Too large");body=JSON.parse(raw)}catch{return respond(bad(400,"Invalid request"));}
 try{
  if(body.action==="load"){const x=await library(env);return respond(Response.json({...x,user:{email:user.email}}));}
  if(body.action==="publish"){if(typeof body.expectedSha!=="string")return respond(bad(400,"Missing expected version"));return respond(Response.json(await publish(env,body.articles,body.expectedSha)));}
  return respond(bad(400,"Unknown action"));
 }catch(e){return respond(bad(/changed/.test(e.message)?409:400,e.message))}
}};
