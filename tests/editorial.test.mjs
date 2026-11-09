import fs from "node:fs";
import assert from "node:assert/strict";
const read=p=>fs.readFileSync(p,"utf8");
const doc=JSON.parse(read("content/articles.json"));
assert.equal(doc.schemaVersion,1);
assert.equal(doc.articles.length,9,"The first real edition should have nine original pieces");
const slugs=new Set();
const allowed=["itu.int","ftc.gov","nasa.gov","nist.gov","federalreserve.gov","house.gov","usa.gov","congress.gov","copyright.gov"];
for(const article of doc.articles){
 assert(!slugs.has(article.id),"Duplicate article slug "+article.id);slugs.add(article.id);
 assert.equal(article.status,"published","No demo or unfinished articles belong in the live library");
 assert.equal(article.publishedAt,"2026-11-09","First edition publishing date unexpected");
 assert(Array.isArray(article.body)&&article.body.length>=8,"Missing substantial paragraphs: "+article.id);
 assert(article.body.join(" ").split(/\s+/).length>=290,"Article needs more original reporting: "+article.id);
 assert(article.sources.length>=2,"Article must supply primary references: "+article.id);
 assert(article.body.some(x=>/^(Reporting note|Method note):/.test(x)),"Method disclosure missing: "+article.id);
 for(const reference of article.sources){
  const marker=reference.indexOf(": https://");
  assert(marker>0,"Invalid source link: "+article.id);
  const url=new URL(reference.slice(marker+2));
  assert(url.protocol==="https:","Sources must use HTTPS");
  assert(allowed.some(domain=>url.hostname===domain||url.hostname.endsWith("."+domain)),"Unverified source domain: "+url.hostname);
 }
 const file="article/"+article.id+"/index.html";
 assert(fs.existsSync(file),"Missing generated article "+file);
 const html=read(file);
 assert(html.includes("Sources & further reading"),"Article lacks sources: "+file);
 assert(html.includes('name="robots" content="index,follow"'),"Published article must be indexable: "+file);
 assert(!html.includes("Editorial sample."),"Old demonstration notice remains: "+file);
 assert(html.includes("PUBLISHED 2026-11-09"),"Article publication date missing: "+file);
 assert(read("sitemap.xml").includes("/article/"+article.id+"/"),"Sitemap is missing "+file);
}
const old=["understanding-policy","global-context","ai-literacy","inflation-basics","research-check","critical-reviews","source-check","business-records"];
for(const id of old){
 assert(!fs.existsSync("article/"+id+"/index.html"),"Orphaned demonstration page "+id);
 assert(!read("sitemap.xml").includes("/article/"+id+"/"),"Old demonstration indexed "+id);
}
const home=read("index.html"),about=read("about/index.html"),standards=read("standards/index.html");
assert(home.includes("Two billion people remain offline"),"Latest verified news should lead the homepage");
assert(!/EDITORIAL SAMPLE|LAUNCH PREVIEW|DEMONSTRATION ARTICLES|Reserved for future sponsors/.test(home),"Homepage still advertises placeholders");
assert(about.includes("AI assistance")&&standards.includes("AI assistance"),"AI drafting and evidence-review disclosure missing");
assert(read("fact-checks/index.html").includes("Did a cooler 2025"),"Fact check missing from its archive");
assert(read("explainers/index.html").includes("NIST"),"Explainer missing from its archive");
assert(read("latest/index.html").includes("Two billion people"),"Fresh reporting missing from latest");
console.log("PASS: nine original sourced articles, no demo pages, transparent methods, archives and sitemap.");
