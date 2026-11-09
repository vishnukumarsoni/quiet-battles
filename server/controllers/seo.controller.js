import { Series, Chapter, Product } from '../models/index.js';
import { env } from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Built from the database, so new series, chapters and products show up automatically.
export const sitemap = asyncHandler(async (_req, res) => {
  const [series, chapters, products] = await Promise.all([
    Series.findAll({ where: { status: 'published' }, attributes: ['slug', 'updatedAt'] }),
    Chapter.findAll({
      where: { status: 'published' },
      attributes: ['slug', 'updatedAt'],
      include: [{ model: Series, as: 'series', attributes: [], where: { status: 'published' }, required: true }],
    }),
    Product.findAll({ where: { status: 'published' }, attributes: ['slug', 'updatedAt'] }),
  ]);

  const urls = [
    ...['/', '/archive', '/shop', '/about', '/contact'].map((p) => ({ loc: p })),
    ...series.map((s) => ({ loc: `/archive/${s.slug}`, lastmod: s.updatedAt })),
    ...chapters.map((c) => ({ loc: `/chapters/${c.slug}`, lastmod: c.updatedAt })),
    ...products.map((p) => ({ loc: `/products/${p.slug}`, lastmod: p.updatedAt })),
  ];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map((u) => `  <url><loc>${esc(env.siteUrl + u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`)
      .join('\n') +
    '\n</urlset>\n';
  res.type('application/xml').send(xml);
});
