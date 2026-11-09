import { Product } from '../models/index.js';
import { roundMoney } from '../utils/query.js';

export const MAX_QTY_PER_LINE = 10;

// Takes what the browser THINKS is in the cart and re-checks it against the database:
// does the product exist, is it published, is the size offered, is there stock,
// and what is the REAL price. The browser is never trusted for prices.
export async function priceItems(items, { transaction } = {}) {
  // Merge duplicate lines (same product + size)
  const merged = new Map();
  for (const it of items) {
    const key = `${it.productId}:${it.size}`;
    merged.set(key, { ...it, quantity: (merged.get(key)?.quantity || 0) + it.quantity });
  }

  const ids = [...new Set([...merged.values()].map((i) => i.productId))];
  const products = await Product.findAll({ where: { id: ids, status: 'published' }, transaction });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  const problems = [];
  for (const it of merged.values()) {
    const product = byId.get(it.productId);
    const ref = { productId: it.productId, size: it.size };
    if (!product) {
      problems.push({ ...ref, reason: 'unavailable', message: 'This product is no longer available' });
      continue;
    }
    if (!product.availableSizes.includes(it.size)) {
      problems.push({ ...ref, name: product.name, reason: 'size_unavailable', message: `${product.name} is not offered in size ${it.size}` });
      continue;
    }
    const maxQty = Math.min(product.stock, MAX_QTY_PER_LINE);
    if (maxQty < 1) {
      problems.push({ ...ref, name: product.name, reason: 'sold_out', message: `${product.name} is sold out` });
      continue;
    }
    const quantity = Math.min(it.quantity, maxQty);
    if (quantity < it.quantity) {
      problems.push({ ...ref, name: product.name, reason: 'quantity_reduced', available: maxQty, message: `Only ${maxQty} of ${product.name} available` });
    }
    lines.push({
      product,
      productId: product.id,
      size: it.size,
      quantity,
      unitPrice: product.price,
      lineTotal: roundMoney(product.price * quantity),
    });
  }
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  return { lines, problems, subtotal };
}

// Plain JSON for the API (no Sequelize objects)
export const presentLine = (l) => ({
  productId: l.productId,
  slug: l.product.slug,
  name: l.product.name,
  image: l.product.images[0] || '',
  size: l.size,
  quantity: l.quantity,
  unitPrice: l.unitPrice,
  lineTotal: l.lineTotal,
  stock: l.product.stock,
});
