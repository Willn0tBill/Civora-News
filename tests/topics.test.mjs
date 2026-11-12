import fs from "node:fs";
import assert from "node:assert/strict";
import {generateSite} from "../studio/generator.mjs";
const articles=JSON.parse(fs.readFileSync("content/articles.json","utf8")).articles;
const published=articles.filter(a=>a.status==="published");
assert(published.length>=200,"Civora must retain at least 200 published articles");
assert(published.every(a=>a.topic&&a.cat),"Every published article needs a topic");
const labels=[...new Set(published.map(a=>a.topic))];
assert.equal(labels.length,21,"Expected 21 focused topics");
const pages=generateSite(articles);
assert(pages["topics/index.html"]?.includes("21 focused editorial subjects"),"Topic directory missing");
for(const topic of labels){
 const key=topic.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 const page=pages["topics/"+key+"/index.html"];
 assert(page,"Topic route missing: "+topic);
 for(const a of published.filter(a=>a.topic===topic)){
  assert(page.includes("article/"+a.id+"/"),"Topic page missing "+a.id);
  assert(pages["article/"+a.id+"/index.html"].includes("topics/"+key+"/"),"Article breadcrumb missing "+a.id);
 }
}
assert(pages["index.html"].includes("Explore by topic"),"Homepage topic section missing");
assert(pages["sitemap.xml"].includes("/topics/"),"Topic sitemap links missing");
console.log("PASS "+published.length+" stories in "+labels.length+" topics.");
