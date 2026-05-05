"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './DiscordShare.module.css';
import Image from 'next/image';
import { buildShareMonstersFromCrowns, formatEmojiGrid } from '@/lib/discordShareFormatter';
import { useSession } from 'next-auth/react';

export default function DiscordShare({ id, username, crowns, wishlist }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedMode, setCopiedMode] = useState('');
  const wrapperRef = useRef(null);
  const canUseEmojiMode = !!session?.user?.canUseEmojiShare;
  const selectedServerName = (Array.isArray(session?.user?.guilds)
    ? session.user.guilds.find((guild) => String(guild?.id) === String(session?.user?.mainCrownServerId || ''))?.name
    : null) || 'Selected Server';

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateShareText = (useEmojis) => {
    const shareId = buildShareNonce();
    return formatEmojiGrid({
      username,
      userId: id,
      shareId,
      emojiServerId: session?.user?.mainCrownServerId,
      monsters: buildShareMonstersFromCrowns(crowns),
      wishlist: wishlist || [],
      useEmojis,
    });
  };

  const copyShare = (useEmojis) => {
    const text = generateShareText(useEmojis);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMode(useEmojis ? 'emoji' : 'text');
      setIsOpen(false);
      setTimeout(() => setCopiedMode(''), 2000);
    });
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`mh-button ${styles.shareBtn} ${copiedMode ? styles.copied : ''}`}
        onClick={() => {
          if (!canUseEmojiMode) {
            copyShare(false);
            return;
          }

          setIsOpen((prev) => !prev);
        }}
        title="Share for discord"
        style={{ width: '100%', marginTop: '12px' }}
      >
        <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
        <span>
          {copiedMode === 'text' && 'Text Copied!'}
          {copiedMode === 'emoji' && 'Emoji Share Copied!'}
          {!copiedMode && 'Share for discord'}
        </span>
      </button>

      {isOpen && canUseEmojiMode && (
        <div className={styles.menu}>
          <button className={styles.option} onClick={() => copyShare(false)}>
            Text
          </button>
          <button className={styles.option} onClick={() => copyShare(true)}>
            Emojis for {selectedServerName}
          </button>
        </div>
      )}
    </div>
  );
}
