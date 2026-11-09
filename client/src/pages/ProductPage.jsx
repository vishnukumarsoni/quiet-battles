import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronDown, Minus, Plus } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFetch from '../hooks/useFetch';
import { productsApi } from '../services';
import { useCart, MAX_PER_LINE } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, pad } from '../utils/format';
import Img from '../components/Img';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import { ErrorState, Spinner } from '../components/States';

const ALL_SIZES = ['S', 'M', 'L', 'XL'];

export default function ProductPage() {
  const { slug } = useParams();
  const { data: p, loading, error, reload } = useFetch(() => productsApi.get(slug), [slug]);
  const { add, items } = useCart();
  const toast = useToast();

  const [active, setActive] = useState(0);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [open, setOpen] = useState('details');

  useDocumentTitle(p?.name || 'Product', p?.description);

  // reset the form when the shopper moves to another product
  useEffect(() => {
    setActive(0);
    setSize('');
    setQty(1);
    setSizeError(false);
    setJustAdded(false);
  }, [slug]);

  if (loading) return <div className="pt-20"><Spinner label="Loading piece" /></div>;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const soldOut = p.stock < 1;
  const max = Math.min(p.stock, MAX_PER_LINE);
  const inCart = size ? items.find((i) => i.productId === p.id && i.size === size)?.quantity || 0 : 0;
  const availability = soldOut ? 'Sold out' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock';

  function onAdd() {
    if (!size) {
      setSizeError(true);
      return;
    }
    const result = add(p, size, qty);
    if (!result.ok) {
      toast.error(`You can have at most ${result.max} of this in your cart.`);
      return;
    }
    toast.success(`${p.name} (${size}) added to your cart.`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  const sections = [
    { id: 'details', title: 'Product details', body: <ul className="space-y-2">{p.details.map((d) => <li key={d} className="flex gap-3"><span className="mt-2 h-px w-3 shrink-0 bg-clay" />{d}</li>)}</ul> },
    { id: 'shipping', title: 'Shipping & returns', body: <p>Demo store: nothing is shipped. In a live store this section would list delivery times, costs and the return window.</p> },
  ];

  return (
    <div className="container-x pb-10">
      <nav aria-label="Breadcrumb" className="eyebrow mb-8">
        <Link to="/shop" className="hover:text-bone">Shop</Link> / {p.category} / <span className="text-bone/80">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        {/* gallery */}
        <div className="lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-[84px_1fr]">
            <div className="order-2 flex gap-3 sm:order-1 sm:flex-col" role="tablist" aria-label="Product images">
              {p.images.map((src, i) => (
                <button
                  key={src}
                  role="tab"
                  aria-selected={active === i}
                  aria-label={`Show image ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`w-20 shrink-0 border transition-colors sm:w-full ${active === i ? 'border-clay' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <Img src={src} alt="" ratio="4/5" className="w-full" />
                </button>
              ))}
            </div>
            <div className="order-1 sm:order-2">
              <Img src={p.images[active]} alt={`${p.name}, image ${active + 1}`} ratio="4/5" eager className="w-full" />
            </div>
          </div>
        </div>

        {/* info */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          {p.chapter && (
            <Link to={`/chapters/${p.chapter.slug}`} className="eyebrow link-line !text-clay">
              Series {pad(p.chapter.series.seriesNumber)} · Chapter {pad(p.chapter.chapterNumber)}
            </Link>
          )}
          <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">{p.name}</h1>
          <p className="mt-5 font-display text-3xl">{formatPrice(p.price)}</p>
          <p className={`mt-2 text-xs uppercase tracking-wider2 ${soldOut ? 'text-[#e2958c]' : p.stock <= 5 ? 'text-clay' : 'text-ash'}`}>{availability}</p>

          <p className="mt-8 text-[15px] leading-relaxed text-bone/80">{p.description}</p>

          <fieldset className="mt-10">
            <legend className="flex w-full justify-between">
              <span className="field-label !mb-3">Size</span>
              {sizeError && <span role="alert" className="text-xs text-[#e2958c]">Please choose a size</span>}
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {ALL_SIZES.map((s) => {
                const offered = p.availableSizes.includes(s);
                return (
                  <label key={s} className={`${offered && !soldOut ? 'cursor-pointer' : 'cursor-not-allowed opacity-30 line-through'}`}>
                    <input
                      type="radio"
                      name="size"
                      value={s}
                      disabled={!offered || soldOut}
                      checked={size === s}
                      onChange={() => { setSize(s); setSizeError(false); }}
                      className="peer sr-only"
                    />
                    <span className="block border border-graphite py-3 text-center text-sm transition-colors peer-checked:border-bone peer-checked:bg-bone peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-clay hover:border-ash">
                      {s}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-graphite" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || soldOut} aria-label="Decrease quantity" className="grid h-12 w-12 place-items-center hover:bg-coal disabled:opacity-30"><Minus size={14} /></button>
              <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max || soldOut} aria-label="Increase quantity" className="grid h-12 w-12 place-items-center hover:bg-coal disabled:opacity-30"><Plus size={14} /></button>
            </div>
            <button type="button" onClick={onAdd} disabled={soldOut} className="btn btn-solid h-12 flex-1">
              {soldOut ? 'Sold out' : justAdded ? <><Check size={14} /> Added</> : 'Add to cart'}
            </button>
          </div>
          {inCart > 0 && (
            <p className="mt-3 text-xs text-ash">
              You have {inCart} in size {size} in your cart. <Link to="/cart" className="link-line text-bone">View cart</Link>
            </p>
          )}

          <div className="mt-12 border-t border-graphite">
            {sections.map((s) => (
              <div key={s.id} className="border-b border-graphite">
                <button
                  type="button"
                  onClick={() => setOpen(open === s.id ? '' : s.id)}
                  aria-expanded={open === s.id}
                  className="flex w-full items-center justify-between py-5 text-[11px] uppercase tracking-wider2"
                >
                  {s.title}
                  <ChevronDown size={16} className={`transition-transform ${open === s.id ? 'rotate-180' : ''}`} />
                </button>
                {open === s.id && <div className="pb-6 text-sm leading-relaxed text-ash">{s.body}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {p.related.length > 0 && (
        <section className="mt-28">
          <h2 className="mb-10 font-display text-4xl sm:text-5xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {p.related.map((r, i) => (
              <Reveal key={r.id} delay={i * 70}><ProductCard product={r} /></Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
