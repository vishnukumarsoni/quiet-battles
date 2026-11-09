import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// A panel that slides in from the right. Esc or a click on the dark area closes it.
export default function Modal({ title, onClose, children, wide = false }) {
  const panel = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/70" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex h-full w-full flex-col border-l border-graphite bg-ink outline-none ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        <div className="flex items-center justify-between border-b border-graphite px-6 py-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ash hover:text-bone"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
