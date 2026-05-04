'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/app/NotificationProvider';
import styles from './ToastManager.module.css';
import Image from 'next/image';

export default function ToastManager() {
  const { notifications } = useNotifications();
  const [activeToasts, setActiveToasts] = useState([]);
  const [toastedIds, setToastedIds] = useState(new Set());

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (Date.now() - new Date(latest.created_at).getTime() < 10000) {
        if (!toastedIds.has(latest.id) && latest.status !== 'read') {
          setActiveToasts(prev => [latest, ...prev].slice(0, 3));
          setToastedIds(prev => new Set(prev).add(latest.id));
          setTimeout(() => {
            setActiveToasts(prev => prev.filter(t => t.id !== latest.id));
          }, 5000);
        }
      }
    }
  }, [notifications, toastedIds]);

  const removeToast = (id) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {activeToasts.map((toast) => (
        <div key={toast.id} className={styles.toast + " animate-mh-slide-right"}>
          <div className={styles.content}>
            <div className={styles.icon}>
              <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={20} height={20} alt="" className="pixel-art" />
            </div>

            <div className={styles.text}>
              {toast.type === 'sos_flare' || toast.type === 'beacon' ? (
                <>
                  <span className={styles.highlight}>{toast.requester_name}</span> fired an SOS Flare!
                </>
              ) : toast.type === 'hunt_accepted' ? (
                <>
                  <span className={styles.highlight}>{toast.host_name}</span> accepted your hunt!
                </>
              ) : (
                <span>New Guild message received!</span>
              )}
            </div>

            <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Dismiss" className="pixel-art" />
            </button>
          </div>
          <div className={styles.progress}></div>
        </div>
      ))}
    </div>
  );
}
