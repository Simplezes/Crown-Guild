"use client";

import { useEffect, useState } from "react";

export interface MonsterOption {
  id: number;
  name: string;
  image_name: string | null;
  type: string;
  emoji?: string | null;
}

let cache: MonsterOption[] | null = null;
let inflight: Promise<MonsterOption[]> | null = null;

function load(): Promise<MonsterOption[]> {
  inflight ??= fetch("/api/monsters")
    .then((res) =>
      res.ok ? (res.json() as Promise<MonsterOption[]>) : Promise.reject(new Error()),
    )
    .then((data) => {
      cache = Array.isArray(data) ? data : [];
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useMonsterOptions(): MonsterOption[] {
  const [monsters, setMonsters] = useState<MonsterOption[]>(cache ?? []);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    load()
      .then((data) => alive && setMonsters(data))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return monsters;
}
