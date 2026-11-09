(()=>{"use strict";
const root=document.querySelector("#story-root");
const slug=new URLSearchParams(location.search).get("slug");
const key="sb_publishable_S73dZKZ9ro03lWDbHFzZhw_5t5pDtGt";
const url="https://qyipadinsphoyxotrceo.supabase.co/rest/v1/civora_articles?select=slug,title,summary,category,kind,author,cover_url,body,sources,published_at,status&status=eq.published&slug=eq."+encodeURIComponent(slug||"")+"&limit=1";
function error(message){root.replaceChildren();const p=document.createElement("p");p.className="live-story-unavailable";p.textContent=message;root.append(p)}
if(!slug||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){error("This article address is invalid.");return}
fetch(url,{headers:{apikey:key,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(12000)})
.then(async r=>{if(!r.ok)throw Error("The article service is temporarily unavailable.");return r.json()})
.then(rows=>{
 const story=rows?.[0];if(!story||!Array.isArray(story.body))return error("This article isn't published or couldn't be found.");
 document.title=story.title+" | Civora News";
 const heading=document.createElement("h1");heading.className="live-story-title";heading.textContent=story.title;
 const eyebrow=document.createElement("div");eyebrow.className="live-story-eyebrow";eyebrow.textContent=story.category+" / "+(story.kind||"news").toUpperCase().replaceAll("-"," ");
 const summary=document.createElement("p");summary.className="live-story-dek";summary.textContent=story.summary;
 const byline=document.createElement("p");byline.className="live-story-meta";byline.textContent="BY "+story.author+" · "+new Date(story.published_at).toLocaleDateString([],{month:"long",day:"numeric",year:"numeric"});
 const body=document.createElement("div");body.className="live-story-body";
 for(const t of story.body){const p=document.createElement("p");p.textContent=t;body.append(p)}
 const sourceSection=document.createElement("section");sourceSection.className="live-story-sources";
 const sourceTitle=document.createElement("h2");sourceTitle.textContent="Sources & further reading";sourceSection.append(sourceTitle);
 const list=document.createElement("ul");for(const ref of story.sources||[]){
  const i=String(ref).indexOf(": https://");if(i<1)continue;
  const label=ref.slice(0,i),value=ref.slice(i+2);let dest;
  try{dest=new URL(value);if(dest.protocol!=="https:")continue}catch{continue}
  const li=document.createElement("li"),a=document.createElement("a");a.href=dest.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label+" ↗";li.append(a);list.append(li)
 }sourceSection.append(list);
 root.replaceChildren(eyebrow,heading,summary,byline);
 if(story.cover_url&&/^https:\/\//.test(story.cover_url)){
  const photo=document.createElement("img");photo.className="live-story-cover";photo.src=story.cover_url;photo.alt="Cover photograph for "+story.title;photo.loading="lazy";root.append(photo);
 }
 root.append(body,sourceSection);
})
.catch(e=>error(e.message||"Couldn't load this story. Try again."));
})();