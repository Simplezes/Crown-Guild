'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './UIProvider.module.css';

// ── Toast ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// ── Confirm ────────────────────────────────────────────────────────────────
const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

let _toastId = 0;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  // ── toast helpers ────────────────────────────────────────────────────────
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

  // ── confirm helper ───────────────────────────────────────────────────────
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

        {/* ── Toasts ────────────────────────────────────────────────── */}
        {toasts.length > 0 && (
          <div className={styles.toastContainer}>
            {toasts.map(t => (
              <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
                <span className={styles.toastMsg}>{t.message}</span>
                <button className={styles.toastClose} onClick={() => dismissToast(t.id)} aria-label="Dismiss">
                  <Image src="/icons/MHWilds-Notes_X_Icon.png" width={12} height={12} alt="×" className="pixel-art" />
                </button>
                <div className={styles.toastProgress} />
              </div>
            ))}
          </div>
        )}

        {/* ── Confirm modal ─────────────────────────────────────────── */}
        {confirmState && (
          <div className={styles.backdrop} onClick={() => handleConfirm(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              {confirmState.title && (
                <div className={styles.modalTitle}>{confirmState.title}</div>
              )}
              <p className={styles.modalMessage}>{confirmState.message}</p>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => handleConfirm(false)}>
                  Cancel
                </button>
                <button
                  className={`${styles.confirmBtn} ${confirmState.danger ? styles.dangerBtn : ''}`}
                  onClick={() => handleConfirm(true)}
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
