import fs from "node:fs";
import assert from "node:assert/strict";
const read=p=>fs.readFileSync(p,"utf8"),doc=JSON.parse(read("content/articles.json"));
assert.equal(doc.schemaVersion,1);assert(doc.articles.length>0,"Empty public archive");
const used=new Set(),map=read("sitemap.xml");
for(const a of doc.articles){
 assert(!used.has(a.id),"Duplicate slug "+a.id);used.add(a.id);
 assert.equal(a.status,"published","Only published stories may appear in the public edition");
 assert(/^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt),"Invalid date "+a.id);
 assert(a.title?.trim()&&a.summary?.trim()&&a.cat,"Missing article metadata "+a.id);
 assert(Array.isArray(a.body)&&a.body.length,"Missing paragraphs "+a.id);
 assert(Array.isArray(a.sources)&&a.sources.length,"Missing references "+a.id);
 for(const ref of a.sources){const i=String(ref).indexOf(": https://");assert(i>0,"Invalid reference "+a.id);assert.equal(new URL(ref.slice(i+2)).protocol,"https:")}
 const html=read("article/"+a.id+"/index.html");assert(html.includes("Sources & further reading"),"Missing sources "+a.id);
 assert(html.includes('name="robots" content="index,follow"'),"Published story incorrectly blocked");
 assert(map.includes("/article/"+a.id+"/"),"Article not indexed "+a.id);
}
for(const id of ["understanding-policy","global-context","ai-literacy","inflation-basics","research-check","critical-reviews","source-check","business-records"])assert(!fs.existsSync("article/"+id+"/index.html"),"Old placeholder page remains");
assert(!/EDITORIAL SAMPLE|LAUNCH PREVIEW|DEMONSTRATION ARTICLES/.test(read("index.html")),"Sample content remains");
console.log("PASS "+doc.articles.length+" original published stories and primary references.");