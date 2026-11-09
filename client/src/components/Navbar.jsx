import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/archive', label: 'The Archive' },
  { to: '/about', label: 'About' },
  { to: '/shop', label: 'Shop' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { count } = useCart();
  const { announcement } = useSettings();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close the mobile menu after navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // stop the page behind the menu from scrolling
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const solid = scrolled || open;
  const linkClass = ({ isActive }) =>
    `text-[11px] uppercase tracking-wider2 transition-colors ${isActive ? 'text-bone' : 'text-bone/60 hover:text-bone'}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${solid ? 'bg-ink/90 backdrop-blur-md border-b border-graphite/70' : 'bg-transparent'}`}>
      {announcement && !scrolled && (
        <p className="hidden sm:block border-b border-bone/10 py-1.5 text-center text-[10px] uppercase tracking-wider2 text-bone/60">
          {announcement}
        </p>
      )}
      <nav className="container-x flex h-16 items-center justify-between sm:h-[72px]" aria-label="Main">
        <Link to="/" className="font-display text-[22px] tracking-[0.14em] leading-none" aria-label="QUIET BATTLES home">
          QUIET BATTLES<span className="text-clay text-sm align-top ml-0.5">™</span>
        </Link>

        <ul className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/cart" className={linkClass} aria-label={`Cart, ${count} items`}>
              <span className="inline-flex items-center gap-2">
                <ShoppingBag size={15} strokeWidth={1.5} /> Cart
                <span className="min-w-[1.25rem] rounded-full border border-bone/30 px-1.5 text-center text-[10px] tracking-normal">{count}</span>
              </span>
            </NavLink>
          </li>
        </ul>

        <div className="flex items-center gap-5 lg:hidden">
          <Link to="/cart" className="relative" aria-label={`Cart, ${count} items`}>
            <ShoppingBag size={20} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-medium text-ink">{count}</span>
            )}
          </Link>
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden h-[calc(100dvh-4rem)] bg-ink px-5 pt-10">
          <ul className="space-y-1">
            {LINKS.map((l, i) => (
              <li key={l.to} className="border-b border-graphite/70">
                <NavLink to={l.to} end={l.end} className={({ isActive }) => `flex items-baseline gap-4 py-4 font-display text-4xl ${isActive ? 'text-clay' : ''}`}>
                  <span className="text-[11px] font-sans tracking-wider2 text-ash">0{i + 1}</span>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
