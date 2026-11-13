"use client";

import { useEffect } from "react";

export function CrownHighlighter({ crownId }: { crownId?: string | number | null }) {
  useEffect(() => {
    if (!crownId) return;
    const element = document.getElementById(`crown-${crownId}`);
    if (!element) return;
    const timer = setTimeout(
      () => element.scrollIntoView({ behavior: "smooth", block: "center" }),
      150,
    );
    return () => clearTimeout(timer);
  }, [crownId]);

  return null;
}
