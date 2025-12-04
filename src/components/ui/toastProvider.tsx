import { createContext, ReactNode, useContext, useState } from 'react';

type Toast = {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, type: Toast['type'] = 'info') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md border px-3 py-2 text-sm shadow-md bg-white ${
              t.type === 'error'
                ? 'border-red-400 text-red-700'
                : t.type === 'success'
                ? 'border-emerald-400 text-emerald-700'
                : 'border-slate-300 text-slate-700'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast sadece ToastProvider içinde kullanılabilir');
  }
  return ctx;
}


