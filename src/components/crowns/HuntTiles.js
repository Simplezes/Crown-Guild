import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/shell/Icon";

export function tilesOf(crowns) {
  const by = new Map();
  crowns.forEach((c) => {
    if (!by.has(c.name)) by.set(c.name, { image: c.image, s: [], l: [] });
    by.get(c.name)[c.type === "small" ? "s" : "l"].push(c);
  });
  const out = [];
  by.forEach((v, name) => {
    const n = Math.max(v.s.length, v.l.length);
    for (let k = 0; k < n; k++) out.push({ name, image: v.image, s: v.s[k] || null, l: v.l[k] || null });
  });
  return out;
}

function Slot({ crown, type }) {
  const letter = type === "small" ? "S" : "L";
  const strip = crown && crown.size
    ? <span className={`bz ${type === "large" ? "l" : ""} ${crown.tempered ? "t" : ""}`} title={`Length: ${Number(crown.size)} cm`}><Icon name="ruler" />{Number(crown.size)}</span>
    : crown && crown.sizeLabel
    ? <span className={`bz ${type === "large" ? "l" : ""} ${crown.tempered ? "t" : ""}`} title={`Size: ${crown.sizeLabel}`}>{crown.sizeLabel}</span>
    : null;
  if (!crown) {
    return (
      <div className="bslot">
        <div className="br none" title={`No ${type} crown`}>
          <span className="bl">{letter}</span>
          <span className="bs">&ndash;</span>
        </div>
        {strip}
      </div>
    );
  }
  return (
    <div className="bslot">
      <div
        className={`br ${type === "large" ? "l" : ""} ${crown.tempered ? "t" : ""}`}
        title={`${type === "small" ? "Small" : "Large"} crown, ${crown.strength} stars${crown.tempered ? ", tempered" : ""}${crown.size ? `, ${crown.size} cm` : crown.sizeLabel ? `, size ${crown.sizeLabel}` : ""}`}
      >
        <span className="bl">{letter}</span>
        <span className="bs">{crown.strength}★</span>
      </div>
      {strip}
    </div>
  );
}

export function HuntTile({ tile, onClick, href }) {
  const tempered = (tile.s && tile.s.tempered) || (tile.l && tile.l.tempered);
  const tall = !!((tile.s && (tile.s.size || tile.s.sizeLabel)) || (tile.l && (tile.l.size || tile.l.sizeLabel)));
  const body = (
    <>
      <div className="aArt">
        {tile.image ? <Image src={`/monsters/${tile.image}`} alt="" width={56} height={56} unoptimized className="px" /> : null}
      </div>
      <b>{tile.name}</b>
      <div className={`brs ${tall ? "tall" : ""}`}>
        <Slot crown={tile.s} type="small" />
        <Slot crown={tile.l} type="large" />
      </div>
    </>
  );
  const cls = `aM ${tempered ? "tp" : ""}`;
  if (href) return <Link className={cls} href={href}>{body}</Link>;
  return <div className={cls} onClick={onClick}>{body}</div>;
}
