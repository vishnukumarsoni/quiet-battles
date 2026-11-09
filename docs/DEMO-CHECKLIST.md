# Demo checklist (about 10 minutes)

**Before the interview:** follow the PowerShell setup in `README.md`, seed the database, open the site and admin in two tabs, and keep Postman or the terminal ready. Use the generated credentials in `server/.env`; do not put them in screenshots or shared collections.

## 1. Show the brand (2 min)
- [ ] Home: hero, intro, featured pieces, Series 01 preview, piece in focus, story, newsletter
- [ ] The Archive → Series 01 → five chapters (all come from the database)
- [ ] Open a chapter: story, editorial images, related product, "Explore next chapter"
- [ ] Resize the browser / open on a phone to show it is responsive

## 2. Show the shop (2 min)
- [ ] Product page: gallery, size (must choose), quantity, availability, Add to Cart toast
- [ ] Cart: change quantity, remove, totals; refresh the page, the cart is still there
- [ ] Checkout (demo) → order confirmation

## 3. Show the CMS (4 min)
- [ ] `/admin` → login (explain httpOnly cookie + route guard + server check)
- [ ] Dashboard shows the order you just placed
- [ ] Products: create one, upload a photo, publish → refresh the shop and it appears; unpublish → gone
- [ ] Chapters: edit the story text → refresh the chapter page
- [ ] Series: try deleting Series 01 → blocked because it has chapters
- [ ] Orders: change status; cancel an order and show the stock returning
- [ ] Settings: change the top banner text → shows on the site

## 4. Talk through the engineering (2 min)
- [ ] Open `ARCHITECTURE.md`: layers, database diagram, why SQL
- [ ] Show `server/tests/api.test.js` and run `npm test` (60 tests)
- [ ] Mention security: bcrypt, httpOnly JWT cookie (not returned in JSON), per-user session invalidation after password change, validation, Helmet, rate limits, upload signature check
- [ ] Mention the stock race condition and how the transaction prevents it
- [ ] Be upfront about limits: demo checkout, no email, Cloudinary / deploy path documented but verify before the demo

## Likely questions, short answers
- **Why SQL?** The data is relational and orders need transactions and constraints.
- **Why is the price re-checked on the server?** Never trust the browser.
- **Where is the login stored?** httpOnly cookie, so scripts cannot read it.
- **How do chapters connect to products?** `chapters.relatedProductId` foreign key; a product can be shown in a chapter and the product page links back.
- **What happens if two people buy the last item?** One transaction wins, the other gets a 409 (there is a test for it).
- **How would you add real payments?** Create the order as `pending`, create a payment session with the provider, confirm through a webhook, then mark `paid`.
