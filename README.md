# Civora News — Rebuilt

A **fully static, multi-page publication** designed for GitHub Pages. The entire newspaper renders as real HTML, rather than loading the page contents through a JavaScript fetch. No framework, paid account, package install or API key is required.

## Pages

Home, Latest, U.S., World, Technology, Business, Science, Culture, Explainers, Fact Checks, Opinion, Reviews, Newsletter, Search, About, Editorial Standards, Corrections, Privacy, Advertise, Contact, and one dedicated article page per non-draft story.

## Live hosting

Configure **Settings → Pages → Deploy from a branch → main → /(root)**. The custom-domain URL is https://civoranews.org/ (valid HTTPS requires GitHub Pages certificate provisioning). Once the deployment succeeds, all category and article URLs are directly accessible, even without JavaScript. If the site remains inaccessible, inspect **Actions → pages build and deployment** in GitHub; a committed file does not itself prove a successful Pages deployment.

## Publishing articles

1. Add or update records in `content/articles.json` (or use the `/editor/` draft utility to export that JSON).
2. Validate every factual claim, quotation, license and reference. Set `status` to `published` **only** for verified articles; `draft` records are excluded. The existing eight pieces are labeled `sample`.
3. On a local checkout with Node.js 20+, run `node scripts/build.mjs`. The script generates separate article, category, and archive HTML pages, plus sitemap.
4. Commit **both** the updated source file and generated HTML. GitHub Pages then publishes the files from the `main` branch. The CI workflow checks that generated HTML is in sync.

This is intentional: the previous automated bot-generated commits did not necessarily trigger a subsequent GitHub Pages deployment. There is no automatic publishing via a bot commit in this version.

## Search

`/search/` contains a complete server-rendered article list. A tiny optional JavaScript enhancement filters it interactively; the archive remains readable with JavaScript disabled.

## Editorial and monetization status

All initial articles are marked as demonstration samples. No current-event coverage is invented, no newsletter is collecting subscribers, no sponsors are active, and there is no tracking or ad account. Before monetization, use truthful, age-compliant billing and payment arrangements.

## Files

- `content/articles.json`: source of truth for stories
- `scripts/build.mjs`: zero-dependency HTML generator
- `assets/site.css`: site-wide responsive design
- `assets/site.js`: progressive search enhancement only
- `.github/workflows/validate.yml`: content/site consistency check
- `editor/index.html`: existing client-side draft/export tool

## Improvements to the article and publishing experience

**Important:** The old auto-publishing workflow is retired because it could overwrite the newer static pages. Use `content/articles.json` → `node scripts/build.mjs` → commit the source and generated HTML together. GitHub Actions validates output but does not create news content or bypass editorial review.

Article pages now offer optional reading-progress tracking, estimated read time, a quick jump to references, and copy-link support. Search responds to live input while keeping the full archive accessible without JavaScript. A custom 404 page gives lost readers a route home.

The additional site-integrity test checks actual generated pages and links. Initial articles remain clearly labeled demonstration content, not reported breaking news.

## Card-based home edition (PPW-inspired)

The homepage uses a featured cover card plus a responsive grid of interactive cover cards, inspired by PPW's rounded, approachable newspaper card layout. Pointer hover and keyboard focus rotate cards to show the headline and summary. On touch/narrow screens, first tap reveals an overlay with the summary, second action opens the article; a close button and Escape key close the preview. Without JavaScript, the front of every card remains a regular direct article link. The cards respect reduced-motion settings, and published article pages remain unchanged.

## Civora Studio — publishing dashboard

The new [Civora Studio](studio/) at `/studio/` replaces the old Draft Desk link. It uses GitHub's authenticated REST API as the publishing backend: create/edit articles, preview content, save local-only drafts, and publish or remove articles with an atomic commit containing the source JSON and generated HTML. No separate server is required. Studio retains access tokens in tab memory only; use a narrowly scoped, short-lived fine-grained token with Contents: Read and write on **this repository only**.

The old `/editor/` route now redirects to Studio. CI verifies generator parity, generated pages, mobile layouts and internal links. For setup, editorial and security details, see [studio/README.md](studio/README.md).

Note: The code and static deployment are testable automatically, but the first real post needs an authorized editor to test browser token authentication and GitHub API permissions. Do not treat the publishing interaction as end-to-end verified before that test.

## Staged secure Studio: email and password

A standalone [email/password upgrade](studio/secure/README.md) is prepared at `/studio/secure/`, using **Firebase Authentication + Cloudflare Worker**. It is not the active publisher yet. The existing `/studio/` remains available until the new Firebase project, Cloudflare Worker, staff allowlist and Worker secrets are configured under the owner's accounts and successfully tested.

No private keys or GitHub publishing credentials belong in the browser. The login uses refreshable Firebase sessions and admin-controlled user accounts, rather than a permanently valid user-side GitHub token. The staged version fails closed while `studio/secure/config.mjs` is empty. See the setup guide for the remaining authorized account steps.

## Operations and uptime

For production health checks, TLS readiness, recoveries, and the launch checklist, see [docs/OPERATIONS.md](docs/OPERATIONS.md). An independent GitHub Actions workflow checks the actual HTTPS website twice daily, including the homepage, article pages, assets, sitemap, search and custom-domain 404. The admin dashboard remains at its direct URL but is no longer linked from the public footer.
