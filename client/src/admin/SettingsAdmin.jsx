import { useEffect, useState } from 'react';
import { settingsApi, authApi } from '../services';
import { errorMessage, fieldErrors } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/States';
import Field from './components/Field';
import { PageHeader } from './components/ui';

const FIELDS = [
  ['siteName', 'Site name'],
  ['tagline', 'Tagline'],
  ['announcement', 'Top banner message', 'Shown above the menu. Leave empty to hide it.'],
  ['contactEmail', 'Contact email'],
  ['contactPhone', 'Contact phone'],
  ['address', 'Address'],
  ['instagram', 'Instagram link'],
  ['twitter', 'X (Twitter) link'],
  ['youtube', 'YouTube link'],
];

export default function SettingsAdmin() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => { settingsApi.get().then((r) => setForm(r.data)).catch((e) => toast.error(errorMessage(e))); /* eslint-disable-next-line */ }, []);
  if (!form) return <Spinner />;

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await settingsApi.update(form);
      toast.success('Settings saved. Refresh the site to see them.');
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errorMessage(err)); } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pw.newPassword.length < 10) return toast.error('New password must be at least 10 characters.');
    setPwSaving(true);
    try {
      await authApi.changePassword(pw.currentPassword, pw.newPassword);
      toast.success('Password updated');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(errorMessage(err)); } finally { setPwSaving(false); }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Site-wide text and links used in the header, footer and contact page." />
      <div className="grid gap-12 xl:grid-cols-2">
        <form onSubmit={save} className="space-y-5">
          {FIELDS.map(([key, label, hint]) => (
            <Field key={key} label={label} hint={hint} error={errors[key]}>
              <input className="adm-input" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </Field>
          ))}
          <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </form>

        <form onSubmit={changePassword} className="h-fit space-y-5 border border-graphite p-6">
          <h2 className="font-display text-2xl">Change password</h2>
          <Field label="Current password"><input type="password" autoComplete="current-password" className="adm-input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></Field>
          <Field label="New password" hint="At least 10 characters."><input type="password" autoComplete="new-password" className="adm-input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></Field>
          <button className="adm-btn" disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </>
  );
}
