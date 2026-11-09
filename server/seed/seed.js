// Usage:
//   npm run seed          -> create tables if missing, then add/update demo content and the admin user
//   npm run seed:fresh    -> DROP every table first, then seed (wipes all data!)
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { sequelize, User, Series, Chapter, Product } from '../models/index.js';
import { products, series, chapters, SIZES } from './content.js';

const fresh = process.argv.includes('--fresh');
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function upsertBySlug(Model, slug, values) {
  const existing = await Model.findOne({ where: { slug } });
  if (existing) return existing.update(values);
  return Model.create({ slug, ...values });
}

async function seedAdmin() {
  const { name, email, password } = env.admin;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first. No default admin is ever created.');
  }
  if (password.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.');

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.scope('withPassword').findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    await existing.update({ name, passwordHash, role: 'admin' });
    console.log(`  admin   updated  ${email}`);
  } else {
    await User.create({ name, email, passwordHash, role: 'admin' });
    console.log(`  admin   created  ${email}`);
  }
}

async function run() {
  if (fresh) {
    console.log('Dropping all tables...');
    await sequelize.drop();
  }
  await sequelize.sync();
  console.log('Seeding...');

  await seedAdmin();

  const productBySlug = {};
  for (const { ageDays, ...p } of products) {
    // eslint-disable-next-line no-await-in-loop
    productBySlug[p.slug] = await upsertBySlug(Product, p.slug, {
      ...p,
      availableSizes: SIZES,
      status: 'published',
      createdAt: daysAgo(ageDays),
    });
  }
  console.log(`  products  ${products.length}`);

  const seriesRow = await upsertBySlug(Series, series.slug, series);
  console.log(`  series    ${seriesRow.title}`);

  for (const c of chapters) {
    const [cover, ...gallery] = c.images.map((n) => `/placeholders/${n}.jpg`);
    // eslint-disable-next-line no-await-in-loop
    await upsertBySlug(Chapter, c.slug, {
      title: c.title,
      chapterNumber: c.chapterNumber,
      seriesId: seriesRow.id,
      description: c.description,
      storyContent: c.storyContent,
      coverImage: cover,
      galleryImages: gallery,
      relatedProductId: productBySlug[c.productSlug].id,
      status: 'published',
    });
  }
  console.log(`  chapters  ${chapters.length}`);
  console.log('Done.');
}

run()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await sequelize.close();
    process.exit(1);
  });
