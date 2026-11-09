# Civora News

**Clarity in context.** A responsive independent news publication prototype.

## Version 1

- Responsive editorial homepage and six categories (U.S., World, Technology, Business, Science, Culture)
- Article reading views with references and clear editorial-demo labels
- Instant client-side story search
- About, editorial standards, corrections, and privacy pages
- Visible future sponsorship placement (no active advertising)
- Accessible navigation, keyboard focus states, reduced-motion support
- Fully static site, with no paid dependencies, external fonts, tracking, or backend

## Important editorial status

The eight launch articles are **demonstration/evergreen editorial samples**, not current reporting. Do not represent them as verified breaking stories. External reference links are examples of primary information sources and further reading, not evidence that all current events have been independently investigated.

## Local preview

Open `index.html` in a browser. No build step is required.

For a local web server, run `python -m http.server 8000` from the repository and visit `http://localhost:8000`.

## Publishing to GitHub Pages

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Set branch to **main** and folder to **/(root)**, then save.
4. After GitHub publishes, the expected site URL is `https://willn0tbill.github.io/Civora-News/` (check Pages settings for the actual link).

Page navigation uses hash routes, so article links should function on static GitHub Pages hosting.

## Future production work

- Replace samples with carefully reported, sourced original articles.
- Add publishing dates, author profiles, an actual newsroom email, and a structured CMS.
- Add real metadata feeds (RSS, sitemap and structured article data) when stories have genuine published timestamps.
- Add newsletter signup only after choosing a compliant service and writing a complete privacy policy.
- Add advertising only when sponsor placements, disclosures, billing, and age-appropriate payment arrangements are in place.

## Maintainer notes

Site content is currently held in the `articles` array near the start of the inline script in `index.html`. This keeps V1 deployable without infrastructure, but should become structured content files as the publication grows.

No paid monetization accounts or age verification workarounds are part of this project.
