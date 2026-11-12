(()=>{
"use strict";
const URL="https://qyipadinsphoyxotrceo.supabase.co";
const PUBLIC_KEY="sb_publishable_S73dZKZ9ro03lWDbHFzZhw_5t5pDtGt";
const $=id=>document.getElementById(id);
const sections={"U.S.":"us","World":"world","Technology":"tech","Business":"business","Science":"science","Culture":"culture"};
const formats=["news","explainer","opinion","review","fact-check"];
const topicsBySection={"U.S.":["Politics & Elections","Government & Policy","Courts & Civil Rights","Communities & Public Services"],"World":["Diplomacy & International Law","Humanitarian & Development","Global Trade & Economy"],"Technology":["Artificial Intelligence","Security & Privacy","Software & Infrastructure","Internet & Platforms"],"Business":["Banking & Consumer Money","Markets & Economy","Small Business & Commerce"],"Science":["Climate & Weather","Space & Astronomy","Earth & Oceans","Health & Research"],"Culture":["Music & Entertainment","Arts & Heritage","Media & Publishing"]};
function refreshTopicChoices(selected=""){const select=document.getElementById("topic"),choices=topicsBySection[document.getElementById("category").value]||[];select.replaceChildren(new Option("Choose a specific topic",""));for(const label of choices)select.add(new Option(label,label));select.value=choices.includes(selected)?selected:"";}

const db=window.supabase?.createClient(URL,PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:"civora-newsroom-auth-v1"}});
let session=null,role=null,articles=[],editing=null,busy=false,dirty=false,loading=false,removedPhoto=false;
const formatDate=v=>v?new Date(v).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}):"Unpublished";
const slugify=text=>String(text||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100);
const paragraphs=text=>String(text||"").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
const lines=text=>String(text||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
function notice(id,message,type=""){const el=$(id);el.textContent=message;el.className="message "+type;}
function busyState(value){busy=value;for(const id of ["loginSubmit","saveDraft","publishArticle","deleteArticle","refreshArticles"]){const btn=$(id);if(btn)btn.disabled=value;}}
function theme(){let t="light";try{t=localStorage.getItem("civora-theme")|| (matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{}document.documentElement.dataset.theme=t==="dark"?"dark":"light";$("themeSwitch").textContent=document.documentElement.dataset.theme==="dark"?"☀":"◐";}
$("themeSwitch").addEventListener("click",()=>{const target=document.documentElement.dataset.theme==="dark"?"light":"dark";try{localStorage.setItem("civora-theme",target)}catch{}theme()});theme();
$("showPassword").addEventListener("click",()=>{const el=$("loginPassword");el.type=el.type==="password"?"text":"password";$("showPassword").textContent=el.type==="password"?"Show":"Hide";});
function loggedOut(message=""){
 session=null;role=null;
 $("loginView").hidden=false;$("adminView").hidden=true;$("logoutBtn").hidden=true;
 if(message)notice("loginMessage",message,"error");
}
async function loadSession(){
 if(!db){loggedOut("Publishing cannot initialize. Reload the page or check the browser's content blockers.");return;}
 const {data,error}=await db.auth.getSession();
 if(error||!data?.session){loggedOut(error?.message||"");return;}
 await authorize(data.session);
}
async function authorize(next){
 if(loading)return;
 loading=true;
 try{
  const current=await db.auth.getUser();
  if(current.error||!current.data?.user)throw Error("Your session expired. Sign in again.");
  const user=current.data.user;
  const {data:staff,error}=await db.from("civora_editors").select("role").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  if(!staff)throw Error("This login isn't approved to publish for Civora. Contact the newsroom owner.");
  session=next;role=staff.role;
  $("editorIdentity").textContent=(role==="owner"?"OWNER":"EDITOR")+" · "+(user.email||"");
  $("loginView").hidden=true;$("adminView").hidden=false;$("logoutBtn").hidden=false;
  notice("loginMessage","");
  resetEditor(true);
  await refresh();
 }catch(e){loggedOut(e.message||"Could not verify newsroom access.");}
 finally{loading=false;}
}
$("loginForm").addEventListener("submit",async event=>{
 event.preventDefault();if(busy||!db)return;
 busyState(true);notice("loginMessage","Signing in…");
 try{
  const {data,error}=await db.auth.signInWithPassword({email:$("loginEmail").value.trim().toLowerCase(),password:$("loginPassword").value});
  if(error)throw error;
  $("loginPassword").value="";
  await authorize(data.session);
 }catch(e){notice("loginMessage",e.message||"Could not sign in.","error");}
 finally{busyState(false);}
});
$("logoutBtn").addEventListener("click",async()=>{
 if(dirty&&!confirm("You have unsaved article changes. Sign out anyway?"))return;
 await db.auth.signOut();dirty=false;loggedOut();
});
db?.auth.onAuthStateChange((event,next)=>{
 if(event==="SIGNED_OUT"){dirty=false;loggedOut();}
 else if(event==="TOKEN_REFRESHED"&&session)session=next;
});
function resetEditor(force=false){
 if(!force&&dirty&&!confirm("Discard unsaved article changes?"))return false;
 editing=null;dirty=false;removedPhoto=false;$("articleForm").reset();
 $("slug").readOnly=false;$("author").value="Civora Research Desk";$("category").value="U.S.";$("kind").value="news";refreshTopicChoices();
 $("editorHeading").textContent="Create an article";$("cancelEdit").hidden=true;$("deleteArticle").hidden=true;
 $("photoPreviewWrap").hidden=true;$("photoPreview").removeAttribute("src");$("previewPanel").hidden=true;
 $("verified").checked=false;notice("articleMessage","");
 return true;
}
$("newArticle").addEventListener("click",()=>{if(resetEditor()){window.scrollTo({top:0,behavior:"smooth"});$("title").focus();}});
$("cancelEdit").addEventListener("click",()=>resetEditor());
$("title").addEventListener("input",()=>{if(!editing)$("slug").value=slugify($("title").value)});
$("articleForm").addEventListener("input",()=>{dirty=true});
$("category").addEventListener("change",()=>{refreshTopicChoices();dirty=true});
function editArticle(article){
 if(!resetEditor())return;
 editing=article;
 $("title").value=article.title;$("slug").value=article.slug;$("slug").readOnly=true;
 $("summary").value=article.summary;$("author").value=article.author;$("category").value=article.category;$("kind").value=article.kind;refreshTopicChoices(article.topic);
 $("body").value=article.body.join("\n\n");$("sources").value=(article.sources||[]).join("\n");
 $("coverText").value=article.cover_text||"";
 $("editorHeading").textContent="Edit article";$("cancelEdit").hidden=false;$("deleteArticle").hidden=false;
 if(article.cover_url){$("photoPreviewWrap").hidden=false;$("photoPreview").src=article.cover_url;}
 window.scrollTo({top:0,behavior:"smooth"});$("title").focus();
}
$("coverFile").addEventListener("change",event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type)||file.size>6*1024*1024){notice("articleMessage","Choose a JPG, PNG, WEBP, or GIF under 6 MB.","error");event.target.value="";return;}
 removedPhoto=false;const reader=new FileReader();reader.onload=()=>{$("photoPreview").src=String(reader.result);$("photoPreviewWrap").hidden=false};reader.readAsDataURL(file);
});
$("removePhoto").addEventListener("click",()=>{removedPhoto=true;$("coverFile").value="";$("photoPreviewWrap").hidden=true;$("photoPreview").removeAttribute("src");dirty=true;});
function readForm(status){
 const title=$("title").value.trim(),slug=$("slug").value.trim().toLowerCase(),summary=$("summary").value.trim();
 const author=$("author").value.trim(),body=paragraphs($("body").value),sources=lines($("sources").value);
 if(!title||!slug||!summary||!author||!body.length)throw Error("Headline, URL, description, author, and article body are required.");
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw Error("Article URL must contain lowercase letters, digits, and hyphens.");
 if(title.length>190||summary.length>1000||author.length>150)throw Error("Some article text exceeds the allowed length.");
 if(sources.some(s=>{const i=s.indexOf(": https://");if(i<1)return true;try{return new URL(s.slice(i+2)).protocol!=="https:"}catch{return true}}))throw Error("Use one source per line in the form: Source name: https://example.org/report");
 if(status==="published"){
  if(!sources.length)throw Error("Add at least one verifiable source link before publishing.");
  if(!$("topic").value)throw Error("Choose a specific topic before publishing.");
  if(!$("verified").checked)throw Error("Confirm the editorial fact and image-rights check before publishing.");
 }
 const cover_text=($("coverText").value.trim()||title.split(/\s+/).slice(0,4).join(" ")).slice(0,60);
 return{slug,title,summary,author,category:$("category").value,topic:$("topic").value||null,kind:formats.includes($("kind").value)?$("kind").value:"news",cover_text,body,sources,status};
}
async function uploadPhoto(file){
 if(!session?.user?.id)throw Error("Sign in before uploading a photo.");
 if(file.size>6*1024*1024||!/^image\/(jpeg|png|webp|gif)$/.test(file.type))throw Error("Unsupported image or file larger than 6 MB.");
 const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"}[file.type];
 const path=session.user.id+"/"+crypto.randomUUID()+"."+ext;
 const {data,error}=await db.storage.from("civora-images").upload(path,file,{contentType:file.type,upsert:false,cacheControl:"3600"});
 if(error)throw Error("Image upload failed: "+error.message);
 return db.storage.from("civora-images").getPublicUrl(data.path).data.publicUrl;
}
async function saveArticle(status){
 if(busy)return;let data;
 try{data=readForm(status)}catch(e){notice("articleMessage",e.message,"error");return}
 const publishedEdit=editing?.status==="published"&&status==="draft";
 if(publishedEdit&&!confirm("Save as draft? This will unpublish the current article after the next website sync."))return;
 busyState(true);notice("articleMessage",status==="draft"?"Saving draft to newsroom…":"Publishing to Civora's database…");
 try{
  const file=$("coverFile").files?.[0];
  const cover_url=file?await uploadPhoto(file):removedPhoto?null:editing?.cover_url||null;
  const payload={...data,cover_url,updated_at:new Date().toISOString(),published_at:status==="published"?(editing?.status==="published"?editing.published_at:new Date().toISOString()):null};
  let result;
  if(editing){
   result=await db.from("civora_articles").update(payload).eq("id",editing.id).select("id").single();
  }else{
   result=await db.from("civora_articles").insert({...payload,author_id:session.user.id}).select("id").single();
  }
  if(result.error)throw result.error;
  dirty=false;resetEditor(true);await refresh();
  notice("articleMessage",status==="draft"?"Draft saved to the newsroom. You can edit it from any device.":"Article saved and published to the database. GitHub Pages will sync automatically; allow several minutes before sharing the URL.","success");
 }catch(e){notice("articleMessage",e.message||"Could not save article.","error");}
 finally{busyState(false);}
}
$("articleForm").addEventListener("submit",e=>{e.preventDefault();saveArticle("published")});
$("saveDraft").addEventListener("click",()=>saveArticle("draft"));
$("deleteArticle").addEventListener("click",async()=>{
 if(!editing||busy)return;
 const item=editing;
 if(!confirm("Delete '"+item.title+"' permanently from Civora's database? The public site will remove it after syncing."))return;
 busyState(true);
 try{
  const {error}=await db.from("civora_articles").delete().eq("id",item.id);
  if(error)throw error;
  dirty=false;resetEditor(true);await refresh();notice("articleMessage","Article deleted from the database. Website removal follows the next sync.","success");
 }catch(e){notice("articleMessage",e.message,"error");}
 finally{busyState(false);}
});
function showPreview(){
 let info;try{info=readForm("draft")}catch(e){notice("articleMessage",e.message,"error");return}
 $("previewHeadline").textContent=info.title;$("previewSummary").textContent=info.summary;
 $("previewMeta").textContent=(info.topic||info.category)+" / "+info.kind.toUpperCase()+" · By "+info.author;
 const container=$("previewBody");container.replaceChildren();for(const text of info.body){const p=document.createElement("p");p.textContent=text;container.append(p)}
 $("previewPanel").hidden=false;$("previewPanel").scrollIntoView({behavior:"smooth",block:"nearest"});
}
$("previewArticle").addEventListener("click",showPreview);
$("closePreview").addEventListener("click",()=>{$("previewPanel").hidden=true});
async function refresh(){
 const {data,error}=await db.from("civora_articles").select("*").order("updated_at",{ascending:false}).limit(500);
 if(error)throw error;articles=data||[];
 $("publishedCount").textContent=articles.filter(a=>a.status==="published").length;
 $("draftCount").textContent=articles.filter(a=>a.status==="draft").length;
 $("totalCount").textContent=articles.length;
 $("lastSync").textContent=new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
 renderList();
}
function renderList(){
 const container=$("articleList");container.replaceChildren();
 const q=$("searchArticles").value.trim().toLowerCase(),status=$("filterStatus").value;
 const selected=articles.filter(a=>(status==="all"||a.status===status)&&[a.title,a.author,a.summary,a.category,a.topic].join(" ").toLowerCase().includes(q));
 if(!selected.length){const p=document.createElement("p");p.className="muted";p.textContent="No articles found.";container.append(p);return}
 for(const article of selected){
  const card=document.createElement("article");card.className="article-row";
  const top=document.createElement("div");top.className="article-row-top";
  const category=document.createElement("small");category.textContent=(article.topic||article.category).toUpperCase()+" / "+article.kind.toUpperCase();
  const status=document.createElement("span");status.className="status-pill "+article.status;status.textContent=article.status;
  top.append(category,status);
  const title=document.createElement("h3");title.textContent=article.title;
  const meta=document.createElement("p");meta.textContent=(article.author||"Civora News")+" · "+formatDate(article.published_at||article.updated_at);
  const actions=document.createElement("div");actions.className="article-row-actions";
  const edit=document.createElement("button");edit.type="button";edit.textContent="Edit story ↗";edit.addEventListener("click",()=>editArticle(article));
  actions.append(edit);
  if(article.status==="published"){
   const link=document.createElement("a");link.href="../article/"+encodeURIComponent(article.slug)+"/";link.target="_blank";link.rel="noopener noreferrer";link.textContent="View article ↗";actions.append(link);
  }
  card.append(top,title,meta,actions);container.append(card);
 }
}
$("searchArticles").addEventListener("input",renderList);
$("filterStatus").addEventListener("change",renderList);
$("refreshArticles").addEventListener("click",async()=>{
 if(busy)return;busyState(true);
 try{await refresh()}catch(e){notice("articleMessage",e.message,"error")}
 finally{busyState(false)}
});
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
loadSession().catch(e=>loggedOut(e.message||"Unable to initialize newsroom."));
})();