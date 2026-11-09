import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import Archive from './pages/Archive';
import SeriesPage from './pages/SeriesPage';
import ChapterPage from './pages/ChapterPage';
import ProductPage from './pages/ProductPage';
import Shop from './pages/Shop';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderConfirmed from './pages/OrderConfirmed';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { Spinner } from './components/States';

// The admin panel is loaded only when someone opens /admin, so shoppers never download it.
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/Login'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const SeriesAdmin = lazy(() => import('./admin/SeriesAdmin'));
const ChapterAdmin = lazy(() => import('./admin/ChapterAdmin'));
const ProductAdmin = lazy(() => import('./admin/ProductAdmin'));
const MediaAdmin = lazy(() => import('./admin/MediaAdmin'));
const OrdersAdmin = lazy(() => import('./admin/OrdersAdmin'));
const InboxAdmin = lazy(() => import('./admin/InboxAdmin'));
const SettingsAdmin = lazy(() => import('./admin/SettingsAdmin'));

// Login state is only needed in the admin area, so shoppers never trigger a "who am I?" request.
const AdminShell = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <CartProvider>
          <>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<Home />} />
                  <Route path="archive" element={<Archive />} />
                  <Route path="archive/:slug" element={<SeriesPage />} />
                  <Route path="chapters/:slug" element={<ChapterPage />} />
                  <Route path="products/:slug" element={<ProductPage />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="order-confirmed" element={<OrderConfirmed />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route element={<AdminShell />}>
                  <Route path="admin/login" element={<AdminLogin />} />
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="series" element={<SeriesAdmin />} />
                    <Route path="chapters" element={<ChapterAdmin />} />
                    <Route path="products" element={<ProductAdmin />} />
                    <Route path="media" element={<MediaAdmin />} />
                    <Route path="orders" element={<OrdersAdmin />} />
                    <Route path="inbox" element={<InboxAdmin />} />
                    <Route path="settings" element={<SettingsAdmin />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </>
        </CartProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
