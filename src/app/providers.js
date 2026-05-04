"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "./NotificationProvider";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SessionProvider>
  );
}
