import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-graphite pb-6">
      <div>
        <h1 className="font-display text-4xl leading-none">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ash">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </header>
  );
}

const TONES = {
  published: 'border-[#2f4a36] text-[#9fd0aa]',
  draft: 'border-graphite text-ash',
  pending: 'border-[#5a4a2a] text-[#d9bd7e]',
  confirmed: 'border-[#2a4160] text-[#96b7e0]',
  shipped: 'border-[#2a4160] text-[#96b7e0]',
  delivered: 'border-[#2f4a36] text-[#9fd0aa]',
  paid: 'border-[#2f4a36] text-[#9fd0aa]',
  cancelled: 'border-[#4a2723] text-[#e2958c]',
  failed: 'border-[#4a2723] text-[#e2958c]',
  refunded: 'border-graphite text-ash',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-wider2 ${TONES[status] || TONES.draft}`}>
      {status}
    </span>
  );
}

export function Pager({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-end gap-3 text-sm text-ash">
      <span>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
      <button className="adm-btn !px-2" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
      <button className="adm-btn !px-2" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
    </div>
  );
}

export function TableShell({ children }) {
  return <div className="relative overflow-x-auto border border-graphite"><table className="w-full min-w-[640px] text-left text-sm">{children}</table></div>;
}
export const Th = ({ children, className = '' }) => (
  <th className={`border-b border-graphite bg-coal px-4 py-3 text-[11px] font-medium uppercase tracking-wider2 text-ash ${className}`}>{children}</th>
);
export const Td = ({ children, className = '' }) => <td className={`border-b border-graphite/60 px-4 py-3 align-middle ${className}`}>{children}</td>;

export function Empty({ children }) {
  return <p className="border border-dashed border-graphite py-14 text-center text-sm text-ash">{children}</p>;
}
