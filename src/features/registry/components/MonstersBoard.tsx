"use client";

import { useMemo, useState } from "react";
import { useLog } from "@/features/crowns";
import { useDrawer } from "@/features/monster";
import { TrackPin } from "@/features/wishlist";
import type { RegistryMonster } from "@/server/services/registry";
import { Icon, Pager } from "@/shared/ui";
import { useBoardFit } from "../hooks/useBoardFit";
import {
  SORTS,
  matchesFilter,
  matchesSearch,
  type BoardFilter,
  type BoardSort,
  type BoardView,
} from "../lib/board";
import { BoardToolbar } from "./BoardToolbar";
import { MonsterCard, MonsterTable } from "./MonsterItems";

interface MonstersBoardProps {
  monsters: RegistryMonster[];
  signedIn: boolean;
}

export function MonstersBoard({ monsters, signedIn }: MonstersBoardProps) {
  const { openLog } = useLog();
  const { openDrawer } = useDrawer();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BoardFilter>("All");
  const [sort, setSort] = useState<BoardSort>("Demand");
  const [view, setView] = useState<BoardView>("grid");
  const [page, setPage] = useState(1);
  const [tracks, setTracks] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(monsters.map((m) => [m.id, m.wishlistType])),
  );
  const { bodyRef, size, minHeight } = useBoardFit(view);

  const counts = useMemo<Record<BoardFilter, number>>(
    () => ({
      All: monsters.length,
      Tracked: monsters.filter((m) => tracks[m.id]).length,
      Complete: monsters.filter((m) => m.isCompleted).length,
      Demand: monsters.filter((m) => m.demand > 0).length,
    }),
    [monsters, tracks],
  );

  const list = useMemo(
    () =>
      monsters
        .filter((m) => matchesSearch(m, query) && matchesFilter(m, filter, !!tracks[m.id]))
        .sort(SORTS[sort]),
    [monsters, query, filter, sort, tracks],
  );

  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * size, current * size);
  const resetPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const pin = (monster: RegistryMonster) =>
    signedIn ? (
      <TrackPin
        monsterId={monster.id}
        name={monster.name}
        initialType={monster.wishlistType}
        onChange={(type) => setTracks((previous) => ({ ...previous, [monster.id]: type }))}
      />
    ) : null;

  const log = (monster: RegistryMonster) =>
    signedIn ? (
      <button
        className="lg2"
        onClick={(event) => {
          event.stopPropagation();
          openLog({ monsterId: monster.id });
        }}
        aria-label={`Log a ${monster.name} crown`}
      >
        <Icon name="plus" />
        Log crown
      </button>
    ) : null;

  return (
    <div className="pad m2page">
      <div className="m2h">
        <div>
          <h2>Monsters</h2>
          <p>Every crown target, what the guild has and what hunters want.</p>
        </div>
        {signedIn && (
          <div className="m2c">
            <div>
              <b>{counts.Complete}</b>
              <span>Complete</span>
            </div>
            <div>
              <b>{counts.Tracked}</b>
              <span>Tracking</span>
            </div>
            <div>
              <b>{monsters.length}</b>
              <span>Listed</span>
            </div>
          </div>
        )}
      </div>

      <BoardToolbar
        query={query}
        onQuery={resetPage(setQuery)}
        filter={filter}
        onFilter={resetPage(setFilter)}
        counts={counts}
        sort={sort}
        onSort={resetPage(setSort)}
        view={view}
        onView={setView}
      />

      <div ref={bodyRef} style={minHeight ? { minHeight } : undefined}>
        {list.length === 0 ? (
          <div className="m2empty">
            <b>No monsters match</b>
            <span>Try another filter or clear the search.</span>
          </div>
        ) : view === "grid" ? (
          <div className="m2g">
            {shown.map((monster) => (
              <MonsterCard
                key={monster.id}
                monster={monster}
                signedIn={signedIn}
                onOpen={() => openDrawer(monster.name)}
                pin={pin(monster)}
                log={log(monster)}
              />
            ))}
          </div>
        ) : (
          <MonsterTable
            monsters={shown}
            signedIn={signedIn}
            sort={sort}
            onSort={resetPage(setSort)}
            onOpen={openDrawer}
            pin={pin}
            log={log}
          />
        )}
      </div>

      <Pager page={current} pages={pages} onPage={setPage} />
    </div>
  );
}
