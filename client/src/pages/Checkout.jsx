import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../services';
import { errorMessage, fieldErrors } from '../services/api';
import { formatPrice } from '../utils/format';

const EMPTY = { name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' };

// Same rules as the server, so people get quick feedback. The server still re-checks everything.
function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
  if (f.phone && !/^[0-9+\-\s()]{7,20}$/.test(f.phone)) e.phone = 'Enter a valid phone number';
  if (f.line1.trim().length < 3) e.line1 = 'Enter your address';
  if (f.city.trim().length < 2) e.city = 'Enter your city';
  if (f.state.trim().length < 2) e.state = 'Enter your state';
  if (!/^[A-Za-z0-9\- ]{4,10}$/.test(f.postalCode.trim())) e.postalCode = 'Enter a valid postal code';
  if (f.country.trim().length < 2) e.country = 'Enter your country';
  return e;
}

function Field({ id, label, form, errors, onChange, type = 'text', autoComplete, optional, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}{optional && <span className="normal-case tracking-normal text-ash/60"> (optional)</span>}</label>
      <input id={id} name={id} type={type} value={form[id]} onChange={onChange} autoComplete={autoComplete} className="field" aria-invalid={Boolean(errors[id])} aria-describedby={errors[id] ? `${id}-err` : undefined} />
      {errors[id] && <p id={`${id}-err`} className="field-error">{errors[id]}</p>}
    </div>
  );
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((x) => ({ ...x, [e.target.name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await ordersApi.create({
        customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
        shippingAddress: {
          line1: form.line1.trim(), line2: form.line2.trim(), city: form.city.trim(),
          state: form.state.trim(), postalCode: form.postalCode.trim(), country: form.country.trim(),
        },
        items: items.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
      });
      clear();
      navigate('/order-confirmed', { state: { order: res.data }, replace: true });
    } catch (err) {
      const server = fieldErrors(err);
      // server errors are named "customer.email" / "shippingAddress.city"; the form uses the short name
      const mapped = {};
      Object.entries(server).forEach(([k, v]) => { mapped[k.split('.').pop()] = v; });
      setErrors(mapped);
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const shared = { form, errors, onChange };
  return (
    <div className="container-x">
      <h1 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none">Checkout</h1>
      <p className="mt-4 max-w-xl border-l border-clay pl-4 text-sm text-ash">
        This is a demonstration checkout. Your order is saved so the admin panel can show it, but <strong className="font-medium text-bone">no payment is taken</strong>, so please do not enter real card details anywhere.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-12 grid gap-14 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          <fieldset>
            <legend className="eyebrow mb-6">Contact</legend>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <Field id="name" label="Full name" autoComplete="name" className="sm:col-span-2" {...shared} />
              <Field id="email" label="Email" type="email" autoComplete="email" {...shared} />
              <Field id="phone" label="Phone" type="tel" autoComplete="tel" optional {...shared} />
            </div>
          </fieldset>
          <fieldset>
            <legend className="eyebrow mb-6">Shipping address</legend>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <Field id="line1" label="Address" autoComplete="address-line1" className="sm:col-span-2" {...shared} />
              <Field id="line2" label="Apartment, suite, etc." autoComplete="address-line2" optional className="sm:col-span-2" {...shared} />
              <Field id="city" label="City" autoComplete="address-level2" {...shared} />
              <Field id="state" label="State" autoComplete="address-level1" {...shared} />
              <Field id="postalCode" label="Postal code" autoComplete="postal-code" {...shared} />
              <Field id="country" label="Country" autoComplete="country-name" {...shared} />
            </div>
          </fieldset>
        </div>

        <aside className="h-fit border border-graphite bg-coal p-7 lg:col-span-4 lg:col-start-9 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="eyebrow">Your order</h2>
          <ul className="mt-6 space-y-4">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size}`} className="flex justify-between gap-4 text-sm">
                <span>{i.name} <span className="text-ash">· {i.size} × {i.quantity}</span></span>
                <span className="tabular-nums">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between border-t border-graphite pt-5 font-display text-3xl">
            <span>Total</span><span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          {formError && <p role="alert" className="mt-5 border border-[#6b2a24] bg-[#2a1614] px-4 py-3 text-sm text-[#f1c9c4]">{formError}</p>}
          <button type="submit" disabled={submitting} className="btn btn-solid mt-6 w-full">{submitting ? 'Placing order…' : 'Place demo order'}</button>
          <Link to="/cart" className="link-line mt-5 block text-center text-[11px] uppercase tracking-wider2 text-ash">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
