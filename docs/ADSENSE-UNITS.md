# Civora AdSense — all four ad formats

Civora already loads the publisher-wide Google AdSense script with client `ca-pub-1423460909106679` once on each eligible public page. It also serves `/ads.txt`.

The four **manually positioned** formats are implemented:

| Format | Where Civora places it | AdSense settings |
| --- | --- | --- |
| Display | Homepage, below guided reading paths **and** after the cover-card gallery (two distinct units) | Responsive display units (`data-ad-format="auto"`) |
| In-feed | **News Feed**: after third article in Latest/category archives and live database feed; **Reading Room**: after third Reading Room story (two distinct units) | In-feed native units (`data-ad-format="fluid"`), each with its own `data-ad-slot` and optional `data-ad-layout-key` |
| In-article | After paragraph two of eligible articles, including the dynamic `/story/` reader | In-article native unit (`data-ad-format="fluid"`, `data-ad-layout="in-article"`) |
| Multiplex | At the bottom of article pages, after references and related stories | Multiplex native unit (`data-ad-format="autorelaxed"`) |

## Activate manual units

1. In the **adult account holder's** AdSense dashboard, go to **Ads → By ad unit**, and create one unit of each of the four types.
2. From the code supplied for each unit, copy its **numeric** `data-ad-slot`. For the In-feed units, also copy each `data-ad-layout-key` if it appears. Never substitute a guessed number: the client ID is **not** the slot ID.
3. Add them to [`assets/ads-config.js`](../assets/ads-config.js):

```js
window.CIVORA_AD_SLOTS = Object.freeze({
  display: "3659691671",
  displayLower: "4629158411",
  newsFeed: "1467149312",
  newsFeedLayoutKey: "-fb+5w+4e-db+86",
  readingRoom: "4259678663",
  readingRoomLayoutKey: "-fb+5w+4e-db+86",
  inArticle: "IN_ARTICLE_SLOT_NUMBER",
  multiplex: "MULTIPLEX_SLOT_NUMBER"
});
```

The first four numeric slot values shown above are the **actual user-provided AdSense IDs**; the remaining In-article and Multiplex examples are illustrative text and must be replaced with their exact AdSense IDs. Leave either remaining slot empty until then. Deploy the changes through GitHub Pages. You do **not** need to paste the full Google script four times. The publisher-wide async loader already exists.

**Without slot IDs:** these manual ad containers are invisible and request **no** manual ads, so Civora doesn't show fake ads or empty placeholder panels. Existing Auto ads can still display separately if enabled in AdSense. The four formats are built and supported; actual ad serving requires valid IDs, AdSense approval, and applicable consent settings.

Civora hides known unfilled units, doesn't run manual advertising inside staff Studio, and keeps advertising labeled and outside the main article text links. Always review ad density on mobile. Avoid layering excessive Auto ads on top of the manual placements; tune Auto ads settings in AdSense if needed.

## Verification

Run `node tests/ad-units.test.mjs`, `node tests/adsense.test.mjs`, and `node scripts/build.mjs --check`. CI runs these checks on new commits. If an ad does not show after activation, check AdSense site approval, the publisher and slot IDs, privacy/consent settings, network blockers, and any `data-ad-status="unfilled"` response.
