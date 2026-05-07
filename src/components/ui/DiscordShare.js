"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './DiscordShare.module.css';
import Image from 'next/image';
import { buildShareMonstersFromCrowns, formatEmojiGrid } from '@/lib/discordShareFormatter';
import { emojiservers, emojiServerMeta } from '@/lib/emojiservers';

const emojiServerList = Object.keys(emojiservers).map((id) => ({
  id,
  name: emojiServerMeta?.[id]?.name || `Server ${id}`,
}));

export default function DiscordShare({ id, username, crowns, wishlist }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [copiedMode, setCopiedMode] = useState('');
  const wrapperRef = useRef(null);

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowServerPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateShareText = (useEmojis, emojiServerId) => {
    const shareId = buildShareNonce();
    return formatEmojiGrid({
      username,
      userId: id,
      shareId,
      emojiServerId: emojiServerId || null,
      monsters: buildShareMonstersFromCrowns(crowns),
      wishlist: wishlist || [],
      useEmojis,
    });
  };

  const copyShare = (useEmojis, emojiServerId) => {
    const text = generateShareText(useEmojis, emojiServerId);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMode(useEmojis ? 'emoji' : 'text');
      setIsOpen(false);
      setShowServerPicker(false);
      setTimeout(() => setCopiedMode(''), 2000);
    });
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`mh-button ${styles.shareBtn} ${copiedMode ? styles.copied : ''}`}
        onClick={() => {
          setShowServerPicker(false);
          setIsOpen((prev) => !prev);
        }}
        title="Share for discord"
        style={{ width: '100%', marginTop: '12px' }}
      >
        <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
        <span>
          {copiedMode === 'text' && 'Text Copied!'}
          {copiedMode === 'emoji' && 'Compact Copied!'}
          {!copiedMode && 'Share for discord'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.menu}>
          <button className={styles.option} onClick={() => copyShare(false)}>
            Text
          </button>
          <button className={styles.option} onClick={() => {
            setIsOpen(false);
            setShowServerPicker(true);
          }}>
            Compact format
          </button>
        </div>
      )}

      {showServerPicker && (
        <div className={styles.menu}>
          <div className={styles.serverPickerTitle}>Select a server</div>
          {emojiServerList.map((server) => (
            <button
              key={server.id}
              className={styles.option}
              onClick={() => copyShare(true, server.id)}
            >
              {server.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
