(()=>{"use strict";
const SAVED="civora-reading-list-v1";
const RECENT="civora-reading-history-v1";
const memoryFallback={};
function getList(key){
 try{const data=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(data)?data.filter(x=>typeof x==="string").slice(0,80):[];}catch{return memoryFallback[key]||[];}
}
function putList(key,items){
 const next=[...new Set(items.filter(x=>typeof x==="string"))].slice(0,80);
 memoryFallback[key]=next;
 try{localStorage.setItem(key,JSON.stringify(next));}catch{}
 window.dispatchEvent(new CustomEvent("civora:reading-change",{detail:{key}}));
 return next;
}
function isSaved(id){return getList(SAVED).includes(id);}
function toggleSave(id){return putList(SAVED,isSaved(id)?getList(SAVED).filter(x=>x!==id):[id,...getList(SAVED)]).includes(id);}
function recentRead(id){putList(RECENT,[id,...getList(RECENT).filter(x=>x!==id)].slice(0,20));}
function updateSaveButtons(){
 for(const btn of document.querySelectorAll("[data-save-story]")){
  const active=isSaved(btn.dataset.saveStory);
  btn.classList.toggle("is-saved",active);
  btn.setAttribute("aria-pressed",String(active));
  btn.textContent=active?"✓ Saved":"＋ Save for later";
  btn.setAttribute("aria-label",(active?"Remove from":"Add to")+" reading list: "+(btn.dataset.storyTitle||"article"));
 }
 const count=document.querySelector("[data-saved-count]");
 if(count)count.textContent=String(getList(SAVED).length);
}
window.CivoraReading=Object.freeze({getSaved:()=>getList(SAVED),getRecent:()=>getList(RECENT),isSaved,toggleSave,recentRead,refresh:updateSaveButtons});
document.documentElement.classList.add("has-js");
document.addEventListener("click",event=>{
 const save=event.target.closest("[data-save-story]");
 if(save){
  event.preventDefault();toggleSave(save.dataset.saveStory);updateSaveButtons();
  return;
 }
 const shuffle=event.target.closest("[data-surprise]");
 if(shuffle){
  const covers=[...document.querySelectorAll(".flip-card .flip-front")];
  if(covers.length){
   event.preventDefault();
   const index=Math.floor(Math.random()*covers.length);
   location.assign(covers[index].href);
  }
 }
});
window.addEventListener("storage",event=>{if(event.key===SAVED||event.key===RECENT)updateSaveButtons();});
const story=document.querySelector(".article-frame[data-story-id]");
if(story){
 const id=story.dataset.storyId;
 if(id)recentRead(id);
 const focus=document.querySelector("[data-reading-focus]");
 const size=document.querySelector("[data-text-size]");
 if(focus){
  focus.addEventListener("click",()=>{
   const active=document.body.classList.toggle("reading-focus");
   focus.setAttribute("aria-pressed",String(active));
   focus.textContent=active?"Exit focus mode":"Focus on the story";
  });
 }
 if(size){
  size.addEventListener("click",()=>{
   const sizes=["normal","large","larger"];
   const index=sizes.indexOf(document.body.dataset.readingSize||"normal");
   const next=sizes[(index+1)%sizes.length];
   document.body.dataset.readingSize=next;
   size.textContent=next==="normal"?"Text size: Standard":next==="large"?"Text size: Large":"Text size: Larger";
   size.setAttribute("aria-label","Change article text size. Current size: "+next);
  });
 }
}
updateSaveButtons();
})();
