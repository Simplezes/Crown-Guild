"use client";

import { createContext, useCallback, useContext, useState } from "react";
import LogHuntModal from "./LogHuntModal";

const LogContext = createContext({ openLog: () => {} });
export const useLog = () => useContext(LogContext);

export function LogProvider({ children }) {
  const [state, setState] = useState({ open: false, count: 0, monsterId: null, group: null });

  const openLog = useCallback((opts = {}) => {
    setState((s) => ({ open: true, count: s.count + 1, monsterId: opts.monsterId ?? null, group: opts.group ?? null }));
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  return (
    <LogContext.Provider value={{ openLog }}>
      {children}
      {state.open && <LogHuntModal key={state.count} monsterId={state.monsterId} initialGroup={state.group} onClose={close} />}
    </LogContext.Provider>
  );
}
