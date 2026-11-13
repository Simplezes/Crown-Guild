"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "@/shared/ui";

interface ConfirmOptions {
  title?: string;
  danger?: boolean;
  confirmLabel?: string;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
  resolve: (result: boolean) => void;
}

type Confirm = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used inside ConfirmProvider");
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback<Confirm>(
    (message, options = {}) => new Promise((resolve) => setState({ message, ...options, resolve })),
    [],
  );

  const settle = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="cfmwrap" onClick={() => settle(false)}>
          <div
            className="cfm"
            role="alertdialog"
            aria-label={state.title || "Confirm"}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="cfi">
              <Icon name={state.danger ? "trash" : "check"} />
            </span>
            <h3>{state.title || "Are you sure?"}</h3>
            <p>{state.message}</p>
            <div className="cfb">
              <button className="tbx" onClick={() => settle(false)}>
                Cancel
              </button>
              <button
                className={`tbx solid ${state.danger ? "danger" : ""}`}
                onClick={() => settle(true)}
              >
                {state.danger && <Icon name="trash" />}
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
