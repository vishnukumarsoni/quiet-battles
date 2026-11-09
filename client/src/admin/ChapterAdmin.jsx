import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { chaptersApi, productsApi, seriesApi } from '../services';
import { errorMessage, fieldErrors } from '../services/api';
import { useToast } from '../context/ToastContext';
import { imgUrl, pad } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';
import Modal from './components/Modal';
import Field from './components/Field';
import { ImageField, ImagesField } from './components/ImageFields';
import { Empty, PageHeader, Pager, StatusBadge, TableShell, Td, Th } from './components/ui';

const BLANK = { title: '', slug: '', chapterNumber: '', seriesId: '', description: '', storyContent: '', coverImage: '', galleryImages: [], relatedProductId: '', status: 'draft' };

export default function ChapterAdmin() {
  const toast = useToast();
  const [seriesFilter, setSeriesFilter] = useState('');
  const [page, setPage] = useState(1);
  const list = useFetch(() => chaptersApi.list({ status: 'all', limit: 20, page, seriesId: seriesFilter || undefined }), [seriesFilter, page]);
  const series = useFetch(() => seriesApi.list({ status: 'all', limit: 100 }), []);
  const products = useFetch(() => productsApi.list({ status: 'all', limit: 60 }), []);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);

  async function open(row) {
    setErrors({});
    if (!row) {
      const sid = seriesFilter || series.data?.[0]?.id || '';
      setForm({ ...BLANK, seriesId: String(sid) });
      setEditing({});
      return;
    }
    // the list leaves out the long story text, so load the full chapter first
    setOpening(true);
    try {
      const { data } = await chaptersApi.get(row.id);
      setForm({ ...BLANK, ...data, seriesId: String(data.seriesId), chapterNumber: String(data.chapterNumber), relatedProductId: data.relatedProductId ? String(data.relatedProductId) : '', galleryImages: data.galleryImages || [] });
      setEditing(data);
    } catch (err) { toast.error(errorMessage(err)); } finally { setOpening(false); }
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      title: form.title, chapterNumber: form.chapterNumber, seriesId: form.seriesId, description: form.description,
      storyContent: form.storyContent, coverImage: form.coverImage, galleryImages: form.galleryImages,
      relatedProductId: form.relatedProductId || null, status: form.status,
    };
    if (form.slug) body.slug = form.slug;
    try {
      if (editing.id) await chaptersApi.update(editing.id, body);
      else await chaptersApi.create(body);
      toast.success(editing.id ? 'Chapter updated' : 'Chapter created');
      setEditing(null);
      list.reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally { setSaving(false); }
  }

  async function toggle(row) {
    try {
      await chaptersApi.update(row.id, { status: row.status === 'published' ? 'draft' : 'published' });
      toast.success(row.status === 'published' ? 'Chapter unpublished' : 'Chapter published');
      list.reload();
    } catch (err) { toast.error(errorMessage(err)); }
  }
  async function remove(row) {
    if (!window.confirm(`Delete chapter "${row.title}"?`)) return;
    try { await chaptersApi.remove(row.id); toast.success('Chapter deleted'); list.reload(); } catch (err) { toast.error(errorMessage(err)); }
  }

  return (
    <>
      <PageHeader title="Chapters" subtitle="Each chapter belongs to one series and can link to one product.">
        <select className="adm-input !w-auto" value={seriesFilter} onChange={(e) => { setSeriesFilter(e.target.value); setPage(1); }} aria-label="Filter by series">
          <option value="">All series</option>
          {(series.data || []).map((s) => <option key={s.id} value={s.id}>Series {pad(s.seriesNumber)} · {s.title}</option>)}
        </select>
        <button className="adm-btn adm-btn-primary" onClick={() => open()} disabled={!series.data?.length}><Plus size={14} /> New chapter</button>
      </PageHeader>

      {list.loading ? <Spinner /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : list.data.length === 0 ? <Empty>No chapters yet.</Empty> : (
        <>
          <TableShell>
            <thead><tr><Th>Cover</Th><Th>#</Th><Th>Title</Th><Th>Series</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {list.data.map((c) => (
                <tr key={c.id}>
                  <Td><div className="h-14 w-11 overflow-hidden border border-graphite bg-coal">{c.coverImage && <img src={imgUrl(c.coverImage)} alt="" className="h-full w-full object-cover" />}</div></Td>
                  <Td>{pad(c.chapterNumber)}</Td>
                  <Td><p className="font-medium">{c.title}</p><p className="text-xs text-ash">/chapters/{c.slug}</p></Td>
                  <Td className="text-ash">Series {pad(c.series.seriesNumber)}</Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="adm-btn" onClick={() => toggle(c)} title={c.status === 'published' ? 'Unpublish' : 'Publish'}>{c.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button className="adm-btn" onClick={() => open(c)} disabled={opening} aria-label={`Edit ${c.title}`}><Pencil size={14} /></button>
                      <button className="adm-btn adm-btn-danger" onClick={() => remove(c)} aria-label={`Delete ${c.title}`}><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pager meta={list.meta} onPage={setPage} />
        </>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit chapter' : 'New chapter'} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Parent series" error={errors.seriesId}>
                <select className="adm-input" value={form.seriesId} onChange={set('seriesId')} required>
                  <option value="" disabled>Choose a series</option>
                  {(series.data || []).map((s) => <option key={s.id} value={s.id}>Series {pad(s.seriesNumber)} · {s.title}</option>)}
                </select>
              </Field>
              <Field label="Chapter number" error={errors.chapterNumber}><input type="number" min="1" className="adm-input" value={form.chapterNumber} onChange={set('chapterNumber')} required /></Field>
            </div>
            <Field label="Title" error={errors.title}><input className="adm-input" value={form.title} onChange={set('title')} required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL slug" error={errors.slug} hint="Optional. Built from the title if empty."><input className="adm-input" value={form.slug} onChange={set('slug')} /></Field>
              <Field label="Status"><select className="adm-input" value={form.status} onChange={set('status')}><option value="draft">Draft (hidden)</option><option value="published">Published</option></select></Field>
            </div>
            <Field label="Short description" error={errors.description} hint="Shown on cards and as the page summary."><textarea rows={2} className="adm-input" value={form.description} onChange={set('description')} /></Field>
            <Field
              label="Storytelling content"
              error={errors.storyContent}
              hint={'Blank line = new paragraph. Start a line with "> " for a pull quote, "## " for a heading. Type [[image 1]] on its own line to place the first gallery image there.'}
            >
              <textarea rows={14} className="adm-input font-mono text-[13px] leading-relaxed" value={form.storyContent} onChange={set('storyContent')} />
            </Field>
            <Field label="Cover image" error={errors.coverImage}><ImageField value={form.coverImage} onChange={(v) => setForm((f) => ({ ...f, coverImage: v }))} /></Field>
            <Field label="Gallery images (editorial)" error={errors.galleryImages} hint="Image 1 is the first thumbnail, and so on."><ImagesField max={12} value={form.galleryImages} onChange={(v) => setForm((f) => ({ ...f, galleryImages: v }))} /></Field>
            <Field label="Related product" error={errors.relatedProductId}>
              <select className="adm-input" value={form.relatedProductId} onChange={set('relatedProductId')}>
                <option value="">None</option>
                {(products.data || []).map((p) => <option key={p.id} value={p.id}>{p.name}{p.status !== 'published' ? ' (draft)' : ''}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-3 border-t border-graphite pt-5">
              <button type="button" className="adm-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save chapter'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
