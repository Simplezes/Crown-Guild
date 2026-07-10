"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MonsterIcon from '@/components/ui/MonsterIcon';
import UserAvatar from '@/components/ui/UserAvatar';

function AvatarStack({ finders }) {
  if (!finders?.length) return null;

  return (
    <div className="flex items-center">
      {finders.slice(0, 4).map((finder, index) => (
        <UserAvatar
          key={`${finder.username}-${index}`}
          src={finder.avatar_url}
          alt={finder.username}
          size={24}
          className={`shrink-0 rounded-full border border-ember/40 bg-void ${index > 0 ? '-ml-2' : ''}`}
        />
      ))}
      {finders.length > 4 ? (
        <div className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border border-ember/40 bg-ember/20 font-body text-[9px] font-semibold text-ember-bright">
          +{finders.length - 4}
        </div>
      ) : null}
    </div>
  );
}

function CrownRow({ iconSrc, label, finders }) {
  const hasFinders = finders.length > 0;

  return (
    <div className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${hasFinders ? 'border-ember/20 bg-ember/10' : 'border-white/10 bg-void/60'}`}>
      <Image src={iconSrc} width={14} height={14} alt="" className={`pixel-art ${hasFinders ? '' : 'grayscale opacity-35'}`} />
      <div className="min-w-0 flex-1">
        <p className="font-body text-[10px] uppercase tracking-[0.24em] text-mist-dim">{label}</p>
        {hasFinders ? (
          <div className="mt-1 flex items-center justify-between gap-2">
            <AvatarStack finders={finders} />
            <span className="font-display text-sm text-ember-bright">{finders.length}</span>
          </div>
        ) : (
          <p className="mt-1 font-body text-xs italic text-mist-dim">Not recorded</p>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 12;

export default function RegistrySearch({ initialRegistry, headerContent }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const filteredRegistry = useMemo(() => {
    if (!search.trim()) return initialRegistry;
    const term = search.toLowerCase();
    return initialRegistry.filter((monster) =>
      monster.name.toLowerCase().includes(term) ||
      (monster.extraInfo?.type && monster.extraInfo.type.toLowerCase().includes(term))
    );
  }, [search, initialRegistry]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistry.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRegistry = filteredRegistry.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-white/5 bg-void-panel">
        {headerContent}
        <div className="flex flex-col gap-3 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div className="flex flex-1 items-center gap-3 rounded-3xl border border-white/5 bg-void-panel px-4 py-3">
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={20} height={20} alt="" className="pixel-art" />
            <input
              type="text"
              placeholder="Search registry by monster or type"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-full bg-transparent font-body text-sm text-mist outline-none placeholder:text-mist-dim"
            />
            {search ? (
              <button onClick={() => handleSearchChange('')} className="rounded px-1.5 text-lg leading-none text-mist-dim hover:text-ember-bright">
                ×
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-void-panel px-5 py-3 sm:px-6 font-body text-[10px] uppercase tracking-[0.24em] text-mist-dim">
        Showing {filteredRegistry.length} specimens
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredRegistry.length > 0 ? (
          pagedRegistry.map((monster) => (
            <Link
              key={monster.id}
              href={`/monster/${monster.name}`}
              className="group overflow-hidden rounded-2xl border border-white/5 bg-void-panel p-3 transition-colors hover:border-ember/35"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <MonsterIcon imageName={monster.image_name} name={monster.name} size={48} className="shrink-0 rounded-2xl border border-white/5 bg-void" />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base uppercase tracking-wide text-mist transition-colors group-hover:text-ember-bright">
                      {monster.name}
                    </h3>
                    {monster.extraInfo?.type ? (
                      <p className="mt-1 font-body text-[10px] uppercase tracking-[0.24em] text-mist-dim">{monster.extraInfo.type}</p>
                    ) : null}
                    {monster.smallFinders?.length > 0 || monster.largeFinders?.length > 0 ? (
                      <p className="mt-2 font-body text-[9px] uppercase tracking-[0.2em] text-mist-dim">
                        {monster.smallFinders?.length > 0 && `${monster.smallFinders.length} Small`}
                        {monster.smallFinders?.length > 0 && monster.largeFinders?.length > 0 && ' / '}
                        {monster.largeFinders?.length > 0 && `${monster.largeFinders.length} Large`}
                      </p>
                    ) : null}
                  </div>
                </div>
                {monster.demand > 0 ? (
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-blood/30 bg-blood/10 px-2.5 py-1 font-body text-[9px] font-semibold uppercase tracking-[0.2em] text-blood-bright">
                    <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={12} height={12} alt="" className="pixel-art" />
                    {monster.demand}
                  </div>
                ) : null}
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 bg-void-panel px-8 py-16 text-center">
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={48} height={48} alt="" className="pixel-art grayscale" />
            <p className="font-display text-xl uppercase tracking-wide text-mist">No specimens match the current search.</p>
            <span className="font-body text-sm text-mist-dim">Try broadening the term or clearing the filter.</span>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={safePage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 font-display text-lg text-mist disabled:opacity-30"
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="font-display text-xs uppercase tracking-[0.3em] text-mist-dim">Page {safePage} of {totalPages}</span>
          <button
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={safePage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 font-display text-lg text-mist disabled:opacity-30"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
