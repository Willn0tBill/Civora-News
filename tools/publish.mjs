#!/usr/bin/env node
// Civora publishing tool. Run: node tools/publish.mjs
// Node 20+, no packages or credentials required.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root,"content","articles.json");
const doc = JSON.parse(fs.readFileSync(source,"utf8"));
if(doc.schemaVersion !== 1 || !Array.isArray(doc.articles)) throw Error("Expected {schemaVersion:1,articles:[]}.");
const seen = new Set();
const visible = [];
for (const [i,a] of doc.articles.entries()) {
  const where = "Article #"+(i+1);
  if(!a || typeof a !== "object") throw Error(where+": invalid record");
  if(typeof a.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id)) throw Error(where+": invalid slug (id)");
  if(seen.has(a.id)) throw Error(where+": duplicate slug "+a.id);
  seen.add(a.id);
  if(!["draft","sample","published"].includes(a.status)) throw Error(where+": status must be draft, sample, or published");
  for(const k of ["title","summary","cat","visual","art","author"]) if(typeof a[k] !== "string" || !a[k].trim()) throw Error(where+": missing "+k);
  if(!["U.S.","World","Technology","Business","Science","Culture"].includes(a.cat)) throw Error(where+": invalid category");
  if(!["us","world","tech","business","science","culture"].includes(a.visual)) throw Error(where+": invalid visual");
  if(!Array.isArray(a.body) || !a.body.length || a.body.some(x=>typeof x!=="string"||!x.trim())) throw Error(where+": body must be paragraphs of text");
  if(!Array.isArray(a.sources) || a.sources.some(x=>typeof x!=="string"|| !/^[^:]+: https:\/\/\S+$/.test(x))) throw Error(where+": sources must be 'Name: https://example.org'");
  if(a.status==="published"){
    if(!a.publishedAt || !/^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt) || Number.isNaN(Date.parse(a.publishedAt))) throw Error(where+": published articles need YYYY-MM-DD publishedAt");
    if(!a.sources.length) console.warn("Editorial warning: published story has no external source references: "+a.id);
  }
  if(a.status!=="draft") visible.push(a);
}
const dest=path.join(root,"assets","articles.json");
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(visible,null,2)+"\n");
const template=fs.readFileSync(path.join(root,"templates","article.html"),"utf8");
const htmlEsc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
for(const a of visible){
  const folder=path.join(root,"article",a.id);
  fs.mkdirSync(folder,{recursive:true});
  const html=template.replace(/<title>[\s\S]*?<\/title>/,'<title>'+htmlEsc(a.title)+' | Civora News</title>')
    .replace('content="Civora News — independent reporting, informed perspectives, and stories worth understanding."','content="'+htmlEsc(a.summary)+'"');
  fs.writeFileSync(path.join(folder,"index.html"),html);
}
console.log("Validated "+doc.articles.length+" stories; published "+visible.length+" visible records, generated corresponding article pages.");
