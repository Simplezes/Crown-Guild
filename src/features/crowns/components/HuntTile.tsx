import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/shared/ui";

export interface TileCrown {
  name: string;
  image: string | null;
  type: string;
  tempered: boolean | number;
  strength: number;
  size?: number;
  sizeLabel?: string | null;
}

interface TileSlot {
  tempered: boolean | number;
  strength: number;
  size?: number;
  sizeLabel?: string | null;
}

export interface HuntTileData {
  name: string;
  image: string | null;
  s: TileSlot | null;
  l: TileSlot | null;
}

export function tilesOf(crowns: TileCrown[]): HuntTileData[] {
  const byName = new Map<string, { image: string | null; s: TileSlot[]; l: TileSlot[] }>();
  for (const crown of crowns) {
    const group = byName.get(crown.name) ?? { image: crown.image, s: [], l: [] };
    byName.set(crown.name, group);
    group[crown.type === "small" ? "s" : "l"].push(crown);
  }

  const tiles: HuntTileData[] = [];
  for (const [name, group] of byName) {
    const count = Math.max(group.s.length, group.l.length);
    for (let index = 0; index < count; index++) {
      tiles.push({
        name,
        image: group.image,
        s: group.s[index] ?? null,
        l: group.l[index] ?? null,
      });
    }
  }
  return tiles;
}

function SizeBadge({ crown, type }: { crown: TileSlot | null; type: "small" | "large" }) {
  if (!crown) return null;
  const variant = `${type === "large" ? "l" : ""} ${crown.tempered ? "t" : ""}`;
  if (crown.size) {
    return (
      <span className={`bz ${variant}`} title={`Length: ${Number(crown.size)} cm`}>
        <Icon name="ruler" />
        {Number(crown.size)}
      </span>
    );
  }
  if (crown.sizeLabel) {
    return (
      <span className={`bz lbl ${variant}`} title={`Size: ${crown.sizeLabel}`}>
        {crown.sizeLabel}
      </span>
    );
  }
  return null;
}

function Slot({ crown, type }: { crown: TileSlot | null; type: "small" | "large" }) {
  const letter = type === "small" ? "S" : "L";

  if (!crown) {
    return (
      <div className="bslot">
        <div className="br none" title={`No ${type} crown`}>
          <span className="bl">{letter}</span>
          <span className="bs">&ndash;</span>
        </div>
      </div>
    );
  }

  const detail = crown.size
    ? `, ${crown.size} cm`
    : crown.sizeLabel
      ? `, size ${crown.sizeLabel}`
      : "";
  const title = `${type === "small" ? "Small" : "Large"} crown, ${crown.strength} stars${crown.tempered ? ", tempered" : ""}${detail}`;

  return (
    <div className="bslot">
      <div
        className={`br ${type === "large" ? "l" : ""} ${crown.tempered ? "t" : ""}`}
        title={title}
      >
        <span className="bl">{letter}</span>
        <span className="bs">{crown.strength}★</span>
      </div>
      <SizeBadge crown={crown} type={type} />
    </div>
  );
}

interface HuntTileProps {
  tile: HuntTileData;
  onClick?: () => void;
  href?: string;
}

export function HuntTile({ tile, onClick, href }: HuntTileProps) {
  const tempered = !!(tile.s?.tempered || tile.l?.tempered);
  const tall = !!(tile.s?.size || tile.s?.sizeLabel || tile.l?.size || tile.l?.sizeLabel);
  const className = `aM ${tempered ? "tp" : ""}`;

  const body = (
    <>
      <div className="aArt">
        {tile.image && (
          <Image
            src={`/monsters/${tile.image}`}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="px"
          />
        )}
      </div>
      <b>{tile.name}</b>
      <div className={`brs ${tall ? "tall" : ""}`}>
        <Slot crown={tile.s} type="small" />
        <Slot crown={tile.l} type="large" />
      </div>
    </>
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {body}
      </Link>
    );
  }
  return (
    <div className={className} onClick={onClick}>
      {body}
    </div>
  );
}
