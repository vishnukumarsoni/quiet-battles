import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { seriesApi } from '../services';
import { errorMessage, fieldErrors } from '../services/api';
import { useToast } from '../context/ToastContext';
import { imgUrl, pad } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';
import Modal from './components/Modal';
import Field from './components/Field';
import { ImageField } from './components/ImageFields';
import { Empty, PageHeader, StatusBadge, TableShell, Td, Th } from './components/ui';

const BLANK = { title: '', slug: '', seriesNumber: '', description: '', coverImage: '', status: 'draft' };

export default function SeriesAdmin() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => seriesApi.list({ status: 'all', limit: 100 }), []);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id...} = edit
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const open = (row) => {
    setEditing(row || {});
    setErrors({});
    setForm(row ? { ...BLANK, ...row, seriesNumber: String(row.seriesNumber) } : { ...BLANK, seriesNumber: String((data?.length || 0) + 1) });
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = { title: form.title, slug: form.slug, seriesNumber: form.seriesNumber, description: form.description, coverImage: form.coverImage, status: form.status };
    if (!body.slug) delete body.slug;
    try {
      if (editing.id) await seriesApi.update(editing.id, body);
      else await seriesApi.create(body);
      toast.success(editing.id ? 'Series updated' : 'Series created');
      setEditing(null);
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row) {
    try {
      await seriesApi.update(row.id, { status: row.status === 'published' ? 'draft' : 'published' });
      toast.success(row.status === 'published' ? 'Series unpublished' : 'Series published');
      reload();
    } catch (err) { toast.error(errorMessage(err)); }
  }

  async function remove(row) {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    try {
      await seriesApi.remove(row.id);
      toast.success('Series deleted');
      reload();
    } catch (err) { toast.error(errorMessage(err)); }
  }

  return (
    <>
      <PageHeader title="Series" subtitle="A series groups chapters. Only published series appear on the site.">
        <button className="adm-btn adm-btn-primary" onClick={() => open()}><Plus size={14} /> New series</button>
      </PageHeader>

      {loading ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <Empty>No series yet.</Empty> : (
        <TableShell>
          <thead><tr><Th>Cover</Th><Th>#</Th><Th>Title</Th><Th>Chapters</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id}>
                <Td><div className="h-14 w-11 overflow-hidden border border-graphite bg-coal">{s.coverImage && <img src={imgUrl(s.coverImage)} alt="" className="h-full w-full object-cover" />}</div></Td>
                <Td>{pad(s.seriesNumber)}</Td>
                <Td><p className="font-medium">{s.title}</p><p className="text-xs text-ash">/archive/{s.slug}</p></Td>
                <Td>{s.chapterCount}</Td>
                <Td><StatusBadge status={s.status} /></Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="adm-btn" onClick={() => toggle(s)} title={s.status === 'published' ? 'Unpublish' : 'Publish'}>{s.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    <button className="adm-btn" onClick={() => open(s)} aria-label={`Edit ${s.title}`}><Pencil size={14} /></button>
                    <button className="adm-btn adm-btn-danger" onClick={() => remove(s)} aria-label={`Delete ${s.title}`}><Trash2 size={14} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit series' : 'New series'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-5">
            <Field label="Title" error={errors.title}><input className="adm-input" value={form.title} onChange={set('title')} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Series number" error={errors.seriesNumber}><input type="number" min="1" className="adm-input" value={form.seriesNumber} onChange={set('seriesNumber')} required /></Field>
              <Field label="Status"><select className="adm-input" value={form.status} onChange={set('status')}><option value="draft">Draft (hidden)</option><option value="published">Published</option></select></Field>
            </div>
            <Field label="URL slug" error={errors.slug} hint="Optional. Leave empty to build it from the title."><input className="adm-input" value={form.slug} onChange={set('slug')} placeholder="series-01" /></Field>
            <Field label="Description" error={errors.description}><textarea rows={5} className="adm-input" value={form.description} onChange={set('description')} /></Field>
            <Field label="Cover image" error={errors.coverImage}><ImageField value={form.coverImage} onChange={(v) => setForm((f) => ({ ...f, coverImage: v }))} /></Field>
            <div className="flex justify-end gap-3 border-t border-graphite pt-5">
              <button type="button" className="adm-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save series'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
