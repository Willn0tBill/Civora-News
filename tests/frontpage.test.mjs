import fs from "node:fs";
import assert from "node:assert/strict";
import {generateSite} from "../studio/generator.mjs";

const read=path=>fs.readFileSync(path,"utf8");
const doc=JSON.parse(read("content/articles.json"));
const home=read("index.html"),css=read("assets/frontpage.css"),js=read("assets/frontpage.js");
const generator=generateSite(doc.articles);
assert.equal(generator["index.html"],home,"Homepage must exactly match generated source");
assert(home.includes('class="front-grid"')||home.includes('class="front-empty"'),"Missing front page or archived-edition fallback");
if(home.includes('class="front-grid"'))assert(home.includes('class="front-feature"'),"Missing visible headline feature");
if(home.includes('class="front-grid"'))assert(home.includes('class="front-briefs"'),"Missing secondary headlines");
if(home.includes('class="front-grid"'))assert(home.includes('class="front-feature-cta"'),"Missing clear lead story link");
assert(home.includes('class="flip-grid"'),"Existing flip-card collection must be preserved");
assert(home.includes('class="reading-room-teaser"'),"Existing Reading Room must be preserved");
assert(home.includes('href="./assets/frontpage.css"')&&home.includes('src="./assets/frontpage.js"'),"Homepage feature files are not loaded");
if(home.includes('class="front-grid"'))assert(home.includes('aria-label="Guided reading paths"'),"Missing accessible reading route section");
assert([0,3].includes((home.match(/data-reading-path=/g)||[]).length),"Reading paths must be absent when there is no current edition");
const currentCoverCount=(home.match(/data-flip-card/g)||[]).length;
const readingPathCount=(home.match(/data-reading-path=/g)||[]).length;
assert((home.match(/data-path-story=/g)||[]).length===readingPathCount*Math.min(3,currentCoverCount),"Reading paths should reflect available current articles");
for(const id of (readingPathCount?["context","evidence","thinking"]:[])){
 const start=home.indexOf('data-reading-path="'+id+'"');
 assert(start>=0,"Missing reading path: "+id);
 const body=home.slice(start,start+5000);
 assert(body.includes('data-path-progress-label'),"Missing reading progress label for "+id);
 assert(body.includes("<progress "), "Missing reading progress meter for "+id);
}
assert(js.includes("window.CivoraReading")&&js.includes("getRecent"),"Reading path progress must use local reader history");
assert(js.includes("civora:reading-change"),"Progress must update as the reader opens stories");
assert(!/\bfetch\s*\(/.test(js),"Reading path must not upload history");
assert(css.includes("@media(max-width:650px)"),"No narrow phone front-page adjustments");
assert(css.includes("@media(prefers-reduced-motion:reduce)"),"Front page must respect reduced-motion preference");
assert(!/data-front-reveal=pending\]\{opacity:0/.test(css),"Reading cards must remain visible before scroll effects fire");
assert(!home.includes("EDITORIAL SAMPLE"),"Demonstration articles must not remain");
const fresh={...doc.articles[0],id:"test-live-report",title:"A newly verified public report",status:"published",kind:"news",publishedAt:new Date().toISOString().slice(0,10)};
const generated=generateSite([...doc.articles,fresh]);
assert(generated["index.html"].includes(fresh.title),"Future published reporting should populate front page");
const h=generated["index.html"];
if(home.includes(doc.articles[0].title))assert(h.indexOf(fresh.title)<h.indexOf(doc.articles[0].title),"Fresh reporting should lead current stories");
assert(h.includes("SELECTED FROM THE LATEST REPORTING"),"A published lead should update the front-page edition status");
assert(generated["article/"+fresh.id+"/index.html"],"New article page missing");
assert(generated["discover/index.html"].includes(fresh.title),"Reading Room should remain synchronized");
assert(!read("privacy/index.html").includes("upload your reading history to Civora." ) || read("privacy/index.html").includes("do not upload your reading history"),"Privacy statements must remain consistent");

const collection=home.slice(home.indexOf('<section class="flip-collection"'),home.indexOf("</section>",home.indexOf('<section class="flip-collection"'))+10);
assert(collection.includes('data-collection-grid data-initial-cards="8" data-reveal-step="9"'),"Homepage should reveal eight covers initially, then nine at a time");
if(currentCoverCount>8)assert(collection.includes('data-collection-more')&&collection.includes('aria-controls="civora-cover-grid"'),"Missing accessible Load more control");
if(currentCoverCount>8)assert(collection.includes('role="status" aria-live="polite"'),"Missing screen-reader-friendly story count");
assert.equal((collection.match(/data-flip-card/g)||[]).length,currentCoverCount,"Homepage collection must contain only current-edition cards");
assert(css.includes(".flip-collection .flip-card[hidden]"),"The hidden state must override card styling");
assert(js.includes("cards.slice(initial)")&&js.includes('button.addEventListener("click"'),"Load-more handler not wired");
const {runInNewContext}=await import("node:vm");
const coverCards=Array.from({length:20},()=>({hidden:false,querySelector(){return{focus:()=>{}}},scrollIntoView(){}}));
const controlsMock={
 hidden:true,
 querySelector(sel){return {"[data-collection-more]":buttonMock,"[data-collection-more-label]":labelMock,"[data-collection-status]":statusMock}[sel]}
};
let clickHandler;
const buttonMock={hidden:false,addEventListener(event,handler){if(event==="click")clickHandler=handler}};
const labelMock={textContent:""},statusMock={textContent:""};
const gridMock={dataset:{initialCards:"8",revealStep:"9"},querySelectorAll(){return coverCards}};
const documentMock={querySelector(sel){return {"[data-collection-grid]":gridMock,"[data-collection-controls]":controlsMock}[sel]},querySelectorAll(){return[]}};
runInNewContext(js,{document:documentMock,window:{},Number});
assert.equal(coverCards.filter(c=>!c.hidden).length,8,"Initially only 8 cards should be visible");
assert.equal(statusMock.textContent,"Showing 8 of 20 stories");
assert.equal(controlsMock.hidden,false,"Show-more controls should appear when JavaScript starts");
assert.equal(typeof clickHandler,"function","Load-more click event must be functional");
clickHandler();
assert.equal(coverCards.filter(c=>!c.hidden).length,17,"Click should reveal 9 additional cards");
assert.equal(labelMock.textContent,"Show 3 more stories","Final button should reflect remaining card count");
clickHandler();
assert.equal(coverCards.filter(c=>!c.hidden).length,20,"Final click should reveal the rest");
assert.equal(buttonMock.hidden,true,"Exhausted collection should hide the button");

console.log("PASS frontpage: visible lead, headlines, guided reading progress, mobile motion, privacy and future articles.");
