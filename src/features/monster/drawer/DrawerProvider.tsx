"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Drawer } from "./Drawer";

interface DrawerContextValue {
  openDrawer: (name: string) => void;
}

const DrawerContext = createContext<DrawerContextValue>({ openDrawer: () => undefined });

export const useDrawer = () => useContext(DrawerContext);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  const openDrawer = useCallback((next: string) => setName(next), []);
  const close = useCallback(() => setName(null), []);
  const value = useMemo(() => ({ openDrawer }), [openDrawer]);

  return (
    <DrawerContext.Provider value={value}>
      {children}
      {name && <Drawer key={name} name={name} onClose={close} />}
    </DrawerContext.Provider>
  );
}
