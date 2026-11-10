# QUIET BATTLES™

**Wear your battles.** A full-stack e-commerce site for a premium fashion label that releases clothing as *chapters*. Built as a full-stack web developer assessment.

- **Storefront:** home, The Archive, series page, chapter stories, product page, cart, demo checkout, about, contact
- **Admin / CMS:** series, chapters, products, image library, orders, inbox, settings. No code changes are needed to manage content
- **Backend:** Node + Express REST API, JWT login, role-based access, validation, rate limiting, image uploads
- **Database:** SQLite locally; pooled Neon PostgreSQL in production

> Checkout is a **demonstration**. Orders are saved but no payment is taken. The pictures are generated placeholders: replace them from the admin panel.

## Tech stack

React 18 · Vite · Tailwind CSS · React Router · Axios · Lucide icons  
Node 18+ · Express · Sequelize · SQLite / PostgreSQL · JWT · bcryptjs · Multer · Helmet · express-validator  
Neon Postgres · Netlify (static client + Express function) · Supabase Storage or Cloudinary

## Run it locally

You need **Node 18 or newer**. SQLite is created locally; no separate database is needed. From PowerShell at the repository root:

```powershell
Copy-Item server/.env.example server/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Put the generated value in `server/.env` as `JWT_SECRET`, and set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (at least 10 characters). Never commit `.env` or paste production secrets into source files.

```powershell
npm --prefix server ci
npm --prefix client ci
npm run seed
```

Start both apps together from the repository root:

```powershell
npm run dev  # API: http://localhost:5000/api/health; website: http://localhost:5173
```

Open <http://localhost:5173>. The admin panel is at <http://localhost:5173/admin>; use the credentials in `server/.env`.

For deployment, follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Netlify routes `/api/*` to an Express function and connects to Neon through its pooled URL. Store deployment secrets in Netlify's Functions environment, never in the frontend or Git. Supabase Storage or Cloudinary can provide durable production images.

Root-level checks are available with `npm run build` and `npm test`. The root scripts delegate to the client and server package scripts; install dependencies in each app as shown above.

| Command (in `server/`) | What it does |
|---|---|
| `npm run dev` | API with auto-restart |
| `npm start` | API for production |
| `npm run seed` | add or update demo content and the admin user (safe to repeat) |
| `npm run seed:fresh` | **deletes everything**, then seeds again |
| `npm test` | 61 integration tests (`TEST_DATABASE_URL=… npm test` runs them on PostgreSQL) |

| Command (in `client/`) | What it does |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build into `dist/` |

### Common problems

| Problem | Fix |
|---|---|
| `JWT_SECRET is missing or shorter than 32 characters` | set it in `server/.env` |
| `Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first` | add both, then run `npm run seed` again |
| Site shows "Cannot reach the server" | start both apps with `npm run dev`, or check that ports 5000 and 5173 are free |
| `EADDRINUSE` | port 5000 is busy: change `PORT` in `server/.env` and the proxy target in `client/vite.config.js` |
| `This origin is not allowed` | add your site address to `CLIENT_URL` in `server/.env` |
| `sqlite3` fails to install | use Node 18, 20 or 22 (LTS) |
| Admin login says "Too many login attempts" | wait 15 minutes, or restart the API in development |

## Project structure

```
quiet-battles/
├── client/                 React app
│   ├── public/             robots.txt, placeholder images
│   └── src/  pages · components · layouts · admin · context · hooks · services · utils
├── server/                 Express API
│   ├── config/  controllers/  middleware/  models/  routes/  services/  utils/
│   ├── seed/               demo content + seed script
│   └── tests/              integration tests
├── docs/                   API.md · DEPLOYMENT.md · TESTING.md · DEMO-CHECKLIST.md
├── ARCHITECTURE.md         how it fits together, database design, security, assumptions
├── netlify.toml            Netlify build, function and static asset configuration
└── render.yaml             Optional legacy Render blueprint
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): layers, database diagram, why each choice was made
- [docs/API.md](docs/API.md): every endpoint, rules and examples
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Netlify + Neon setup, step by step
- [docs/TESTING.md](docs/TESTING.md): what was tested, bugs found, what was **not** tested
- [docs/DEMO-CHECKLIST.md](docs/DEMO-CHECKLIST.md): a 10-minute walkthrough and likely interview questions

## Editing content

Everything on the site comes from the database. In the admin panel:

- **Series → Chapters:** every chapter belongs to a series and can point at one product. Chapter text is plain text: a blank line starts a paragraph, `> ` makes a pull quote, `## ` a heading, and `[[image 1]]` puts the first gallery image at that spot.
- **Products:** price, sizes (S / M / L / XL), stock, photos, featured on the home page.
- **Images:** upload, preview, replace (all uses update) and delete.
- **Settings:** top banner, contact details, social links.

Use **Draft / Published** to hide or show anything.
