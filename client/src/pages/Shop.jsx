import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useFetch from '../hooks/useFetch';
import { productsApi } from '../services';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState, GridSkeleton } from '../components/States';

const SORTS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name', 'Name'],
];

export default function Shop() {
  useDocumentTitle('Shop', 'Shop every QUIET BATTLES™ piece: tees, sweats and outerwear from Series 01.');
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const q = params.get('q') || '';
  const inStock = params.get('inStock') === 'true';
  const page = Number(params.get('page')) || 1;

  // the search box types freely; the URL (and the API call) only updates after a short pause
  const [text, setText] = useState(q);
  useEffect(() => {
    setText(q);
  }, [q]);
  useEffect(() => {
    const t = setTimeout(() => text !== q && update({ q: text, page: '' }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  }

  const { data, meta, loading, error, reload } = useFetch(
    () => productsApi.list({ category: category || undefined, sort, q: q || undefined, inStock: inStock || undefined, page, limit: 12 }),
    [category, sort, q, inStock, page]
  );

  const categories = meta?.categories || [];
  const chip = (active) => `border px-4 py-2 text-[11px] uppercase tracking-wider2 transition-colors ${active ? 'border-bone bg-bone text-ink' : 'border-graphite text-bone/70 hover:border-ash'}`;

  return (
    <div className="container-x">
      <header className="mb-12 border-b border-graphite pb-10">
        <p className="eyebrow">Shop</p>
        <h1 className="mt-3 font-display text-[clamp(3.2rem,8vw,7rem)] leading-[0.9]">All pieces</h1>
      </header>

      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button className={chip(!category)} onClick={() => update({ category: '', page: '' })}>All</button>
          {categories.map((c) => (
            <button key={c} className={chip(category === c)} onClick={() => update({ category: c, page: '' })}>{c}</button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="relative w-full sm:w-56">
            <label htmlFor="shop-search" className="sr-only">Search products</label>
            <Search size={14} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-ash" />
            <input id="shop-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search" className="field pl-6" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-3 text-xs text-ash">
            <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked ? 'true' : '', page: '' })} className="accent-[#b9a98f]" />
            In stock only
          </label>
          <div>
            <label htmlFor="shop-sort" className="field-label">Sort</label>
            <select id="shop-sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value, page: '' })} className="field !w-auto bg-ink pr-6">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <GridSkeleton count={8} />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState title="Nothing matches" text="Try removing a filter or searching for something else." action={{ to: '/shop', label: 'Clear filters' }} />
      )}
      {!loading && !error && data.length > 0 && (
        <>
          <p className="mb-6 text-xs text-ash" aria-live="polite">{meta.total} {meta.total === 1 ? 'piece' : 'pieces'}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">
            {data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {meta.totalPages > 1 && (
            <nav className="mt-16 flex items-center justify-center gap-6 text-[11px] uppercase tracking-wider2" aria-label="Pagination">
              <button className="btn !py-2.5" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
              <span className="text-ash">Page {page} of {meta.totalPages}</span>
              <button className="btn !py-2.5" disabled={page >= meta.totalPages} onClick={() => update({ page: String(page + 1) })}>Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
