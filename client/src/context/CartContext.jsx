import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../services';

const KEY = 'qb_cart_v1';
export const MAX_PER_LINE = 10;

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

// Read the saved cart. If storage is blocked or the data is damaged, start with an empty cart.
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(raw)) return [];
    return raw.filter((i) => i && i.productId && i.size && Number(i.quantity) > 0);
  } catch {
    return [];
  }
}

// The most a shopper can put in one line: our hard limit, or what is in stock.
const limitFor = (item) => Math.max(1, Math.min(MAX_PER_LINE, item.stock ?? MAX_PER_LINE));
const same = (a, b) => a.productId === b.productId && a.size === b.size;

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  // Save on every change
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* private mode: the cart simply lives for this visit */
    }
  }, [items]);

  // Keep several open tabs in step
  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setItems(load());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product, size, quantity = 1) => {
    let result = { ok: true };
    setItems((current) => {
      const incoming = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images?.[0] || '',
        price: product.price,
        stock: product.stock,
        size,
        quantity: 0,
      };
      const found = current.find((i) => same(i, incoming));
      const max = limitFor(incoming);
      const wanted = (found?.quantity || 0) + quantity;
      if (wanted > max) result = { ok: false, max };
      const next = Math.min(wanted, max);
      if (found) return current.map((i) => (same(i, incoming) ? { ...i, ...incoming, quantity: next } : i));
      return [...current, { ...incoming, quantity: next }];
    });
    return result;
  }, []);

  const setQuantity = useCallback((productId, size, quantity) => {
    setItems((current) =>
      current.map((i) =>
        same(i, { productId, size })
          ? { ...i, quantity: Math.min(Math.max(Math.floor(Number(quantity)) || 1, 1), limitFor(i)) }
          : i
      )
    );
  }, []);

  const remove = useCallback((productId, size) => {
    setItems((current) => current.filter((i) => !same(i, { productId, size })));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  // Ask the server for today's prices and stock, so an old cart never shows stale numbers.
  const sync = useCallback(async () => {
    if (items.length === 0) return [];
    const { data } = await cartApi.validate(items.map(({ productId, size, quantity }) => ({ productId, size, quantity })));
    const fresh = new Map(data.items.map((l) => [`${l.productId}:${l.size}`, l]));
    setItems((current) =>
      current
        .filter((i) => fresh.has(`${i.productId}:${i.size}`))
        .map((i) => {
          const l = fresh.get(`${i.productId}:${i.size}`);
          return { ...i, name: l.name, slug: l.slug, image: l.image, price: l.unitPrice, stock: l.stock, quantity: l.quantity };
        })
    );
    return data.problems;
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100,
      add,
      setQuantity,
      remove,
      clear,
      sync,
    }),
    [items, add, setQuantity, remove, clear, sync]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
