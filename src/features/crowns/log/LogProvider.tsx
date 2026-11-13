"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { LogHuntModal } from "./LogHuntModal";
import type { GroupCrown } from "./types";

interface OpenLogOptions {
  monsterId?: number | null;
  group?: GroupCrown[] | null;
}

interface LogContextValue {
  openLog: (options?: OpenLogOptions) => void;
}

interface LogState {
  open: boolean;
  count: number;
  monsterId: number | null;
  group: GroupCrown[] | null;
}

const LogContext = createContext<LogContextValue>({ openLog: () => undefined });

export const useLog = () => useContext(LogContext);

export function LogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LogState>({
    open: false,
    count: 0,
    monsterId: null,
    group: null,
  });

  const openLog = useCallback((options: OpenLogOptions = {}) => {
    setState((current) => ({
      open: true,
      count: current.count + 1,
      monsterId: options.monsterId ?? null,
      group: options.group ?? null,
    }));
  }, []);
  const close = useCallback(() => setState((current) => ({ ...current, open: false })), []);
  const value = useMemo(() => ({ openLog }), [openLog]);

  return (
    <LogContext.Provider value={value}>
      {children}
      {state.open && (
        <LogHuntModal
          key={state.count}
          monsterId={state.monsterId}
          initialGroup={state.group}
          onClose={close}
        />
      )}
    </LogContext.Provider>
  );
}
