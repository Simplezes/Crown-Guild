'use client';

import { useEffect } from 'react';

export default function CrownHighlighter({ crownId }) {
  useEffect(() => {
    if (!crownId) return;

    const el = document.getElementById(`crown-${crownId}`);
    if (!el) return;

    // Small delay to allow layout to settle
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    return () => clearTimeout(t);
  }, [crownId]);

  return null;
}
