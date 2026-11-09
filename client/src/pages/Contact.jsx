import { useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../context/SettingsContext';
import { formsApi } from '../services';
import { errorMessage, fieldErrors } from '../services/api';

export default function Contact() {
  useDocumentTitle('Contact', 'Questions, press or collaboration? Get in touch with QUIET BATTLES™.');
  const s = useSettings();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ sending: false, done: false, error: '' });

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((x) => ({ ...x, [e.target.name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email';
    if (form.message.trim().length < 10) found.message = 'Tell us a little more (at least 10 characters)';
    setErrors(found);
    if (Object.keys(found).length) return;

    setState({ sending: true, done: false, error: '' });
    try {
      await formsApi.contact({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() });
      setForm({ name: '', email: '', message: '' });
      setState({ sending: false, done: true, error: '' });
    } catch (err) {
      setErrors(fieldErrors(err));
      setState({ sending: false, done: false, error: errorMessage(err) });
    }
  }

  return (
    <div className="container-x">
      <header>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 font-display text-[clamp(3.2rem,9vw,8rem)] leading-[0.88]">Say <em className="text-clay">hello.</em></h1>
      </header>

      <div className="mt-16 grid gap-16 md:grid-cols-12">
        <div className="space-y-8 text-sm md:col-span-4">
          {s.contactEmail && <div><p className="eyebrow mb-2">Email</p><a href={`mailto:${s.contactEmail}`} className="link-line text-lg">{s.contactEmail}</a></div>}
          {s.contactPhone && <div><p className="eyebrow mb-2">Phone</p><p className="text-lg">{s.contactPhone}</p></div>}
          {s.address && <div><p className="eyebrow mb-2">Studio</p><p className="text-ash">{s.address}</p></div>}
          <p className="text-ash">We read everything and reply within a few days.</p>
        </div>

        {state.done ? (
          <div role="status" className="md:col-span-7 md:col-start-6">
            <h2 className="font-display text-5xl">Message received.</h2>
            <p className="mt-4 text-ash">Thank you. We will get back to you soon.</p>
            <button className="btn mt-8" onClick={() => setState({ sending: false, done: false, error: '' })}>Send another</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-8 md:col-span-7 md:col-start-6">
            {[['name', 'Name', 'text', 'name'], ['email', 'Email', 'email', 'email']].map(([id, label, type, ac]) => (
              <div key={id}>
                <label htmlFor={id} className="field-label">{label}</label>
                <input id={id} name={id} type={type} autoComplete={ac} value={form[id]} onChange={onChange} className="field" aria-invalid={Boolean(errors[id])} />
                {errors[id] && <p className="field-error">{errors[id]}</p>}
              </div>
            ))}
            <div>
              <label htmlFor="message" className="field-label">Message</label>
              <textarea id="message" name="message" rows={6} value={form.message} onChange={onChange} className="field resize-y" aria-invalid={Boolean(errors.message)} />
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>
            {state.error && <p role="alert" className="text-sm text-[#e2958c]">{state.error}</p>}
            <button type="submit" disabled={state.sending} className="btn btn-solid">{state.sending ? 'Sending…' : 'Send message'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
