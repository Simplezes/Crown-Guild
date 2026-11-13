"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MonsterOption } from "@/shared/hooks/useMonsterOptions";
import { Icon } from "@/shared/ui";
import {
  DEFAULT_FILTER,
  type FilterField,
  type FilterOption,
  type FilterState,
} from "../lib/crown-filter";
import { activeFilters, resetFilter } from "../lib/filter-options";
import { suggestMonsters } from "../lib/monster-match";
import { FilterMenu } from "./FilterMenu";

interface CrownFilterBarProps {
  filter: FilterState;
  setFilter: (update: (current: FilterState) => FilterState) => void;
  query: string;
  setQuery: (query: string) => void;
  monsters: MonsterOption[];
  onChange: () => void;
}

export function CrownFilterBar({
  filter,
  setFilter,
  query,
  setQuery,
  monsters,
  onChange,
}: CrownFilterBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [field, setField] = useState<FilterField | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setField(null);
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const monsterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "Any", label: "Any monster" },
      ...monsters.map((m) => ({ value: String(m.id), label: m.name, image_name: m.image_name })),
    ],
    [monsters],
  );
  const monsterTypes = useMemo(
    () => [
      "Any",
      ...[...new Set(monsters.map((m) => m.type || "Monster"))].sort((a, b) => a.localeCompare(b)),
    ],
    [monsters],
  );
  const suggestions = useMemo(() => suggestMonsters(monsters, query), [monsters, query]);
  const chips = activeFilters(filter, monsterOptions);

  const update = (next: (current: FilterState) => FilterState) => {
    setFilter(next);
    onChange();
  };

  return (
    <div className="pf-filter-wrap" ref={wrapRef}>
      <div className="pf-filter" role="search">
        <button
          type="button"
          className="pf-filter-trigger"
          onClick={() => {
            setSuggestionsOpen(false);
            setField(null);
            setMenuOpen((open) => !open);
          }}
          aria-expanded={menuOpen}
          aria-label="Open filter options"
          title="Filter"
        >
          <Icon name="filter" />
        </button>
        <div className="pf-filter-chips">
          {chips.map((chip) => (
            <span className="pf-filter-chip" key={chip.key}>
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => update((current) => ({ ...current, ...resetFilter(chip.key) }))}
                aria-label={`Remove ${chip.label} filter`}
                title={`Remove ${chip.label}`}
              >
                <Icon name="close" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange();
            setSuggestionsOpen(true);
            setMenuOpen(false);
          }}
          onFocus={() => {
            setSuggestionsOpen(true);
            setMenuOpen(false);
            setField(null);
          }}
          placeholder={chips.length ? "" : "Search crowns..."}
          aria-label="Search crowns"
          autoComplete="off"
        />
      </div>

      {suggestionsOpen && suggestions.length > 0 && (
        <div className="pf-suggestions" role="listbox" aria-label="Monster suggestions">
          <div className="pf-suggestions-head">Is this what you&apos;re looking for?</div>
          {suggestions.map((monster) => (
            <button
              key={monster.id}
              type="button"
              className="pf-suggestion"
              role="option"
              aria-selected={false}
              onClick={() => {
                update((current) => ({ ...current, monsterId: String(monster.id) }));
                setQuery("");
                setSuggestionsOpen(false);
              }}
            >
              {monster.image_name && (
                <Image
                  src={`/monsters/${monster.image_name}`}
                  alt=""
                  width={26}
                  height={26}
                  unoptimized
                />
              )}
              <span>{monster.name}</span>
            </button>
          ))}
        </div>
      )}

      {menuOpen && (
        <FilterMenu
          filter={filter}
          onFilter={update}
          field={field}
          onField={setField}
          monsters={monsterOptions}
          monsterTypes={monsterTypes}
          hasActive={chips.length > 0}
          onClearAll={() => {
            setFilter(() => DEFAULT_FILTER);
            setQuery("");
            onChange();
          }}
        />
      )}
    </div>
  );
}
