import { Cart, CartItem, Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/respond.js';
import { MAX_QTY_PER_LINE, priceItems, presentLine } from '../services/cartService.js';

// Server cart: owned by the logged-in user, or by a guest via the "X-Cart-Key" header
// (a random string the browser generates). The storefront itself keeps its cart in
// localStorage and uses POST /api/cart/validate; these routes serve logged-in customers
// and API clients.
const KEY_RE = /^[A-Za-z0-9_-]{16,64}$/;

async function findCart(req, { create }) {
  let where;
  let defaults;
  if (req.user) {
    where = { userId: req.user.id };
    defaults = { userId: req.user.id };
  } else {
    const key = req.headers['x-cart-key'];
    if (!key || !KEY_RE.test(key)) throw new ApiError(400, 'Send a cart key (16-64 letters/numbers) in the X-Cart-Key header');
    where = { cartKey: key };
    defaults = { cartKey: key };
  }
  if (!create) return Cart.findOne({ where });
  const [cart] = await Cart.findOrCreate({ where, defaults });
  return cart;
}

async function presentCart(cart) {
  const rows = cart ? await CartItem.findAll({ where: { cartId: cart.id }, order: [['id', 'ASC']] }) : [];
  const { lines, subtotal } = await priceItems(rows.map((r) => ({ productId: r.productId, size: r.size, quantity: r.quantity })));
  const itemIdByKey = new Map(rows.map((r) => [`${r.productId}:${r.size}`, r.id]));
  const items = lines.map((l) => ({ id: itemIdByKey.get(`${l.productId}:${l.size}`), ...presentLine(l) }));
  return { items, itemCount: items.reduce((n, i) => n + i.quantity, 0), subtotal };
}

export const getCart = asyncHandler(async (req, res) => ok(res, await presentCart(await findCart(req, { create: false }))));

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, size, quantity } = req.body;
  const product = await Product.findOne({ where: { id: productId, status: 'published' } });
  if (!product) throw new ApiError(404, 'Product not found');
  if (!product.availableSizes.includes(size)) throw new ApiError(422, `Size ${size} is not available for this product`);
  const limit = Math.min(product.stock, MAX_QTY_PER_LINE);
  if (limit < 1) throw new ApiError(409, 'This product is sold out');

  const cart = await findCart(req, { create: true });
  const existing = await CartItem.findOne({ where: { cartId: cart.id, productId, size } });
  const wanted = (existing?.quantity || 0) + quantity;
  if (wanted > limit) throw new ApiError(409, `Only ${limit} available`);
  if (existing) await existing.update({ quantity: wanted });
  else await CartItem.create({ cartId: cart.id, productId, size, quantity });
  return created(res, await presentCart(cart));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await findCart(req, { create: false });
  const item = cart && (await CartItem.findOne({ where: { id: req.params.itemId, cartId: cart.id } }));
  if (!item) throw new ApiError(404, 'Cart item not found');
  const product = await Product.findByPk(item.productId);
  const limit = product ? Math.min(product.stock, MAX_QTY_PER_LINE) : 0;
  if (req.body.quantity > limit) throw new ApiError(409, limit ? `Only ${limit} available` : 'This product is sold out');
  await item.update({ quantity: req.body.quantity });
  return ok(res, await presentCart(cart));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await findCart(req, { create: false });
  const item = cart && (await CartItem.findOne({ where: { id: req.params.itemId, cartId: cart.id } }));
  if (!item) throw new ApiError(404, 'Cart item not found');
  await item.destroy();
  return ok(res, await presentCart(cart));
});

// Stateless re-pricing used by the storefront cart page and checkout.
export const validateCart = asyncHandler(async (req, res) => {
  const { lines, problems, subtotal } = await priceItems(req.body.items);
  return ok(res, { items: lines.map(presentLine), problems, subtotal });
});
