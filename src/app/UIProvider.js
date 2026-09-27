'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '@/components/shell/Icon';

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
          <div className="twrap" aria-live="polite">
            <div className="toasts">
              {toasts.map(t => (
                <div key={t.id} className="toast" role="status">
                  <Icon name={t.type === 'error' ? 'close' : t.type === 'success' ? 'check' : 'chat'} />
                  <span>{t.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {confirmState && (
          <div className="cfmwrap" onClick={() => handleConfirm(false)}>
            <div className="cfm" role="alertdialog" aria-label={confirmState.title || 'Confirm'} onClick={e => e.stopPropagation()}>
              <span className="cfi"><Icon name={confirmState.danger ? 'trash' : 'check'} /></span>
              <h3>{confirmState.title || 'Are you sure?'}</h3>
              <p>{confirmState.message}</p>
              <div className="cfb">
                <button className="tbx" onClick={() => handleConfirm(false)}>Cancel</button>
                <button className={`tbx solid ${confirmState.danger ? 'danger' : ''}`} onClick={() => handleConfirm(true)}>
                  {confirmState.danger && <Icon name="trash" />}{confirmState.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
