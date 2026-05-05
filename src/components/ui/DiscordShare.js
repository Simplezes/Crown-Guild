"use client";

import { useState } from 'react';
import styles from './DiscordShare.module.css';
import Image from 'next/image';

export default function DiscordShare({ id, username, crowns, wishlist }) {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    const lines = [];

    lines.push(`**${username} - Crown Collection**`);

    if (crowns && crowns.length > 0) {
      const monsterData = {};
      crowns.forEach(c => {
        const key = `${c.name}||${c.tempered ? 1 : 0}`;
        if (!monsterData[key]) {
          monsterData[key] = { name: c.name, tempered: !!c.tempered, small: null, large: null };
        }
        monsterData[key][c.type] = {
          rating: c.strength_rating || 1,
          isInvestigation: !!c.investigation_id,
          remainingUses: c.remaining_uses,
        };
      });

      const formatCrown = (info) => {
        let s = `${info.rating}★`;
        if (info.isInvestigation) s += ` (${info.remainingUses ?? '?'} uses)`;
        return s;
      };

      const formatName = (entry) => entry.tempered ? `Tempered ${entry.name}` : entry.name;

      const both = [], smallOnly = [], largeOnly = [];
      Object.values(monsterData).forEach(entry => {
        if (entry.small && entry.large) both.push(entry);
        else if (entry.small) smallOnly.push(entry);
        else if (entry.large) largeOnly.push(entry);
      });

      if (both.length > 0) {
        lines.push('');
        lines.push('**Small + Large**');
        both.forEach(e => lines.push(`${formatName(e)} - S ${formatCrown(e.small)}  L ${formatCrown(e.large)}`));
      }
      if (smallOnly.length > 0) {
        lines.push('');
        lines.push('**Small Crown**');
        smallOnly.forEach(e => lines.push(`${formatName(e)} - ${formatCrown(e.small)}`));
      }
      if (largeOnly.length > 0) {
        lines.push('');
        lines.push('**Large Crown**');
        largeOnly.forEach(e => lines.push(`${formatName(e)} - ${formatCrown(e.large)}`));
      }
    }

    if (wishlist && wishlist.length > 0) {
      const wishlistItems = wishlist.map(w => {
        const typeLabel = w.type === 'both' ? 'S+L' : (w.type === 'small' ? 'S' : 'L');
        return `${w.monster_name} (${typeLabel})`;
      });
      lines.push('');
      lines.push(`**Wishlist:** ${wishlistItems.join(' · ')}`);
    }

    lines.push('');
    lines.push(`${process.env.NEXT_PUBLIC_WEB_URL}/profile/${id}?t=${Date.now()}`);

    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = generateMarkdown();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      className={`mh-button ${styles.shareBtn} ${copied ? styles.copied : ''}`}
      onClick={handleCopy}
      title="Copy markdown for Discord"
      style={{ width: '100%', marginTop: '12px' }}
    >
      <Image src="/icons/MHWilds-Link_Party_Icon.png" width={18} height={18} alt="" className="pixel-art" />
      <span>{copied ? 'Copied to Clipboard!' : 'Share to Discord'}</span>
    </button>
  );
}
