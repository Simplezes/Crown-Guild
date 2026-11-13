"use client";

import Image from "next/image";
import { useDrawer } from "@/features/monster";
import type { MonsterOption } from "@/shared/hooks/useMonsterOptions";
import { Icon } from "@/shared/ui";
import type { ListingKind, ListingMap } from "../hooks/useListing";

type Noun = "collected" | "wishlisted";

interface SizeCardProps {
  monster: MonsterOption;
  type: string | null | undefined;
  isOwner: boolean;
  noun: Noun;
  onToggle: (monster: MonsterOption, kind: ListingKind) => void;
}

function SizeCard({ monster, type, isOwner, noun, onToggle }: SizeCardProps) {
  const { openDrawer } = useDrawer();
  const has = (kind: ListingKind) => type === "both" || type === kind;

  const sizeButton = (kind: ListingKind, label: string) => (
    <button
      className={`szb ${has(kind) ? "on" : ""}`}
      aria-pressed={has(kind)}
      disabled={!isOwner}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(monster, kind);
      }}
      aria-label={`${label} crown of ${monster.name}: ${has(kind) ? noun : `not ${noun}`}`}
    >
      <Image src={`/icons/${kind}crown.png`} alt="" width={16} height={16} className="px" />
      <span>{label}</span>
    </button>
  );

  const summary = !type
    ? `Not ${noun}`
    : type === "both"
      ? "Both sizes"
      : type === "small"
        ? "Small only"
        : "Large only";

  return (
    <div className={`pc2 ${type ? "" : "miss"}`} onClick={() => openDrawer(monster.name)}>
      <div className="pc2a">
        <Image
          src={`/monsters/${monster.image_name}`}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="px"
        />
      </div>
      <div className="pc2b">
        <b>{monster.name}</b>
        <div className="pc2c">
          <span className="ck">{summary}</span>
        </div>
      </div>
      <div className="szs">
        {sizeButton("small", "Small")}
        {sizeButton("large", "Large")}
      </div>
    </div>
  );
}

interface SizesTabProps {
  monsters: MonsterOption[];
  map: ListingMap;
  noun: Noun;
  isOwner: boolean;
  username: string;
  onToggle: (monster: MonsterOption, kind: ListingKind) => void;
  onCopyWishlist?: () => void;
}

function tipFor(noun: Noun, isOwner: boolean, username: string): string {
  if (!isOwner) return `The crown sizes ${username} has ${noun}.`;
  return noun === "collected"
    ? "Choose the crown sizes you have collected for each monster. Others use this to see what you can host. This is a personal tracker only - Mastery Points come from crowns you log in the Crown Ledger."
    : "Choose the crown sizes you are looking for. Hosts can find you in searches.";
}

export function SizesTab({
  monsters,
  map,
  noun,
  isOwner,
  username,
  onToggle,
  onCopyWishlist,
}: SizesTabProps) {
  const have = monsters.filter((monster) => map[monster.id]);
  const lack = monsters.filter((monster) => !map[monster.id]);
  const card = (monster: MonsterOption) => (
    <SizeCard
      key={monster.id}
      monster={monster}
      type={map[monster.id]}
      isOwner={isOwner}
      noun={noun}
      onToggle={onToggle}
    />
  );

  return (
    <>
      {noun === "wishlisted" && isOwner && have.length > 0 && onCopyWishlist && (
        <div className="ptools">
          <button
            className="btn o sm"
            onClick={onCopyWishlist}
            title="Copy your wishlist with MH Wilds emotes"
          >
            <Icon name="copy" />
            Copy wishlist
          </button>
        </div>
      )}
      <p className="ptip">{tipFor(noun, isOwner, username)}</p>
      {have.length ? (
        <div className="pgrid">{have.map(card)}</div>
      ) : (
        <div className="m2empty">
          <b>{noun === "collected" ? "Nothing collected yet" : "No wishes yet"}</b>
          <span>{isOwner ? "Pick a size on any monster below." : ""}</span>
        </div>
      )}
      {lack.length > 0 && (
        <>
          <div className="plab">
            Not {noun} yet <i>{lack.length}</i>
          </div>
          <div className="pgrid">{lack.map(card)}</div>
        </>
      )}
    </>
  );
}
