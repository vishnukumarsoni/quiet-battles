import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (message, type = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss]
  );
  const api = useMemo(
    () => ({ show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error') }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 border px-4 py-3 text-sm max-w-sm toast-in ${
              t.type === 'error' ? 'bg-[#2a1614] border-[#6b2a24] text-[#f1c9c4]' : 'bg-coal border-graphite text-bone'
            }`}
          >
            {t.type === 'success' && <Check size={16} className="mt-0.5 shrink-0 text-clay" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-ash hover:text-bone">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
