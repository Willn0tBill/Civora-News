import fs from "node:fs";
import assert from "node:assert/strict";
const css=fs.readFileSync("assets/site.css","utf8");
const js=fs.readFileSync("assets/site.js","utf8");
const editor=fs.readFileSync("editor/index.html","utf8");
const home=fs.readFileSync("index.html","utf8");
const routes=["index.html","latest/index.html","section/us/index.html","section/world/index.html","section/technology/index.html","section/business/index.html","section/science/index.html","section/culture/index.html","article/ai-literacy/index.html","search/index.html","about/index.html","newsletter/index.html","reviews/index.html","fact-checks/index.html"];
for(const path of routes){
 const html=fs.readFileSync(path,"utf8");
 assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1">/,"Missing mobile viewport: "+path);
 assert.match(html,/assets\/site\.css/,"Missing shared styles: "+path);
 assert.match(html,/<main id="main-content"/,"Missing standalone page content: "+path);
}
for(const query of ["max-width:900px","max-width:760px","max-width:480px","max-width:350px","hover:none","prefers-reduced-motion:reduce"]){
 assert(css.includes(query),"Missing responsive or motion rule: "+query);
}
for(const selector of [".mobile-nav-controls",".nav-outer.nav-expanded",".flip-card.is-flipped",".article-body",".search-controls",".footer-grid",".header-controls"]){
 assert(css.includes(selector),"Missing mobile style: "+selector);
}
assert(css.includes("min-height:44px"),"Touch controls must have comfortable target sizes");
assert(css.includes(".search-controls input{font-size:16px"),"Search must avoid iOS input zoom");
assert(js.includes("mobile-nav-toggle"),"Missing mobile section toggle");
assert(js.includes('menu.setAttribute("aria-expanded"'),"Menu state not exposed to assistive tech");
assert(js.includes('event.key==="Escape"'),"Missing keyboard close handling");
assert(js.includes("data-flip-trigger")&&js.includes("data-flip-close"),"Missing mobile card interaction");
assert(js.includes("touchMode()"),"Missing touch-specific preview behavior");
assert(home.includes('class="flip-grid"'),"Home cover collection missing");
assert(editor.includes('name="viewport"'),"Editor missing viewport");
assert(editor.includes("@media(max-width:480px)"),"Editor missing small-screen layout");
assert(editor.includes("#save,#reset,#download"),"Editor actions must stack on phones");
console.log("PASS mobile: "+routes.length+" responsive routes, navigation, card previews, editor, touch sizing, reduced motion.");

/* Regression: mobile card covers must reserve distinct space for the label/CTA. */
assert(css.includes("Cover text collision fix:"),"Card/footer spacing fix was removed");
assert(css.includes("padding-bottom:110px"),"Card title no longer reserves footer space");
assert(css.includes(".flip-cover-label{display:none}"),"Redundant mobile cover caption may collide with preview label");
assert(css.includes(".flip-cover-foot{padding:14px 17px 18px;min-height:68px}"),"Narrow-phone footer spacing changed");
