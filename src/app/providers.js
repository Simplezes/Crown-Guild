"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "./NotificationProvider";
import { UIProvider } from "./UIProvider";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        <UIProvider>
          {children}
        </UIProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}
