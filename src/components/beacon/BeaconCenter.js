'use client';

import { useState, useRef } from 'react';
import styles from './BeaconCenter.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useNotifications } from '@/app/NotificationProvider';

export default function BeaconCenter() {
  const { notifications, unreadCount, actOnNotification, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      markAllAsRead('hunt_accepted');
    }
  };

  const handleAction = async (id, action) => {
    if (loadingId) return;
    setLoadingId(id);
    try {
      await actOnNotification(id, action);
      if (action === 'accept') {
        setFeedback({ type: 'success', msg: 'Hunt Accepted! Check your investigations.' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  const unreadNotifications = notifications.filter(n => n.status !== 'read');

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button className={styles.trigger} onClick={toggleMenu}>
        <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={24} height={24} alt="" className="pixel-art" />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.menu + " animate-mh-fade"}>
          <div className={styles.header}>
            <h3 className="mh-title">Beacon Log</h3>
            <button className={styles.refreshBtn} onClick={refresh}>Refresh</button>
          </div>
          
          {feedback && (
            <div className={`${styles.feedback} ${feedback.type === 'error' ? styles.errorFeedback : styles.success} animate-mh-fade`}>
              {feedback.msg}
            </div>
          )}

          <div className={styles.list}>
            {unreadNotifications.length > 0 ? unreadNotifications.map((n) => (
              <div key={n.id} className={styles.item}>
                <div className={styles.requester}>
                  <Image
                    src={(n.type === 'hunt_accepted' ? n.host_avatar : n.requester_avatar) || "/icons/MHWilds-Quest_Members_Icon.png"}
                    width={32}
                    height={32}
                    className={styles.avatar}
                    alt=""
                  />
                  <div className={styles.reqInfo}>
                    <span className={styles.name}>{n.type === 'hunt_accepted' ? n.host_name : n.requester_name}</span>
                    <span className={styles.message}>
                      {n.type === 'hunt_accepted' ? 'Accepted your hunt!' : 'Fired an SOS flare'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.targetInfo}>
                  <div className={styles.monster}>
                    <Image src={`/monsters/${n.monster_image}`} width={24} height={24} alt="" className="pixel-art" />
                    <span>{n.monster_name}</span>
                  </div>
                  <div className={styles.crown}>
                    <Image src={n.crown_type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={14} height={14} alt="" className="pixel-art" />
                    <span>{n.crown_type}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  {n.type === 'hunt_accepted' ? (
                    <>
                      <Link href={`/profile/${n.host_id}`} className={styles.acceptBtn} onClick={() => { markAsRead(n.id); setIsOpen(false); }}>
                        View Host Profile
                      </Link>
                      <button className={styles.iconBtn} onClick={() => markAsRead(n.id)} title="Dismiss">
                        <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="Dismiss" className="pixel-art" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className={styles.acceptBtn} 
                        onClick={() => handleAction(n.id, 'accept')}
                        disabled={loadingId === n.id}
                      >
                        {loadingId === n.id ? '...' : 'Accept Hunt'}
                      </button>
                      <button 
                        className={styles.declineBtn} 
                        onClick={() => handleAction(n.id, 'decline')}
                        disabled={loadingId === n.id}
                      >
                        {loadingId === n.id ? '...' : 'Decline'}
                      </button>
                    </>
                  )}
                  <Link href={`/monster/${n.monster_name}`} className={styles.iconBtn} onClick={() => setIsOpen(false)}>
                    <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="Details" className="pixel-art" />
                  </Link>
                </div>
              </div>
            )) : (
              <div className={styles.empty}>
                <p>No active SOS flares received.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
