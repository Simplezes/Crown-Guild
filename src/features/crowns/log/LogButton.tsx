"use client";

import { Icon } from "@/shared/ui";
import { useLog } from "./LogProvider";

export function LogButton({ monsterId }: { monsterId: number }) {
  const { openLog } = useLog();
  return (
    <button className="lg2" onClick={() => openLog({ monsterId })}>
      <Icon name="plus" />
      Log crown
    </button>
  );
}
