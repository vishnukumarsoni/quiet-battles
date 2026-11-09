import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { ordersApi } from '../services';
import { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatPrice } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';
import { Empty, PageHeader, Pager, StatusBadge, TableShell, Td, Th } from './components/ui';

const ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT = ['pending', 'paid', 'failed', 'refunded'];

export default function OrdersAdmin() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  useEffect(() => { const t = setTimeout(() => { setSearch(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const { data, meta, loading, error, reload } = useFetch(
    () => ordersApi.list({ page, limit: 15, orderStatus: status || undefined, q: search || undefined }),
    [page, status, search]
  );

  async function change(order, field, value) {
    if (field === 'orderStatus' && value === 'cancelled' && !window.confirm('Cancel this order? The stock will be returned to the shop.')) return;
    try {
      await ordersApi.update(order.id, { [field]: value });
      toast.success('Order updated');
      reload();
    } catch (err) { toast.error(errorMessage(err)); reload(); }
  }

  return (
    <>
      <PageHeader title="Orders" subtitle="Demo orders placed from the checkout. No real payments.">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
          <input className="adm-input !pl-9" placeholder="Order no., name, email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
        </div>
        <select className="adm-input !w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </PageHeader>

      {loading ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <Empty>No orders found.</Empty> : (
        <>
          <TableShell>
            <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Placed</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th><span className="sr-only">Details</span></Th></tr></thead>
            <tbody>
              {data.map((o) => (
                <Fragment key={o.id}>
                  <tr>
                    <Td className="font-medium">{o.orderNumber}</Td>
                    <Td><p>{o.customerName}</p><p className="text-xs text-ash">{o.customerEmail}</p></Td>
                    <Td className="text-xs text-ash">{formatDateTime(o.createdAt)}</Td>
                    <Td className="tabular-nums">{formatPrice(o.totalAmount)}</Td>
                    <Td><StatusBadge status={o.paymentStatus} /></Td>
                    <Td><StatusBadge status={o.orderStatus} /></Td>
                    <Td><button className="adm-btn !px-2" aria-expanded={openId === o.id} aria-label="Toggle details" onClick={() => setOpenId(openId === o.id ? null : o.id)}><ChevronDown size={14} className={openId === o.id ? 'rotate-180' : ''} /></button></Td>
                  </tr>
                  {openId === o.id && (
                    <tr>
                      <td colSpan={7} className="border-b border-graphite bg-coal px-6 py-6">
                        <div className="grid gap-8 lg:grid-cols-3">
                          <div className="lg:col-span-2">
                            <p className="mb-3 text-[11px] uppercase tracking-wider2 text-ash">Items</p>
                            <ul className="divide-y divide-graphite border border-graphite text-sm">
                              {o.items.map((i) => (
                                <li key={i.id} className="flex justify-between gap-4 px-4 py-2.5"><span>{i.name} <span className="text-ash">· {i.size} × {i.quantity}</span></span><span className="tabular-nums">{formatPrice(i.price * i.quantity)}</span></li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-5 text-sm">
                            <div>
                              <p className="mb-2 text-[11px] uppercase tracking-wider2 text-ash">Ship to</p>
                              <p>{o.customerName}</p>
                              <p className="text-ash">{[o.shippingAddress.line1, o.shippingAddress.line2, o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.postalCode, o.shippingAddress.country].filter(Boolean).join(', ')}</p>
                              {o.customerPhone && <p className="text-ash">{o.customerPhone}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <label className="text-xs text-ash">Order status
                                <select className="adm-input mt-1" value={o.orderStatus} disabled={o.orderStatus === 'cancelled'} onChange={(e) => change(o, 'orderStatus', e.target.value)}>{ORDER.map((s) => <option key={s}>{s}</option>)}</select>
                              </label>
                              <label className="text-xs text-ash">Payment
                                <select className="adm-input mt-1" value={o.paymentStatus} onChange={(e) => change(o, 'paymentStatus', e.target.value)}>{PAYMENT.map((s) => <option key={s}>{s}</option>)}</select>
                              </label>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </TableShell>
          <Pager meta={meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
