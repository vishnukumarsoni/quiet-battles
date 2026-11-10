# QUIET BATTLES™ – Architecture

A short guide you can use to explain the whole project in an interview.

## 1. The big picture

```
  Browser (Netlify CDN)                  Express API (Netlify Function)      Neon / Supabase
 ┌────────────────────────┐   same-site  ┌─────────────────────────────┐   ┌─────────────────────┐
 │ React + Vite static SPA│ ── /api/* ─▶ │ routes → controllers        │──▶│ Pooled PostgreSQL   │
 │ hashed assets cached   │              │ → Sequelize models/services │   │ Supabase Storage    │
 │ httpOnly admin cookie  │              └─────────────────────────────┘   └─────────────────────┘
 └────────────────────────┘
```

- `client/` and `server/` are two separate apps with their own `package.json`.
- In development Vite proxies `/api` and `/uploads` to the server, so the browser only talks to one origin.
- In production Netlify serves static files from its CDN and routes `/api/*` to a same-origin Express function, preserving the admin cookie.
- The Netlify function uses one Sequelize connection per warm instance. Schema sync runs during explicit seeding, not on every production cold start.
- Public images use Supabase Storage or Cloudinary with immutable caching; responsive transformed `srcset` is optional and requires Supabase image transformations.

## 2. Why these choices

| Decision | Reason |
|---|---|
| **SQL (Sequelize) instead of MongoDB** | The data is relational: series → chapters → product, orders → order lines. Foreign keys, unique constraints and transactions come for free. |
| **SQLite in dev, pooled Neon PostgreSQL in production** | Zero setup locally; Netlify serverless functions use one application-side connection per warm instance. |
| **JWT in an httpOnly cookie** | JavaScript cannot directly read the cookie. Login never returns the JWT in JSON; API clients can use a cookie jar. A credential-derived HMAC marker invalidates existing sessions after a password change. This reduces token exposure but does not make XSS harmless. |
| **Cart in localStorage, re-priced by the server** | Guests need no account. At checkout the server ignores any price the browser sends and uses the database price. |
| **Orders store a snapshot of each line** | Editing or deleting a product later never changes old orders. |
| **Stock is taken inside a transaction** | `UPDATE … WHERE stock >= qty` means two shoppers cannot buy the last item. A test proves it. |
| **Chapter text is plain text with a tiny format** | No raw HTML is stored or rendered, so a writer cannot inject scripts. |
| **Admin panel is lazy-loaded** | Shoppers never download admin code. |

## 3. Database design

```
 series 1 ───────< chapters >─────── 0..1 products
   id               seriesId  → series.id        (ON DELETE RESTRICT)
                    relatedProductId → products.id (ON DELETE SET NULL)

 users 1 ───< orders 1 ───< order_items >─── 0..1 products   (line is a snapshot)
 users 0..1 ── carts 1 ───< cart_items >─── 1 products
 media, settings, subscribers, messages  (stand-alone)
```

| Table | Important points |
|---|---|
| `users` | unique `email`, `passwordHash` (bcrypt, cost 12, never returned by the API), `role` = `admin` / `customer` |
| `series` | unique `slug` and `seriesNumber`, `status` = `draft` / `published` |
| `chapters` | `seriesId` FK, `relatedProductId` FK, **unique (seriesId, chapterNumber)**, `storyContent`, `galleryImages` (JSON) |
| `products` | unique `slug`, `price` DECIMAL(10,2), `availableSizes` ⊆ S/M/L/XL, `stock` ≥ 0, `images` (JSON), `featured` |
| `carts`, `cart_items` | optional server cart (logged-in user or guest key), unique (cart, product, size) |
| `orders`, `order_items` | `orderNumber` like `QB-20261108-9F3A1C`, `paymentStatus`, `orderStatus`, address as JSON, price snapshot on every line |
| `media` | one row per uploaded image (URL, storage, size) so the admin can browse / replace / delete |
| `settings` | key/value text used by header, footer and contact page |
| `subscribers`, `messages` | newsletter and contact form |

Rules enforced by the database or the API: a series with chapters cannot be deleted (409); deleting a product only clears the chapter link; a chapter number is unique inside its series; draft content is invisible to the public.

## 4. Backend layers (`server/`)

```
routes/        URL → which middleware + controller   (one file per resource)
middleware/    auth (JWT, roles), validators (express-validator), upload (Multer + file-signature check),
               rate limiters, error handler
controllers/   read the request, call models/services, send { success, data, meta }
services/      business rules: cart pricing, order placement + stock, local/Supabase/Cloudinary image storage, media usage
models/        Sequelize models + associations (models/index.js)
config/        env.js (reads .env), db.js (SQLite or pooled PostgreSQL), cloudinary.js
utils/         ApiError, asyncHandler, slugify, pagination/search helpers
seed/          demo content + seed script
tests/         integration tests (node:test)
```

Every response has the same shape: `{ "success": true, "data": …, "meta": … }` or `{ "success": false, "message": "…", "errors": [{ "field", "message" }] }`.

## 5. Frontend structure (`client/src/`)

```
pages/        Home, Archive, SeriesPage, ChapterPage, ProductPage, Shop, CartPage, Checkout, OrderConfirmed, About, Contact
components/   Navbar, Footer, ProductCard, Img (lazy + fade), Reveal (scroll animation), StoryContent, States (loading/empty/error)
layouts/      PublicLayout
admin/        AdminLayout (route guard), Login, Dashboard, Series/Chapter/Product/Media/Orders/Inbox/Settings pages
context/      CartContext (localStorage), AuthContext (admin only), ToastContext, SettingsContext
services/     api.js (Axios instance + error helpers), index.js (one function per endpoint)
hooks/        useFetch, useDocumentTitle (title + meta description per page)
utils/        format.js (prices, dates, image URLs)
```

## 6. Security checklist

- bcrypt password hashing, generic login errors and a dummy hash for unknown-email checks
- JWT in httpOnly cookie, `SameSite` configurable, `Secure` in production
- Login responses contain no JWT; changing the password invalidates existing JWTs by comparing a server-keyed credential marker
- Role-based access: every write route and every admin read goes through `protect` + `restrictTo('admin')`; the React route guard is only for convenience, the server always re-checks
- Server-side validation on every body (express-validator); `pick()` whitelists fields (no mass-assignment of `id`, `role`, …)
- Sequelize parameterised queries; the `sort` option is looked up in a whitelist
- Upload checks: allowed MIME types, 5 MB limit, **real file signature** (magic bytes), random file names
- Helmet security headers, CORS allow-list, request body size limit
- Rate limits: login (10 failed tries / 15 min), orders, forms, uploads, whole API
- `JWT_SECRET` must be ≥ 32 characters or the server refuses to start; no secrets or default passwords in the code; the admin is created from env vars by the seed script

## 7. Assumptions (the brief said to document them)

1. Shoppers check out as guests. The `customer` role exists in the schema for later.
2. Checkout is a **demo**: orders are saved with payment `pending`; no payment gateway.
3. Placeholder pictures are generated demo images (labelled "DEMO IMAGE"). Replace them from **Admin → Images** or the product / chapter forms.
4. Currency is INR (₹). Change `CURRENCY` in `client/src/utils/format.js`.
5. The public URL for a series is `/archive/<slug>`; the seeded slug is `series-01`.
6. No emails are sent (order confirmation, newsletter). Those would need an email provider.
