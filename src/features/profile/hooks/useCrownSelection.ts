"use client";

import { useState } from "react";

export function useCrownSelection() {
  const [active, setActive] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const reset = () => {
    setActive(false);
    setPicked(new Set());
  };

  const toggle = (key: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const replace = (keys: string[]) => setPicked(new Set(keys));

  return { active, start: () => setActive(true), picked, toggle, replace, reset };
}
