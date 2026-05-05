"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/app/UIProvider';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './WishlistToggle.module.css';

export default function WishlistToggle({ monsterId, initialType, className }) {
  const { data: session } = useSession();
  const toast = useToast();
  const router = useRouter();
  const [currentType, setCurrentType] = useState(initialType);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentType(initialType);
  }, [initialType]);

  if (!session) return null;

  const handleToggle = async (typeToToggle) => {
    setLoading(true);
    try {
      let newType = null;

      if (typeToToggle === 'small') {
        if (currentType === 'small') newType = null;
        else if (currentType === 'large') newType = 'both';
        else if (currentType === 'both') newType = 'large';
        else newType = 'small';
      } else {
        if (currentType === 'large') newType = null;
        else if (currentType === 'small') newType = 'both';
        else if (currentType === 'both') newType = 'small';
        else newType = 'large';
      }

      const method = newType ? 'POST' : 'DELETE';
      const res = await fetch('/api/wishlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterId, type: newType }),
      });

      if (res.ok) {
        setCurrentType(newType);
        toast.success(newType ? `Tracking ${newType} crowns!` : 'Removed from wishlist');
        router.refresh();
      } else {
        toast.error('Failed to update wishlist');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isSmallActive = currentType === 'small' || currentType === 'both';
  const isLargeActive = currentType === 'large' || currentType === 'both';

  return (
    <div className={styles.dualToggle + " " + className}>
      <button
        onClick={() => handleToggle('small')}
        disabled={loading}
        className={`${styles.toggleBtn} ${isSmallActive ? styles.active : ''}`}
        title="Track Small Crown"
      >
        <Image
          src="/icons/smallcrown.png"
          width={18}
          height={18}
          alt=""
          className="pixel-art"
        />
        <span className={styles.label}>S</span>
      </button>
      <button
        onClick={() => handleToggle('large')}
        disabled={loading}
        className={`${styles.toggleBtn} ${isLargeActive ? styles.active : ''}`}
        title="Track Large Crown"
      >
        <Image
          src="/icons/largecrown.png"
          width={18}
          height={18}
          alt=""
          className="pixel-art"
        />
        <span className={styles.label}>L</span>
      </button>
    </div>
  );
}
