"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLog } from "@/features/crowns";
import { useDrawer } from "@/features/monster";
import { useMonsterOptions } from "@/shared/hooks/useMonsterOptions";
import { Icon } from "@/shared/ui";

interface PaletteItem {
  kind: "action" | "monster";
  title: string;
  hint: string;
  icon?: string;
  image?: string | null;
  run: () => void;
}

export function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openLog } = useLog();
  const { openDrawer } = useDrawer();
  const monsters = useMonsterOptions();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const term = query.trim().toLowerCase();
    const actions: PaletteItem[] = [];
    if (session?.user) {
      actions.push({
        kind: "action",
        title: "Log a crown",
        icon: "plus",
        hint: "L",
        run: () => openLog(),
      });
    }
    actions.push(
      {
        kind: "action",
        title: "Go to Home",
        icon: "home",
        hint: "Page",
        run: () => router.push("/"),
      },
      {
        kind: "action",
        title: "Go to Monsters",
        icon: "monsters",
        hint: "Page",
        run: () => router.push("/investigation"),
      },
      {
        kind: "action",
        title: "Go to Compare",
        icon: "compare",
        hint: "Page",
        run: () => router.push("/compare"),
      },
    );
    const matches = (
      term ? monsters.filter((m) => m.name.toLowerCase().includes(term)) : monsters.slice(0, 5)
    )
      .slice(0, 6)
      .map<PaletteItem>((m) => ({
        kind: "monster",
        title: m.name,
        image: m.image_name,
        hint: "Monster",
        run: () => openDrawer(m.name),
      }));
    return actions.filter((action) => action.title.toLowerCase().includes(term)).concat(matches);
  }, [query, monsters, session, openLog, openDrawer, router]);

  const current = Math.min(selected, Math.max(0, items.length - 1));
  const run = (index: number) => {
    const item = items[index];
    if (!item) return;
    onClose();
    item.run();
  };

  useEffect(() => {
    listRef.current?.querySelector(".pi.on")?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected(Math.min(items.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected(Math.max(0, current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(current);
    }
  };

  let lastGroup = "";
  return (
    <div className="ovl">
      <div
        className="mback pb enter"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <div className="pal" role="dialog" aria-label="Command palette" onKeyDown={onKey}>
          <div className="pin">
            <Icon name="search" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(0);
              }}
              placeholder="Search monsters or actions"
              aria-label="Search"
            />
          </div>
          <div className="plist" ref={listRef}>
            {items.map((item, index) => {
              const group = item.kind === "action" ? "Actions" : "Monsters";
              const heading = group !== lastGroup ? <div className="pg">{group}</div> : null;
              lastGroup = group;
              return (
                <span key={item.title} style={{ display: "contents" }}>
                  {heading}
                  <button
                    className={`pi ${index === current ? "on" : ""}`}
                    onMouseMove={() => setSelected(index)}
                    onClick={() => run(index)}
                  >
                    {item.icon ? (
                      <Icon name={item.icon} />
                    ) : (
                      <Image
                        className="px"
                        src={`/monsters/${item.image}`}
                        alt=""
                        width={24}
                        height={24}
                        unoptimized
                      />
                    )}
                    {item.title}
                    <small>{item.hint}</small>
                  </button>
                </span>
              );
            })}
            {items.length === 0 && <div className="pg">No results</div>}
          </div>
          <div className="pfoot">
            <span>
              <kbd>↑↓</kbd>navigate
            </span>
            <span>
              <kbd>Enter</kbd>select
            </span>
            <span>
              <kbd>Esc</kbd>close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
