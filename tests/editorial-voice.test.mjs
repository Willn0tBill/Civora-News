import fs from "node:fs";
import assert from "node:assert/strict";
const data=JSON.parse(fs.readFileSync("content/articles.json","utf8"));
const published=data.articles.filter(a=>a.status==="published");
assert(published.length>0,"Expected published Civora articles");
for(const a of published){
  assert(Array.isArray(a.body)&&a.body.length>=6,a.id+": expected six substantive paragraphs");
  assert(a.body.every(p=>typeof p==="string"&&p.trim().length>=40),a.id+": short or missing paragraph");
  assert(Array.isArray(a.sources)&&a.sources.length>=2,a.id+": at least two credited sources");
  assert(a.sources.every(s=>/^.+:\s*https:\/\//.test(s)),a.id+": source references must include a label and HTTPS URL");
  assert(a.body.some(p=>/reporting note:/i.test(p)),a.id+": method disclosure missing");
  if(a.image_url){
    assert(/^https:\/\//.test(a.image_url),a.id+": cover image needs HTTPS URL");
    assert(a.body.some(p=>/image note:/i.test(p)),a.id+": cover image requires credit and context");
  }
}
console.log("PASS editorial essentials for "+published.length+" published articles.");
