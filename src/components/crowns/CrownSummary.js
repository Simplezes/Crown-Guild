"use client";

import Link from "next/link";
import Image from "next/image";
import MonsterIcon from "@/components/ui/MonsterIcon";

const cardBase = "group relative flex flex-col overflow-hidden rounded-lg border border-white/5 bg-void p-2.5 transition-colors hover:border-white/10";
const cardActive = "border-ember/40 bg-ember/10 shadow-[0_0_16px_-8px_rgba(201,162,74,0.35)]";
const chipSmall = "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.25 py-0.5 font-body text-[8px] font-semibold uppercase text-mist";
const chipLarge = "inline-flex items-center gap-1 rounded-md border border-ember/30 bg-ember/10 px-1.25 py-0.5 font-body text-[8px] font-semibold uppercase text-ember-bright";
const chipMuted = "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.25 py-0.5 font-body text-[8px] font-semibold uppercase text-mist-dim opacity-60";

export default function CrownSummary({ items, allMonsters, isOwner, mode, onToggle }) {
  if (!allMonsters) return null;

  const itemMap = {};
  (items || []).forEach(c => {
    if (!itemMap[c.monster_id]) {
      itemMap[c.monster_id] = { small: false, large: false };
    }
    if (c.type === 'small' || c.type === 'both') itemMap[c.monster_id].small = true;
    if (c.type === 'large' || c.type === 'both') itemMap[c.monster_id].large = true;
  });

  const handleDotClick = (e, monsterId, type) => {
    if (!isOwner || !onToggle) return;
    e.preventDefault();
    e.stopPropagation();

    const current = itemMap[monsterId] || { small: false, large: false };
    const isSmall = type === 'small';
    const active = isSmall ? current.small : current.large;

    let newType = null;
    if (isSmall) {
      if (active) {
        newType = current.large ? 'large' : null;
      } else {
        newType = current.large ? 'both' : 'small';
      }
    } else {
      if (active) {
        newType = current.small ? 'small' : null;
      } else {
        newType = current.small ? 'both' : 'large';
      }
    }

    onToggle(monsterId, newType);
  };

  const editable = isOwner && mode !== 'host';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {allMonsters.filter(m => m.is_large).map((monster) => {
        const status = itemMap[monster.id];
        const hasBoth = status?.small && status?.large;
        const toneClass = hasBoth
          ? cardActive
          : status
            ? "border-white/15 bg-white/5"
            : "border-white/5 bg-void";

        return (
          <div
            key={monster.id}
            className={`${cardBase} ${toneClass}`}
            title={monster.name}
          >
            <div className="mb-1.5 flex items-start justify-between gap-1.5">
              <span className={hasBoth ? chipLarge : status ? chipSmall : chipMuted}>
                {hasBoth ? "Both" : status ? "Tracked" : "Untracked"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 font-body text-[10px] uppercase text-mist-dim">
                {mode === "wishlist" ? "Wish" : "Owned"}
              </span>
            </div>

            <Link href={`/monster/${encodeURIComponent(monster.name)}`} className="mx-auto">
              <MonsterIcon imageName={monster.image_name} name={monster.name} size={44} />
            </Link>

            <div className="mt-1.5 text-center">
              <Link href={`/monster/${encodeURIComponent(monster.name)}`}>
                <h3 className="truncate font-display text-[11px] uppercase tracking-wide text-mist hover:text-ember-bright">{monster.name}</h3>
              </Link>
              <div className="mt-1.5 flex justify-center gap-1">
                <button
                  type="button"
                  disabled={!editable}
                  className={`inline-flex items-center gap-1 rounded-md border px-1 py-0.5 font-body text-[9px] font-semibold uppercase transition-colors ${status?.small ? "border-ember/30 bg-ember/10 text-ember-bright" : "border-white/10 bg-white/5 text-mist-dim opacity-60"} ${editable ? "hover:opacity-100" : ""}`}
                  onClick={(e) => handleDotClick(e, monster.id, 'small')}
                >
                  <Image src="/icons/smallcrown.png" width={10} height={10} alt="" className="pixel-art" />
                  Small
                </button>
                <button
                  type="button"
                  disabled={!editable}
                  className={`inline-flex items-center gap-1 rounded-md border px-1 py-0.5 font-body text-[9px] font-semibold uppercase transition-colors ${status?.large ? "border-ember/30 bg-ember/10 text-ember-bright" : "border-white/10 bg-white/5 text-mist-dim opacity-60"} ${editable ? "hover:opacity-100" : ""}`}
                  onClick={(e) => handleDotClick(e, monster.id, 'large')}
                >
                  <Image src="/icons/largecrown.png" width={10} height={10} alt="" className="pixel-art" />
                  Large
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
