"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/shared/providers";

export type ListingKind = "small" | "large";
export type ListingMap = Record<number, string | null | undefined>;

interface ListingMonster {
  id: number;
  name: string;
}

export function useListing(endpoint: string, noun: string, initial: ListingMap) {
  const router = useRouter();
  const toast = useToast();
  const [map, setMap] = useState<ListingMap>(initial);

  const toggle = async (monster: ListingMonster, kind: ListingKind) => {
    const previous = map[monster.id] ?? null;
    let small = previous === "both" || previous === "small";
    let large = previous === "both" || previous === "large";
    if (kind === "small") small = !small;
    else large = !large;
    const next = small && large ? "both" : small ? "small" : large ? "large" : null;

    setMap((current) => ({ ...current, [monster.id]: next }));
    try {
      const response = await fetch(endpoint, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monsterId: monster.id, type: next }),
      });
      if (!response.ok) throw new Error();
      const added = kind === "small" ? small : large;
      toast.success(
        `${monster.name} ${kind} crown ${added ? "added to" : "removed from"} your ${noun}.`,
      );
      router.refresh();
    } catch {
      setMap((current) => ({ ...current, [monster.id]: previous }));
      toast.error(`Could not update your ${noun}.`);
    }
  };

  return { map, toggle };
}
