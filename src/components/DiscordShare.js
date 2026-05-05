"use client";

import { useState } from 'react';
import styles from './DiscordShare.module.css';
import Image from 'next/image';

export default function DiscordShare({ id, username, crowns, wishlist }) {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    let text = `### 👑 Crown Collection: ${username}\n\n`;

    if (crowns && crowns.length > 0) {
      const monsterData = {};
      crowns.forEach(c => {
        if (!monsterData[c.name]) monsterData[c.name] = { small: null, large: null };
        monsterData[c.name][c.type] = c.strength_rating || 1;
      });

      const completed = [];
      const partialSmall = [];
      const partialLarge = [];

      Object.entries(monsterData).forEach(([name, status]) => {
        if (status.small && status.large) {
          completed.push(`• **${name}** (${status.small}★ | ${status.large}★)`);
        } else if (status.small) {
          partialSmall.push(`• **${name}** (${status.small}★)`);
        } else if (status.large) {
          partialLarge.push(`• **${name}** (${status.large}★)`);
        }
      });

      if (completed.length > 0) {
        text += `**✨ Small + Large:**\n${completed.join('\n')}\n\n`;
      }
      if (partialSmall.length > 0) {
        text += `**🔸 Small Only:**\n${partialSmall.join('\n')}\n\n`;
      }
      if (partialLarge.length > 0) {
        text += `**🔹Large Only:**\n${partialLarge.join('\n')}\n\n`;
      }
    }

    if (wishlist && wishlist.length > 0) {
      text += `**📝 My Wishlist:**\n`;
      wishlist.forEach(w => {
        const typeLabel = w.type === 'both' ? 'S+L' : (w.type === 'small' ? 'Small' : 'Large');
        text += `• **${w.monster_name}** [${typeLabel}]\n`;
      });
      text += `\n`;
    }

    text += `*View Full Collection: https://crownguild.vercel.app/profile/${id}?*`;
    return text;
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
