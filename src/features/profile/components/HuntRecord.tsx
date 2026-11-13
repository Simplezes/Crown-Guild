import Image from "next/image";
import type { CSSProperties } from "react";
import { HuntTile, tilesOf } from "@/features/crowns";
import { Icon } from "@/shared/ui";
import type { CrownGroup } from "../lib/crown-groups";

const QUEST_ICON: Record<string, string> = {
  "Event Quests": "event",
  "Optional Quests": "optional",
  "Field Survey Quests": "survey",
  "Investigation Quests": "investigation",
};

const questLabel = (quest: string | null | undefined) =>
  (quest || "Optional Quests")
    .replace(/ Quests$/, "")
    .replace("Field Survey Quest", "Field Survey");

interface HuntRecordProps {
  group: CrownGroup;
  isOwner: boolean;
  selecting: boolean;
  picked: boolean;
  onPick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onUseCharge: () => void;
  onTile: (name: string) => void;
}

export function HuntRecord({
  group,
  isOwner,
  selecting,
  picked,
  onPick,
  onEdit,
  onDelete,
  onShare,
  onUseCharge,
  onTile,
}: HuntRecordProps) {
  const first = group[0];
  if (!first) return null;

  const tiles = tilesOf(
    group.map((crown) => ({
      name: crown.name,
      image: crown.image_name,
      type: crown.type,
      tempered: !!crown.tempered,
      strength: crown.strength_rating,
      size: crown.size_cm ?? undefined,
      sizeLabel: crown.size_label,
    })),
  );
  const questMonster =
    first.inv_monster_id && String(first.inv_monster_id) !== String(first.monster_id)
      ? first
      : null;
  const trackedInvestigation =
    first.quest === "Investigation Quests" && first.remaining_uses != null;
  const tempered = group.some((crown) => crown.tempered);

  return (
    <div
      className={`aRec ${tempered ? "tp" : ""} ${picked ? "picked" : ""}`}
      style={{ "--n": tiles.length } as CSSProperties}
      onClick={selecting ? onPick : undefined}
    >
      <div className="aHead pf-hunt-header">
        <div className="aH1">
          <span className="aQ">
            <Icon name={QUEST_ICON[first.quest] || "optional"} />
            <span className="aQ-label">
              <span className="aQ-label-main">{questLabel(first.quest)}</span>
              {trackedInvestigation && (
                <span className="aQ-uses-word"> · {first.remaining_uses}</span>
              )}
            </span>
            {questMonster?.inv_monster_image && (
              <Image
                src={`/monsters/${questMonster.inv_monster_image}`}
                alt={`Investigation target: ${questMonster.inv_monster_name}`}
                title={`Investigation target: ${questMonster.inv_monster_name}`}
                width={22}
                height={22}
                unoptimized
                className="pf-investigation-target"
              />
            )}
          </span>
        </div>
        <div className="aH2">
          {selecting ? (
            <span className={`pk ${picked ? "on" : ""}`}>{picked && <Icon name="check" />}</span>
          ) : (
            <div className="pc2x">
              {isOwner && trackedInvestigation && (
                <button
                  className="chg"
                  onClick={onUseCharge}
                  title="Use a charge (reduces uses left)"
                  aria-label="Use a charge, reducing uses left by 1"
                >
                  <b>&minus;1</b>
                </button>
              )}
              {isOwner && (
                <button onClick={onEdit} title="Edit hunt record" aria-label="Edit hunt record">
                  <Icon name="edit" />
                </button>
              )}
              <button onClick={onShare} title="Copy link" aria-label="Copy link">
                <Icon name="link" />
              </button>
              {isOwner && (
                <button
                  className="dl"
                  onClick={onDelete}
                  title="Delete hunt record"
                  aria-label="Delete hunt record"
                >
                  <Icon name="trash" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="aParty">
        {tiles.map((tile, index) => (
          <HuntTile
            key={index}
            tile={tile}
            onClick={selecting ? undefined : () => onTile(tile.name)}
          />
        ))}
      </div>
    </div>
  );
}
