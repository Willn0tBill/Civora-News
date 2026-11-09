# Civora Studio — email/password upgrade (staged)

This directory contains a **new standalone email/password version of Studio**. It is staged at `/studio/secure/` while the original `/studio/` continues working. **Do not switch the main Studio link until the backend is configured and tested.**

## Architecture

- **Public site**: GitHub Pages at `https://civoranews.org/`.
- **Admin site**: `/studio/secure/`, a separate web page with the current Civora editing interface.
- **Authentication**: A new, dedicated Firebase Authentication project, configured with email/password sign-in. The Firebase SDK manages persistent sessions and refreshes expiring access tokens. **Accounts do not need a preset expiration date.** An administrator can revoke access.
- **Publishing backend**: A Cloudflare Worker (`backend/cloudflare/worker.mjs`) verifies the signed Firebase JWT, checks a server-only allowlist of staff Firebase UIDs, and commits generated news pages to GitHub. The GitHub token is stored as a Cloudflare Worker **secret**, never in a website file.
- **Drafts**: Remain local to the browser in this first version. Shared private drafts require a database and a separate authorization model later.

## Setup — required before email/password sign-in works

1. Create a **new Firebase project for Civora** on the Firebase Spark (no-cost) plan. Do **not** reuse PPW or SwiftSupply accounts.
2. In Firebase Authentication, enable **Email/Password**. Add `civoranews.org` to **Authorized domains** as needed for auth email actions. Register a Web app and obtain its Firebase web config (`apiKey`, `authDomain`, `projectId`, `appId`).
3. Create the owner account using Firebase Authentication's administrative controls. Use a unique password and working email. When signing in, Studio will send a verification email if necessary; complete that verification before publishing.
4. Get the owner's **Firebase Auth UID** from Authentication → Users. This is used for the Worker allowlist. Do not rely on editable profile fields or email addresses for publication authorization.
5. Create a Cloudflare Worker on your account (Workers Free is suitable for a small newsroom). Edit `backend/cloudflare/wrangler.toml` to set `FIREBASE_PROJECT_ID` to the **same new project's ID**. Deploy the Worker from the repository root with:
   ```sh
   npx wrangler login
   npx wrangler deploy --config backend/cloudflare/wrangler.toml
   ```
6. In Cloudflare Worker **Secrets**, configure:
   - `GITHUB_TOKEN`: a secret repository-limited GitHub token with **Contents: Read and write** on `Willn0tBill/Civora-News`. Never put it in the public source code. Rotate it when appropriate, or replace it with a GitHub App integration later.
   - `STAFF_UIDS`: a comma-separated list of **Firebase Auth UIDs** allowed to use this publisher. Start with the owner only.
   Keep `ALLOWED_ORIGINS=https://civoranews.org,https://willn0tbill.github.io` during the transition. The exact origin must be allowlisted before publishing. Cloudflare Workers securely inject these secrets on the server; they are **not browser variables**.
7. Edit `studio/secure/config.mjs` and add the **public** Firebase web config values and the deployed Worker HTTPS URL as `publisherUrl`. Those web config fields are intended for browser use; **never add a service account JSON, private key, GitHub secret, or password**.
8. Commit the configuration and redeploy GitHub Pages. Open `https://civoranews.org/studio/secure/`. Log in with the approved email/password, verify your email, and test reading articles.
9. Publish a verified, non-sensitive test article. Confirm the GitHub commit, the Pages deployment, and the resulting article page. Check the Worker logs if there is an error. Only after a successful publish should `/studio/` be redirected to the new login.

## Security

- No public registration button is provided: staff creation is administrative.
- The Worker requires a Firebase JWT with **Google-verified RS256 signature**, matching `aud` and `iss`, unexpired claims, verified email, and exact server-side UID allowlist.
- Staff permissions are checked on **every** publishing request.
- The Worker only writes structured articles and HTML generated from the pinned Civora generator. The browser cannot submit arbitrary repository paths or server code.
- GitHub publication is guarded by the current source-file version and a static-page generator parity check.
- No never-expiring **browser-side** GitHub credential exists. A staff account can last indefinitely, but access tokens refresh and can be revoked.
- Public website files are not private. Keep unpublished confidential reporting out of local drafts and the public repository.
- Worker secrets, account creation, and actual Cloudflare/Firebase deployment **must** be performed under the user's authorized accounts. A staged code commit is **not** an active sign-in backend.

## Verification

```sh
node --check studio/secure/studio.mjs
node --check backend/cloudflare/worker.mjs
node tests/secure-studio.test.mjs
```

These are static/integration-independent checks. They do not substitute for testing a real Firebase sign-in and Cloudflare-to-GitHub publish. The older token-based Studio is intentionally preserved until the new service is activated.

## Verified Studio workflow (November 9, 2026)

Both Civora Studio clients have been tested in Chrome using isolated mock GitHub/Firebase responses for login, local draft save, article submission, live deployment verification, and safe deletion of a draft with the same slug as a published article. **The mock test did not publish a test article to the real news website.**

The editor now supports exporting/importing local draft JSON backups, an unsaved-changes warning, protected deletion of local drafts, and a publication status panel. A successful GitHub commit is labeled **awaiting deployment**, not **live**. After Pages deploys, use **Check live website** to verify the exact article headline; unpublishing can likewise be checked for a 404. Do not share newly published article links until the public check succeeds.

Drafts live in that browser's local storage, not a private newsroom database, so export important work before clearing site data or changing devices. The secure email/password backend must be configured before it is used for a real publish.

## Remaining account activation

The Cloudflare Worker `civora-publisher` exists at `https://civora-publisher.winotbill.workers.dev`, but **its account configuration is incomplete**: `backend/cloudflare/wrangler.toml` still has a placeholder `FIREBASE_PROJECT_ID`, the public `studio/secure/config.mjs` has empty Firebase fields, and the deployed Worker has no `GITHUB_TOKEN` or `STAFF_UIDS` secrets. Those blanks are intentional: nothing should be invented or copied from another project.

The newsroom owner must first create/register a Civora-specific Firebase Web app, enable Authentication → Email/Password, create and verify the owner's staff login, and obtain the owner's Firebase Auth UID. Put the public Web app `apiKey`, `authDomain`, `projectId`, and `appId` into `studio/secure/config.mjs`. Set `FIREBASE_PROJECT_ID` to that exact Civora project ID and redeploy the Worker. Configure Worker secrets `STAFF_UIDS` (approved UIDs) and `GITHUB_TOKEN` (GitHub credential restricted to the Civora News repository, Contents read/write) through the Cloudflare dashboard. **Never commit secrets or send credentials through chat.** Users log in by email and password; the private GitHub credential is a server-side integration.

Finally test one authorized login, article creation, deployment, update and unpublication against production before redirecting `/studio/` from the legacy GitHub-connected publisher to `/studio/secure/`. No real end-to-end authenticated Firebase publish has yet been verified.
