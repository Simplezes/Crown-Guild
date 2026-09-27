'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Icon, Emblem } from '@/components/shell/Icon';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

const RankUpContext = createContext(null);
export const useRankUp = () => useContext(RankUpContext);

let _toastId = 0;
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: Math.round((i * 137.5) % 100),
  delay: (i % 7) * 0.09,
  drift: ((i % 5) - 2) * 18,
  hue: (i * 47) % 360,
}));

function RankUpOverlay({ rankUp, onClose }) {
  return (
    <div className="rupwrap" onClick={onClose}>
      <div className="rupfx" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <i key={i} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, '--drift': `${c.drift}px`, background: `hsl(${c.hue} 80% 60%)` }} />
        ))}
      </div>
      <div className="rupcard" role="alertdialog" aria-label="Rank up" onClick={(e) => e.stopPropagation()}>
        <span className="rupeyebrow">Rank up</span>
        <div className="rupbadge"><Emblem rank={rankUp.rank} /></div>
        <h2>{rankUp.title}</h2>
        <p>You&apos;ve earned a new Hunter rank.</p>
        <button className="tbx pri" onClick={onClose}>Nice!</button>
      </div>
    </div>
  );
}

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [rankUp, setRankUp] = useState(null);

  const celebrateRankUp = useCallback((next) => {
    if (!next) return;
    setRankUp(next);
  }, []);

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
        <RankUpContext.Provider value={celebrateRankUp}>
        {children}

        {rankUp && <RankUpOverlay rankUp={rankUp} onClose={() => setRankUp(null)} />}

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
        </RankUpContext.Provider>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
