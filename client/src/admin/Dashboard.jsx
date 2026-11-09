import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { adminApi } from '../services';
import { formatDateTime, formatPrice } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';
import { PageHeader, StatusBadge } from './components/ui';

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => adminApi.stats(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const t = data.totals;
  const cards = [
    ['Products', t.products, '/admin/products'],
    ['Series', t.series, '/admin/series'],
    ['Chapters', t.chapters, '/admin/chapters'],
    ['Orders', t.orders, '/admin/orders'],
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A quick look at the store." />

      <div className="grid grid-cols-2 gap-px border border-graphite bg-graphite lg:grid-cols-4">
        {cards.map(([label, n, to]) => (
          <Link key={label} to={to} className="bg-ink p-6 transition-colors hover:bg-coal">
            <p className="text-[11px] uppercase tracking-wider2 text-ash">Total {label}</p>
            <p className="mt-3 font-display text-6xl leading-none tabular-nums">{n}</p>
          </Link>
        ))}
      </div>

      <div className="mt-px grid gap-px border-x border-b border-graphite bg-graphite sm:grid-cols-3">
        <div className="bg-ink p-6"><p className="text-[11px] uppercase tracking-wider2 text-ash">Order value (demo)</p><p className="mt-2 font-display text-3xl">{formatPrice(data.revenue)}</p></div>
        <Link to="/admin/inbox" className="bg-ink p-6 hover:bg-coal"><p className="text-[11px] uppercase tracking-wider2 text-ash">Unread messages</p><p className="mt-2 font-display text-3xl">{t.unreadMessages}</p></Link>
        <Link to="/admin/inbox" className="bg-ink p-6 hover:bg-coal"><p className="text-[11px] uppercase tracking-wider2 text-ash">Newsletter subscribers</p><p className="mt-2 font-display text-3xl">{t.subscribers}</p></Link>
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h2 className="mb-4 text-[11px] uppercase tracking-wider2 text-ash">Recent orders</h2>
          {data.recentOrders.length === 0 ? (
            <p className="border border-dashed border-graphite py-12 text-center text-sm text-ash">No orders yet. Place one from the shop to see it here.</p>
          ) : (
            <ul className="divide-y divide-graphite border border-graphite">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-ash">{o.customerName} · {formatDateTime(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</p>
                  </div>
                  <div className="flex items-center gap-4"><StatusBadge status={o.orderStatus} /><span className="tabular-nums">{formatPrice(o.totalAmount)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-[11px] uppercase tracking-wider2 text-ash">Low stock</h2>
          {data.lowStock.length === 0 ? <p className="text-sm text-ash">All products are well stocked.</p> : (
            <ul className="divide-y divide-graphite border border-graphite">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? 'text-[#e2958c]' : 'text-clay'}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
