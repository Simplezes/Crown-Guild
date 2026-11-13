"use client";

import Image from "next/image";
import { forwardRef } from "react";
import { useDrawer } from "@/features/monster";
import { Icon } from "@/shared/ui";
import type { ShellSummary } from "../types";

interface TargetsMenuProps {
  summary: ShellSummary;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const TargetsMenu = forwardRef<HTMLDivElement, TargetsMenuProps>(function TargetsMenu(
  { summary, open, onToggle, onClose },
  ref,
) {
  const { openDrawer } = useDrawer();

  return (
    <div className="avwrap" ref={ref}>
      <button className="tbtn" aria-haspopup="true" aria-expanded={open} onClick={onToggle}>
        <Icon name="pin" />
        <span className="lbl">Targets</span>
        <b>{summary.targets.length}</b>
      </button>
      {open && (
        <div className="dd tgd" role="menu">
          <div className="sl" style={{ paddingTop: 4 }}>
            Your targets
          </div>
          {summary.targets.length ? (
            summary.targets.map((target) => (
              <button
                key={target.name}
                role="menuitem"
                onClick={() => {
                  onClose();
                  openDrawer(target.name);
                }}
              >
                <Image
                  src={`/monsters/${target.image}`}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  className="px"
                />
                {target.name}
              </button>
            ))
          ) : (
            <div className="none">Nothing tracked yet. Use Track on any monster.</div>
          )}
        </div>
      )}
    </div>
  );
});
