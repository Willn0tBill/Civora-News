import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const read=p=>fs.readFileSync(p,"utf8");
const docs=JSON.parse(read("content/articles.json"));
const home=read("index.html"),latest=read("latest/index.html"),discover=read("discover/index.html");
assert(home.includes('data-civora-ad="display"'),"Display ad slot missing from home");
assert(latest.includes('data-civora-ad="inFeed"'),"In-feed ad slot missing from Latest");
assert(discover.includes('data-civora-ad="inFeed"'),"In-feed ad slot missing from Discover");
const article=read("article/"+docs.articles[0].id+"/index.html");
assert(article.includes('data-civora-ad="inArticle"'),"In-article slot missing");
assert(article.includes('data-civora-ad="multiplex"'),"Multiplex slot missing");
assert(article.indexOf('data-civora-ad="inArticle"')<article.indexOf("Sources & further reading"),"In-article ad should occur before sources");
assert(article.indexOf('data-civora-ad="multiplex"')>article.indexOf("Sources & further reading"),"Multiplex ad should follow the article");
assert(read("story/index.html").includes("assets/ad-units.js"),"Live article reader lacks ad initializer");
assert(read("assets/live-story.js").includes("window.CivoraAds?.hydrate(root)"),"Live articles cannot initialize ads");
assert(read("assets/live-news.js").includes("window.CivoraAds?.hydrate(container)"),"Live feed cannot initialize new ads");
const config=read("assets/ads-config.js"),clientCode=read("assets/ad-units.js");
assert(!/\b\d{10}\b/.test(config),"Do not hard-code invented slot IDs");
assert(!read("studio/index.html").includes("assets/ad-units.js"),"Staff dashboard should remain ad-free");

function run(slots){
 class Node{
  constructor(type="aside",format=""){
   this.nodeType=1;this.type=type;this.dataset=format?{civoraAd:format}:{};this.children=[];
   this.classSet=new Set();this.classList={add:(name)=>this.classSet.add(name),remove:name=>this.classSet.delete(name),contains:name=>this.classSet.has(name)};
  }
  matches(selector){return selector==="[data-civora-ad]"&&Boolean(this.dataset.civoraAd)}
  querySelectorAll(selector){
   if(selector!=="[data-civora-ad]")return [];
   return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);
  }
  append(...nodes){this.children.push(...nodes)}
  getBoundingClientRect(){return {width:320}}
  setAttribute(name,val){this[name]=val}
 }
 const root=new Node("document");
 const formats=["display","inFeed","inArticle","multiplex"];
 for(const type of formats)root.append(new Node("aside",type));
 const win={CIVORA_AD_SLOTS:slots,adsbygoogle:[]};
 const ctx={window:win,document:{readyState:"complete",querySelectorAll:(q)=>root.querySelectorAll(q),matches:()=>false,createElement:type=>new Node(type)},MutationObserver:class{observe(){} disconnect(){}},setTimeout:()=>{}};
 vm.runInNewContext(clientCode,ctx,{timeout:1000});
 return {win,root,formats};
}
const empty=run({display:"",inFeed:"",inArticle:"",multiplex:""});
assert.equal(empty.win.adsbygoogle.length,0,"Empty slot IDs must never request ads");
for(const wrapper of empty.root.children){assert.equal(wrapper.children.length,0,"Empty ad slot should have no visible contents");assert.equal(wrapper.dataset.civoraAdState,"unconfigured")}
const enabled=run({display:"1111111111",inFeed:"2222222222",inFeedLayoutKey:"-abc+def",inArticle:"3333333333",multiplex:"4444444444"});
assert.equal(enabled.win.adsbygoogle.length,4,"Expected all four ad types to initialize");
for(const [i,wrapper] of enabled.root.children.entries()){
 const tag=wrapper.children.find(child=>child.type==="ins");
 assert(tag,"Missing ad tag "+wrapper.dataset.civoraAd);
 assert.equal(tag.dataset.adClient,"ca-pub-1423460909106679");
 assert.equal(tag.dataset.adSlot,["1111111111","2222222222","3333333333","4444444444"][i]);
 assert(wrapper.classList.contains("civora-ad-ready"));
}
assert.equal(enabled.root.children[1].children.find(x=>x.type==="ins").dataset.adFormat,"fluid");
assert.equal(enabled.root.children[1].children.find(x=>x.type==="ins").dataset.adLayoutKey,"-abc+def");
assert.equal(enabled.root.children[2].children.find(x=>x.type==="ins").dataset.adLayout,"in-article");
assert.equal(enabled.root.children[3].children.find(x=>x.type==="ins").dataset.adFormat,"autorelaxed");
enabled.win.CivoraAds.hydrate(enabled.root);
assert.equal(enabled.win.adsbygoogle.length,4,"Repeated hydration must not duplicate ads");
const bad=run({display:"YOUR_SLOT_ID",inFeed:"",inArticle:"",multiplex:""});
assert.equal(bad.win.adsbygoogle.length,0,"Placeholder text must not request ads");
console.log("PASS all four AdSense formats, deferred initialization, optional layout key, empty slots, no duplication and live article integration.");
