import {initializeApp} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut,sendEmailVerification,sendPasswordResetEmail,setPersistence,browserLocalPersistence} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {firebaseConfig,publisherUrl} from "./config.mjs";


const PUBLIC_ROOT="https://willn0tbill.github.io/Civora-News/";
const DRAFT_KEY="civora-studio-local-drafts-v1";
const categories={"U.S.":"us","World":"world","Technology":"tech","Business":"business","Science":"science","Culture":"culture"};
let authClient=null, identity=null, remoteDoc={schemaVersion:1,articles:[]}, remoteSha=null;
let drafts=[], editingId=null, busy=false, currentPanel="overview", lastSync=null;
const $=id=>document.getElementById(id);

function notify(message,error=false){
 const bar=$("toast");bar.textContent=message;bar.classList.toggle("error",error);bar.classList.add("visible");
 clearTimeout(notify.timer);notify.timer=setTimeout(()=>bar.classList.remove("visible"),6500);
}
function busyState(value){
 busy=value;for(const btn of ["connect-btn","publish-story","unpublish-story","delete-story","refresh","save-draft"])if($(btn))$(btn).disabled=value;
}
function localDate(){
 const d=new Date(),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,10);
}
function normalizeSlug(text){return String(text||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function paragraphs(text){return String(text||"").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);}
function lines(text){return String(text||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);}
function readDrafts(){try{const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||"[]");return Array.isArray(d)?d.filter(x=>x&&typeof x.id==="string").slice(0,200):[]}catch{return []}}
function saveDrafts(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts));return true}catch{notify("Browser storage is unavailable. Export your article before closing this tab.",true);return false}}
function applyTheme(){
 let mode="light";try{const s=localStorage.getItem("civora-theme");mode=s==="dark"||s==="light"?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{}
 document.documentElement.dataset.theme=mode;
 const b=$("theme-switch");b.title=mode==="dark"?"Switch to light mode":"Switch to dark mode";b.setAttribute("aria-label",b.title);b.textContent=mode==="dark"?"☀":"◐";
}
$("theme-switch").addEventListener("click",()=>{const d=document.documentElement;d.dataset.theme=d.dataset.theme==="dark"?"light":"dark";try{localStorage.setItem("civora-theme",d.dataset.theme)}catch{}applyTheme()});
applyTheme();

async function backend(action,details={}){
 if(!authClient?.currentUser)throw Error("Please sign in.");
 const idToken=await authClient.currentUser.getIdToken();
 let response;try{response=await fetch(publisherUrl,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+idToken},body:JSON.stringify({action,...details}),cache:"no-store"})}catch{throw Error("Publishing server unreachable. Check your connection and Cloudflare deployment.")}
 let result;try{result=await response.json()}catch{result={}}
 if(!response.ok)throw Error(result.error||"Publishing server error "+response.status);
 return result;
}
async function remoteContent(){
 const data=await backend("load");
 if(data.doc?.schemaVersion!==1||!Array.isArray(data.doc.articles))throw Error("The newsroom returned an invalid library.");
 return {doc:data.doc,sha:data.sha};
}
async function reloadContent(){
 const updated=await remoteContent();
 remoteDoc=updated.doc;remoteSha=updated.sha;lastSync=new Date();renderEverything();
}
async function activate(user){
 identity={email:user.email};await reloadContent();
 $("authenticated").hidden=false;$("connect-screen").hidden=true;$("disconnect").hidden=false;
 $("identity").textContent=user.email||"Staff";
 showPanel("overview");
}
async function connect(event){
 event.preventDefault();if(busy)return;
 if(!authClient){notify("Email login has not been connected to Firebase yet.",true);return}
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||!password){notify("Enter your email and password.",true);return}
 busyState(true);
 try{
  await signInWithEmailAndPassword(authClient,email,password);
  $("password").value="";
  const user=authClient.currentUser;if(!user)throw Error("Login did not return an account.");
  if(!user.emailVerified){await sendEmailVerification(user);await signOut(authClient);throw Error("Check your inbox to verify your email before entering Studio.");}
  await activate(user);notify("Signed in as "+user.email+".");
 }catch(e){notify(e.message||"Sign-in failed.",true)}
 finally{busyState(false)}
}
$("connect-form").addEventListener("submit",connect);
$("disconnect").addEventListener("click",async()=>{
 if(authClient)await signOut(authClient);
 identity=null;remoteDoc={schemaVersion:1,articles:[]};remoteSha=null;
 $("authenticated").hidden=true;$("connect-screen").hidden=false;$("disconnect").hidden=true;
 $("identity").textContent="Not connected";$("password").value="";
 notify("Signed out.");
});
$("reset-password").addEventListener("click",async()=>{
 const email=$("email").value.trim();
 if(!authClient){notify("Email login is not configured.",true);return}
 if(!email){notify("Enter your email address first.",true);return}
 try{await sendPasswordResetEmail(authClient,email);notify("If this address has an account, a password reset email will arrive.")}catch{notify("Unable to request a password reset. Try again later.",true)}
});
if(firebaseConfig.apiKey&&firebaseConfig.projectId&&publisherUrl.startsWith("https://")){
 try{
  authClient=getAuth(initializeApp(firebaseConfig));
  setPersistence(authClient,browserLocalPersistence).catch(()=>{});
  onAuthStateChanged(authClient,async user=>{
   if(user&&!identity){if(!user.emailVerified){notify("Verify your email address before entering Studio.",true);return;}try{await activate(user)}catch(e){notify(e.message||"Unable to load newsroom.",true)}}
   else if(!user){identity=null;$("authenticated").hidden=true;$("connect-screen").hidden=false;$("disconnect").hidden=true;}
  });
 }catch(e){notify("Firebase configuration is invalid.",true);$("setup-status").hidden=false}
}else{
 $("setup-status").hidden=false;
 $("connect-btn").disabled=true;
}
function showPanel(name){
 currentPanel=name;for(const panel of document.querySelectorAll("[data-panel]"))panel.hidden=panel.dataset.panel!==name;
 const headings={overview:"Newsroom overview",stories:"Article library",drafts:"Local drafts",help:"Publishing guide",editor:"Article editor"};
 $("page-heading").textContent=headings[name]||"Newsroom";
 document.querySelectorAll("[data-nav]").forEach(el=>{el.classList.toggle("selected",el.dataset.nav===name);if(el.dataset.nav===name)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current")});
 window.scrollTo({top:0,behavior:"instant"});
 if(name==="stories")renderStories();if(name==="drafts")renderDrafts();
}
for(const btn of document.querySelectorAll("[data-nav]"))btn.addEventListener("click",()=>showPanel(btn.dataset.nav));
for(const id of ["new-story","new-from-list","new-from-drafts"])$(id).addEventListener("click",()=>startEditor());
$("back-editor").addEventListener("click",()=>showPanel("stories"));
$("refresh").addEventListener("click",async()=>{busyState(true);try{await reloadContent();notify("Synced with GitHub.")}catch(e){notify(e.message,true)}finally{busyState(false)}});
$("story-search").addEventListener("input",renderStories);
$("status-filter").addEventListener("change",renderStories);

function storyRow(story,isDraft=false){
 const row=document.createElement("article");row.className="studio-story";
 const info=document.createElement("div"),kicker=document.createElement("span");kicker.className="story-kicker";kicker.textContent=story.cat+" / "+(isDraft?"LOCAL DRAFT":story.status==="published"?"PUBLISHED":"EDITORIAL SAMPLE");
 const headline=document.createElement("h3");headline.textContent=story.title||"Untitled draft";
 const byline=document.createElement("p");byline.textContent=(story.author||"Civora Editorial")+" · "+(isDraft?"Stored on this device":story.publishedAt||"Launch sample");
 info.append(kicker,headline,byline);
 const actions=document.createElement("div");actions.className="story-actions";
 const button=document.createElement("button");button.type="button";button.className="button light";button.textContent="Edit ↗";button.addEventListener("click",()=>startEditor(story,isDraft));actions.appendChild(button);
 if(!isDraft){const view=document.createElement("a");view.href=PUBLIC_ROOT+"article/"+encodeURIComponent(story.id)+"/";view.target="_blank";view.rel="noopener noreferrer";view.className="text-action";view.textContent="View";actions.appendChild(view);}
 row.append(info,actions);return row;
}
function renderList(target,items,msg,isDraft=false){target.replaceChildren();if(!items.length){const t=document.createElement("div");t.className="empty-list";t.textContent=msg;target.append(t)}else for(const a of items)target.append(storyRow(a,isDraft))}
function renderStories(){
 const q=$("story-search").value.toLowerCase().trim(),status=$("status-filter").value;
 const remote=remoteDoc.articles.map(a=>({...a,__local:false}));
 const local=drafts.filter(a=>!remote.some(r=>r.id===a.id)).map(a=>({...a,status:"draft",__local:true}));
 const items=remote.concat(local).filter(a=>(status==="all"||a.status===status)&&[a.title,a.summary,a.cat,a.author].join(" ").toLowerCase().includes(q));
 renderList($("all-stories"),items,"No articles match your search.");
 // Draft records are handled locally even if an old article shares the same ID.
 for(const [i,a] of items.entries()){if(a.__local){const el=$("all-stories").children[i];el.querySelector("button")?.replaceWith((()=>{const b=document.createElement("button");b.className="button light";b.textContent="Edit ↗";b.onclick=()=>startEditor(a,true);return b})())}}
}
function renderDrafts(){renderList($("drafts-list"),drafts,"No local drafts yet. Create one to begin.",true)}
function renderEverything(){
 const posts=remoteDoc.articles;
 $("stat-published").textContent=posts.filter(a=>a.status==="published").length;
 $("stat-samples").textContent=posts.filter(a=>a.status==="sample").length;
 $("stat-drafts").textContent=drafts.length;
 $("stat-sync").textContent=lastSync?.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})||"—";
 renderList($("recent-stories"),posts.slice().reverse().slice(0,6),"Nothing published yet.");
 renderStories();renderDrafts();
}
function clearEditor(){
 editingId=null;$("article-form").reset();$("story-author").value="Civora Editorial";$("story-date").value=localDate();
 $("story-slug").readOnly=false;delete $("story-slug").dataset.edited;$("story-title").value="";$("editor-heading").textContent="Create an article";
 $("unpublish-story").hidden=true;$("delete-story").hidden=true;$("editor-status").textContent="NEW DRAFT";
}
function startEditor(a=null,isDraft=false){
 clearEditor();
 if(a){
  editingId=a.id;
  $("story-title").value=a.title||"";$("story-slug").value=a.id||"";$("story-summary").value=a.summary||"";
  $("story-category").value=a.cat||"U.S.";$("story-author").value=a.author||"Civora Editorial";
  $("story-cover").value=a.art||"";$("story-date").value=a.publishedAt||localDate();
  $("story-body").value=(a.body||[]).join("\n\n");$("story-sources").value=(a.sources||[]).join("\n");
  $("editor-heading").textContent=isDraft?"Edit draft":"Edit article";
  const alreadyLive=remoteDoc.articles.some(p=>p.id===a.id);
  $("story-slug").readOnly=alreadyLive;
  $("unpublish-story").hidden=!alreadyLive;$("delete-story").hidden=false;
  $("editor-status").textContent=alreadyLive?"LIVE IN PUBLICATION":"LOCAL DRAFT";
 }
 $("fact-check").checked=false;
 renderPreview();showPanel("editor");$("story-title").focus();
}
$("story-title").addEventListener("input",()=>{if(!editingId && !$("story-slug").dataset.edited)$("story-slug").value=normalizeSlug($("story-title").value);renderPreview()});
$("story-slug").addEventListener("input",()=>{$("story-slug").dataset.edited="true";renderPreview()});
for(const id of ["story-summary","story-category","story-author","story-cover","story-date","story-body","story-sources"])$(id).addEventListener("input",renderPreview);
function renderPreview(){
 const title=$("story-title").value.trim()||"Your headline will appear here.";
 $("article-preview").querySelector("h2").textContent=title;
 $("article-preview").querySelector(".preview-category").textContent=$("story-category").value;
 $("article-preview").querySelector(".preview-dek").textContent=$("story-summary").value.trim()||"The article summary appears in this space.";
 $("article-preview").querySelector(".preview-meta").textContent=($("story-author").value||"Civora Editorial")+" · DRAFT PREVIEW";
 const body=$("preview-paragraphs");body.replaceChildren();
 for(const line of paragraphs($("story-body").value).slice(0,14)){const p=document.createElement("p");p.textContent=line;body.append(p)}
}
const validSource=s=>/^[^:]+: https:\/\/[^\s]+$/i.test(s);
function articleFromForm(asPublished){
 const fields={id:$("story-slug").value.trim(),title:$("story-title").value.trim(),summary:$("story-summary").value.trim(),cat:$("story-category").value,author:$("story-author").value.trim(),art:$("story-cover").value.trim()||$("story-title").value.trim(),visual:categories[$("story-category").value],body:paragraphs($("story-body").value),sources:lines($("story-sources").value),status:asPublished?"published":"draft",publishedAt:asPublished?$("story-date").value||localDate():null,updatedAt:null};
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fields.id))throw Error("Use a lowercase URL slug containing only letters, numbers and hyphens.");
 if(!fields.title||!fields.summary||!fields.author||!fields.art||!fields.body.length)throw Error("Headline, summary, author and article text are required.");
 if(fields.sources.some(s=>!validSource(s)))throw Error("References must follow: Source name: https://example.com/page");
 if(fields.title.length>190)throw Error("Headline is too long.");
 if(asPublished){
  if(!fields.sources.length)throw Error("Add at least one verifiable source link before publishing.");
  if(!$("fact-check").checked)throw Error("Complete the editorial verification checkbox before publishing.");
  const d=fields.publishedAt;if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error("Enter a valid publication date.");
 }
 return fields;
}
function saveLocal(record,notice=true){
 const i=drafts.findIndex(x=>x.id===record.id);if(i>=0)drafts[i]=record;else drafts.push(record);
 const ok=saveDrafts();renderEverything();if(notice)notify(ok?"Draft saved on this device. It is not public.":"Could not save draft.",!ok);return ok;
}
$("save-draft").addEventListener("click",()=>{
 try{const d=articleFromForm(false);saveLocal(d);editingId=d.id;$("editor-status").textContent="LOCAL DRAFT"}
 catch(e){notify(e.message,true)}
});

async function commitArticles(nextArticles,summary){
 if(busy)throw Error("Another operation is already running.");
 busyState(true);
 try{
  const next=nextArticles.filter(a=>a.status!=="draft");
  const result=await backend("publish",{articles:next,expectedSha:remoteSha});
  await reloadContent();return result.commit;
 }finally{busyState(false)}
}
async function publish(){
 if(busy)return;
 let story;try{story=articleFromForm(true)}catch(e){notify(e.message,true);return}
 if(editingId&&story.id!==editingId){notify("Existing article URLs cannot be changed. Create a new article for a different slug.",true);return}
 if(remoteDoc.articles.some(a=>a.id===story.id && a.id!==editingId)){notify("That URL slug already belongs to another story.",true);return}
 const existing=remoteDoc.articles.find(x=>x.id===story.id);
 if(existing)story={...existing,...story,updatedAt:localDate(),publishedAt:existing.status==="published"?(existing.publishedAt||story.publishedAt):story.publishedAt};
 const doc=remoteDoc.articles.filter(a=>a.id!==story.id).concat([story]);
 try{
  const sha=await commitArticles(doc,"publish: "+story.title);
  drafts=drafts.filter(x=>x.id!==story.id);saveDrafts();renderEverything();
  editingId=story.id;$("editor-status").textContent="PUBLISHED";$("unpublish-story").hidden=false;$("delete-story").hidden=false;
  notify("Article committed! GitHub Pages deployment started. Commit: "+sha.slice(0,8));
  const link=document.createElement("a");link.href=PUBLIC_ROOT+"article/"+encodeURIComponent(story.id)+"/";link.target="_blank";link.rel="noopener noreferrer";link.textContent="Open published article ↗";
  const toast=$("toast");toast.append(" · ",link);
 }catch(e){notify(e.message,true)}
}
$("publish-story").addEventListener("click",publish);
$("unpublish-story").addEventListener("click",async()=>{
 if(busy||!editingId)return;const current=remoteDoc.articles.find(a=>a.id===editingId);if(!current)return;
 if(!confirm("Unpublish '"+current.title+"'? Its article page will be removed from the live site after deployment."))return;
 try{
  const record=articleFromForm(false);saveLocal(record,false);
  const sha=await commitArticles(remoteDoc.articles.filter(a=>a.id!==editingId),"unpublish: "+current.title);
  notify("Unpublished in commit "+sha.slice(0,8)+". Saved an editable local draft.");
  startEditor(record,true);
 }catch(e){notify(e.message,true)}
});
$("delete-story").addEventListener("click",async()=>{
 if(busy||!editingId)return;const original=remoteDoc.articles.find(a=>a.id===editingId);
 if(!confirm("Permanently remove '"+$("story-title").value+"' from "+(original?"the publication and local drafts":"local drafts")+"?"))return;
 try{
  if(original)await commitArticles(remoteDoc.articles.filter(a=>a.id!==editingId),"remove: "+original.title);
  drafts=drafts.filter(x=>x.id!==editingId);saveDrafts();renderEverything();showPanel("stories");notify("Article removed.");
 }catch(e){notify(e.message,true)}
});

drafts=readDrafts();renderPreview();
