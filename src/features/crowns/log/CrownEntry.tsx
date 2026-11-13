import Image from "next/image";
import { SIZE_LABELS } from "@/config/sizes";
import type { MonsterOption } from "@/shared/hooks/useMonsterOptions";
import { Icon } from "@/shared/ui";
import type { LogEntry } from "./types";
import { cleanSize } from "./entries";

interface CrownEntryProps {
  entry: LogEntry;
  index: number;
  monster: MonsterOption;
  canRemove: boolean;
  onChange: (patch: Partial<LogEntry>) => void;
  onRemove: () => void;
  onPickMonster: () => void;
}

export function CrownEntry({
  entry,
  index,
  monster,
  canRemove,
  onChange,
  onRemove,
  onPickMonster,
}: CrownEntryProps) {
  const position = index + 1;

  return (
    <div className={`h3e ${entry.tempered ? "tp" : ""}`}>
      <div className="h3t">
        <button
          className="h3m"
          onClick={onPickMonster}
          aria-label={`Change monster ${position}: ${monster.name}`}
        >
          <span className="h3a">
            {monster.image_name && (
              <Image
                src={`/monsters/${monster.image_name}`}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="px"
              />
            )}
          </span>
          <span className="h3n">
            <b>{monster.name}</b>
            <small>{monster.type}</small>
          </span>
          <span className="h3c">Change</span>
        </button>
        {canRemove && (
          <button
            className="hrx"
            aria-label={`Remove monster ${position}`}
            title="Remove"
            onClick={onRemove}
          >
            <Icon name="close" />
          </button>
        )}
      </div>
      <div className="h3g">
        <div className="h3f">
          <small>Size</small>
          <div className="hrs" role="group" aria-label="Crown size">
            <button
              aria-pressed={entry.type === "small"}
              onClick={() => onChange({ type: "small" })}
            >
              <Image src="/icons/smallcrown.png" alt="" width={15} height={15} className="px" />
              Small
            </button>
            <button
              aria-pressed={entry.type === "large"}
              onClick={() => onChange({ type: "large" })}
            >
              <Image src="/icons/largecrown.png" alt="" width={15} height={15} className="px" />
              Large
            </button>
          </div>
        </div>
        <div className="h3f">
          <small>Strength</small>
          <div className="stp">
            <button
              aria-label="Decrease strength"
              disabled={entry.strength_rating <= 1}
              onClick={() => onChange({ strength_rating: entry.strength_rating - 1 })}
            >
              &minus;
            </button>
            <b>
              {entry.strength_rating}
              <i>★</i>
            </b>
            <button
              aria-label="Increase strength"
              disabled={entry.strength_rating >= 10}
              onClick={() => onChange({ strength_rating: entry.strength_rating + 1 })}
            >
              +
            </button>
          </div>
        </div>
        <div className="h3f">
          <small>Tempered</small>
          <button
            className={`tmt ${entry.tempered ? "on" : ""}`}
            role="switch"
            aria-checked={entry.tempered}
            onClick={() => onChange({ tempered: !entry.tempered })}
          >
            <Icon name="tempered" />
            <span>{entry.tempered ? "Tempered" : "Normal"}</span>
          </button>
        </div>
        <div className="h3f">
          <div className="pqh">
            <small>Length</small>
            <div className="pqs" role="group" aria-label={`Length format for crown ${position}`}>
              <button
                aria-pressed={entry.sizeMode !== "label"}
                onClick={() => onChange({ sizeMode: "cm", sizeLabel: "" })}
              >
                cm
              </button>
              <button
                aria-pressed={entry.sizeMode === "label"}
                onClick={() => onChange({ sizeMode: "label", size: "" })}
              >
                Size
              </button>
            </div>
          </div>
          {entry.sizeMode === "label" ? (
            <div className="szl" role="group" aria-label={`Size of crown ${position}`}>
              {SIZE_LABELS.map((label) => (
                <button
                  key={label}
                  aria-pressed={entry.sizeLabel === label}
                  onClick={() => onChange({ sizeLabel: label })}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <label className="h3len" title="Length in cm (optional)">
              <input
                inputMode="decimal"
                value={entry.size}
                onChange={(event) => onChange({ size: cleanSize(event.target.value) })}
                placeholder="Optional"
                autoComplete="off"
                aria-label={`Length of crown ${position} in cm, optional`}
              />
              <span>cm</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
