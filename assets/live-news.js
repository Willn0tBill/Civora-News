(()=>{"use strict";
const base="https://qyipadinsphoyxotrceo.supabase.co";
const key="sb_publishable_S73dZKZ9ro03lWDbHFzZhw_5t5pDtGt";
const pathname=location.pathname;
const isHome=pathname==="/"||pathname.endsWith("/Civora-News/");
const isLatest=/\/latest\/?$/.test(pathname);
const section=pathname.match(/\/section\/(us|world|technology|business|science|culture)\/?$/);
const desk=pathname.match(/\/(explainers|opinion|reviews|fact-checks)\/?$/);
if(!isHome&&!isLatest&&!section&&!desk)return;
const sectionMap={us:"U.S.",world:"World",technology:"Technology",business:"Business",science:"Science",culture:"Culture"};
const kindMap={explainers:"explainer",opinion:"opinion",reviews:"review","fact-checks":"fact-check"};
const liveOnly=new Set([...document.querySelectorAll('a[href*="/article/"]')].map(a=>{
 try{const match=new URL(a.href).pathname.match(/\/article\/([a-z0-9-]+)\/?$/);return match?.[1]}catch{return null}
}).filter(Boolean));
const url=base+"/rest/v1/civora_articles?select=slug,title,summary,category,kind,author,published_at,status&status=eq.published&order=published_at.desc&limit=80";
fetch(url,{headers:{apikey:key,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(8000)})
.then(async response=>{if(!response.ok)throw Error("Newsroom feed unavailable");return response.json()})
.then(rows=>{
 if(!Array.isArray(rows))return;
 const news=rows.filter(a=>{
  if(!a?.slug||liveOnly.has(a.slug))return false;
  if(section&&a.category!==sectionMap[section[1]])return false;
  if(desk&&a.kind!==kindMap[desk[1]])return false;
  return true;
 }).slice(0,6);
 if(!news.length)return;
 const target=isHome?document.querySelector(".front-edition"):document.querySelector(".page-intro")||document.querySelector(".feed-list")||document.querySelector("main .container >section");
 if(!target)return;
 const container=document.createElement("section");
 container.className="civora-live-updates"+(isHome?" container":"");
 container.setAttribute("aria-label","Newly published stories");
 const header=document.createElement("div");header.className="live-feed-heading";
 const eyebrow=document.createElement("div");eyebrow.textContent="NEW FROM THE NEWSROOM · LIVE EDITION";
 const subtitle=document.createElement("p");subtitle.textContent="Fresh reporting from Civora's publishing desk.";
 header.append(eyebrow,subtitle);
 const cards=document.createElement("div");cards.className="live-feed-grid";
 for(const story of news){
  const card=document.createElement("a");card.className="live-feed-card";
  card.href="/story/?slug="+encodeURIComponent(story.slug);
  const category=document.createElement("small");category.textContent=story.category+" / "+(story.kind||"news").replaceAll("-"," ");
  const title=document.createElement("strong");title.textContent=story.title;
  const description=document.createElement("span");description.textContent=story.summary;
  const bottom=document.createElement("em");bottom.textContent="Read this story ↗";
  card.append(category,title,description,bottom);cards.append(card);
 }
 container.append(header,cards);
 if(isHome)target.before(container);else target.after(container);
})
.catch(()=>{/* Keep the independently generated archive readable on network errors. */});
})();