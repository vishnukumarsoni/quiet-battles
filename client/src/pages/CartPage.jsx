import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import Img from '../components/Img';
import { EmptyState } from '../components/States';

export default function CartPage() {
  useDocumentTitle('Your cart');
  const { items, count, subtotal, setQuantity, remove, sync } = useCart();
  const toast = useToast();
  const [notices, setNotices] = useState([]);

  // When the cart page opens, double-check prices and stock with the server once.
  useEffect(() => {
    let alive = true;
    sync()
      .then((problems) => alive && setNotices(problems.map((p) => p.message)))
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="container-x">
        <EmptyState title="Your cart is empty" text="Nothing here yet. Pieces you add will wait for you here, even if you close the tab." action={{ to: '/shop', label: 'Browse the shop' }} />
      </div>
    );
  }

  return (
    <div className="container-x">
      <h1 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none">Your cart <span className="text-ash text-3xl align-top">({count})</span></h1>

      {notices.length > 0 && (
        <div role="alert" className="mt-8 border border-clay/40 bg-clay/5 px-5 py-4 text-sm text-clay">
          {notices.map((n) => <p key={n}>{n}</p>)}
        </div>
      )}

      <div className="mt-12 grid gap-14 lg:grid-cols-12">
        <ul className="divide-y divide-graphite border-y border-graphite lg:col-span-8">
          {items.map((i) => (
            <li key={`${i.productId}-${i.size}`} className="grid grid-cols-[88px_1fr] gap-5 py-6 sm:grid-cols-[120px_1fr_auto]">
              <Link to={`/products/${i.slug}`}><Img src={i.image} alt={i.name} ratio="4/5" className="w-full" /></Link>
              <div className="flex flex-col">
                <Link to={`/products/${i.slug}`} className="text-[15px] hover:text-clay">{i.name}</Link>
                <p className="mt-1 text-xs uppercase tracking-wider2 text-ash">Size {i.size}</p>
                <p className="mt-1 text-sm text-ash">{formatPrice(i.price)}</p>
                <div className="mt-auto flex items-center gap-5 pt-4">
                  <div className="flex items-center border border-graphite" role="group" aria-label={`Quantity for ${i.name}`}>
                    <button onClick={() => setQuantity(i.productId, i.size, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center hover:bg-coal disabled:opacity-30"><Minus size={13} /></button>
                    <span className="w-8 text-center text-sm tabular-nums">{i.quantity}</span>
                    <button
                      onClick={() => {
                        if (i.quantity >= Math.min(10, i.stock ?? 10)) toast.error(`Only ${Math.min(10, i.stock ?? 10)} available.`);
                        else setQuantity(i.productId, i.size, i.quantity + 1);
                      }}
                      aria-label="Increase quantity"
                      className="grid h-9 w-9 place-items-center hover:bg-coal"
                    ><Plus size={13} /></button>
                  </div>
                  <button onClick={() => remove(i.productId, i.size)} className="link-line text-[11px] uppercase tracking-wider2 text-ash hover:text-bone">Remove</button>
                </div>
              </div>
              <p className="col-start-2 text-sm tabular-nums sm:col-start-3 sm:text-right">{formatPrice(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-graphite bg-coal p-7 lg:col-span-4 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="eyebrow">Summary</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between"><dt className="text-ash">Subtotal</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ash">Shipping</dt><dd className="text-ash">Free (demo)</dd></div>
            <div className="flex justify-between border-t border-graphite pt-5 font-display text-3xl"><dt>Total</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
          </dl>
          <Link to="/checkout" className="btn btn-solid mt-8 w-full">Checkout</Link>
          <Link to="/shop" className="link-line mt-5 block text-center text-[11px] uppercase tracking-wider2 text-ash">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
