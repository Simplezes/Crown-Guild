'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ContactButton.module.css';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { SOS_FEATURE_ENABLED } from '@/lib/sos';

export default function ContactButton({ hostId, monsterId, monsterName, crownId, discordId }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({
    top: 0,
    left: 0,
    maxWidth: '320px',
    maxHeight: 'calc(100vh - 24px)',
    visibility: 'hidden',
  });

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const isOwnCrown = session?.user?.id === hostId;

  const updateMenuPosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !popupRef.current || typeof window === 'undefined') return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;
    const gap = 8;
    const maxWidth = Math.min(320, viewportWidth - margin * 2);
    const maxHeight = viewportHeight - margin * 2;
    const popupWidth = Math.min(popupRef.current.offsetWidth || maxWidth, maxWidth);
    const popupHeight = Math.min(popupRef.current.offsetHeight || maxHeight, maxHeight);
    const availableBelow = viewportHeight - rect.bottom - gap - margin;
    const availableAbove = rect.top - gap - margin;
    const nextDropUp = availableBelow < Math.min(popupHeight, 220) && availableAbove > availableBelow;

    let left = rect.right - popupWidth;
    left = Math.min(Math.max(margin, left), viewportWidth - margin - popupWidth);

    let top = nextDropUp ? rect.top - popupHeight - gap : rect.bottom + gap;
    top = Math.min(Math.max(margin, top), viewportHeight - margin - popupHeight);

    setDropUp(nextDropUp);
    setMenuStyle({
      top,
      left,
      maxWidth: `${maxWidth}px`,
      maxHeight: `${maxHeight}px`,
      visibility: 'visible',
    });
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen((current) => !current);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleClickOutside(event) {
      const target = event.target;
      if (wrapperRef.current?.contains(target) || popupRef.current?.contains(target)) {
        return;
      }

      if (isOpen) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, updateMenuPosition]);

  useLayoutEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    }
  }, [isOpen, status, errorMsg, updateMenuPosition]);

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

  const menu = isOpen ? createPortal(
    <div
      ref={popupRef}
      className={`${styles.menu} ${dropUp ? styles.dropUp : ''} animate-mh-fade`}
      style={menuStyle}
    >
      <div className={styles.header}>
        <span className="mh-title">Contact Options</span>
      </div>

      {SOS_FEATURE_ENABLED && isOwnCrown && (
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
              const url = `${window.location.origin}/monster/${encodeURIComponent(monsterName)}?crownId=${crownId}&user=${hostId}&share=${buildShareNonce()}`;
              navigator.clipboard.writeText(url);
              setStatus('shared');
              setTimeout(() => setStatus('idle'), 2000);
            }}
          >
            <div className={styles.optionIcon}>
              <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
            </div>
            <div className={styles.optionText}>
              <span className={styles.label}>{status === 'shared' ? 'Link Copied!' : 'Share Crown'}</span>
              <span className={styles.desc}>Get shareable link</span>
            </div>
          </button>

          {SOS_FEATURE_ENABLED && (
            <button className={styles.option + ' ' + styles.sos} onClick={handleRequestSOS}>
              <div className={styles.optionIcon}>
                <Image src="/icons/MHWilds-Quest_Menu_Icon.png" width={18} height={18} alt="" className="pixel-art" />
              </div>
              <div className={styles.optionText}>
                <span className={styles.label}>
                  {status === 'success' ? 'Beacon Fired!' : 'Request SOS Assist'}
                </span>
                <span className={styles.desc}>Notify host via Bot</span>
              </div>
            </button>
          )}
        </>
      )}

      {status === 'error' && (
        <div className={styles.error}>
          {errorMsg}
        </div>
      )}
    </div>,
    document.body
  ) : null;

  if (!SOS_FEATURE_ENABLED && isOwnCrown) {
    return null;
  }

  return (
    <>
    <div className={`${styles.wrapper} ${isOpen ? styles.active : ''}`} ref={wrapperRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={toggleMenu}
        disabled={status === 'loading'}
      >
        <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={16} height={16} alt="" className="pixel-art" />
        {status === 'loading' ? 'Working...' : 'Contact Hunter'}
      </button>
    </div>
    {menu}
    </>
  );
}
