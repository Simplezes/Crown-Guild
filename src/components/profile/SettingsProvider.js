"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useToast } from "@/app/UIProvider";
import SettingsModal from "./SettingsModal";

const SettingsContext = createContext({ openSettings: () => {} });
export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  const toast = useToast();
  const [data, setData] = useState(null);

  const openSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/user/settings", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Could not load your settings.");
    }
  }, [toast]);

  const close = useCallback(() => setData(null), []);

  return (
    <SettingsContext.Provider value={{ openSettings }}>
      {children}
      {data && <SettingsModal user={data.user} rank={data.rank} onClose={close} />}
    </SettingsContext.Provider>
  );
}
