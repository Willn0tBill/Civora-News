(()=>{"use strict";
const cards=[...document.querySelectorAll("[data-reading-path]")];
if(!cards.length)return;
const store=window.CivoraReading;
function refresh(){
 const seen=new Set(store?.getRecent?.()||[]);
 for(const card of cards){
  let count=0;
  for(const row of card.querySelectorAll("[data-path-story]")){
   const visited=seen.has(row.dataset.pathStory);
   row.classList.toggle("is-visited",visited);
   if(visited)count++;
  }
  const progress=card.querySelector("progress");
  const text=card.querySelector("[data-path-progress-label]");
  if(progress){progress.max=card.querySelectorAll("[data-path-story]").length;progress.value=count;}
  if(text)text.textContent=count+" of "+(progress?.max||3)+" explored";
 }
}
refresh();
window.addEventListener("civora:reading-change",refresh);
window.addEventListener("storage",event=>{if(!event.key||event.key==="civora-reading-history-v1")refresh()});
if("IntersectionObserver" in window&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){if(entry.isIntersecting){entry.target.dataset.frontReveal="shown";observer.unobserve(entry.target)}}
 },{threshold:.08,rootMargin:"0px 0px 25px 0px"});
 for(const card of cards){
  if(card.getBoundingClientRect().top>innerHeight+50){card.dataset.frontReveal="pending";observer.observe(card)}
 }
}
})();
