"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { buildShareMonstersFromCrowns, formatEmojiGrid } from '@/lib/discordShareFormatter';
import { emojiservers, emojiServerMeta } from '@/lib/emojiservers';

const emojiServerList = Object.keys(emojiservers).map((id) => ({
  id,
  name: emojiServerMeta?.[id]?.name || `Server ${id}`,
}));

function OptionCard({ label, description, onClick }) {
  return (
    <button
      className="flex flex-col gap-1 rounded-lg border border-white/10 bg-void px-3 py-3 text-left transition-colors hover:border-ember/40 hover:bg-white/5"
      onClick={onClick}
    >
      <span className="font-display text-sm text-mist">{label}</span>
      {description && <span className="font-body text-xs text-mist-dim">{description}</span>}
    </button>
  );
}

export default function DiscordShare({ id, username, crowns, wishlist }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingServer, setSelectingServer] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedMode, setCopiedMode] = useState('');

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const buildProfileCardImageUrl = (cardMode = 'full') => `${window.location.origin}/profile/${encodeURIComponent(id)}/og?card=${cardMode}&share=${buildShareNonce()}`;

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSelectingServer(false);
      }
    }
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const generateShareText = (useEmojis, emojiServerId) => {
    const shareId = buildShareNonce();
    return formatEmojiGrid({
      username,
      userId: id,
      shareId,
      emojiServerId: emojiServerId || null,
      monsters: buildShareMonstersFromCrowns(crowns),
      crowns: crowns || [],
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
    setIsCopyingImage(true);

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
    } finally {
      setIsCopyingImage(false);
    }
  };

  const shareLabel =
    (isCopyingImage && 'Loading...') ||
    (copiedMode === 'text' && 'Text Copied!') ||
    (copiedMode === 'emoji' && 'Compact Copied!') ||
    (copiedMode === 'full' && 'Full Card Copied!') ||
    (copiedMode === 'monsters' && 'Monsters Card Copied!') ||
    'Share for discord';

  const menu = isOpen && typeof window !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 p-4 animate-mh-fade"
      onClick={() => { setIsOpen(false); setSelectingServer(false); }}
    >
      <div 
        className="flex w-full max-w-sm flex-col rounded-2xl border border-ember bg-void-panel shadow-2xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-void px-5 py-4">
          <span className="font-display text-base uppercase tracking-widest text-ember-bright">Share Profile</span>
          <button 
            onClick={() => { setIsOpen(false); setSelectingServer(false); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xl leading-none text-mist-dim transition-colors hover:border-white/30 hover:text-mist"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5 max-h-[70vh] overflow-y-auto">
          {selectingServer ? (
            <>
              <div className="px-1 font-display text-xs uppercase tracking-wider text-ember">Select a server</div>
              <div className="grid grid-cols-2 gap-2.5">
                {emojiServerList.map((server) => (
                  <OptionCard key={server.id} label={server.name} onClick={() => copyShare(true, server.id)} />
                ))}
              </div>
              <div className="my-1 h-px bg-white/10" />
              <button className="w-full rounded-lg border border-white/10 py-2.5 font-display text-xs uppercase tracking-widest text-mist hover:border-ember/40 hover:text-ember-bright" onClick={() => setSelectingServer(false)}>
                ← Back
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <div className="px-1 font-display text-xs uppercase tracking-wider text-ember">Copy image</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <OptionCard label="Full card" description="Profile details + monsters" onClick={() => copyProfileCard('full')} />
                  <OptionCard label="Monsters card" description="Monsters only" onClick={() => copyProfileCard('monsters')} />
                </div>
              </div>

              <div className="my-1 h-px bg-white/10" />

              <div className="flex flex-col gap-2">
                <div className="px-1 font-display text-xs uppercase tracking-wider text-ember">Share text</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <OptionCard label="Standard text" description="Full markdown format" onClick={() => copyShare(false)} />
                  <OptionCard label="Compact format" description="With emoji servers" onClick={() => setSelectingServer(true)} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-display text-xs uppercase tracking-widest transition-colors ${
          copiedMode ? "bg-green-600 text-white" : "bg-ember text-void hover:bg-ember-bright"
        }`}
        onClick={() => {
          setSelectingServer(false);
          setIsOpen(true);
        }}
        title="Share for discord"
      >
        <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
        <span>{shareLabel}</span>
      </button>
      {menu}
    </>
  );
}
