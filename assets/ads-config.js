/* Civora AdSense manual ad units.
 * Copy the numeric data-ad-slot value from each unit's Google AdSense code.
 * In-feed: also copy data-ad-layout-key when provided by AdSense.
 * Empty values intentionally DISABLE that format, leaving no blank ad.
 * Keep publisher ID in the existing site-wide AdSense loader; do not add it here.
 */
window.CIVORA_AD_SLOTS = Object.freeze({
  display: "",
  inFeed: "",
  inFeedLayoutKey: "",
  inArticle: "",
  multiplex: ""
});
