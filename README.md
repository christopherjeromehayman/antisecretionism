# Anti-Secretionism

Source for the Anti-Secretionist food guide, ingredient checker, petition and grocery pilot. The production domain is configured as `https://antisecretionist.com`.

## Build in Codex

Open this directory as the project. Edit the pages, styles and browser scripts in `web/`. The request handler in `worker/handler.js` serves those pages and handles petition signatures and votes. The database schema is in `drizzle/`.

From the project root, run:

```sh
python3 scripts/build.py
```

The build includes the pages, artwork, sitemap and crawler rules in `dist/server/index.js`. It also copies the deployment manifest and database migration into `dist/`. GitHub stores the source. Sites runs the Worker with its D1 database.

Set `CUSTOM_DOMAIN_LIVE=yes` on Sites after the bare domain serves the site over HTTPS. Until then, the platform address keeps its own discovery URLs. Once enabled, public page requests on the platform address redirect to the same path on the purchased domain.

## Add a verified Gemmy menu

The homepage ZIP finder reads the same reviewed `web/movement-links.json` feed as the movement page. For a public restaurant menu that visibly displays Gemmy, use `business` for both `kind` and `origin`, set `url` to the menu, and add a `gemmyLocations` array to that entry. Each confirmed location needs `name`, a full display `address` including city, state and ZIP, and a five-digit `zip` string (keep leading zeroes). For a menu with no public publication date, omit `published` and use `verifiedOn` with the YYYY-MM-DD date you saw Gemmy on that menu. The movement page identifies this as the menu verification date. Continue using the actual `published` date for dated articles and posts. Include only locations covered by that menu. Remove locations when the badge disappears. Other coverage and dish stickers can stay in the feed without location metadata.

## Revenue launch
1. Use an owned domain accepted by Google AdSense. Connect that domain to the public site, then add it in AdSense under Sites. Complete the account and payment details yourself. https://support.google.com/adsense/answer/7584263
2. Set ADSENSE_PUBLISHER in Sites to the public publisher ID in the form pub- followed by 16 digits. The Worker serves the verification meta tag and /ads.txt. Request site review.
3. Use AdSense Privacy & messaging to configure applicable consent messages, check the privacy disclosure and test consent on the production domain. Enable Auto ads for the domain. After Google marks it Ready, set ADS_APPROVED=yes. Only editorial articles load the ad script. https://support.google.com/adsense/answer/12131223
4. Compare page revenue per thousand views and return readership on articles. Calculate actual revenue as article pageviews × observed page RPM / 1,000. Keep the checker, petition and product standard ad-free.
5. Use merchandise votes to decide which sample to order. Request the delivered supplier cost, packaging, platform and payment fees. Test tentative prices ($28 hat, $29 tee, $9 sticker pack); cost, postage, returns and taxes can erase margin. A sticker pack is a better checkout add-on than a single sticker mailed alone. Inspect a sample and connect the owner's payout-enabled print-on-demand store before taking orders.
6. Offer a retailer a one-store pilot. Charge for documented review and shelf-tag servicing only after testing the process. Measure units per store per week versus a comparison shelf, reorders and staff time. Make paid placements conspicuous and keep the ingredient decision independent.
7. A lawyer can clear separate merchandise and certification marks before a packaging launch. Keep the community term open. A license can govern the badge, product scope, fee, QR destination, review and withdrawal. The program cannot require everyone who mentions the movement to link or pay. https://www.uspto.gov/trademarks/apply/certification-mark-applications
