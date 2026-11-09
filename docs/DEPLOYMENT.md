# Deployment guide

Target setup: **GitHub → Render (API + PostgreSQL) → Vercel (React) + Cloudinary (images)**.  
Free-plan limits change often, so check each provider's current pricing page before the demo. Two known free-plan quirks: Render web services sleep after a while (first request is slow) and the disk is wiped on every deploy, which is why production images must go to Cloudinary.

## 0. Before you start

1. Push the project to a GitHub repository (the `.gitignore` already keeps `.env`, `node_modules`, the SQLite file and uploads out). Keep production credentials in the hosting provider's secret environment settings, not in Git or a deployed `.env` file.
2. Create free accounts on Render, Vercel and Cloudinary.

## 1. Cloudinary (image storage)

Dashboard → copy **Cloud name**, **API key**, **API secret**. You will paste them into Render in step 2.

## 2. Database + API on Render

**Option A – Blueprint:** New → Blueprint → pick the repo (it reads `render.yaml`).  
**Option B – by hand:** New → PostgreSQL (copy the *Internal Database URL*), then New → Web Service with

| Field | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Environment variables:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | the PostgreSQL URL from Render |
| `JWT_SECRET` | a random string of 32+ characters (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CLIENT_URL` | your Vercel address, e.g. `https://quiet-battles.vercel.app` (add the custom domain too, comma-separated) |
| `SITE_URL` | same as `CLIENT_URL` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the admin you will log in with (password ≥ 10 characters). Only used by the seed command |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from step 1 |

After the first deploy open `https://YOUR-API.onrender.com/api/health`: you should see `{"success":true,…}`. The tables are created automatically on start.

**Load the demo content once:** Render → your web service → **Shell** → `npm run seed`.  
After the first admin is seeded, remove `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the service environment if no further seed is needed. Use a unique, generated production password and rotate it after an administrative handoff.

## 3. Frontend on Vercel

1. New Project → import the repo → **Root directory `client`**. Framework preset: Vite (install `npm ci`, build `npm run build`, output `dist`).
2. Open `client/vercel.json` in the repo and replace both `YOUR-API-NAME.onrender.com` placeholders with your real Render address. Commit and push.
3. Leave `VITE_API_URL` **empty**. The rewrites forward `/api`, `/uploads` and `/sitemap.xml` to Render, so the browser only ever talks to your Vercel domain. That is why the login cookie works without any third-party-cookie problems, and why `COOKIE_SAMESITE` can stay `lax`.
4. Deploy, then update `CLIENT_URL` and `SITE_URL` on Render to the final Vercel address and redeploy the API.
5. Put your real domain in `client/public/robots.txt` (the `Sitemap:` line).

*Alternative without rewrites:* set `VITE_API_URL=https://YOUR-API.onrender.com` on Vercel and `COOKIE_SAMESITE=none` on Render. This works in Chrome/Firefox but browsers that block third-party cookies (Safari) will break the admin login, so the rewrite setup is recommended.

## 4. Smoke test after deploy

- [ ] `/api/health` returns success
- [ ] Home page shows products and the Series 01 chapter list
- [ ] Add to cart → checkout → order confirmation
- [ ] `/admin` → login → dashboard shows the order
- [ ] Upload an image in Admin → Images; it appears with a `res.cloudinary.com` URL
- [ ] Refresh `/archive/series-01` directly (the SPA fallback works)

## Common errors

| Problem | Cause / fix |
|---|---|
| API crashes: `JWT_SECRET is missing or shorter than 32 characters` | set the variable on Render |
| Browser shows `This origin is not allowed` | `CLIENT_URL` on Render does not exactly match the Vercel address (no trailing slash, `https`) |
| Admin login works but you are logged out on refresh | cookie blocked: use the rewrite setup (step 3), not a different domain |
| Uploaded images disappear after a deploy | Cloudinary variables missing, so files went to the temporary disk |
| `SequelizeConnectionError` on Render | wrong `DATABASE_URL` (use the *Internal* URL when the API runs on Render) |
| Seed says `Set ADMIN_EMAIL and ADMIN_PASSWORD` | add both variables before running `npm run seed` |
| 404 on page refresh in Vercel | the last rewrite in `vercel.json` (`/(.*)` → `/index.html`) is missing |
