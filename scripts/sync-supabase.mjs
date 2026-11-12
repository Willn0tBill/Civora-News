// Supabase is the source of truth for Civora articles.
// This runs in GitHub Actions with a PUBLIC publishable key and no private credentials.
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const project="https://qyipadinsphoyxotrceo.supabase.co";
const key="sb_publishable_S73dZKZ9ro03lWDbHFzZhw_5t5pDtGt";
const fields="slug,title,summary,category,topic,kind,author,cover_text,cover_url,body,sources,status,published_at,updated_at";
const url=project+"/rest/v1/civora_articles?select="+fields+"&status=eq.published&order=published_at.asc,created_at.asc&limit=500";
const response=await fetch(url,{headers:{"apikey":key,"Accept":"application/json"},signal:AbortSignal.timeout(20000)});
if(!response.ok)throw Error("Civora public article sync failed (HTTP "+response.status+"): "+(await response.text()).slice(0,200));
const records=await response.json();
if(!Array.isArray(records))throw Error("Supabase returned an invalid article list");
const allowed=new Set(["U.S.","World","Technology","Business","Science","Culture"]);
const visuals={"U.S.":"us","World":"world","Technology":"tech","Business":"business","Science":"science","Culture":"culture"};
const ids=new Set();
const articles=records.map(row=>{
 if(!row||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug||"")||ids.has(row.slug))throw Error("Invalid or duplicate article slug");
 ids.add(row.slug);
 if(!allowed.has(row.category)||!row.topic?.trim()||!row.title?.trim()||!row.summary?.trim()||!Array.isArray(row.body)||!row.body.length||!Array.isArray(row.sources)||!row.sources.length)throw Error("Invalid published article: "+row.slug);
 if(!row.published_at||!Number.isFinite(Date.parse(row.published_at)))throw Error("Missing article publication date: "+row.slug);
 const result={id:row.slug,title:row.title,summary:row.summary,cat:row.category,topic:row.topic,kind:row.kind||"news",author:row.author||"Civora Research Desk",art:row.cover_text||row.title.split(/\s+/).slice(0,4).join(" "),visual:visuals[row.category],body:row.body,sources:row.sources,status:"published",publishedAt:new Date(row.published_at).toISOString().slice(0,10),updatedAt:null};
 if(row.cover_url&&/^https:\/\//.test(row.cover_url))result.image_url=row.cover_url;
 return result;
});
if(articles.length===0&&!process.env.CIVORA_ALLOW_EMPTY_SYNC)throw Error("Refusing to replace the entire public edition with zero articles");
// Remove standalone pages for deleted or unpublished articles.
const previous=JSON.parse(fs.readFileSync("content/articles.json","utf8")).articles||[];
for(const row of previous){
 if(!ids.has(row.id)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)){
  fs.rmSync(path.join("article",row.id),{recursive:true,force:true});
 }
}
fs.writeFileSync("content/articles.json",JSON.stringify({schemaVersion:1,articles},null,2)+"\n");
execFileSync(process.execPath,["scripts/build.mjs"],{stdio:"inherit"});
console.log("Civora synchronized "+articles.length+" published article(s).");
