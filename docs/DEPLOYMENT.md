# Deployment guide

Recommended setup: **GitHub → Neon (pooled PostgreSQL) → Netlify (Vite static site + Express Function) → Supabase Storage or Cloudinary (images)**. Netlify serves static assets from its CDN and routes the API through a same-origin function.

## Recommended: Netlify + Neon

### 1. Configure Netlify

Import the repository as a single Netlify site using the repository root as the base directory. The checked-in `netlify.toml` sets the build command, publishes `client/dist`, bundles the Express function in `server/netlify/functions`, and configures the SPA fallback. The build installs the root, server production, and client dependencies from their lockfiles.

Set these variables in **Site configuration → Environment variables**. Scope secrets to Functions (and Builds only when needed):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled PostgreSQL URL; use the hostname containing `-pooler` and keep SSL parameters |
| `JWT_SECRET` | random secret, at least 32 characters |
| `CLIENT_URL` | exact Netlify site origin, no trailing slash |
| `SITE_URL` | canonical public site URL |
| `COOKIE_SAMESITE` | `lax` |
| `SUPABASE_URL` | Supabase project URL, if using Supabase Storage |
| `SUPABASE_SECRET_KEY` | server-only Supabase secret API key, if using Supabase Storage |
| `SUPABASE_STORAGE_BUCKET` | `product-media` |

Alternatively, configure all three Cloudinary variables instead of Supabase Storage. Production startup refuses local-disk-only storage because Netlify Functions have no persistent filesystem. Never use the Supabase publishable key as `DATABASE_URL` or a server Storage key.

The API function directly handles `/api/*` and `/sitemap.xml`; no separate API domain or `VITE_API_URL` is needed. It uses a single application-side database connection per warm function instance and does not run schema synchronization on cold starts. The code keeps full TLS certificate verification enabled. Netlify's default function region is Ohio; if your plan supports it, set the function region to Singapore (`sin`) near the Neon database to reduce database round-trip time.

Netlify's synchronous function payload cap is about 6 MB, with binary uploads effectively limited to about 4.5 MB after encoding. This app limits Netlify uploads to one 4 MB image per request; the admin can upload several images in separate requests. Larger assets should be uploaded directly to a storage provider instead of passing through the function.

### 2. Initialize Neon

Put the Neon pooled URL and a strong `JWT_SECRET` in the ignored `server/.env`. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run from the repository root:

```powershell
npm --prefix server ci
npm --prefix server run seed
```

The seed command creates the schema, demo content, and admin account. Never run `seed:fresh` against production; it drops all tables. Once seeding is complete, the admin variables are not needed by the deployed function.

### 3. Add durable image storage

For Supabase Storage, create a public-read bucket named `product-media` and set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_STORAGE_BUCKET` in Netlify. Public read allows storefront image delivery; writes remain server-side. For Cloudinary, configure its three server-only credentials instead.

The Vite `Img` component lazy-loads images. Set `VITE_SUPABASE_IMAGE_TRANSFORMS=true` as a Netlify build variable only if Supabase image transformations are enabled for the project. This produces responsive WebP variants; otherwise original public URLs are used. Hashed assets use a one-year immutable CDN cache, and uploaded files use random names with the same cache lifetime.

Vercel/Render/local disk files are not present in Netlify. Re-upload any existing `/uploads/...` images through Admin → Images after migration.

### 4. Verify

- [ ] Netlify deploy builds the site and reports the `api` function
- [ ] `/api/health` returns success
- [ ] Frontend home and deep links load
- [ ] Admin login survives refresh with the same-site httpOnly cookie
- [ ] Upload, replace, and delete an image; verify its durable storage URL
- [ ] Place a demo order and verify it appears in the admin order list

### Troubleshooting

| Error | Cause / fix |
|---|---|
| `getaddrinfo ENOTFOUND <Neon host>` locally | The machine's DNS resolver cannot resolve Neon. Use an approved resolver that can; do not pin a temporary Neon IP. Hosted Netlify Functions use their own DNS path. |
| `DATABASE_URL is required in production` | Set the pooled Neon URL in Netlify's Functions environment and redeploy. |
| Production image storage configuration error | Configure Supabase Storage secrets or all Cloudinary credentials; local disk is not persistent on Netlify. |
| PostgreSQL warns that `sslmode=require` is changing | The server normalizes it to `verify-full` so TLS certificate and hostname verification remain enabled. |

## Optional alternative: Supabase + Vercel

### 1. Configure Supabase

1. Create a Supabase project and save its database password in a password manager.
2. In **Storage**, create a public bucket named `product-media`. Public means anyone can read storefront images; only the backend's secret key can upload, replace, or delete them.
3. In **Project Settings → API Keys**, create a server-only secret key. Never put it in a `VITE_*` or `NEXT_PUBLIC_*` variable, the frontend, Git, or a browser request.
4. In **Connect → Transaction pooler**, copy the transaction-mode Postgres URL (port `6543`). Use this for Vercel, not the direct database URL. Percent-encode reserved characters in the password.

The Supabase publishable key is not a database password and cannot replace `DATABASE_URL` or the server Storage secret.

### 2. Deploy the API to Vercel

Create a Vercel project from the repository with **Root Directory `server`**. Vercel detects the Express app in `server.js`; `server/vercel.json` installs production dependencies only. Set these server-project environment variables for Production:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase transaction-pooler URL (port `6543`) |
| `JWT_SECRET` | random secret, at least 32 characters |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | server-only Supabase secret API key |
| `SUPABASE_STORAGE_BUCKET` | `product-media` |
| `CLIENT_URL` | exact production frontend origin, no trailing slash |
| `SITE_URL` | canonical public frontend URL |
| `COOKIE_SAMESITE` | `lax` |

Choose a Vercel function region near the Supabase project region. The API uses a single application-side database connection per warm function instance. Production does not run schema synchronization on cold starts.

Deploy the API and assign it a stable domain such as `quiet-battles-api.vercel.app`. The domain must be available in your Vercel account.

### 3. Initialize the database

In a local, ignored `server/.env`, set the same `DATABASE_URL`, `JWT_SECRET`, and `SUPABASE_URL`/`SUPABASE_SECRET_KEY` values. Then run from the repository root:

```powershell
npm --prefix server ci
npm --prefix server run seed
```

The seed command creates the tables and demo data and creates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`. Use a unique password. Never run `seed:fresh` against production; it drops all tables. After seeding, the admin variables do not need to be set in Vercel.

### 4. Deploy the frontend to Vercel

Create a second Vercel project from the same repository with **Root Directory `client`**, Vite framework, install command `npm ci`, build command `npm run build`, and output directory `dist`.

In `client/vercel.json`, replace `YOUR-API-PROJECT.vercel.app` with the stable API domain assigned above. Keep `VITE_API_URL` empty: the rewrites proxy `/api/*` and `/sitemap.xml` through the frontend origin. Set the API project's `CLIENT_URL` to the frontend's production origin and redeploy the API. Add a preview origin only when you need preview deployments to make authenticated API calls.

The Vercel CDN caches hashed `/assets/*` files for a year. Supabase Storage uploads also use immutable one-year caching and random object names. `Img` already lazy-loads images; to use responsive transformed WebP variants, enable Supabase Storage Image Transformations (plan-dependent) and set `VITE_SUPABASE_IMAGE_TRANSFORMS=true` in the frontend project.

Vercel has no persistent filesystem. Existing `/uploads/...` files from a previous local/Render deployment must be re-uploaded through Admin → Images; new uploads use Supabase Storage.

### 5. Verify

- [ ] API `/api/health` returns success
- [ ] Frontend home and deep links load
- [ ] Public catalog returns seeded products and chapters
- [ ] Admin login survives refresh using the first-party httpOnly cookie
- [ ] Upload, replace, and delete an image; verify its URL is under Supabase Storage
- [ ] Place a demo order and verify it appears in the admin order list

### Troubleshooting

| Error | Cause / fix |
|---|---|
| `getaddrinfo ENOTFOUND <Neon host>` locally, while a public DNS lookup succeeds | The machine's configured DNS resolver cannot resolve the Neon endpoint. Use a DNS resolver allowed by your network that resolves Neon (or ask the network administrator); do not pin a temporary Neon IP in the connection URL. |
| PostgreSQL warns that `sslmode=require` is changing | The server normalizes this to `verify-full` so TLS certificate and hostname verification remain enabled. |

## Legacy alternative: Render + Cloudinary

The steps below are retained for existing Render deployments. They are not needed for the recommended Netlify + Neon setup.

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
