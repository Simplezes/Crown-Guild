"use client";

import { SessionProvider } from "next-auth/react";
import { UIProvider } from "./UIProvider";
import { DrawerProvider } from "@/components/monster/DrawerProvider";
import { PaletteProvider } from "@/components/shell/Palette";
import { SettingsProvider } from "@/components/profile/SettingsProvider";
import { LogProvider } from "@/components/log/LogProvider";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <UIProvider>
        <LogProvider><SettingsProvider><DrawerProvider><PaletteProvider>{children}</PaletteProvider></DrawerProvider></SettingsProvider></LogProvider>
      </UIProvider>
    </SessionProvider>
  );
}
