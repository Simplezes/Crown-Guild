"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserSettings } from "@/server/services/settings";
import { useToast } from "@/shared/providers";
import { SettingsModal } from "./SettingsModal";

interface SettingsData {
  user: UserSettings;
  rank: { title: string };
}

interface SettingsContextValue {
  openSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  openSettings: async () => undefined,
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [data, setData] = useState<SettingsData | null>(null);

  const openSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/user/settings", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setData((await response.json()) as SettingsData);
    } catch {
      toast.error("Could not load your settings.");
    }
  }, [toast]);

  const close = useCallback(() => setData(null), []);
  const value = useMemo(() => ({ openSettings }), [openSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
      {data && <SettingsModal user={data.user} rank={data.rank} onClose={close} />}
    </SettingsContext.Provider>
  );
}
