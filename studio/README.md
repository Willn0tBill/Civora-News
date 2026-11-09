# Civora Studio

A responsive editorial control room for [Civora News](../). This is a **separate page**, at `/studio/`, that connects to the existing public newspaper. It uses GitHub as the publishing backend, so there is no additional subscription, database or server to configure.

## Access

1. Sign in to **your own GitHub account** and open [Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens/new).
2. Select **resource owner: Willn0tBill** and **only repository: Civora-News**.
3. Grant **Contents: Read and write**. No organization-wide or additional access is needed. Set a short expiration and rotate your token regularly.
4. Open `https://civoranews.org/studio/`, paste the token into the page **only after its HTTPS certificate is valid** and choose **Connect to GitHub**.
5. **Never paste a token into ChatGPT, Discord, messages, a GitHub commit, or an article.** Studio keeps it in JavaScript memory only; re-enter it after a page reload.

Any other reporter or editor must have their own GitHub account and approved repository write access. A token alone cannot give access beyond that user's actual GitHub permissions.

## Editorial workflow

- **Articles** loads the currently published source library from `content/articles.json` in GitHub.
- **New article** opens a full form with headline, slug, summary, section, byline, cover label, body and sources.
- **Save local draft** stores an unfinished article only in this browser's local storage. Local drafts are **not** saved to the public GitHub repo or shared with other editors. Do not keep confidential source identities here; browser data can be erased and other scripts on the same origin may share storage access.
- **Live preview** displays typed article paragraphs without interpreting supplied HTML.
- **Publish article** requires a source, publication date and explicit editorial review. The browser uses the site generator, then makes **one Git commit** updating `content/articles.json`, the homepage, article pages, category pages, sitemap and other generated output.
- **Unpublish** removes the story from the source and deletes the stale standalone article HTML in the same commit; it saves a local draft.
- **Delete** permanently removes a published article or local draft (after confirmation).
- GitHub Pages rebuilds following an authenticated contributor commit to `main`. The update may take a short time to propagate.

## Safety and implementation

Studio uses the fixed GitHub REST API hostname and does not include advertising scripts, analytics, service keys or embedded credentials. The GitHub token is used in HTTP Authorization headers, never in a URL. GitHub's permissions are the authorization layer.

The site generator in `studio/generator.mjs` is synchronized with `scripts/build.mjs`; `tests/studio.test.mjs` guards against drift. If someone changes the website design before Studio refreshes, the publisher refuses to commit instead of reverting the design.

This is an initial GitHub-authorized administration system **rather than a hosted multi-user OAuth CMS**. A separate admin domain with an OAuth service, centralized private drafts, granular staff roles, image uploads and editorial approval queues can be added later if necessary.

## Verification and limitations

Automated CI validates generator parity and website links. Actual token-based browser publishing must be tested by an authorized GitHub editor; a GitHub API connection made by ChatGPT does not grant its credentials to this web application.

## Verified Studio workflow (November 9, 2026)

Both Civora Studio clients have been tested in Chrome using isolated mock GitHub/Firebase responses for login, local draft save, article submission, live deployment verification, and safe deletion of a draft with the same slug as a published article. **The mock test did not publish a test article to the real news website.**

The editor now supports exporting/importing local draft JSON backups, an unsaved-changes warning, protected deletion of local drafts, and a publication status panel. A successful GitHub commit is labeled **awaiting deployment**, not **live**. After Pages deploys, use **Check live website** to verify the exact article headline; unpublishing can likewise be checked for a 404. Do not share newly published article links until the public check succeeds.

Drafts live in that browser's local storage, not a private newsroom database, so export important work before clearing site data or changing devices. The secure email/password backend must be configured before it is used for a real publish.
