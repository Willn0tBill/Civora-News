import assert from "node:assert/strict";
import fs from "node:fs";
import {generateSite} from "../studio/generator.mjs";

const base=JSON.parse(fs.readFileSync("content/articles.json","utf8")).articles[0];
const make=(id,publishedAt)=>({...base,id,title:"Archive fixture "+id,summary:"Historical article for lifecycle verification.",publishedAt,status:"published",kind:"explainer"});
const fixtures=[
 make("fresh-now","2026-11-10"),
 make("month-not-yet","2026-10-11"),
 make("month-threshold","2026-10-10"),
 make("year-not-yet","2025-11-11"),
 make("year-threshold","2025-11-10")
];
const out=generateSite(fixtures,{asOf:"2026-11-10"});
const includes=(page,id)=>out[page].includes("article/"+id+"/");
for(const id of ["fresh-now","month-not-yet"]){
 assert(includes("latest/index.html",id),id+" should remain in Latest");
 assert(includes("index.html",id),id+" should remain on homepage");
 assert(!includes("archive/index.html",id)&&!includes("deep-archive/index.html",id),id+" must not enter an older shelf");
}
for(const id of ["month-threshold","year-not-yet"]){
 assert(includes("archive/index.html",id),id+" should be in the one-month archive");
 assert(!includes("latest/index.html",id),id+" must leave Latest");
 assert(!includes("index.html",id),id+" must leave homepage");
 assert(!includes("deep-archive/index.html",id),id+" should not yet be in deep archive");
}
assert(includes("deep-archive/index.html","year-threshold"),"One-year-old article should be in deep archive");
assert(!includes("archive/index.html","year-threshold"),"Deep articles must leave the regular archive");
assert(!includes("latest/index.html","year-threshold"),"Deep articles must leave Latest");
assert(out["deep-archive/index.html"].includes("2025"),"Deep Archive should be grouped by year");
assert(out["archive/index.html"].includes("October 2026")&&out["archive/index.html"].includes("November 2025"),"Archive should be grouped by publication month");
for(const row of fixtures){
 for(const path of ["search/index.html","discover/index.html","sitemap.xml"])assert(includes(path,row.id),row.id+" should remain accessible through "+path);
 assert(out["article/"+row.id+"/index.html"],"Original story URL was removed for "+row.id);
 const article=out["article/"+row.id+"/index.html"];
 if(row.id==="year-threshold"){
  assert(article.includes("FROM THE DEEP ARCHIVE"),"Missing historical story disclosure");
  assert(article.includes("Return to Deep Archive"),"Old article must return to its shelf");
 } else if(row.id==="month-threshold"){
  assert(article.includes("FROM THE ARCHIVE"),"Missing archive disclosure");
  assert(article.includes("Return to Archive"),"Archived article must return to its shelf");
 }
}
const empty=generateSite(fixtures,{asOf:"2030-01-01"});
assert(!empty["index.html"].includes('data-flip-card>'),"No recent articles should appear as active cover cards");
assert(empty["index.html"].includes('archive-empty-link'),"Homepage needs a path to archives with no recent articles");
assert(empty["index.html"].includes('Browse the Archive'),"Archive navigation must survive an empty latest edition");
assert(!includes.call(null,"latest/index.html","not-a-story"),"Sanity check");
for(const row of fixtures){
 assert(!empty["latest/index.html"].includes("article/"+row.id+"/"),"Latest cannot show old article "+row.id);
 assert(empty["deep-archive/index.html"].includes("article/"+row.id+"/"),"Deep archive lost "+row.id);
 assert(empty["search/index.html"].includes("article/"+row.id+"/"),"Search lost "+row.id);
}
const check=(pub,asOf,route)=> {
 const page=generateSite([make("boundary-probe",pub)],{asOf});
 assert(page[route+"/index.html"].includes("article/boundary-probe/"),pub+" at "+asOf+" should be in "+route);
};
check("2026-03-31","2026-04-29","latest");
check("2026-03-31","2026-04-30","archive");
check("2024-01-31","2024-02-28","latest");
check("2024-01-31","2024-02-29","archive");
check("2024-02-29","2025-02-27","archive");
check("2024-02-29","2025-02-28","deep-archive");
const hidden=generateSite([...fixtures,{...make("draft-ghost","2020-01-01"),status:"draft"}],{asOf:"2026-11-10"});
assert(!hidden["sitemap.xml"].includes("draft-ghost"),"Unpublished draft leaked into archive");
assert(hidden["archive/index.html"].includes('href="../deep-archive/"'),"Archive page needs a direct deep-archive link");
console.log("PASS archive lifecycle: calendar-month/year boundaries, leap years, historical URLs, search, discover, and empty editions.");