import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function Login() {
  const { user, isAdmin, login, logout, loading } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/admin';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user && isAdmin) return <Navigate to={from} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address.');
    if (!form.password) return setError('Enter your password.');
    setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password);
      if (u.role !== 'admin') {
        await logout();
        setError('This account does not have admin access.');
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={onSubmit} noValidate className="w-full max-w-sm">
        <p className="font-display text-3xl tracking-[0.12em]">QUIET BATTLES™</p>
        <p className="mt-1 text-[11px] uppercase tracking-wider2 text-ash">Admin sign in</p>

        <div className="mt-10 space-y-6">
          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <input id="email" type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" autoFocus />
          </div>
          <div>
            <label htmlFor="password" className="field-label">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field" />
          </div>
        </div>

        {error && <p role="alert" className="mt-6 border border-[#6b2a24] bg-[#2a1614] px-4 py-3 text-sm text-[#f1c9c4]">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-solid mt-8 w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="/" className="link-line mt-8 block text-center text-[11px] uppercase tracking-wider2 text-ash">Back to the site</a>
      </form>
    </div>
  );
}
