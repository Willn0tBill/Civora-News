// Reveal the cover collection progressively without removing any article links from the HTML.
// Without JavaScript, the full collection stays visible.
(()=>{"use strict";
const grid=document.querySelector("[data-collection-grid]");
const controls=document.querySelector("[data-collection-controls]");
if(!grid||!controls)return;
const cards=[...grid.querySelectorAll("[data-flip-card]")];
const button=controls.querySelector("[data-collection-more]");
const label=controls.querySelector("[data-collection-more-label]");
const status=controls.querySelector("[data-collection-status]");
const initial=Math.max(1,Number.parseInt(grid.dataset.initialCards,10)||8);
const batch=Math.max(1,Number.parseInt(grid.dataset.revealStep,10)||9);
if(!button||!label||!status||cards.length<=initial)return;
let shown=initial;
for(const card of cards.slice(initial))card.hidden=true;
function update(){
 const remaining=cards.length-shown;
 status.textContent="Showing "+shown+" of "+cards.length+" stories";
 button.hidden=remaining===0;
 if(remaining>0){
  const next=Math.min(batch,remaining);
  label.textContent="Show "+next+" more "+(next===1?"story":"stories");
 }
}
button.addEventListener("click",()=>{
 const start=shown;
 shown=Math.min(cards.length,shown+batch);
 for(let i=start;i<shown;i++)cards[i].hidden=false;
 update();
 const firstNew=cards[start];
 firstNew?.querySelector("[data-flip-trigger]")?.focus({preventScroll:true});
 firstNew?.scrollIntoView({block:"nearest"});
});
update();
controls.hidden=false;
})();

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
