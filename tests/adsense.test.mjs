import fs from "node:fs";
import assert from "node:assert/strict";
const pub="ca-pub-1423460909106679";
const tag='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+pub;
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()&&entry.name!==".git"?walk(dir+"/"+entry.name):entry.isFile()&&entry.name.endsWith(".html")?[dir+"/"+entry.name]:[]);
let checked=0;
for(const path of walk(".").map(x=>x.replace(/^\.\//,""))){
 const html=fs.readFileSync(path,"utf8");
 if(path.startsWith("studio/")||path.startsWith("editor/")){
  assert(!html.includes(tag),"Admin must not load advertising: "+path);
 }else if(path==="404.html"||path==="search/index.html"){
  assert(!html.includes(tag),"Search and error pages must not load AdSense: "+path);
 }else{
  assert.equal(html.split(tag).length-1,1,"Expected one AdSense tag in "+path);
  assert(html.includes('crossorigin="anonymous"'),"AdSense tag missing crossorigin: "+path);
  assert(html.includes('name="google-adsense-account" content="'+pub+'"'),"AdSense publisher meta missing: "+path);
  const headEnd=html.indexOf("</head>"),tagStart=html.indexOf(tag);
  assert(tagStart>=0&&tagStart<headEnd,"AdSense must load in head: "+path);checked++;
 }
}
const ads=fs.readFileSync("ads.txt","utf8").trim();
assert.equal(ads,"google.com, pub-1423460909106679, DIRECT, f08c47fec0942fa0");
const privacy=fs.readFileSync("privacy/index.html","utf8");
assert(privacy.includes("Advertising and cookies")&&privacy.includes("Google AdSense"),"Privacy disclosure not updated");
assert(!privacy.includes("without third-party advertising trackers"),"Stale privacy claim");
console.log("PASS AdSense in "+checked+" public pages; no staff ads; correct ads.txt and privacy notice.");
