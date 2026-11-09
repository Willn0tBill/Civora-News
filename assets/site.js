(()=>{"use strict";
const input=document.querySelector("#site-search");
if(input){const cards=[...document.querySelectorAll(".search-entry")],status=document.querySelector("#search-status"),empty=document.querySelector("#search-empty");
input.value=new URLSearchParams(location.search).get("q")||"";
const update=()=>{const term=input.value.toLocaleLowerCase().trim();let count=0;for(const card of cards){const match=card.dataset.search.includes(term);card.hidden=!match;if(match)count++;}if(status)status.textContent=count+" matching "+(count===1?"story":"stories");if(empty)empty.hidden=count!==0;};
input.addEventListener("input",update);input.form?.addEventListener("submit",e=>{e.preventDefault();update();const url=new URL(location.href);input.value?url.searchParams.set("q",input.value):url.searchParams.delete("q");history.replaceState(null,"",url)});update();}
const article=document.querySelector(".article-frame article");
if(article){const header=article.querySelector(".article-header"),body=article.querySelector(".article-body"),sources=article.querySelector(".article-sources");
if(header&&body){const meta=header.querySelector(".article-meta");if(meta){const span=document.createElement("span");span.textContent=Math.max(1,Math.ceil((body.textContent||"").trim().split(/\s+/).length/220))+" MIN READ";meta.appendChild(span);}
const progress=document.createElement("div");progress.className="reading-progress";progress.setAttribute("aria-hidden","true");const bar=document.createElement("span");progress.appendChild(bar);document.body.prepend(progress);
let scheduled=false;const draw=()=>{const h=document.documentElement.scrollHeight-innerHeight;bar.style.width=(h>0?Math.min(100,Math.max(0,scrollY/h*100)):100)+"%";scheduled=false;};const tick=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(draw);}};addEventListener("scroll",tick,{passive:true});addEventListener("resize",tick,{passive:true});draw();
const tools=document.createElement("div");tools.className="reader-tools";if(sources){sources.id="article-sources";const jump=document.createElement("a");jump.href="#article-sources";jump.textContent="Jump to sources ↓";tools.appendChild(jump);}
const copy=document.createElement("button");copy.type="button";copy.textContent="Copy article link ↗";const msg=document.createElement("span");msg.className="share-message";msg.setAttribute("role","status");msg.setAttribute("aria-live","polite");copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(location.href);msg.textContent="Link copied."}catch{msg.textContent="Copy the URL from your browser's address bar."}});tools.append(copy,msg);header.appendChild(tools);}}

/* A single theme preference follows the reader between real HTML pages. */
const searchLink=document.querySelector(".masthead-inner .header-search");
if(searchLink){
 const controls=document.createElement("div");controls.className="header-controls";
 searchLink.replaceWith(controls);
 const toggle=document.createElement("button");toggle.type="button";toggle.className="theme-toggle";
 toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><span class="theme-label">Theme</span>';
 controls.append(toggle,searchLink);
 const root=document.documentElement;
 try{
  const remembered=localStorage.getItem("civora-theme");
  root.dataset.theme=(remembered==="dark"||remembered==="light")?remembered:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
 }catch{root.dataset.theme="light"}
 const refresh=()=>{
  const dark=root.dataset.theme==="dark",name=dark?"Switch to light mode":"Switch to dark mode";
  toggle.setAttribute("aria-label",name);
  toggle.setAttribute("title",name);
  toggle.setAttribute("aria-pressed",String(dark));
  toggle.querySelector(".theme-label").textContent=dark?"Light mode":"Dark mode";
  toggle.querySelector("svg").innerHTML=dark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>':'<path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5a8.5 8.5 0 1 0 10.6 10.6Z"/>';
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",dark?"#0b1623":"#f8f9f7");
 };
 refresh();
 toggle.addEventListener("click",()=>{root.dataset.theme=root.dataset.theme==="dark"?"light":"dark";try{localStorage.setItem("civora-theme",root.dataset.theme)}catch{}refresh()});
}
/* Animate once when cards arrive; no JavaScript means all content is visible. */
if("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches){
 const targets=document.querySelectorAll(".story-card,.desk-item,.feed-item,.category-lead,.split-feature,.sponsor-box,.side-headline");
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.dataset.reveal="visible";observer.unobserve(e.target)}},{threshold:.08,rootMargin:"0px 0px -24px 0px"});
 let n=0;
 for(const el of targets)if(el.getBoundingClientRect().top>innerHeight-24){el.dataset.reveal="pending";el.style.setProperty("--delay",(n%4*45)+"ms");observer.observe(el);n++}
}

/* Cover cards: hover on fine pointers; first tap previews on touch devices. */
const flipCards=[...document.querySelectorAll("[data-flip-card]")];
if(flipCards.length){
 const touchMode=()=>matchMedia("(hover: none), (max-width: 760px)").matches;
 const closeCard=(card,focus=false)=>{
  card.classList.remove("is-flipped");
  const trigger=card.querySelector("[data-flip-trigger]");
  trigger?.setAttribute("aria-expanded","false");
  if(focus)trigger?.focus({preventScroll:true});
 };
 for(const card of flipCards){
  const front=card.querySelector("[data-flip-trigger]");
  const read=card.querySelector(".flip-read");
  const dismiss=card.querySelector("[data-flip-close]");
  if(!front||!read||!dismiss)continue;
  front.setAttribute("aria-expanded","false");
  front.addEventListener("click",event=>{
   if(!touchMode())return;
   event.preventDefault();
   for(const other of flipCards)if(other!==card)closeCard(other);
   card.classList.add("is-flipped");
   front.setAttribute("aria-expanded","true");
   read.focus({preventScroll:true});
  });
  dismiss.addEventListener("click",()=>closeCard(card,true));
  card.addEventListener("keydown",event=>{
   if(event.key==="Escape"&&card.classList.contains("is-flipped")){
    event.preventDefault();
    closeCard(card,true);
   }
  });
 }
 addEventListener("resize",()=>{if(!touchMode())for(const c of flipCards)closeCard(c)},{passive:true});
}
})();