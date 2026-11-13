"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { LogProvider } from "@/features/crowns";
import { DrawerProvider } from "@/features/monster";
import { SettingsProvider } from "@/features/profile";
import { PaletteProvider } from "@/features/shell";
import { ConfirmProvider, RankUpProvider, ToastProvider } from "@/shared/providers";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ConfirmProvider>
          <RankUpProvider>
            <LogProvider>
              <SettingsProvider>
                <DrawerProvider>
                  <PaletteProvider>{children}</PaletteProvider>
                </DrawerProvider>
              </SettingsProvider>
            </LogProvider>
          </RankUpProvider>
        </ConfirmProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
