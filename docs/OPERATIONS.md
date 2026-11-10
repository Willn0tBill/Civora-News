# Civora News — Production operations

This checklist applies to **https://civoranews.org/**. For future news copy, follow [Civora's Editorial Voice](CIVORA-VOICE.md). Current publication path: authenticated Civora Studio → Supabase → scheduled GitHub Actions sync → static GitHub Pages. The live site is a static GitHub Pages publication, so article pages should remain readable even if the editorial publisher (Cloudflare/Firebase) is offline.

## Launch gates

- [ ] **HTTPS certificate valid on both `civoranews.org` and `www.civoranews.org`.** Check GitHub repo → Settings → Pages → Custom domain. Wait for successful verification; enable **Enforce HTTPS** after certificate issuance. Never enter editorial credentials over plain HTTP.
- [ ] **Live pages checked** on iPhone-sized widths and desktop: homepage, card previews, navigation, section pages, article, search, and 404.
- [x] **Source-backed editorial edition published.** The 14-article source-backed edition was updated November 10, 2026. Eleven original reports or explainers were rewritten for the unified Civora voice; three new reports were published. These are documentary syntheses, not firsthand or interview-based reports.
- [ ] **Official newsroom contact channel configured.** Until a mailbox/contact route is ready, the site does not solicit confidential tips or present an invented address.
- [ ] **Publishing backend configured and end-to-end tested** before migrating the staff login. The Firebase Web configuration is intentionally blank until authorized setup is complete.
- [ ] **GitHub Actions green**: static-build validation, generated-page consistency, link checks, secure Studio tests.
- [ ] **Production monitoring enabled** and checked: `.github/workflows/production-health.yml` runs twice daily and supports manual runs; it intentionally fails if HTTPS is not valid.

## How publishing works

1. Staff use the direct `/studio/` address (legacy GitHub authorization) or `/studio/secure/` after Firebase/Cloudflare setup. Studio is intentionally not advertised in the public website footer.
2. Choose article format: **News report, Explainer, Opinion, Review, or Fact check**. The format determines which archive includes the article.
3. Verify each claim, byline, date, copyright, and sources. A checkbox is an acknowledgement, **not** a substitute for fact-checking.
4. Publish. A single commit updates `content/articles.json`, generated HTML pages, index/section pages, sitemap, and related output.
5. Wait for successful GitHub Pages deployment and check the public article URL. Newest published articles lead, with original news pieces, explainers and fact checks labeled by format.
6. If browser drafts matter, keep an independent private backup. Current drafts are stored locally on that device and are not a team-shared database.

## Monitoring and incident response

- **Public site unreachable:** Check the [GitHub Pages deployment workflow](https://github.com/Willn0tBill/Civora-News/actions), DNS resolution, and the custom domain certificate. Do not start deleting working DNS records in response to a transient GitHub Pages provisioning message.
- **HTTPS fails:** Check GitHub Pages Settings, name server and DNS records, and the certificate status. Keep login disabled over HTTP; do not submit private credentials.
- **Pages deploy fails:** Read the failing GitHub Actions step. The generated pages must exactly match the source JSON and site generator. Run `node scripts/build.mjs --check`, `node tests/site.test.mjs`, `node tests/mobile.test.mjs`, `node tests/studio.test.mjs`, and `node tests/secure-studio.test.mjs` locally.
- **A bad website commit:** Use GitHub's **Revert** action (or `git revert <commit>`) to create a new commit that undoes the broken change, then verify Pages deployment. Avoid force-pushing `main` or deleting the source JSON.
- **Article missing from section:** Check its `kind` value (not just the news category). Supported formats are `news`, `explainer`, `opinion`, `review`, and `fact-check`. The generator retains limited backwards-compatibility for historic article types, but the published edition contains no sample entries.
- **Article overwritten by another editor:** Studio and Worker use a version check against `content/articles.json`; refresh and reconcile changes rather than force-publishing stale data.
- **Cloudflare publisher unavailable:** Public stories should continue to load. Check the `civora-publisher` Worker, its deploy logs, and whether `FIREBASE_PROJECT_ID`, `STAFF_UIDS`, and secret `GITHUB_TOKEN` exist. Never expose GitHub or Firebase private credentials in public files.
- **Firebase sign-in fails:** Check Email/Password provider, the registered web app's *public* configuration, verified email, allowed staff UID, authorized domain, and Firebase project connection.
- **Broken link or missing page:** Confirm the requested article still exists. A removed or mistyped path should return the branded 404 with links to `/` and `/search/`.

## External dependencies and limits

GitHub Pages may take time to propagate updates and provision certificates. Cloudflare Workers, Firebase Authentication, and GitHub API quotas can vary by plan. The public site does not depend on those admin services to render static news pages.

**Do not claim successful live editorial publishing until a real authorized Firebase login and Cloudflare-to-GitHub publication have been tested.** Security-sensitive credentials should be configured via the provider dashboard or a local trusted CLI, never copied into chat or the GitHub repository.
