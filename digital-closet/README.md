# Digital Closet

Photograph your clothes, turn them into stickers, dress a 2D mannequin, save outfits and get suggestions.
Built to run entirely on free tiers: GitHub Pages (site), Render (API), MongoDB Atlas M0 (metadata only), Cloudinary (images), Gemini (optional, text only).
New here? Follow **Setup from scratch** below, then **Run locally**.

## Run locally

Requires Node 20+, a free MongoDB Atlas M0 cluster and a free Cloudinary account
(Cloudinary dashboard > Settings > API Keys: copy cloud name, API key, API secret into `server/.env`).

```bash
# backend
cd server
cp .env.example .env        # fill MONGODB_URI, JWT_SECRET and the 3 CLOUDINARY_* values
npm install
npm run dev                 # http://localhost:3000/api/health

# frontend (second terminal)
cd client
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:5173/digital-closet/
```

## Auto-tagging

New items are tagged (category, style, pattern, season) by CLIP running in a Web Worker in the browser. Nothing is sent to a server.
The model (`Xenova/clip-vit-base-patch32`, quantized, a large one-time download) is fetched on the first item and cached by the browser.
If it cannot load, the form simply stays manual.

## Avatars

The mannequin is drawn in the browser from four numbers (silhouette, height, width, torso-to-leg ratio), so an avatar is a tiny JSON record (max 10 per user).
`client/src/lib/mannequin.js` also exports the named anchor points (neck, shoulders, waist, hips, knees, ankles, feet, wrists) used by the outfit builder.
Tick "Show anchor points" on the Avatar tab to see them.

## Outfit builder

The Outfits tab draws the mannequin and clothing stickers on a react-konva canvas. Each category maps to a target area computed from the avatar's anchor points
(`client/src/lib/fit.js`), so changing avatar re-fits the same outfit automatically. Tap a piece to bring it forward, drag/resize/rotate it, and "Save fit" to reuse
that adjustment in every outfit (stored on the item as `fit`). Run `npm install` in `client/` after pulling this step (new deps: `konva`, `react-konva`).

## Outfits and shuffle

Saved outfits store only item ids (name, tags, favorite), so they re-fit to any avatar. Shuffle swaps each unlocked, filled slot for another piece of the same category;
lock a piece from its panel to keep it. Swipe sideways on the avatar background (or use the arrows) to move through earlier combinations; swiping past the end shuffles again.
"Export PNG" saves the stage as an image (needs Cloudinary's CORS headers, which are on by default). Deleting an item removes it from saved outfits.

## Suggestions (rules-based, free)

The Suggest tab samples complete outfits from your closet and scores them in the browser (`client/src/lib/recommend.js`): color pairing (neutrals, analogous, complementary),
at most one statement piece, complete slots, style/occasion match, and season fit for today's weather. It shows the best three that differ from each other, each with a short "why".
Weather comes from Open-Meteo using your browser location (only if you allow it) or a typed city, which Open-Meteo's geocoder resolves; the closet is never sent. Only a typed city is remembered on the device.
Without weather the ideas still work, they just ignore the season.

## AI stylist (optional, free tier)

`POST /api/suggest` asks Gemini for 3 outfits. Set `GEMINI_API_KEY` (free key from Google AI Studio) in `server/.env` or Render; leave it empty and the Suggest tab just uses the built-in recommender.
`GEMINI_MODEL` defaults to `gemini-2.5-flash`; change it if Google renames the free model.

- **What Gemini sees:** per item only category, color hex, style, pattern and season (as short refs like `i7`), plus the occasion and a weather bucket (e.g. "cool and rainy"). Never images, item names, ids, emails or locations.
- **Limits:** 5 AI picks per user per day and `AI_GLOBAL_DAILY_CAP` (default 200) across everyone, counted per UTC day in MongoDB (`usages`, auto-expiring). A failed call is refunded.
- **Cache:** results are cached for 24 h by a hash of (item ids + weather bucket + occasion) and cost no quota.
- **Fallback:** the reply is parsed as JSON and validated with zod, and every outfit is checked against your real items. On any limit, error or bad reply the server answers `ideas: null` and the app keeps showing the built-in ideas.

## Setup from scratch

1. **GitHub repo.** Create a repo named `digital-closet` (another name works too, see step 6) and push this project to the `main` branch.
2. **MongoDB Atlas.** Create a free M0 cluster. *Database Access*: add a user with a password. *Network Access*: allow `0.0.0.0/0` (Render's free tier has no fixed IP; the password still protects it).
   *Connect > Drivers*: copy the connection string, put your password in it and add `/digital-closet` before the `?`. That is `MONGODB_URI`.
3. **Cloudinary.** Create a free account. Dashboard > Settings > API Keys: note the cloud name, API key and API secret.
4. **Gemini key (optional).** Create a free key at https://aistudio.google.com/apikey. Skip it and the app uses only the built-in recommender.
5. **Render (API).** New > Blueprint, pick your repo (it reads `render.yaml`). When asked, fill the variables marked `sync: false`:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | from step 2 |
   | `CLIENT_ORIGIN` | your site's origin, e.g. `https://YOUR_USER.github.io` (no path, no trailing slash) |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from step 3 |
   | `GEMINI_API_KEY` | from step 4, or leave empty |

   `JWT_SECRET` is generated for you. When it is live, open `https://YOUR-SERVICE.onrender.com/api/health`: you should see `{"ok":true,"db":true}`.
   The free service sleeps after ~15 minutes idle, so the first request can take about 30 seconds.
6. **GitHub Pages (site).** Repo > Settings > Pages > Source: **GitHub Actions**. Then Settings > Secrets and variables > Actions > **Variables** > New: `VITE_API_URL` = your Render URL (no trailing slash).
   Push to `main` (or run the workflow from the Actions tab). The workflow builds `client/` with the base path `/<repo-name>/` and publishes it at `https://YOUR_USER.github.io/<repo-name>/`.
7. **Check.** Open the site, register, add an item. If login says it cannot reach the server, `VITE_API_URL` or `CLIENT_ORIGIN` is wrong (change it, redeploy or restart).

Environment variables are listed in `.env.example`. Secrets live only in `server/.env` or the Render dashboard; the client only gets `VITE_*` values, which are public.

## Privacy and your data

- The in-app **Privacy** page (also linked on the login screen) says in plain words which provider sees what. In short: photos never leave your device except the finished cut-out going to Cloudinary; MongoDB holds only metadata;
  Gemini only ever gets anonymous text tags; Open-Meteo gets a city or coordinates.
- Images are private by default in the sense that they are never listed and each has a random address, but Cloudinary free serves them by public link, so anyone holding an exact link can open it.
- **Account** screen: download all your data as JSON, delete all data (keep the login) or delete the account. Both deletions need your password and remove Cloudinary images (per item plus a sweep of your folder) and every database record.
- Typed names and tags are cleaned on the server (control characters and `<>` removed) on top of zod validation; API responses are sent with `Cache-Control: no-store`.

## Installable app (PWA)

`client/public/manifest.webmanifest` and `sw.js` make the site installable and let the app shell open offline. Only the app's own files are cached; data, photos and AI models need a connection.
The worker is registered only in production builds. To force an update after a deploy, bump `CACHE` in `sw.js`.

## Layout

- `client/` Vite + React (HashRouter, deployable to GitHub Pages)
- `server/` Express + Mongoose API (deployable to Render via `render.yaml`)

## Notes

- Background removal runs in the browser. The first cutout downloads an AI model (~40 MB) and is slow; later ones are fast.
- Photos are compressed to WebP (~50 KB) and uploaded straight to Cloudinary with a server-signed request. MongoDB only stores URLs and metadata.
