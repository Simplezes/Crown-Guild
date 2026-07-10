"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/app/UIProvider';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

  const btnBase = "flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-semibold uppercase transition-colors disabled:opacity-50";
  const active = "border-ember/50 bg-ember/15 text-ember-bright";
  const inactive = "border-white/10 text-mist-dim hover:border-white/20 hover:text-mist";

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <button
        onClick={() => handleToggle('small')}
        disabled={loading}
        className={`${btnBase} ${isSmallActive ? active : inactive}`}
        title="Track Small Crown"
      >
        <Image src="/icons/smallcrown.png" width={18} height={18} alt="" className="pixel-art" />
        <span>S</span>
      </button>
      <button
        onClick={() => handleToggle('large')}
        disabled={loading}
        className={`${btnBase} ${isLargeActive ? active : inactive}`}
        title="Track Large Crown"
      >
        <Image src="/icons/largecrown.png" width={18} height={18} alt="" className="pixel-art" />
        <span>L</span>
      </button>
    </div>
  );
}
