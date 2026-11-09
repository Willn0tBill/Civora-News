import fs from "node:fs";
import assert from "node:assert/strict";
const read=p=>fs.readFileSync(p,"utf8");
const html=read("studio/index.html"),js=read("studio/newsroom.js"),css=read("studio/newsroom.css"),sync=read("scripts/sync-supabase.mjs");
for(const id of ["loginEmail","loginPassword","articleForm","saveDraft","publishArticle","deleteArticle","coverFile","articleList","verified"]){assert(html.includes('id="'+id+'"'),"Missing admin control "+id)}
assert(js.includes("signInWithPassword")&&js.includes("getSession"),"Authentication absent");
assert(js.includes('db.from("civora_editors")'),"Role verification absent");
assert(js.includes('db.from("civora_articles")'),"Database publishing absent");
assert(js.includes('.upload(path,file'),"Photo upload absent");
assert(js.includes('beforeunload')&&js.includes("dirty"),"Unsaved changes not protected");
assert(!js.includes("api.github.com")&&!js.includes("GITHUB_TOKEN"),"Publishing credentials must not be in browser");
assert(css.includes("@media(max-width:650px)"),"Mobile admin layout missing");
assert(sync.includes("status=eq.published")&&sync.includes("scripts/build.mjs"),"Public site does not sync published posts");
assert(sync.includes("Refusing to replace the entire public edition"),"An empty API response may wipe the public edition");
assert(read("assets/live-news.js").includes("live-feed-card"),"Instant public feed missing");
assert(read("assets/live-story.js").includes("story.body"),"Immediate article reader missing");
assert(read("studio/github/index.html").includes('id="connect-form"'),"Existing GitHub admin fallback missing");
console.log("PASS PPW-style Supabase auth, drafts, photos, public feed and static publishing sync.");