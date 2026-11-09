# Testing report

Latest local verification: 9 Nov 2026 on Windows with Node 24.15.0. The backend integration suite and root frontend build were executed. Chromium checks and responsive checks below are from 8 Nov 2026 and were not repeated during this verification. Items that were **not** tested are listed at the end.

## 1. Backend integration tests – 60 / 60 pass

`npm test` from the repository root (or `npm --prefix server test`) boots the real Express app on a throw-away database and calls it over HTTP.  
The identical suite also passes on **PostgreSQL 18**: `TEST_DATABASE_URL=postgres://… npm test`.

| Area | What is checked |
|---|---|
| Authentication (7) | wrong password and unknown email give the same 401; body validation (422); httpOnly cookie; JWT and password hash never returned in JSON; password change invalidates prior sessions; `/auth/me`; garbage token; logout |
| Access control (9) | every admin route returns 401 without login and 403 for a customer account |
| CRUD + relationships (15) | product / series / chapter create, read, update, delete; invalid data rejected; duplicate slug gets `-2`; mass-assignment ignored; duplicate series number and duplicate chapter number → 409; chapter with missing series or product → 422; chapter response contains series, product, next/previous; drafts hidden from public but visible to admin; unpublished series hides its chapters; series with chapters cannot be deleted; deleting a product clears the link; search / filter / sort / pagination; SQL-injection strings in `q` and `sort`; 404 for missing records |
| Cart and orders (12) | server-side re-pricing; size / stock problems reported; invalid cart input; guest server cart add / update / remove; order form validation; stock reduced after an order; browser-sent prices ignored; overselling refused; **two simultaneous orders for the last unit → one 201, one 409**; order keeps the old price after the product changes; draft products cannot be bought; admin list / search / status change; cancelling restocks exactly once; cancelled orders cannot be reopened; dashboard statistics |
| Image upload (9) | real PNG accepted and served; PDF rejected; fake image (wrong file signature) rejected; > 5 MB rejected; missing file rejected; library listing; delete blocked while in use, `?force=true` removes the file and the references; replace rewrites URLs everywhere |
| Settings and misc (8) | settings read / write with field whitelist; contact form; newsletter de-duplication; password change rules; JSON 404 and bad-JSON handling; Helmet headers and no `X-Powered-By`; CORS allow / block; sitemap |

## 2. Browser end-to-end – 42 / 42 checks pass (Chromium, desktop 1440 px)

Run through the real UI against the real API:

- Product page: size required, quantity selector, toast on add, cart badge
- Cart: quantity change, remove, total (₹17,500 for 3 × ₹3,200 + ₹7,900), survives a page reload
- Checkout: empty-form validation, successful order, confirmation with order number, cart emptied
- Contact form, newsletter, shop search, chapter page (related product + next chapter), 404 state
- Admin: `/admin` redirects to login; wrong password; login; cookie is httpOnly and no token in localStorage; dashboard shows the new order
- Admin CRUD: create a product **with an uploaded image**, see it on the public shop, unpublish (public gets 404, admin can still preview), edit price, server validation error shown on the field, delete; series edit form, deleting a series with chapters is blocked; five chapters listed, full story loads in the editor, edit appears on the public page; order status change; image library; inbox; settings change appears on the site; logout protects `/admin` again

## 3. Responsive and console checks

- 8 public pages × 2 sizes (1440 × 900 and 390 × 844): **no horizontal overflow, no console errors**
- Admin dashboard, products and orders at 390 px: no horizontal overflow (one real bug was found here and fixed: a hidden table header was widening the page)

## 4. Security checks performed

- 10th wrong login within 15 minutes returns 429
- Rate limiting, CORS, Helmet and upload rules covered by the automated tests above
- Login returns no JWT in its JSON response; password changes invalidate existing sessions. Both are covered by API tests.
- On 9 Nov 2026, `npm audit` reported zero vulnerabilities for the client and server dependency trees. The server keeps Sequelize 6 and uses patched transitive `uuid` and `minimatch` versions via npm overrides; rerun audits after dependency changes.
- This is an automated dependency and application test pass, not a penetration test or a guarantee that the application is vulnerability-free.

## 5. Bugs found and fixed while testing

| Bug | Fix |
|---|---|
| Two simultaneous orders on SQLite: second one crashed with `SQLITE_BUSY` | busy timeout + WAL mode, and order transactions start as `IMMEDIATE` |
| Checkout blocked (`This origin is not allowed`) when the site was opened as `127.0.0.1` instead of `localhost` | in development both addresses are allowed (never in production) |
| Visitors got a 401 in the console on every page (login check ran everywhere) | auth check now runs only inside `/admin` |
| Mobile admin: orders page scrolled sideways | table wrapper made `relative` |
| Duplicate context providers + React warnings (`fetchpriority`, effects returning values) | cleaned up |
| Old-style numerals made "1" look like "I" in headings | lining numerals enabled |

## 6. NOT tested (be honest about these in the interview)

- Deployment itself (Render / Vercel) and real **Cloudinary** uploads: no credentials here. The local-disk path is tested; the Cloudinary code path follows the SDK docs but has not run.
- Browsers other than Chromium (Safari, Firefox), real phones, tablets (only emulated sizes)
- Screen-reader testing and a Lighthouse score. Semantic HTML, alt text, labels, focus styles, skip link and reduced-motion support are in place but not audited by a tool
- Email sending (not implemented) and real payments (out of scope for this assessment)
