// Integration tests: they boot the real Express app on a throw-away SQLite database
// and call it over HTTP, exactly like the browser does.   Run:  npm test
import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qb-test-'));
process.env.NODE_ENV = 'test';
process.env.SQLITE_PATH = path.join(tmp, 'test.sqlite');
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456';
process.env.CLIENT_URL = 'http://localhost:5173';
// Default: throw-away SQLite file. To run the same suite on PostgreSQL:
//   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/qb_test npm test
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
else delete process.env.DATABASE_URL;
delete process.env.CLOUDINARY_CLOUD_NAME;

const { connectDb, sequelize } = await import('../config/db.js');
const { createApp } = await import('../app.js');
const { User } = await import('../models/index.js');
const bcrypt = (await import('bcryptjs')).default;

let server;
let base;
const ADMIN = { email: 'admin@test.dev', password: 'a-strong-password-1' };
let adminToken;
let customerToken;

async function call(method, url, { body, token, headers = {}, form } = {}) {
  const opts = { method, headers: { ...headers } };
  if (token) opts.headers.authorization = `Bearer ${token}`;
  if (form) opts.body = form;
  else if (body !== undefined && method !== 'GET') {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(base + url, opts);
  let json = null;
  try { json = await res.json(); } catch { /* not json */ }
  return { status: res.status, body: json, headers: res.headers };
}

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const pngForm = (name = 'image', filename = 'pixel.png', type = 'image/png', data = png) => {
  const f = new FormData();
  f.append(name, new Blob([data], { type }), filename);
  return f;
};

before(async () => {
  await connectDb();
  await sequelize.sync({ force: true });
  await User.scope('withPassword').create({ name: 'Admin', email: ADMIN.email, passwordHash: await bcrypt.hash(ADMIN.password, 4), role: 'admin' });
  await User.create({ name: 'Cust', email: 'cust@test.dev', passwordHash: await bcrypt.hash('customer-password-1', 4), role: 'customer' });
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const adminLogin = await call('POST', '/auth/login', { body: ADMIN });
  adminToken = adminLogin.headers.get('set-cookie').match(/qb_token=([^;]+)/)[1];
  const customerLogin = await call('POST', '/auth/login', { body: { email: 'cust@test.dev', password: 'customer-password-1' } });
  customerToken = customerLogin.headers.get('set-cookie').match(/qb_token=([^;]+)/)[1];
});

after(async () => {
  server.close();
  await sequelize.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const productBody = (over = {}) => ({ name: 'Test Tee', price: 1000, stock: 3, category: 'Tops', description: 'A tee', images: ['/placeholders/p1-1.jpg'], availableSizes: ['S', 'M'], status: 'published', ...over });

describe('authentication', () => {
  it('rejects a wrong password with 401 and a generic message', async () => {
    const r = await call('POST', '/auth/login', { body: { email: ADMIN.email, password: 'nope-nope-nope' } });
    assert.equal(r.status, 401);
    assert.equal(r.body.message, 'Invalid email or password');
  });
  it('rejects an unknown email with the same message', async () => {
    const r = await call('POST', '/auth/login', { body: { email: 'nobody@test.dev', password: 'whatever-123' } });
    assert.equal(r.status, 401);
    assert.equal(r.body.message, 'Invalid email or password');
  });
  it('validates the login body (422)', async () => {
    const r = await call('POST', '/auth/login', { body: { email: 'not-an-email', password: '' } });
    assert.equal(r.status, 422);
    assert.ok(Array.isArray(r.body.errors));
  });
  it('sets an httpOnly cookie and never returns the password hash', async () => {
    const r = await call('POST', '/auth/login', { body: ADMIN });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('set-cookie'), /qb_token=.*HttpOnly/i);
    assert.equal(Object.hasOwn(r.body.data, 'token'), false);
    assert.equal(JSON.stringify(r.body).includes('passwordHash'), false);
  });
  it('GET /auth/me needs a token, then returns the user', async () => {
    assert.equal((await call('GET', '/auth/me')).status, 401);
    const r = await call('GET', '/auth/me', { token: adminToken });
    assert.equal(r.body.data.user.role, 'admin');
  });
  it('rejects a garbage token', async () => {
    assert.equal((await call('GET', '/auth/me', { token: 'abc.def.ghi' })).status, 401);
  });
  it('logout clears the cookie', async () => {
    const r = await call('POST', '/auth/logout');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('set-cookie'), /qb_token=;/);
  });
});

describe('role based access control', () => {
  const adminRoutes = [
    ['POST', '/series'], ['POST', '/chapters'], ['POST', '/products'], ['GET', '/orders'],
    ['GET', '/admin/stats'], ['GET', '/upload'], ['PUT', '/settings'], ['GET', '/contact'], ['GET', '/newsletter'],
  ];
  for (const [method, url] of adminRoutes) {
    it(`${method} ${url}: 401 without login, 403 for a customer`, async () => {
      assert.equal((await call(method, url, { body: {} })).status, 401);
      assert.equal((await call(method, url, { token: customerToken, body: {} })).status, 403);
    });
  }
});

describe('series, chapters and products (CRUD + relationships)', () => {
  let series; let chapter; let product;

  it('creates a product and rejects invalid ones', async () => {
    const bad = await call('POST', '/products', { token: adminToken, body: productBody({ price: -5, availableSizes: ['XXL'] }) });
    assert.equal(bad.status, 422);
    const ok = await call('POST', '/products', { token: adminToken, body: productBody() });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.data.slug, 'test-tee');
    assert.equal(typeof ok.body.data.price, 'number');
    product = ok.body.data;
  });

  it('gives duplicate names a unique slug', async () => {
    const r = await call('POST', '/products', { token: adminToken, body: productBody() });
    assert.equal(r.body.data.slug, 'test-tee-2');
    await call('DELETE', `/products/${r.body.data.id}`, { token: adminToken });
  });

  it('ignores fields a client should not set (id, createdAt)', async () => {
    const r = await call('POST', '/products', { token: adminToken, body: productBody({ name: 'Mass Assign', id: 9999, createdAt: '2000-01-01' }) });
    assert.notEqual(r.body.data.id, 9999);
    assert.notEqual(r.body.data.createdAt.slice(0, 4), '2000');
    await call('DELETE', `/products/${r.body.data.id}`, { token: adminToken });
  });

  it('creates a series and a chapter linked to it and to the product', async () => {
    const s = await call('POST', '/series', { token: adminToken, body: { title: 'Series Test', seriesNumber: 7, status: 'published', description: 'd' } });
    assert.equal(s.status, 201);
    series = s.body.data;
    const dupNumber = await call('POST', '/series', { token: adminToken, body: { title: 'Another', seriesNumber: 7 } });
    assert.equal(dupNumber.status, 409);

    const c = await call('POST', '/chapters', { token: adminToken, body: { title: 'Chapter One', chapterNumber: 1, seriesId: series.id, relatedProductId: product.id, status: 'published', storyContent: 'Hello\n\n> quote' } });
    assert.equal(c.status, 201);
    chapter = c.body.data;
    const dupChapter = await call('POST', '/chapters', { token: adminToken, body: { title: 'Dup', chapterNumber: 1, seriesId: series.id } });
    assert.equal(dupChapter.status, 409);
  });

  it('rejects a chapter with a series or product that does not exist', async () => {
    const a = await call('POST', '/chapters', { token: adminToken, body: { title: 'Ghost', chapterNumber: 2, seriesId: 9999 } });
    assert.equal(a.status, 422);
    const b = await call('POST', '/chapters', { token: adminToken, body: { title: 'Ghost', chapterNumber: 2, seriesId: series.id, relatedProductId: 9999 } });
    assert.equal(b.status, 422);
  });

  it('public chapter response includes series, related product and navigation', async () => {
    const c2 = await call('POST', '/chapters', { token: adminToken, body: { title: 'Chapter Two', chapterNumber: 2, seriesId: series.id, status: 'published' } });
    const r = await call('GET', `/chapters/${chapter.slug}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.data.series.slug, series.slug);
    assert.equal(r.body.data.relatedProduct.id, product.id);
    assert.equal(r.body.data.nextChapter.slug, 'chapter-two');
    assert.equal(r.body.data.prevChapter, null);
    await call('DELETE', `/chapters/${c2.body.data.id}`, { token: adminToken });
  });

  it('the series page lists its published chapters in order, without the long story text', async () => {
    const r = await call('GET', `/series/${series.slug}`);
    assert.equal(r.body.data.chapters.length, 1);
    assert.equal('storyContent' in r.body.data.chapters[0], false);
  });

  it('drafts are hidden from the public but visible to the admin', async () => {
    await call('PUT', `/chapters/${chapter.id}`, { token: adminToken, body: { status: 'draft' } });
    assert.equal((await call('GET', `/chapters/${chapter.slug}`)).status, 404);
    assert.equal((await call('GET', `/chapters/${chapter.slug}`, { token: adminToken })).status, 200);
    assert.equal((await call('GET', `/series/${series.slug}`)).body.data.chapters.length, 0);
    await call('PUT', `/chapters/${chapter.id}`, { token: adminToken, body: { status: 'published' } });
  });

  it('an unpublished series hides its chapters too', async () => {
    await call('PUT', `/series/${series.id}`, { token: adminToken, body: { status: 'draft' } });
    assert.equal((await call('GET', `/series/${series.slug}`)).status, 404);
    assert.equal((await call('GET', `/chapters/${chapter.slug}`)).status, 404);
    await call('PUT', `/series/${series.id}`, { token: adminToken, body: { status: 'published' } });
  });

  it('refuses to delete a series that still has chapters (409)', async () => {
    const r = await call('DELETE', `/series/${series.id}`, { token: adminToken });
    assert.equal(r.status, 409);
  });

  it('deleting a product only clears the chapter link', async () => {
    const tmpProduct = (await call('POST', '/products', { token: adminToken, body: productBody({ name: 'Temp' }) })).body.data;
    await call('PUT', `/chapters/${chapter.id}`, { token: adminToken, body: { relatedProductId: tmpProduct.id } });
    assert.equal((await call('DELETE', `/products/${tmpProduct.id}`, { token: adminToken })).status, 200);
    const r = await call('GET', `/chapters/${chapter.id}`, { token: adminToken });
    assert.equal(r.body.data.relatedProductId, null);
    await call('PUT', `/chapters/${chapter.id}`, { token: adminToken, body: { relatedProductId: product.id } });
  });

  it('product list: search, filter, sort, pagination meta', async () => {
    await call('POST', '/products', { token: adminToken, body: productBody({ name: 'Cheap Hat', price: 200, category: 'Hats' }) });
    const search = await call('GET', '/products?q=hat');
    assert.equal(search.body.data.length, 1);
    const byCat = await call('GET', '/products?category=Hats');
    assert.equal(byCat.body.data[0].name, 'Cheap Hat');
    const sorted = await call('GET', '/products?sort=price_asc');
    assert.equal(sorted.body.data[0].name, 'Cheap Hat');
    assert.equal(sorted.body.meta.page, 1);
    assert.ok(sorted.body.meta.categories.includes('Hats'));
    const paged = await call('GET', '/products?limit=1&page=2');
    assert.equal(paged.body.data.length, 1);
    assert.equal(paged.body.meta.totalPages, 2);
  });

  it('SQL injection style input in search and sort does not break or leak', async () => {
    const a = await call('GET', `/products?q=${encodeURIComponent("' OR 1=1 --")}`);
    assert.equal(a.status, 200);
    assert.equal(a.body.data.length, 0);
    const b = await call('GET', `/products?sort=${encodeURIComponent('price; DROP TABLE products')}`);
    assert.equal(b.status, 200);
  });

  it('PUT validates and returns 404 for a missing record', async () => {
    assert.equal((await call('PUT', `/products/${product.id}`, { token: adminToken, body: { price: 'free' } })).status, 422);
    assert.equal((await call('PUT', '/products/99999', { token: adminToken, body: { stock: 1 } })).status, 404);
    assert.equal((await call('GET', '/products/not-a-product')).status, 404);
    assert.equal((await call('DELETE', '/products/abc', { token: adminToken })).status, 422);
  });

  it('product detail returns related products and its chapter link', async () => {
    const r = await call('GET', `/products/${product.slug}`);
    assert.equal(r.body.data.chapter.slug, 'chapter-one');
    assert.ok(Array.isArray(r.body.data.related));
    assert.ok(r.body.data.related.every((p) => p.id !== product.id));
  });
});

describe('cart and orders', () => {
  let p;
  const customer = { name: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765 43210' };
  const address = { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'India' };

  before(async () => {
    p = (await call('POST', '/products', { token: adminToken, body: productBody({ name: 'Order Tee', price: 500, stock: 3, availableSizes: ['M', 'L'] }) })).body.data;
  });

  it('POST /cart/validate recalculates the price from the database', async () => {
    const r = await call('POST', '/cart/validate', { body: { items: [{ productId: p.id, size: 'M', quantity: 2 }] } });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.subtotal, 1000);
    assert.equal(r.body.data.items[0].unitPrice, 500);
  });

  it('cart validation reports a size that is not offered and quantity above stock', async () => {
    const r = await call('POST', '/cart/validate', { body: { items: [{ productId: p.id, size: 'L', quantity: 9 }, { productId: p.id, size: 'M', quantity: 1 }] } });
    assert.equal(r.body.data.problems.find((x) => x.size === 'L').reason, 'quantity_reduced');
    assert.equal(r.body.data.items.find((x) => x.size === 'L').quantity, 3);
  });

  it('rejects invalid cart input', async () => {
    assert.equal((await call('POST', '/cart/validate', { body: { items: [] } })).status, 422);
    assert.equal((await call('POST', '/cart/validate', { body: { items: [{ productId: p.id, size: 'XXL', quantity: 1 }] } })).status, 422);
    assert.equal((await call('POST', '/cart/validate', { body: { items: [{ productId: p.id, size: 'M', quantity: 0 }] } })).status, 422);
  });

  it('server cart: add, update, remove with a guest cart key', async () => {
    const key = 'guest-cart-key-1234567890';
    const h = { 'x-cart-key': key };
    assert.equal((await call('GET', '/cart')).status, 400);
    const add = await call('POST', '/cart', { headers: h, body: { productId: p.id, size: 'M', quantity: 1 } });
    assert.equal(add.status, 201);
    const again = await call('POST', '/cart', { headers: h, body: { productId: p.id, size: 'M', quantity: 1 } });
    assert.equal(again.body.data.items[0].quantity, 2);
    const itemId = again.body.data.items[0].id;
    const upd = await call('PUT', `/cart/${itemId}`, { headers: h, body: { quantity: 3 } });
    assert.equal(upd.body.data.itemCount, 3);
    assert.equal((await call('PUT', `/cart/${itemId}`, { headers: h, body: { quantity: 4 } })).status, 409);
    const del = await call('DELETE', `/cart/${itemId}`, { headers: h });
    assert.equal(del.body.data.items.length, 0);
    assert.equal((await call('DELETE', `/cart/${itemId}`, { headers: h })).status, 404);
  });

  it('placing an order validates the form', async () => {
    const r = await call('POST', '/orders', { body: { customer: { name: 'A', email: 'bad' }, shippingAddress: {}, items: [] } });
    assert.equal(r.status, 422);
  });

  it('creates an order, takes stock, and ignores prices sent by the browser', async () => {
    const r = await call('POST', '/orders', { body: { customer, shippingAddress: address, items: [{ productId: p.id, size: 'M', quantity: 2, price: 1 }] } });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.totalAmount, 1000);
    assert.equal(r.body.data.paymentStatus, 'pending');
    assert.match(r.body.data.orderNumber, /^QB-\d{8}-[0-9A-F]{6}$/);
    const after = await call('GET', `/products/${p.id}`, { token: adminToken });
    assert.equal(after.body.data.stock, 1);
  });

  it('refuses to oversell the last item', async () => {
    const r = await call('POST', '/orders', { body: { customer, shippingAddress: address, items: [{ productId: p.id, size: 'M', quantity: 2 }] } });
    assert.equal(r.status, 409);
    assert.equal((await call('GET', `/products/${p.id}`, { token: adminToken })).body.data.stock, 1);
  });

  it('two orders at the same moment cannot both take the last unit', async () => {
    const attempt = () => call('POST', '/orders', { body: { customer, shippingAddress: address, items: [{ productId: p.id, size: 'L', quantity: 1 }] } });
    const results = await Promise.all([attempt(), attempt()]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal((await call('GET', `/products/${p.id}`, { token: adminToken })).body.data.stock, 0);
  });

  it('a snapshot keeps the old price after the product changes', async () => {
    await call('PUT', `/products/${p.id}`, { token: adminToken, body: { price: 9999, stock: 5 } });
    const list = await call('GET', '/orders', { token: adminToken });
    const order = list.body.data.find((o) => o.items[0].name === 'Order Tee' && o.totalAmount === 1000);
    assert.equal(order.items[0].price, 500);
  });

  it('draft products cannot be bought', async () => {
    const d = (await call('POST', '/products', { token: adminToken, body: productBody({ name: 'Secret', status: 'draft' }) })).body.data;
    const r = await call('POST', '/orders', { body: { customer, shippingAddress: address, items: [{ productId: d.id, size: 'S', quantity: 1 }] } });
    assert.equal(r.status, 409);
  });

  it('admin can list, filter, search and update orders; cancelling restocks once', async () => {
    const fresh = (await call('POST', '/orders', { body: { customer, shippingAddress: address, items: [{ productId: p.id, size: 'M', quantity: 2 }] } })).body.data;
    const stockBefore = (await call('GET', `/products/${p.id}`, { token: adminToken })).body.data.stock;
    assert.equal((await call('GET', `/orders?q=${fresh.orderNumber}`, { token: adminToken })).body.data.length, 1);
    assert.equal((await call('PUT', `/orders/${fresh.id}`, { token: adminToken, body: { orderStatus: 'bogus' } })).status, 422);
    assert.equal((await call('PUT', `/orders/${fresh.id}`, { token: adminToken, body: { orderStatus: 'shipped', paymentStatus: 'paid' } })).body.data.orderStatus, 'shipped');
    await call('PUT', `/orders/${fresh.id}`, { token: adminToken, body: { orderStatus: 'cancelled' } });
    await call('PUT', `/orders/${fresh.id}`, { token: adminToken, body: { orderStatus: 'cancelled' } });
    assert.equal((await call('GET', `/products/${p.id}`, { token: adminToken })).body.data.stock, stockBefore + 2);
    assert.equal((await call('PUT', `/orders/${fresh.id}`, { token: adminToken, body: { orderStatus: 'pending' } })).status, 409);
    assert.equal((await call('GET', '/orders/99999', { token: adminToken })).status, 404);
  });

  it('dashboard stats count everything', async () => {
    const r = await call('GET', '/admin/stats', { token: adminToken });
    assert.ok(r.body.data.totals.orders >= 3);
    assert.ok(r.body.data.totals.products >= 1);
    assert.ok(Array.isArray(r.body.data.recentOrders));
  });
});

describe('image upload', () => {
  let media;
  it('uploads a real PNG', async () => {
    const r = await call('POST', '/upload', { token: adminToken, form: pngForm('images') });
    assert.equal(r.status, 201);
    media = r.body.data[0];
    assert.match(media.url, /^\/uploads\/.+\.png$/);
    assert.ok(fs.existsSync(path.join(process.env.UPLOAD_DIR, media.publicId)));
  });
  it('serves the uploaded file', async () => {
    const res = await fetch(base.replace('/api', '') + media.url);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');
  });
  it('rejects a non-image content type', async () => {
    const r = await call('POST', '/upload', { token: adminToken, form: pngForm('image', 'a.pdf', 'application/pdf') });
    assert.equal(r.status, 400);
  });
  it('rejects a fake image (wrong file signature)', async () => {
    const r = await call('POST', '/upload', { token: adminToken, form: pngForm('image', 'evil.png', 'image/png', Buffer.from('<?php echo 1; ?> not an image at all')) });
    assert.equal(r.status, 400);
    assert.match(r.body.message, /not a valid image/);
  });
  it('rejects files over 5 MB', async () => {
    const big = Buffer.concat([png, Buffer.alloc(5.5 * 1024 * 1024)]);
    const r = await call('POST', '/upload', { token: adminToken, form: pngForm('image', 'big.png', 'image/png', big) });
    assert.equal(r.status, 400);
    assert.match(r.body.message, /too large/);
  });
  it('requires a file', async () => {
    assert.equal((await call('POST', '/upload', { token: adminToken, form: new FormData() })).status, 400);
  });
  it('lists uploaded media', async () => {
    const r = await call('GET', '/upload', { token: adminToken });
    assert.ok(r.body.data.some((m) => m.id === media.id));
  });
  it('deleting an image that is in use is blocked unless forced, and force cleans the references', async () => {
    const prod = (await call('POST', '/products', { token: adminToken, body: productBody({ name: 'With Image', images: [media.url] }) })).body.data;
    const blocked = await call('DELETE', `/upload/${media.id}`, { token: adminToken });
    assert.equal(blocked.status, 409);
    assert.equal(blocked.body.errors[0].type, 'product');
    const forced = await call('DELETE', `/upload/${media.id}?force=true`, { token: adminToken });
    assert.equal(forced.status, 200);
    assert.equal(fs.existsSync(path.join(process.env.UPLOAD_DIR, media.publicId)), false);
    assert.deepEqual((await call('GET', `/products/${prod.id}`, { token: adminToken })).body.data.images, []);
  });
  it('replacing an image rewrites the URL everywhere it is used', async () => {
    const up = (await call('POST', '/upload', { token: adminToken, form: pngForm('image') })).body.data[0];
    const prod = (await call('POST', '/products', { token: adminToken, body: productBody({ name: 'Replace Me', images: [up.url] }) })).body.data;
    const rep = await call('PUT', `/upload/${up.id}`, { token: adminToken, form: pngForm('image', 'new.png') });
    assert.equal(rep.status, 200);
    assert.notEqual(rep.body.data.url, up.url);
    const after = await call('GET', `/products/${prod.id}`, { token: adminToken });
    assert.deepEqual(after.body.data.images, [rep.body.data.url]);
    assert.equal(fs.existsSync(path.join(process.env.UPLOAD_DIR, up.publicId)), false);
  });
});

describe('settings, forms, security and misc', () => {
  it('settings are public to read and admin-only to change', async () => {
    assert.equal((await call('GET', '/settings')).body.data.siteName, 'QUIET BATTLES™');
    const r = await call('PUT', '/settings', { token: adminToken, body: { tagline: 'New tagline', hacker: 'x' } });
    assert.equal(r.body.data.tagline, 'New tagline');
    assert.equal('hacker' in r.body.data, false);
  });
  it('contact form: validates, stores, admin can read', async () => {
    assert.equal((await call('POST', '/contact', { body: { name: 'A', email: 'x', message: 'hi' } })).status, 422);
    assert.equal((await call('POST', '/contact', { body: { name: 'Asha', email: 'asha@example.com', message: 'Hello, I love the hoodie.' } })).status, 201);
    assert.equal((await call('GET', '/contact', { token: adminToken })).body.data.length, 1);
  });
  it('newsletter: validates and de-duplicates', async () => {
    assert.equal((await call('POST', '/newsletter', { body: { email: 'bad' } })).status, 422);
    await call('POST', '/newsletter', { body: { email: 'Fan@Example.com' } });
    await call('POST', '/newsletter', { body: { email: 'fan@example.com' } });
    assert.equal((await call('GET', '/newsletter', { token: adminToken })).body.data.length, 1);
  });
  it('change password needs the current password', async () => {
    assert.equal((await call('PUT', '/auth/password', { token: adminToken, body: { currentPassword: 'wrong-wrong', newPassword: 'another-strong-pass' } })).status, 401);
    assert.equal((await call('PUT', '/auth/password', { token: adminToken, body: { currentPassword: ADMIN.password, newPassword: 'short' } })).status, 422);
    assert.equal((await call('PUT', '/auth/password', { token: adminToken, body: { currentPassword: ADMIN.password, newPassword: 'another-strong-pass' } })).status, 200);
    assert.equal((await call('GET', '/auth/me', { token: adminToken })).status, 401);
    const login = await call('POST', '/auth/login', { body: { email: ADMIN.email, password: 'another-strong-pass' } });
    assert.equal(login.status, 200);
    adminToken = login.headers.get('set-cookie').match(/qb_token=([^;]+)/)[1];
    assert.equal((await call('GET', '/auth/me', { token: adminToken })).status, 200);
  });
  it('unknown routes and bad JSON return JSON errors', async () => {
    const a = await call('GET', '/nope');
    assert.equal(a.status, 404);
    assert.equal(a.body.success, false);
    const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad json' });
    assert.equal(res.status, 400);
  });
  it('sends security headers (Helmet) and hides X-Powered-By', async () => {
    const r = await call('GET', '/health');
    assert.equal(r.headers.get('x-powered-by'), null);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(r.headers.get('strict-transport-security'));
  });
  it('CORS allows the configured client and blocks others', async () => {
    const ok = await fetch(`${base}/health`, { headers: { origin: 'http://localhost:5173' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const bad = await fetch(`${base}/health`, { headers: { origin: 'https://evil.example' } });
    assert.equal(bad.status, 403);
  });
  it('sitemap lists published pages only', async () => {
    const res = await fetch(base.replace('/api', '') + '/sitemap.xml');
    const xml = await res.text();
    assert.match(xml, /<urlset/);
    assert.match(xml, /\/products\/test-tee/);
    assert.equal(xml.includes('secret'), false);
  });
});
