"use client";

import Image from "next/image";
import { useDrawer } from "@/components/monster/DrawerProvider";
import TrackPin from "@/components/registry/TrackPin";

export function WantedActions({ monster, signedIn, tracked }) {
  const { openDrawer } = useDrawer();
  return (
    <>
      {signedIn && <TrackPin trigger="btn" monsterId={monster.id} name={monster.name} initialType={tracked || null} />}
      <button className="btn o sm" onClick={() => openDrawer(monster.name)}>Details</button>
    </>
  );
}

export function ShelfThumb({ name, image, type }) {
  const { openDrawer } = useDrawer();
  const badge = type === "both" ? "2" : type === "small" ? "S" : "L";
  return (
    <button className="g4t both" onClick={() => openDrawer(name)} title={`${name}: ${type}`}>
      <Image src={`/monsters/${image}`} alt={name} width={32} height={32} unoptimized className="px" />
      <i>{badge}</i>
    </button>
  );
}
