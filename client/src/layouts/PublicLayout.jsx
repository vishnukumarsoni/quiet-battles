import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Pages that start with a full-screen image sit UNDER the transparent header.
const FULL_BLEED = [/^\/$/, /^\/chapters\//, /^\/archive\/[^/]+$/];

export default function PublicLayout() {
  const { pathname } = useLocation();

  // new page = start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const bleed = FULL_BLEED.some((re) => re.test(pathname));
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-bone focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className={`flex-1 ${bleed ? '' : 'pt-24 sm:pt-28'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
