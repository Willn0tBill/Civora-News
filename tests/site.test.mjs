import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root=process.cwd();
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()&&e.name!==".git"?walk(p):p.endsWith(".html")?[p]:[]})}
const pages=walk(root).map(p=>path.relative(root,p).replaceAll("\\","/"));
assert(pages.length>=25,"Missing expected separate pages");
let verified=0;
for(const page of pages){
const h=fs.readFileSync(page,"utf8");
if(page!=="404.html"&&!page.startsWith("editor/")&&!page.startsWith("studio/")){assert(h.includes('<main id="main-content"'),"Missing content: "+page);assert(/<h1(?:\\s|>)/.test(h),"Missing headline: "+page)}
if(page.startsWith("article/")){assert(h.includes("Sources & further reading"),"Missing sources: "+page);assert(h.includes("Editorial sample.")||h.includes("PUBLISHED"),"Article lacks disclosure: "+page)}
for(const [,href] of h.matchAll(/\b(?:href|src)="([^"]+)"/g)){
if(!href||href.startsWith("#")||href.startsWith("/Civora-News/")||/^(https?:|data:|mailto:|tel:)/i.test(href))continue;
const local=href.split(/[?#]/)[0];if(!local)continue;
const target=local.startsWith("/")?path.resolve(root,local.slice(1)+(local.endsWith("/")?"index.html":"")):path.resolve(path.dirname(path.join(root,page)),local+(local.endsWith("/")?"index.html":""));
assert(fs.existsSync(target),"Missing internal asset or page: "+page+" → "+href);verified++;
}}
assert(fs.existsSync("content/articles.json"),"Missing article library");
console.log("PASS "+pages.length+" HTML pages, "+verified+" internal links/assets.");

const home=fs.readFileSync("index.html","utf8");
assert(home.includes('class="flip-grid"'),"Cover-card homepage missing");
assert((home.match(/data-flip-card/g)||[]).length>=8,"Expected eight cover cards");
assert(home.includes("data-flip-close")&&home.includes("Read full article"),"Missing mobile preview controls");

const notFound=fs.readFileSync("404.html","utf8");
assert(notFound.includes('href="/"'),"404 must link to custom-domain homepage");
assert(notFound.includes('href="/search/"'),"404 should offer archive search");
assert(!notFound.includes("/Civora-News/"),"404 still uses old project route");
