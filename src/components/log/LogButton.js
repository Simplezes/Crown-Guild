"use client";

import { Icon } from "@/components/shell/Icon";
import { useLog } from "./LogProvider";

export default function LogButton({ monsterId }) {
  const { openLog } = useLog();
  return (
    <button className="lg2" onClick={() => openLog({ monsterId })}>
      <Icon name="plus" />Log crown
    </button>
  );
}
