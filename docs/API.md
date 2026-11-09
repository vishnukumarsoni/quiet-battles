# REST API

Base URL in development: `http://localhost:5000/api`  
All bodies are JSON unless stated. Browser auth uses the `qb_token` httpOnly cookie. API clients can keep that cookie in a cookie jar; login intentionally does not return the JWT in its JSON body. The API also accepts a Bearer token when a trusted client already has one.

**Success:** `{ "success": true, "data": …, "meta": { page, limit, total, totalPages } }`  
**Error:** `{ "success": false, "message": "…", "errors": [{ "field": "price", "message": "…" }] }`

| Status | Meaning |
|---|---|
| 200 / 201 | OK / created |
| 400 | Bad request (invalid JSON, bad upload) |
| 401 | Not logged in, or wrong credentials |
| 403 | Logged in but not an admin, or origin not allowed |
| 404 | Not found (or draft content seen by the public) |
| 409 | Conflict (duplicate number, series still has chapters, out of stock, image in use) |
| 413 / 422 | Body too large / validation failed |
| 429 | Rate limit hit |

Public visitors only ever receive **published** content. A logged-in admin can also read drafts.

## Authentication

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/login` | public (limited) | `{ email, password }` → sets httpOnly cookie, returns `{ user }` |
| POST | `/auth/logout` | public | clears cookie |
| GET | `/auth/me` | login | current user |
| PUT | `/auth/password` | login | `{ currentPassword, newPassword (≥10) }` |

## Series

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/series` | public | `?q=&page=&limit=`; admin may add `?status=all\|draft\|published`. Each item has `chapterCount` |
| GET | `/series/:idOrSlug` | public | includes its `chapters` (without story text) |
| POST | `/series` | admin | `{ title, seriesNumber, description?, coverImage?, status?, slug? }` |
| PUT | `/series/:id` | admin | any of the fields above |
| DELETE | `/series/:id` | admin | 409 while chapters exist |

## Chapters

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/chapters` | public | `?seriesId=&q=&page=&limit=` |
| GET | `/chapters/:idOrSlug` | public | includes `series`, `relatedProduct`, `nextChapter`, `prevChapter` |
| POST | `/chapters` | admin | `{ title, chapterNumber, seriesId, description?, storyContent?, coverImage?, galleryImages?[], relatedProductId?, status?, slug? }` |
| PUT | `/chapters/:id` | admin | partial update |
| DELETE | `/chapters/:id` | admin | |

`storyContent` format: blank line = paragraph, `> text` = pull quote, `## text` = heading, `[[image 1]]` = place the first gallery image.

## Products

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/products` | public | `?q=&category=&minPrice=&maxPrice=&featured=true&inStock=true&sort=newest\|price_asc\|price_desc\|name&page=&limit=`; `meta.categories` lists categories |
| GET | `/products/:idOrSlug` | public | includes `related[]` and `chapter` (the chapter that features it) |
| POST | `/products` | admin | `{ name, price, stock?, category?, description?, details?[], images?[], availableSizes? (S,M,L,XL), featured?, status? }` |
| PUT | `/products/:id` | admin | partial update |
| DELETE | `/products/:id` | admin | chapters keep existing, link cleared |

## Cart

The storefront keeps its cart in localStorage and calls `POST /cart/validate`. The server-side cart routes serve logged-in users and API clients; guests identify themselves with an `X-Cart-Key` header (16–64 letters/numbers).

| Method | Path | Notes |
|---|---|---|
| POST | `/cart/validate` | `{ items: [{ productId, size, quantity }] }` → `{ items, problems[], subtotal }` with real prices and stock |
| GET | `/cart` | current server cart |
| POST | `/cart` | `{ productId, size, quantity }` – adds / increases |
| PUT | `/cart/:itemId` | `{ quantity }` (1–10, not above stock) |
| DELETE | `/cart/:itemId` | |

## Orders

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/orders` | public (limited) | `{ customer: { name, email, phone? }, shippingAddress: { line1, line2?, city, state, postalCode, country }, items: [{ productId, size, quantity }] }` → 201 with the order. Prices come from the DB. 409 with `errors[]` if stock changed |
| GET | `/orders` | admin | `?orderStatus=&paymentStatus=&q=&page=&limit=` |
| GET | `/orders/:id` | admin | |
| PUT | `/orders/:id` | admin | `{ orderStatus?, paymentStatus? }`. Cancelling returns stock; a cancelled order cannot be reopened |

Order status: `pending → confirmed → shipped → delivered` or `cancelled`. Payment status: `pending`, `paid`, `failed`, `refunded`.

## Images

All admin-only. Send `multipart/form-data`, field **`images`** (several) or **`image`** (one). JPG, PNG, WEBP, GIF, max 5 MB.

| Method | Path | Notes |
|---|---|---|
| GET | `/upload` | library, newest first, paginated |
| POST | `/upload` | uploads one or more, returns the `media` rows (`url` is what you store on a product / chapter) |
| PUT | `/upload/:id` | replaces the file; every series / chapter / product using the old URL is updated |
| DELETE | `/upload/:id` | 409 lists where it is used; add `?force=true` to delete and remove those references |

## Other

| Method | Path | Access | Notes |
|---|---|---|---|
| GET / PUT | `/settings` | read public / write admin | siteName, tagline, announcement, contactEmail, contactPhone, address, instagram, twitter, youtube |
| POST | `/contact` | public (limited) | `{ name, email, message }` |
| GET / PUT `/:id/read` / DELETE `/:id` | `/contact` | admin | inbox |
| POST | `/newsletter` | public (limited) | `{ email }` (duplicates are ignored) |
| GET / DELETE `/:id` | `/newsletter` | admin | subscribers |
| GET | `/admin/stats` | admin | totals, revenue, recent orders, low stock |
| GET | `/api/health` | public | liveness check |
| GET | `/sitemap.xml` | public | generated from published content |

## Quick curl example

```bash
curl -c jar -X POST http://localhost:5000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"YOUR_ADMIN_EMAIL","password":"YOUR_ADMIN_PASSWORD"}'

curl -b jar -X POST http://localhost:5000/api/products \
  -H 'content-type: application/json' \
  -d '{"name":"Test Tee","price":2500,"stock":10,"status":"published"}'
```

For Postman, enable its cookie jar for `localhost`; do not copy the JWT into local storage or a shared request collection.
