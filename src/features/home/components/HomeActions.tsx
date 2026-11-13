"use client";

import Image from "next/image";
import Link from "next/link";
import { useDrawer } from "@/features/monster";
import { TrackPin } from "@/features/wishlist";

interface WantedActionsProps {
  monster: { id: number; name: string };
  signedIn: boolean;
  tracked: string | null | undefined;
}

export function WantedActions({ monster, signedIn, tracked }: WantedActionsProps) {
  const { openDrawer } = useDrawer();
  return (
    <>
      {signedIn ? (
        <TrackPin
          trigger="btn"
          noIcon
          monsterId={monster.id}
          name={monster.name}
          initialType={tracked || null}
        />
      ) : (
        <Link className="btn sm" href="/signin?callbackUrl=%2F">
          Sign in to track
        </Link>
      )}
      <button className="btn o sm" onClick={() => openDrawer(monster.name)}>
        Details
      </button>
    </>
  );
}

interface ShelfThumbProps {
  name: string;
  image: string | null;
  type: string;
}

export function ShelfThumb({ name, image, type }: ShelfThumbProps) {
  const { openDrawer } = useDrawer();
  const badge = type === "both" ? "2" : type === "small" ? "S" : "L";
  return (
    <button className="g4t both" onClick={() => openDrawer(name)} title={`${name}: ${type}`}>
      <Image
        src={`/monsters/${image}`}
        alt={name}
        width={32}
        height={32}
        unoptimized
        className="px"
      />
      <i>{badge}</i>
    </button>
  );
}
