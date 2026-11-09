import { useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { productsApi } from '../services';
import { errorMessage, fieldErrors } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice, imgUrl } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';
import Modal from './components/Modal';
import Field from './components/Field';
import { ImagesField } from './components/ImageFields';
import { Empty, PageHeader, Pager, StatusBadge, TableShell, Td, Th } from './components/ui';

const SIZES = ['S', 'M', 'L', 'XL'];
const BLANK = { name: '', slug: '', price: '', stock: '0', category: 'Tops', description: '', details: '', images: [], availableSizes: SIZES, featured: false, status: 'draft' };

export default function ProductAdmin() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setSearch(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const { data, meta, loading, error, reload } = useFetch(() => productsApi.list({ status: 'all', limit: 15, page, q: search || undefined, sort: 'newest' }), [page, search]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const open = (row) => {
    setErrors({});
    setEditing(row || {});
    setForm(row ? { ...BLANK, ...row, price: String(row.price), stock: String(row.stock), details: (row.details || []).join('\n') } : BLANK);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleSize = (s) => setForm((f) => ({ ...f, availableSizes: f.availableSizes.includes(s) ? f.availableSizes.filter((x) => x !== s) : [...f.availableSizes, s] }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      name: form.name, price: form.price, stock: form.stock, category: form.category, description: form.description,
      details: form.details.split('\n').map((l) => l.trim()).filter(Boolean),
      images: form.images, availableSizes: form.availableSizes, featured: form.featured, status: form.status,
    };
    if (form.slug) body.slug = form.slug;
    try {
      if (editing.id) await productsApi.update(editing.id, body);
      else await productsApi.create(body);
      toast.success(editing.id ? 'Product updated' : 'Product created');
      setEditing(null);
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally { setSaving(false); }
  }

  async function toggle(row) {
    try {
      await productsApi.update(row.id, { status: row.status === 'published' ? 'draft' : 'published' });
      toast.success(row.status === 'published' ? 'Product unpublished' : 'Product published');
      reload();
    } catch (err) { toast.error(errorMessage(err)); }
  }
  async function remove(row) {
    if (!window.confirm(`Delete "${row.name}"? Chapters that link to it will simply lose the link.`)) return;
    try { await productsApi.remove(row.id); toast.success('Product deleted'); reload(); } catch (err) { toast.error(errorMessage(err)); }
  }

  return (
    <>
      <PageHeader title="Products" subtitle="Prices, sizes, stock and photos.">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
          <input className="adm-input !pl-9" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => open()}><Plus size={14} /> New product</button>
      </PageHeader>

      {loading ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <Empty>No products found.</Empty> : (
        <>
          <TableShell>
            <thead><tr><Th>Photo</Th><Th>Name</Th><Th>Price</Th><Th>Stock</Th><Th>Sizes</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <Td><div className="h-14 w-11 overflow-hidden border border-graphite bg-coal">{p.images[0] && <img src={imgUrl(p.images[0])} alt="" className="h-full w-full object-cover" />}</div></Td>
                  <Td><p className="font-medium">{p.name}</p><p className="text-xs text-ash">{p.category}{p.featured ? ' · featured' : ''}</p></Td>
                  <Td className="tabular-nums">{formatPrice(p.price)}</Td>
                  <Td className={p.stock === 0 ? 'text-[#e2958c]' : p.stock <= 5 ? 'text-clay' : ''}>{p.stock}</Td>
                  <Td className="text-xs text-ash">{p.availableSizes.join(' ')}</Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="adm-btn" onClick={() => toggle(p)} title={p.status === 'published' ? 'Unpublish' : 'Publish'}>{p.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button className="adm-btn" onClick={() => open(p)} aria-label={`Edit ${p.name}`}><Pencil size={14} /></button>
                      <button className="adm-btn adm-btn-danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pager meta={meta} onPage={setPage} />
        </>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit product' : 'New product'} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="space-y-5">
            <Field label="Name" error={errors.name}><input className="adm-input" value={form.name} onChange={set('name')} required /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price" error={errors.price}><input type="number" step="0.01" min="0" className="adm-input" value={form.price} onChange={set('price')} required /></Field>
              <Field label="Stock" error={errors.stock}><input type="number" min="0" className="adm-input" value={form.stock} onChange={set('stock')} required /></Field>
              <Field label="Category" error={errors.category}><input className="adm-input" value={form.category} onChange={set('category')} /></Field>
            </div>
            <Field label="Available sizes" error={errors.availableSizes}>
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <button type="button" key={s} onClick={() => toggleSize(s)} aria-pressed={form.availableSizes.includes(s)} className={`adm-btn w-14 justify-center ${form.availableSizes.includes(s) ? '!border-bone !bg-bone !text-ink' : ''}`}>{s}</button>
                ))}
              </div>
            </Field>
            <Field label="Description" error={errors.description}><textarea rows={4} className="adm-input" value={form.description} onChange={set('description')} /></Field>
            <Field label="Product details" hint="One line each: fabric, fit, care…" error={errors.details}><textarea rows={5} className="adm-input" value={form.details} onChange={set('details')} /></Field>
            <Field label="Photos" error={errors.images} hint="The first photo is the main image."><ImagesField value={form.images} onChange={(v) => setForm((f) => ({ ...f, images: v }))} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status"><select className="adm-input" value={form.status} onChange={set('status')}><option value="draft">Draft (hidden)</option><option value="published">Published</option></select></Field>
              <Field label="Homepage"><label className="flex h-[38px] cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="accent-[#b9a98f]" /> Feature on the home page</label></Field>
            </div>
            <Field label="URL slug" error={errors.slug} hint="Optional. Built from the name if empty."><input className="adm-input" value={form.slug} onChange={set('slug')} /></Field>
            <div className="flex justify-end gap-3 border-t border-graphite pt-5">
              <button type="button" className="adm-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
