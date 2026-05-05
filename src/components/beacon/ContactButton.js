'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ContactButton.module.css';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

export default function ContactButton({ hostId, monsterId, monsterName, crownId, discordId }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const menuRef = useRef(null);

  const isOwnCrown = session?.user?.id === hostId;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < 300 && spaceAbove > 300) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyTag = () => {
    navigator.clipboard.writeText(discordId || hostId);
    setStatus('copied');
    setTimeout(() => setStatus('idle'), 2000);
  };

  const handleRequestSOS = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/missions/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_id: hostId, monster_id: monsterId, crown_id: crownId }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setIsOpen(false);
        }, 3000);
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Failed to send beacon');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleBroadcastSOS = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/flares/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterId, crownId }),
      });

      if (res.ok) {
        setStatus('broadcast');
        setTimeout(() => {
          setStatus('idle');
          setIsOpen(false);
        }, 3000);
      } else {
        const err = await res.text();
        setStatus('error');
        setErrorMsg(err || 'Failed to broadcast');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className={`${styles.wrapper} ${isOpen ? styles.active : ''}`} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        disabled={status === 'loading'}
      >
        <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={16} height={16} alt="" className="pixel-art" />
        {status === 'loading' ? 'Signaling...' : isOwnCrown ? 'Host Options' : 'Join Hunt'}
      </button>

      {isOpen && (
        <div className={`${styles.menu} ${dropUp ? styles.dropUp : ''} animate-mh-fade`}>
          <div className={styles.header}>
            <span className="mh-title">{isOwnCrown ? 'Host Controls' : 'Contact Options'}</span>
          </div>

          {/* ── Host-only options ─────────────────────── */}
          {isOwnCrown && (
            <button className={styles.option + ' ' + styles.sos} onClick={handleBroadcastSOS}>
              <div className={styles.optionIcon}>
                <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
              </div>
              <div className={styles.optionText}>
                <span className={styles.label}>
                  {status === 'broadcast' ? '📡 Flare Active!' : 'Broadcast Global SOS'}
                </span>
                <span className={styles.desc}>Open this hunt on the Live Radar</span>
              </div>
            </button>
          )}

          {/* ── Seeker-only options ───────────────────── */}
          {!isOwnCrown && (
            <>
              <a
                href={`https://discord.com/users/${hostId}`}
                target="_blank"
                className={styles.option}
                onClick={() => setIsOpen(false)}
              >
                <div className={styles.optionIcon}>
                  <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                </div>
                <div className={styles.optionText}>
                  <span className={styles.label}>Discord Profile</span>
                  <span className={styles.desc}>Open external app</span>
                </div>
              </a>

              <button className={styles.option} onClick={handleCopyTag}>
                <div className={styles.optionIcon}>
                  <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                </div>
                <div className={styles.optionText}>
                  <span className={styles.label}>{status === 'copied' ? 'Copied!' : 'Copy Discord ID'}</span>
                  <span className={styles.desc}>Manual add on Discord</span>
                </div>
              </button>

              <button
                className={styles.option}
                onClick={() => {
                  const url = `${window.location.origin}/monster/${encodeURIComponent(monsterName)}?crownId=${crownId}&user=${hostId}`;
                  navigator.clipboard.writeText(url);
                  setStatus('shared');
                  setTimeout(() => setStatus('idle'), 2000);
                }}
              >
                <div className={styles.optionIcon}>
                  <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                </div>
                <div className={styles.optionText}>
                  <span className={styles.label}>{status === 'shared' ? 'Link Copied!' : 'Share Crown'}</span>
                  <span className={styles.desc}>Get shareable link</span>
                </div>
              </button>

              <button className={styles.option + ' ' + styles.sos} onClick={handleRequestSOS}>
                <div className={styles.optionIcon}>
                  <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                </div>
                <div className={styles.optionText}>
                  <span className={styles.label}>
                    {status === 'success' ? 'Beacon Fired!' : 'Request SOS Assist'}
                  </span>
                  <span className={styles.desc}>Notify host via Bot</span>
                </div>
              </button>
            </>
          )}

          {status === 'error' && (
            <div className={styles.error}>
              {errorMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
