import { connectDb, sequelize } from '../config/db.js';
import { Product } from '../models/index.js';
import { products, SIZES } from './content.js';

const additions = products.filter(({ ageDays }) => ageDays > 5);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function run() {
  await connectDb({ sync: false });
  let inserted = 0;

  for (const { ageDays, ...product } of additions) {
    const [, created] = await Product.findOrCreate({
      where: { slug: product.slug },
      defaults: {
        ...product,
        availableSizes: SIZES,
        status: 'published',
        createdAt: daysAgo(ageDays),
      },
    });
    if (created) inserted += 1;
  }

  console.log(`Inserted ${inserted} missing shop product(s).`);
}

run()
  .catch((error) => {
    console.error('Shop product seeding failed:', error.name, error.original?.code || error.code || '');
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
