import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { formsApi } from '../services';
import { errorMessage } from '../services/api';

export default function Newsletter({ className = '' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  async function onSubmit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setStatus({ type: 'loading', message: '' });
    try {
      const res = await formsApi.subscribe(email);
      setStatus({ type: 'success', message: res.data.message });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: errorMessage(err) });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <label htmlFor="nl-email" className="field-label">Email address</label>
      <div className="flex items-end gap-4">
        <input
          id="nl-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field"
          aria-describedby="nl-status"
        />
        <button type="submit" disabled={status.type === 'loading'} className="group mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider2 disabled:opacity-40">
          {status.type === 'loading' ? 'Sending' : 'Join'}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      <p id="nl-status" role="status" className={`mt-2 min-h-5 text-xs ${status.type === 'error' ? 'text-[#e2958c]' : 'text-clay'}`}>
        {status.message}
      </p>
    </form>
  );
}
