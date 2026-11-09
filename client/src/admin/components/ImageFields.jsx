import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Upload, X } from 'lucide-react';
import { mediaApi } from '../../services';
import { errorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { imgUrl } from '../../utils/format';
import Modal from './Modal';

// Pick an image from the library, upload new ones, or paste a link.
export function MediaPicker({ multiple = false, onPick, onClose }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [chosen, setChosen] = useState([]);
  const [link, setLink] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    mediaApi.list({ limit: 60 }).then((r) => setItems(r.data)).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFiles(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const res = await mediaApi.upload(files);
      setItems((list) => [...res.data, ...list]);
      setChosen((c) => (multiple ? [...c, ...res.data.map((m) => m.url)] : [res.data[0].url]));
      toast.success(`${res.data.length} image${res.data.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const toggle = (url) => setChosen((c) => (multiple ? (c.includes(url) ? c.filter((u) => u !== url) : [...c, url]) : [url]));

  function confirm() {
    const urls = [...chosen];
    if (link.trim()) urls.push(link.trim());
    if (urls.length) onPick(multiple ? urls : urls[0]);
  }

  return (
    <Modal title={multiple ? 'Choose images' : 'Choose an image'} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={multiple} onChange={onFiles} className="hidden" />
        <button type="button" className="adm-btn" onClick={() => fileInput.current.click()} disabled={uploading}>
          <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload from computer'}
        </button>
        <p className="text-xs text-ash">JPG, PNG, WEBP or GIF · max 5 MB each</p>
      </div>

      <div className="mt-6">
        {loading ? <p className="py-10 text-center text-sm text-ash">Loading library…</p> : items.length === 0 ? (
          <p className="border border-dashed border-graphite py-10 text-center text-sm text-ash">Your library is empty. Upload an image to begin.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((m) => {
              const on = chosen.includes(m.url);
              return (
                <li key={m.id}>
                  <button type="button" onClick={() => toggle(m.url)} aria-pressed={on} className={`relative block aspect-square w-full overflow-hidden border ${on ? 'border-clay' : 'border-graphite hover:border-ash'}`}>
                    <img src={imgUrl(m.url)} alt={m.originalName} loading="lazy" className="h-full w-full object-cover" />
                    {on && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center bg-clay text-ink"><Check size={13} /></span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 border-t border-graphite pt-6">
        <label htmlFor="img-link" className="mb-1.5 block text-xs font-medium text-ash">Or use an image link</label>
        <input id="img-link" className="adm-input" placeholder="https://… or /placeholders/hero.jpg" value={link} onChange={(e) => setLink(e.target.value)} />
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
        <button type="button" className="adm-btn adm-btn-primary" onClick={confirm} disabled={chosen.length === 0 && !link.trim()}>
          Use {chosen.length + (link.trim() ? 1 : 0) || ''} selected
        </button>
      </div>
    </Modal>
  );
}

// One image (cover)
export function ImageField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-4">
      <div className="grid h-28 w-24 shrink-0 place-items-center overflow-hidden border border-graphite bg-coal">
        {value ? <img src={imgUrl(value)} alt="Selected" className="h-full w-full object-cover" /> : <ImagePlus size={20} className="text-ash" />}
      </div>
      <div className="space-y-2">
        <button type="button" className="adm-btn" onClick={() => setOpen(true)}>{value ? 'Change image' : 'Choose image'}</button>
        {value && <button type="button" className="adm-btn adm-btn-danger ml-2" onClick={() => onChange('')}>Remove</button>}
        {value && <p className="max-w-[16rem] truncate text-xs text-ash/70" title={value}>{value}</p>}
      </div>
      {open && <MediaPicker onClose={() => setOpen(false)} onPick={(url) => { onChange(url); setOpen(false); }} />}
    </div>
  );
}

// Several images, with reorder and remove (gallery / product photos)
export function ImagesField({ value = [], onChange, max = 10 }) {
  const [open, setOpen] = useState(false);
  const move = (i, d) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <li key={`${url}-${i}`} className="group relative">
            <div className="aspect-[4/5] overflow-hidden border border-graphite bg-coal">
              <img src={imgUrl(url)} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
            </div>
            <span className="absolute left-1 top-1 bg-ink/80 px-1.5 text-[10px]">{i + 1}</span>
            <div className="mt-1 flex justify-between">
              <button type="button" aria-label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0} className="text-ash hover:text-bone disabled:opacity-20"><ArrowLeft size={14} /></button>
              <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))} className="text-[#e2958c]"><X size={14} /></button>
              <button type="button" aria-label="Move later" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="text-ash hover:text-bone disabled:opacity-20"><ArrowRight size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
      {value.length < max && (
        <button type="button" className="adm-btn mt-3" onClick={() => setOpen(true)}><ImagePlus size={14} /> Add images</button>
      )}
      {open && (
        <MediaPicker multiple onClose={() => setOpen(false)} onPick={(urls) => { onChange([...value, ...urls].slice(0, max)); setOpen(false); }} />
      )}
    </div>
  );
}
