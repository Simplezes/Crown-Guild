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
  const [selectingServer, setSelectingServer] = useState(false);
  const [copiedMode, setCopiedMode] = useState('');
  const wrapperRef = useRef(null);

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const buildProfileCardImageUrl = (cardMode = 'full') => `${window.location.origin}/profile/${encodeURIComponent(id)}/og?card=${cardMode}&share=${buildShareNonce()}`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectingServer(false);
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
      setSelectingServer(false);
      setTimeout(() => setCopiedMode(''), 2000);
    });
  };

  const copyProfileCard = async (cardMode) => {
    try {
      const imageUrl = buildProfileCardImageUrl(cardMode);

      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': fetch(imageUrl).then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch profile card image: ${response.status}`);
              }

              return response.blob();
            }),
          }),
        ]);
      } else {
        throw new Error('Image clipboard is not supported in this browser');
      }

      setCopiedMode(cardMode);
      setIsOpen(false);
      setSelectingServer(false);
      setTimeout(() => setCopiedMode(''), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`mh-button ${styles.shareBtn} ${copiedMode ? styles.copied : ''}`}
        onClick={() => {
          setSelectingServer(false);
          setIsOpen((prev) => !prev);
        }}
        title="Share for discord"
        style={{ width: '100%', marginTop: '12px' }}
      >
        <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
        <span>
          {copiedMode === 'text' && 'Text Copied!'}
          {copiedMode === 'emoji' && 'Compact Copied!'}
          {copiedMode === 'full' && 'Full Card Copied!'}
          {copiedMode === 'monsters' && 'Monsters Card Copied!'}
          {!copiedMode && 'Share for discord'}
        </span>
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {selectingServer ? (
            <>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Select a server</div>
              </div>
              <div className={styles.serverGrid}>
                {emojiServerList.map((server) => (
                  <button
                    key={server.id}
                    className={styles.optionCard}
                    onClick={() => copyShare(true, server.id)}
                  >
                    <span className={styles.optionLabel}>{server.name}</span>
                  </button>
                ))}
              </div>
              <div className={styles.menuDivider} />
              <button className={styles.backButton} onClick={() => setSelectingServer(false)}>
                ← Back
              </button>
            </>
          ) : (
            <>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Copy image</div>
                <div className={styles.actionGrid}>
                  <button className={styles.optionCard} onClick={() => copyProfileCard('full')}>
                    <span className={styles.optionLabel}>Full card</span>
                    <span className={styles.optionDescription}>Profile details + monsters</span>
                  </button>
                  <button className={styles.optionCard} onClick={() => copyProfileCard('monsters')}>
                    <span className={styles.optionLabel}>Monsters card</span>
                    <span className={styles.optionDescription}>Monsters only</span>
                  </button>
                </div>
              </div>

              <div className={styles.menuDivider} />

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Share text</div>
                <div className={styles.actionGrid}>
                  <button className={styles.optionCard} onClick={() => copyShare(false)}>
                    <span className={styles.optionLabel}>Standard text</span>
                    <span className={styles.optionDescription}>Full markdown format</span>
                  </button>
                  <button className={styles.optionCard} onClick={() => setSelectingServer(true)}>
                    <span className={styles.optionLabel}>Compact format</span>
                    <span className={styles.optionDescription}>With emoji servers</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
