"use client";

import { useMemo, useState } from "react";
import { useLog } from "@/features/crowns";
import { useDrawer } from "@/features/monster";
import type { MonsterOption } from "@/shared/hooks/useMonsterOptions";
import { Icon, Pager } from "@/shared/ui";
import type { ProfileCrown } from "@/server/services/profile";
import { type useCrownSelection } from "../hooks/useCrownSelection";
import { useHuntActions } from "../hooks/useHuntActions";
import { DEFAULT_FILTER, matchesCrownFilter, type FilterState } from "../lib/crown-filter";
import { groupCrowns, groupKey } from "../lib/crown-groups";
import { CrownFilterBar } from "./CrownFilterBar";
import { HuntRecord } from "./HuntRecord";

const PER_PAGE = 9;

interface CrownsTabProps {
  crowns: ProfileCrown[];
  monsters: MonsterOption[];
  isOwner: boolean;
  profileUserId: string;
  selection: ReturnType<typeof useCrownSelection>;
}

export function CrownsTab({ crowns, monsters, isOwner, profileUserId, selection }: CrownsTabProps) {
  const { openLog } = useLog();
  const { openDrawer } = useDrawer();
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const actions = useHuntActions({ profileUserId, onDeleted: selection.reset });

  const monsterTypeById = useMemo(
    () => Object.fromEntries(monsters.map((m) => [String(m.id), m.type || "Monster"])),
    [monsters],
  );
  const groups = useMemo(() => groupCrowns(crowns), [crowns]);
  const list = groups.filter((group) => matchesCrownFilter(group, filter, query, monsterTypeById));
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const allPicked = list.length > 0 && list.every((group) => selection.picked.has(groupKey(group)));

  return (
    <>
      <div className="ptools">
        <div className="pf-tools-main">
          <CrownFilterBar
            filter={filter}
            setFilter={setFilter}
            query={query}
            setQuery={setQuery}
            monsters={monsters}
            onChange={() => setPage(1)}
          />
          <span className="ptc">
            {list.length} hunt record{list.length === 1 ? "" : "s"}
          </span>
        </div>
        {isOwner && (
          <div
            className="pf-selection-actions"
            role="group"
            aria-label="Hunt record selection actions"
          >
            {selection.active ? (
              <>
                <span className="selc">{selection.picked.size} selected</span>
                <button
                  className="tbx"
                  onClick={() => selection.replace(allPicked ? [] : list.map(groupKey))}
                >
                  {allPicked ? "Clear all" : "Select all"}
                </button>
                <button
                  className="tbx danger"
                  disabled={!selection.picked.size}
                  onClick={() =>
                    actions.remove(list.filter((g) => selection.picked.has(groupKey(g))))
                  }
                >
                  <Icon name="trash" />
                  Delete
                </button>
                <button className="tbx" onClick={selection.reset}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="tbx" onClick={selection.start}>
                <Icon name="check" />
                Select
              </button>
            )}
          </div>
        )}
      </div>
      {list.length ? (
        <div className="ggrid">
          {shown.map((group) => (
            <HuntRecord
              key={groupKey(group)}
              group={group}
              isOwner={isOwner}
              selecting={selection.active}
              picked={selection.picked.has(groupKey(group))}
              onPick={() => selection.toggle(groupKey(group))}
              onEdit={() => openLog({ group })}
              onDelete={() => actions.remove([group])}
              onShare={() => actions.share(group)}
              onUseCharge={() => actions.spendCharge(group)}
              onTile={openDrawer}
            />
          ))}
        </div>
      ) : (
        <div className="m2empty">
          <b>No crowns here</b>
          <span>{isOwner ? "Log a crown to fill this list." : ""}</span>
        </div>
      )}
      <Pager page={current} pages={pages} onPage={setPage} />
    </>
  );
}
