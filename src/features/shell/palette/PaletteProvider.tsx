"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Palette } from "./Palette";

interface PaletteContextValue {
  openPalette: () => void;
}

const PaletteContext = createContext<PaletteContextValue>({ openPalette: () => undefined });

export const usePalette = () => useContext(PaletteContext);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = /input|select|textarea/i.test(target.tagName) || target.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (
        event.key === "/" &&
        !typing &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ openPalette }), [openPalette]);

  return (
    <PaletteContext.Provider value={value}>
      {children}
      {open && <Palette onClose={close} />}
    </PaletteContext.Provider>
  );
}
