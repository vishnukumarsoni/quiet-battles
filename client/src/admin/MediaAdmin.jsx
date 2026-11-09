import { useRef, useState } from 'react';
import { Copy, Replace, Trash2, Upload } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { mediaApi } from '../services';
import { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate, imgUrl } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';
import { Empty, PageHeader, Pager } from './components/ui';

export default function MediaAdmin() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => mediaApi.list({ page, limit: 24 }), [page]);
  const [busy, setBusy] = useState(false);
  const uploadInput = useRef(null);
  const replaceInput = useRef(null);
  const [replacingId, setReplacingId] = useState(null);

  async function onUpload(e) {
    if (!e.target.files.length) return;
    setBusy(true);
    try {
      const res = await mediaApi.upload(e.target.files);
      toast.success(`${res.data.length} image${res.data.length > 1 ? 's' : ''} uploaded`);
      setPage(1);
      reload();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); e.target.value = ''; }
  }

  async function onReplace(e) {
    const file = e.target.files[0];
    if (!file || !replacingId) return;
    setBusy(true);
    try {
      await mediaApi.replace(replacingId, file);
      toast.success('Image replaced everywhere it was used');
      reload();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); setReplacingId(null); e.target.value = ''; }
  }

  async function remove(m) {
    if (!window.confirm(`Delete ${m.originalName || 'this image'}?`)) return;
    try {
      await mediaApi.remove(m.id);
      toast.success('Image deleted');
      reload();
    } catch (err) {
      // 409 = the image is still used somewhere. Show where, and let the admin decide.
      if (err.response?.status === 409) {
        const where = (err.response.data.errors || []).map((u) => `${u.type}: ${u.title}`).join('\n');
        if (window.confirm(`${err.response.data.message}:\n\n${where}\n\nDelete anyway and remove it from those items?`)) {
          try { await mediaApi.remove(m.id, true); toast.success('Image deleted'); reload(); } catch (e2) { toast.error(errorMessage(e2)); }
        }
      } else toast.error(errorMessage(err));
    }
  }

  async function copy(url) {
    try {
      await navigator.clipboard.writeText(imgUrl(url).startsWith('http') ? imgUrl(url) : window.location.origin + url);
      toast.success('Link copied');
    } catch { toast.error('Could not copy. Select the link manually.'); }
  }

  return (
    <>
      <PageHeader title="Images" subtitle="Upload, preview, replace and delete. Images are stored locally or on Cloudinary.">
        <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={onUpload} />
        <input ref={replaceInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onReplace} />
        <button className="adm-btn adm-btn-primary" disabled={busy} onClick={() => uploadInput.current.click()}><Upload size={14} /> {busy ? 'Working…' : 'Upload images'}</button>
      </PageHeader>

      {loading ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <Empty>No uploaded images yet. Upload your first one.</Empty> : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {data.map((m) => (
              <li key={m.id} className="border border-graphite bg-coal">
                <div className="aspect-square overflow-hidden bg-ink"><img src={imgUrl(m.url)} alt={m.originalName} loading="lazy" className="h-full w-full object-cover" /></div>
                <div className="p-3">
                  <p className="truncate text-xs" title={m.originalName}>{m.originalName || 'Untitled'}</p>
                  <p className="mt-0.5 text-[11px] text-ash">{(m.size / 1024).toFixed(0)} KB · {formatDate(m.createdAt)} · {m.storage}</p>
                  <div className="mt-3 flex gap-1.5">
                    <button className="adm-btn !px-2" title="Copy link" aria-label="Copy link" onClick={() => copy(m.url)}><Copy size={13} /></button>
                    <button className="adm-btn !px-2" title="Replace" aria-label="Replace image" onClick={() => { setReplacingId(m.id); replaceInput.current.click(); }}><Replace size={13} /></button>
                    <button className="adm-btn adm-btn-danger !px-2" title="Delete" aria-label="Delete image" onClick={() => remove(m)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pager meta={meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
