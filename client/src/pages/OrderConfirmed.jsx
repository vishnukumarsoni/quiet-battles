import { Link, useLocation } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/format';

export default function OrderConfirmed() {
  useDocumentTitle('Order received');
  const order = useLocation().state?.order;

  return (
    <div className="container-x">
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="eyebrow">Demo order</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,8vw,6rem)] leading-[0.95]">Thank you.</h1>
        {order ? (
          <>
            <p className="mt-6 text-ash">
              Order <span className="text-bone">{order.orderNumber}</span> has been saved. We would email a confirmation to <span className="text-bone">{order.customerEmail}</span> in a live store.
            </p>
            <ul className="mt-10 divide-y divide-graphite border-y border-graphite text-left text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-4">
                  <span>{i.name} <span className="text-ash">· {i.size} × {i.quantity}</span></span>
                  <span className="tabular-nums">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between py-4 font-display text-2xl"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></li>
            </ul>
            <p className="mt-5 text-xs text-ash">Payment status: pending. This is a demonstration and no money was taken.</p>
          </>
        ) : (
          <p className="mt-6 text-ash">Your demo order was saved. (Details are only shown right after checkout.)</p>
        )}
        <Link to="/shop" className="btn mt-10">Keep exploring</Link>
      </div>
    </div>
  );
}
