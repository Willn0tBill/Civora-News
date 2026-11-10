import fs from "node:fs";
import assert from "node:assert/strict";
import {generateSite} from "../studio/generator.mjs";
const read=p=>fs.readFileSync(p,"utf8"),doc=JSON.parse(read("content/articles.json"));
const output=generateSite(doc.articles);
for(const [file,html] of Object.entries(output)){assert(fs.existsSync(file),"Missing "+file);assert.equal(read(file),html,"Generator drift: "+file)}
const build=read("scripts/build.mjs"),browser=read("studio/generator.mjs");
assert.equal(browser.slice(browser.indexOf("const sections="),browser.indexOf("export {generateSite};")).trim(),build.slice(build.indexOf("const sections="),build.indexOf("const source=JSON.parse")).trim(),"Generator source mismatch");
const hidden=generateSite([...doc.articles,{...doc.articles[0],id:"hidden-draft-test",status:"draft"}]);
assert(!Object.keys(hidden).some(x=>x.includes("hidden-draft-test")),"Draft leaked into public pages");
const html=read("studio/index.html"),app=read("studio/newsroom.js");
for(const id of ["loginEmail","loginPassword","articleForm","saveDraft","publishArticle","deleteArticle","verified","coverFile"]){assert(html.includes('id="'+id+'"'),"Admin missing "+id)}
assert(app.includes("signInWithPassword")&&app.includes('db.from("civora_articles")'),"Database publisher missing");
assert(app.includes('db.from("civora_editors")'),"Editor authorization missing");
assert(!/service_role|sb_secret_|GITHUB_TOKEN/.test(html+app),"Private token leaked to browser");
assert(!read("index.html").includes('studio/">Civora Studio'),"Public site must not advertise admin");
const maxDate=Math.max(...doc.articles.map(a=>Date.parse(a.publishedAt+"T00:00:00Z")));
const newer=new Date(Math.max(maxDate,Date.now())+86400000).toISOString().slice(0,10);
for(const [kind,route] of [["news","latest"],["explainer","explainers"],["opinion","opinion"],["review","reviews"],["fact-check","fact-checks"]]){
const a={...doc.articles[0],id:"new-type-"+kind,kind,status:"published",publishedAt:newer,title:"New "+kind+" report"};
const next=generateSite([...doc.articles,a]);assert(next[route+"/index.html"].includes(a.title),"New "+kind+" story missing");
assert(next["sitemap.xml"].includes("/article/"+a.id+"/"),"New story sitemap missing");
}
console.log("PASS "+Object.keys(output).length+" generated pages, newsroom, and publishing categories.");