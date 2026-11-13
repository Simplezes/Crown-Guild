import Image from "next/image";
import type { MonsterOption } from "@/shared/hooks/useMonsterOptions";
import { Icon } from "@/shared/ui";

interface MonsterPickerProps {
  monsters: MonsterOption[];
  query: string;
  current: string;
  onQuery: (query: string) => void;
  onSelect: (monster: MonsterOption) => void;
  onClose: () => void;
}

export function MonsterPicker({
  monsters,
  query,
  current,
  onQuery,
  onSelect,
  onClose,
}: MonsterPickerProps) {
  const needle = query.trim().toLowerCase();
  const list = monsters.filter((monster) => monster.name.toLowerCase().includes(needle));

  return (
    <div
      className="hpk"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="hpkp" role="dialog" aria-label="Choose a monster">
        <div className="hpkh">
          <b>Choose a monster</b>
          <button className="x2" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <label className="hpks">
          <Icon name="search" />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search monsters"
            aria-label="Search monsters"
            autoComplete="off"
          />
        </label>
        <div className="hpkg">
          {list.map((monster) => (
            <button
              key={monster.id}
              className={`pkm ${current === String(monster.id) ? "on" : ""}`}
              onClick={() => onSelect(monster)}
            >
              <span className="pka">
                {monster.image_name && (
                  <Image
                    src={`/monsters/${monster.image_name}`}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="px"
                  />
                )}
              </span>
              <b>{monster.name}</b>
              <small>{monster.type}</small>
            </button>
          ))}
          {list.length === 0 && <p className="pke">No monster matches &ldquo;{query}&rdquo;.</p>}
        </div>
      </div>
    </div>
  );
}
