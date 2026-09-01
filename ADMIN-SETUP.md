# El Señor Dogs admin setup

The public site remains usable on GitHub Pages. It loads `assets/content.json` whenever the secure content API is unavailable.

The live admin dashboard needs a host with server-side functions because a password embedded in a static GitHub Pages site would not be secure. This repository includes a Cloudflare Pages Functions implementation.

## Deploy the secure admin

1. Create a Cloudflare Pages project connected to this GitHub repository.
2. Use no build command and set the output directory to `.`.
3. Create a KV namespace and bind it to the Pages project as `SITE_CONTENT`.
4. Add two encrypted environment variables:
   - `ADMIN_PASSWORD`: the private password used to sign in.
   - `SESSION_SECRET`: a long random value used to sign login cookies.
5. Point `elsenordogs.site` to the Pages project after previewing and approving it.

The dashboard is available at `/admin/`. Sessions expire after 12 hours. Password verification and content writes happen only in the server function; the password is never stored in repository files or browser storage.

## Content behavior

- The first API read uses `assets/content.json` as the default.
- The first admin save stores the complete content model in KV.
- Public pages then read the live KV version from `/api/content`.
- If the API is unavailable, public pages fall back to the repository copy, so the site still renders.

## Current dashboard coverage

- Homepage hero, images, buttons, ticker, and feature
- Menu items, categories, prices, descriptions, photos, availability, and featured status
- Announcements and temporary banners
- Pop-up events
- Manual open/closed status, schedule, contact details, and social links
- Section visibility
- Gallery entries using existing or hosted image URLs
- Story, catering, and contact copy and service endpoints

Direct image uploads are intentionally not included in this first version. Image fields accept existing `assets/...` paths or full HTTPS image URLs. A later version can add authenticated uploads to Cloudflare R2 without exposing storage credentials.
