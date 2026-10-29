# HOATAY website — deployment notes

Static site. No build step, no server code. Upload the whole folder as-is to the web root of experiencehoatay.com.

## Structure
- One page per URL (each folder has its own `index.html`):
  - `/` home
  - `/hotels/`
  - `/branded-residences/`
  - `/about/`
  - `/essays/` and one folder per essay under `/essays/…/`
- `/assets/site.css`, `/assets/site.js` shared by all pages
- `/assets/img/`, `/assets/media/` images and hero video (separate files, not embedded)
- `robots.txt`, `sitemap.xml` (10 URLs), `404.html`, `favicon.svg`

## Hosting requirements
1. Serve from the domain root (all paths are absolute: `/assets/...`, `/about/`).
2. Folder URLs must resolve to `index.html` (default on Netlify, Vercel, Cloudflare Pages, GitHub Pages, cPanel/Apache, Nginx).
3. Force HTTPS and pick ONE host: redirect `www.experiencehoatay.com` → `https://experiencehoatay.com` (301). Canonical tags use the non-www HTTPS address.
4. Configure `404.html` as the not-found page.
5. Recommended cache headers: `/assets/*` long cache (e.g. 30 days); HTML short cache.
6. Old links such as `experiencehoatay.com/#about` redirect automatically to `/about/` (handled in site.js).

## After going live: Google Search Console
1. Go to https://search.google.com/search-console and add a **Domain** property: `experiencehoatay.com`.
2. Verify with the DNS TXT record Google gives you (add it at the domain registrar).
3. Sitemaps → submit `https://experiencehoatay.com/sitemap.xml`.
4. URL Inspection → test `https://experiencehoatay.com/` → **Request indexing**. Repeat for `/hotels/`, `/branded-residences/`, `/about/`.
5. Check back after 1–2 weeks: Pages report (indexed count) and Performance (search queries).

## Editing later
Text edits: change the relevant `index.html`. Shared design: `assets/site.css`. New essay: copy an essay folder, edit it, add its URL to `sitemap.xml` and a card on `/essays/`.
