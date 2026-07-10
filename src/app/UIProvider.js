'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Image from 'next/image';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

let _toastId = 0;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const addToast = useCallback((message, type) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  };

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const confirm = useCallback((message, opts = {}) =>
    new Promise((resolve) => setConfirmState({ message, ...opts, resolve }))
  , []);

  const handleConfirm = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {toasts.length > 0 && (
          <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 sm:bottom-6 sm:right-6">
            {toasts.map(t => (
              <div
                key={t.id}
                className={`animate-mh-slide-right flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lift ${
                  t.type === 'error'
                    ? 'border-blood/40 bg-void-raised text-blood-bright'
                    : t.type === 'success'
                      ? 'border-ember/40 bg-void-raised text-ember-bright'
                      : 'border-white/10 bg-void-raised text-mist'
                }`}
              >
                <span className="font-body text-sm">{t.message}</span>
                <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-mist-dim hover:text-mist">
                  <Image src="/icons/MHWilds-Notes_X_Icon.png" width={12} height={12} alt="×" className="pixel-art" />
                </button>
              </div>
            ))}
          </div>
        )}

        {confirmState && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4" onClick={() => handleConfirm(false)}>
            <div className="animate-mh-slide-down w-full max-w-sm rounded-2xl border border-white/10 bg-void-raised p-6 shadow-lift" onClick={e => e.stopPropagation()}>
              {confirmState.title && (
                <div className="mb-2 font-display text-sm uppercase tracking-widest text-mist">{confirmState.title}</div>
              )}
              <p className="font-body text-sm leading-relaxed text-mist-dim">{confirmState.message}</p>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => handleConfirm(false)} className="rounded-lg border border-white/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-mist hover:border-white/20">
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className={`rounded-lg px-4 py-2 font-display text-xs uppercase tracking-widest ${
                    confirmState.danger ? 'bg-blood text-white hover:bg-blood-bright' : 'bg-ember text-void hover:bg-ember-bright'
                  }`}
                >
                  {confirmState.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
