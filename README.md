# Civora News

**Clarity in context.** An independent digital newspaper prototype.

## V1 sections — separate HTML pages

Civora News now uses real static page paths (not a one-page scrolling layout or hash navigation). Pages can be directly bookmarked and hosted on GitHub Pages.

- `/` — homepage
- `/latest/` — latest archive
- `/section/us/`, `/section/world/`, `/section/technology/`, `/section/business/`, `/section/science/`, `/section/culture/` — six reporting categories
- `/explainers/` — background and context
- `/fact-checks/` — placeholder for properly verified checks
- `/opinion/` — analysis and editorials
- `/reviews/` — culture and technology reviews
- `/newsletter/` — future newsletter information, no unconfigured signup form
- `/search/` — searchable sample archive
- `/article/<slug>/` — one real directory page per launch article
- `/about/`, `/standards/`, `/corrections/`, `/privacy/` — newsroom and transparency pages

Every page contains its own HTML document, loads `assets/site.css` and `assets/site.js`, and uses a shared editorial design. No paid hosting or build tool is required.

## Development and publishing

Run `python -m http.server 8000` from the project root, then open `http://localhost:8000/`. Each folder contains an `index.html` so opening `/reviews/` or `/section/world/` directly works through a web server.

For GitHub Pages: Settings → Pages → Deploy from a branch → `main` → `/(root)`. The expected default URL is `https://willn0tbill.github.io/Civora-News/`, but deployment must be verified in GitHub's Pages settings.

## Editorial status

Eight initial articles are explicitly labeled demonstration content, **not current news reports**. Fact Checks and Newsletter do not claim to operate services that are not launched. Sponsored placements are placeholders and not sold advertisements.

## Next production priorities

1. Replace demo content with original sourced journalism.
2. Move stories into structured article files or a CMS and add real author/date metadata.
3. Add RSS, sitemap, and structured data once real publication dates exist.
4. Configure an official newsroom email and privacy-compliant newsletter provider.
5. Test all routes and accessibility with a browser on the deployed site.
6. Configure honest, age-compliant payment arrangements before monetizing.

Do not publish unverified AI-generated news or bypass service age requirements.

## Editorial publishing workflow (implemented)

**Draft Desk:** Open `/editor/` on the deployed site. Write or edit your article, select a status, and preview it. Click **Save to export list**, then **Download articles.json**.

**Commit to publish:** In GitHub, replace the contents of [`content/articles.json`](content/articles.json) with your exported JSON. Commit to `main`. The [Publish newsroom content workflow](.github/workflows/publish.yml) will validate every article, regenerate `assets/articles.json`, build standalone `article/<slug>/index.html` pages, and commit generated files automatically.

**Status rules:**
- `draft`: stays in the source library but is excluded from the public feed.
- `sample`: visible and explicitly labeled as editorial demonstration material.
- `published`: visible, requires a valid `publishedAt` date, and should only be selected after human fact checking.

**Source format:** one string per reference in the form `Source name: https://example.com/source`. The editor shows a live preview but does not transmit unpublished articles to a server. Its export includes all records loaded from the public library plus local changes: when multiple editors work in parallel, merge carefully to avoid losing unpublished drafts. The public draft editor is not an authenticated CMS and cannot directly push to GitHub.

**Local validation:**
```sh
node tools/publish.mjs
```
Node.js 20+ is sufficient; no npm install required.

**Limits:** This is a lightweight publishing tool, not a newsroom fact-checking substitute. GitHub Actions validates data format, not whether a story is true. The site still needs actual editorial oversight, authentic stories, verified public deployments, and a secure collaborative CMS if more contributors are added.
