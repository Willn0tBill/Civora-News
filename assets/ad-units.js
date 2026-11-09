(()=>{"use strict";
const client="ca-pub-1423460909106679";
const spec={
 display:{format:"auto",responsive:"true"},
 inFeed:{format:"fluid"},
 inArticle:{format:"fluid",layout:"in-article"},
 multiplex:{format:"autorelaxed"}
};
const slots=window.CIVORA_AD_SLOTS||{};
const validSlot=id=>typeof id==="string"&&/^\d{6,20}$/.test(id.trim());
function hydrate(root=document){
 const nodes=[];
 if(root.matches?.("[data-civora-ad]"))nodes.push(root);
 nodes.push(...root.querySelectorAll("[data-civora-ad]"));
 for(const node of nodes){
  if(node.dataset.civoraAdState)continue;
  const type=node.dataset.civoraAd,slot=slots[type];
  if(!spec[type]||!validSlot(slot)){node.dataset.civoraAdState="unconfigured";continue}
  if(node.getBoundingClientRect().width<250){node.dataset.civoraAdState="too-narrow";continue}
  node.dataset.civoraAdState="loading";
  const label=document.createElement("span");
  label.className="civora-ad-label";label.textContent="ADVERTISEMENT";
  const ins=document.createElement("ins");
  ins.className="adsbygoogle";ins.style.display="block";
  ins.dataset.adClient=client;ins.dataset.adSlot=slot.trim();
  ins.dataset.adFormat=spec[type].format;
  if(spec[type].responsive)ins.dataset.fullWidthResponsive="true";
  if(spec[type].layout)ins.dataset.adLayout=spec[type].layout;
  if(type==="inFeed"&&typeof slots.inFeedLayoutKey==="string"&&slots.inFeedLayoutKey.trim()){
   ins.dataset.adLayoutKey=slots.inFeedLayoutKey.trim();
  }
  node.setAttribute("aria-label","Advertisement");
  node.append(label,ins);
  node.classList.add("civora-ad-ready");
  const watch=new MutationObserver(()=>{
   const status=ins.dataset.adStatus;
   if(status==="unfilled"){
    node.classList.add("civora-ad-unfilled");
    node.dataset.civoraAdState="unfilled";watch.disconnect();
   }else if(status==="filled"){
    node.classList.remove("civora-ad-unfilled");
    node.dataset.civoraAdState="filled";watch.disconnect();
   }
  });
  watch.observe(ins,{attributes:true,attributeFilter:["data-ad-status"]});
  // Do not let an ad blocker or a failed ad request leave permanent empty space.
  setTimeout(()=>{if(node.dataset.civoraAdState==="loading"){node.classList.add("civora-ad-unfilled");node.dataset.civoraAdState="pending";}},12000);
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}
  catch(err){node.classList.add("civora-ad-unfilled");node.dataset.civoraAdState="error";watch.disconnect();}
 }
}
window.CivoraAds=Object.freeze({hydrate});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>hydrate(),{once:true});
else hydrate();
})();
