"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { crownMp, getSpeciesTier } from "@/config/mastery";
import type { MonsterOption } from "@/shared/hooks/useMonsterOptions";
import { useRankUp, useToast, type RankUpInfo } from "@/shared/providers";
import { tilesOf } from "../components/HuntTile";
import { blankEntry, entryFromCrown } from "./entries";
import {
  DEFAULT_QUEST,
  INVESTIGATION,
  MAX_CROWNS,
  QUESTS,
  type GroupCrown,
  type LogEntry,
  type PickTarget,
} from "./types";

interface SaveResponse {
  error?: string;
  rankUp?: RankUpInfo | null;
}

interface Options {
  monsterId: number | null;
  initialGroup: GroupCrown[] | null;
  monsters: MonsterOption[];
  onClose: () => void;
}

export function useLogForm({ monsterId, initialGroup, monsters, onClose }: Options) {
  const router = useRouter();
  const toast = useToast();
  const celebrateRankUp = useRankUp();
  const first = initialGroup?.[0];
  const editing = !!initialGroup?.length;

  const [loading, setLoading] = useState(false);
  const [pick, setPick] = useState<PickTarget>(null);
  const [pickQuery, setPickQuery] = useState("");
  const [quest, setQuest] = useState(first?.quest || INVESTIGATION);
  const [uses, setUses] = useState(first?.remaining_uses || 3);
  const [differentQuestMonster, setDifferent] = useState(
    !!first?.investigation_id && String(first.inv_monster_id) !== String(first.monster_id),
  );
  const [primaryId, setPrimaryId] = useState<number | "">(first?.inv_monster_id || "");
  const [rawEntries, setEntries] = useState<LogEntry[]>(() =>
    initialGroup?.length ? initialGroup.map(entryFromCrown) : [blankEntry(monsterId ?? "")],
  );

  const defaultMonster: number | "" = monsters[0]?.id ?? "";
  const entries = useMemo<LogEntry[]>(
    () =>
      rawEntries.map((entry, index) =>
        index === 0 && !entry.monster_id ? { ...entry, monster_id: defaultMonster } : entry,
      ),
    [rawEntries, defaultMonster],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pick !== null) setPick(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [pick, onClose]);

  const byId = useMemo(() => new Map(monsters.map((m) => [String(m.id), m])), [monsters]);
  const monsterOf = (id: number | ""): MonsterOption =>
    byId.get(String(id)) ?? { id: 0, name: "…", image_name: null, type: "Monster" };

  const isInvestigation = quest === INVESTIGATION;
  const primary: number | "" = primaryId || monsters[0]?.id || "";

  const updateEntry = (index: number, patch: Partial<LogEntry>) =>
    setEntries((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  const removeEntry = (index: number) =>
    setEntries((current) => current.filter((_, i) => i !== index));
  const addEntry = () => setEntries((current) => [...current, blankEntry(monsters[0]?.id ?? "")]);

  const payloadFor = (entry: LogEntry, pairId: string | null) => ({
    quest,
    investigation_monster_id: differentQuestMonster ? Number(primary) : null,
    remaining_uses: isInvestigation ? uses : null,
    pair_id: pairId,
    monster_id: Number(entry.monster_id),
    type: entry.type,
    tempered: entry.tempered,
    strength_rating: entry.strength_rating,
    size_cm: entry.sizeMode === "cm" && entry.size ? Number.parseFloat(entry.size) : null,
    size_label: entry.sizeMode === "label" && entry.sizeLabel ? entry.sizeLabel : null,
  });

  const send = (url: string, method: string, body?: unknown) =>
    fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

  const submit = async () => {
    if (loading) return;
    if (entries.some((entry) => !entry.monster_id)) {
      toast.error("Choose a monster for every crown.");
      return;
    }
    setLoading(true);
    try {
      const existingPair = initialGroup?.[0]?.pair_id || null;
      const pairId = entries.length > 1 ? existingPair || crypto.randomUUID() : existingPair;

      const requests = entries.map((entry) =>
        entry.id
          ? send(`/api/crowns/${entry.id}`, "PATCH", payloadFor(entry, pairId))
          : send("/api/crowns", "POST", payloadFor(entry, pairId)),
      );
      const kept = new Set(entries.map((entry) => entry.id).filter(Boolean));
      for (const crown of initialGroup ?? []) {
        if (!kept.has(crown.id)) requests.push(send(`/api/crowns/${crown.id}`, "DELETE"));
      }

      const results = await Promise.all(requests);
      const failed = results.find((result) => !result.ok);
      if (failed) {
        const data = (await failed.json().catch(() => ({}))) as SaveResponse;
        toast.error(data.error || "Failed to save the hunt record.");
        return;
      }

      const payloads = await Promise.all(
        results.map((result) => result.json().catch(() => ({})) as Promise<SaveResponse>),
      );
      const bestRankUp = payloads.reduce<RankUpInfo | null>(
        (best, payload) =>
          payload.rankUp && (!best || payload.rankUp.rank > best.rank) ? payload.rankUp : best,
        null,
      );
      toast.success(editing ? "Hunt record updated." : "Hunt record logged.");
      onClose();
      router.refresh();
      if (bestRankUp) celebrateRankUp(bestRankUp);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const tiles = tilesOf(
    entries.map((entry) => {
      const monster = monsterOf(entry.monster_id);
      return {
        name: monster.name,
        image: monster.image_name,
        type: entry.type,
        tempered: entry.tempered,
        strength: entry.strength_rating,
        size: entry.sizeMode === "cm" ? Number.parseFloat(entry.size) || 0 : 0,
        sizeLabel: entry.sizeMode === "label" ? entry.sizeLabel : "",
      };
    }),
  );

  const masteryPreview = entries.reduce(
    (sum, entry) =>
      sum + crownMp(getSpeciesTier(monsterOf(entry.monster_id).type), entry.type, entry.tempered),
    0,
  );

  const pickCurrent =
    pick === "primary"
      ? String(primary)
      : pick !== null
        ? String(entries[pick]?.monster_id ?? "")
        : "";

  return {
    editing,
    loading,
    quest,
    setQuest,
    uses,
    setUses,
    differentQuestMonster,
    setDifferent,
    primary,
    setPrimaryId,
    entries,
    updateEntry,
    removeEntry,
    addEntry,
    freeSlots: Math.max(0, MAX_CROWNS - entries.length),
    isInvestigation,
    questMeta: QUESTS.find((q) => q.value === quest) ?? DEFAULT_QUEST,
    monsterOf,
    tiles,
    masteryPreview,
    pick,
    setPick,
    pickQuery,
    setPickQuery,
    pickCurrent,
    submit,
  };
}

export type LogForm = ReturnType<typeof useLogForm>;
