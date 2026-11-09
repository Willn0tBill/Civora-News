import fs from "node:fs";
import assert from "node:assert/strict";
import {generateSite} from "../studio/generator.mjs";
const text=(p)=>fs.readFileSync(p,"utf8");
const docs=JSON.parse(text("content/articles.json"));
const generated=generateSite(docs.articles);
for(const [file,html] of Object.entries(generated)){
 assert(fs.existsSync(file),"Missing generated page: "+file);
 assert.equal(text(file),html,"Studio generator differs from public generator for "+file);
}
const build=text("scripts/build.mjs"),browser=text("studio/generator.mjs");
const start="const sections=",end="const source=JSON.parse";
assert.equal(browser.slice(browser.indexOf(start),browser.indexOf("export {generateSite};")).trim(),build.slice(build.indexOf(start),build.indexOf(end)).trim(),"Browser generator has drifted from Node source.");
const sample=docs.articles[0];
const scratch={...sample,id:"draft-only-test",status:"draft"};
const withDraft=generateSite([...docs.articles,scratch]);
assert(!Object.keys(withDraft).some(p=>p.includes("draft-only-test")),"Draft escaped into published pages");
const page=text("studio/index.html"),script=text("studio/studio.mjs");
assert(page.includes('name="robots" content="noindex,nofollow"'),"Studio should not be indexed");
assert(page.includes('id="connect-form"')&&page.includes('type="password"'),"Missing GitHub authorization screen");
assert(page.includes('id="article-form"')&&page.includes('id="fact-check"'),"Missing editorial approval");
assert(page.includes('id="publish-story"')&&page.includes('id="unpublish-story"'),"Missing publishing controls");
assert(script.includes("generateSite(doc.articles)"),"Publishing fails to generate static pages");
assert(script.includes('"/git/trees"')||script.includes('"/git/trees"'),"Publishing missing Git tree API");
assert(script.includes("/git/refs/heads/main"),"Publishing missing Git ref update");
assert(script.includes('remoteSha'),"Publishing missing concurrency protection");
assert(script.includes('localStorage.setItem(DRAFT_KEY'),"Missing local-only draft persistence");
assert(!/localStorage\.setItem\([^)]*accessToken/.test(script),"Never store authentication tokens persistently");
assert(!page.includes("service_role"),"Secret role reference should not be in public HTML");
assert(text("index.html").includes('studio/">Civora Studio'),"Main site lacks Studio navigation");
console.log("PASS: "+Object.keys(generated).length+" browser-generator outputs, drafts exclusion, GitHub publishing controls and Studio security.");

assert(text("sitemap.xml").includes("https://civoranews.org/"),"Sitemap should point to the custom domain");
assert(text("robots.txt").includes("https://civoranews.org/sitemap.xml"),"Robots should point to the custom-domain sitemap");
assert(!text("sitemap.xml").includes("willn0tbill.github.io/Civora-News/"),"Old Pages URL still canonical in sitemap");

// New editorial article types must be discoverable in the correct archives.
for(const [kind,route] of [["news","latest"],["explainer","explainers"],["opinion","opinion"],["review","reviews"],["fact-check","fact-checks"]]){
 const story={...docs.articles[0],id:"new-type-"+kind,kind,status:"published",publishedAt:"2026-11-09",title:"Test "+kind+" article",sources:["Reference: https://example.org/"]};
 const result=generateSite([...docs.articles,story]);
 assert(result[route+"/index.html"].includes(story.title),"Published "+kind+" story missing from "+route);
 assert(result["index.html"].includes(story.title),"Published "+kind+" story missing from homepage");
 assert(result["sitemap.xml"].includes("/article/"+story.id+"/"),"Published "+kind+" story missing from sitemap");
 assert(result["article/"+story.id+"/index.html"].includes('name="robots" content="index,follow"'),"Published news incorrectly blocked from indexing");
}
for(const article of docs.articles.filter(x=>x.status==="sample")){
 assert(!text("sitemap.xml").includes("/article/"+article.id+"/"),"Sample story leaked into sitemap");
 assert(text("article/"+article.id+"/index.html").includes('name="robots" content="noindex,follow"'),"Sample story should not be indexed");
}
assert(text("studio/index.html").includes('id="story-type"'),"Studio cannot classify new stories");
assert(text("studio/secure/index.html").includes('id="story-type"'),"Secure Studio cannot classify new stories");
