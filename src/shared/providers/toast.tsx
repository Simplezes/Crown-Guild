"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/shared/ui";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface Toaster {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ICONS: Record<ToastKind, string> = { error: "close", success: "check", info: "chat" };

const ToastContext = createContext<Toaster | null>(null);

export function useToast(): Toaster {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, kind: ToastKind) => {
    const id = ++nextId;
    setToasts((current) => [...current, { id, message, kind }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  const toaster = useMemo<Toaster>(
    () => ({
      success: (message) => add(message, "success"),
      error: (message) => add(message, "error"),
      info: (message) => add(message, "info"),
    }),
    [add],
  );

  return (
    <ToastContext.Provider value={toaster}>
      {children}
      {toasts.length > 0 && (
        <div className="twrap" aria-live="polite">
          <div className="toasts">
            {toasts.map((toast) => (
              <div key={toast.id} className="toast" role="status">
                <Icon name={ICONS[toast.kind]} />
                <span>{toast.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
