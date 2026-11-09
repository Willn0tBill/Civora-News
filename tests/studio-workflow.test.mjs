import fs from "node:fs";
import assert from "node:assert/strict";
const read=p=>fs.readFileSync(p,"utf8");
const legacy=read("studio/studio.mjs"),secure=read("studio/secure/studio.mjs");
const markup=[read("studio/index.html"),read("studio/secure/index.html")];
const css=read("studio/studio.css");
for(const [i,js] of [legacy,secure].entries()){
 const label=i?"Firebase Studio":"GitHub Studio";
 for(const marker of ['id="draft-import"','id="export-story"','id="publish-status"','id="check-publication"','id="stat-explainers"']){
  assert(markup[i].includes(marker),label+" missing "+marker);
 }
 assert(js.includes("window.addEventListener(\"beforeunload\""),label+" must warn about unsaved edits");
 assert(js.includes("editingDraft?null:remoteDoc.articles.find"),label+" may delete live article when deleting draft");
 assert(js.includes('if(!saveLocal(record,false))throw Error("Cannot unpublish'),label+" may unpublish without an article backup");
 assert(js.includes('await page.waitForFunction')===false,"Puppeteer test logic must not be shipped in the site");
 assert(js.includes('new DOMParser().parseFromString'),label+" does not check the deployed public article");
 assert(js.includes('showPublicationStatus(story.id,story.title,sha)'),label+" does not report commit vs public deployment");
 assert(js.includes('download=name+".civora-draft.json"'),label+" cannot export drafts");
 assert(js.includes('data.format!=="civora-draft-v1"'),label+" may import arbitrary JSON drafts");
 assert(js.includes('if(!response.ok)throw Error("Article is not live yet'),label+" claims success without public verification");
 assert(markup[i].includes("connect-src 'self' https://civoranews.org")||markup[i].includes("connect-src 'self' https://api.github.com https://civoranews.org"),label+" may block live status fetches");
 assert(!markup[i].includes('<span>Editorial samples</span>'),label+" still shows stale sample metrics");
}
assert(secure.includes("activationInFlight"),"Firebase activation may race with sign-in");
assert(secure.includes("await authReady"),"Firebase local-session persistence must initialize before login");
assert(!markup[1].includes("Fine-grained GitHub access token"),"Email login page must never ask for GitHub credentials");
assert(css.includes(".publish-status")&&css.includes(".draft-toolbar"),"Publication feedback and draft toolbar lack styles");
console.log("PASS Studio workflow guards: safe drafts, import/export, mocked publish status integration, Firebase login coordination and CSP.");
