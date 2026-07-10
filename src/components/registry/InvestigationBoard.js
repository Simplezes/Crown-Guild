'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MonsterIcon from '@/components/ui/MonsterIcon';
import WishlistToggle from '@/components/wishlist/WishlistToggle';

const PAGE_SIZE = 12;
const FILTERS = [
  { key: 'all', label: 'All Targets' },
  { key: 'tracked', label: 'Tracked' },
  { key: 'complete', label: 'Complete' },
  { key: 'demand', label: 'Demand' },
];

export default function InvestigationBoard({ monsters }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const filteredMonsters = useMemo(() => {
    const term = search.trim().toLowerCase();

    return monsters.filter((monster) => {
      const matchesSearch = !term || monster.name.toLowerCase().includes(term) || monster.extraInfo?.type?.toLowerCase().includes(term);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'tracked' && monster.isWishlisted) ||
        (filter === 'complete' && monster.isCompleted) ||
        (filter === 'demand' && monster.demand > 0);

      return matchesSearch && matchesFilter;
    });
  }, [filter, monsters, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMonsters.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedMonsters = filteredMonsters.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const completedCount = monsters.filter((monster) => monster.isCompleted).length;
  const trackedCount = monsters.filter((monster) => monster.isWishlisted).length;
  const demandCount = monsters.reduce((sum, monster) => sum + Number(monster.demand || 0), 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-white/5 bg-void-panel">
        <div className="border-b border-white/5 bg-gradient-to-r from-ember/10 via-transparent to-transparent px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-ember-dim">
                <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                Guild Field Guide
              </span>
              <h2 className="mt-2 font-display text-3xl uppercase tracking-wide text-mist sm:text-4xl">The Great Ledger</h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-mist-dim">
                Review your targets, surface demand, and keep the hunt board trimmed to what matters most.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:min-w-[24rem]">
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-ember-bright">{monsters.length}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Listed</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-ember-bright">{completedCount}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Complete</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-blood-bright">{trackedCount}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Tracked</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div className="flex flex-1 items-center gap-3 rounded-3xl border border-white/5 bg-void-panel px-4 py-3">
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={20} height={20} alt="" className="pixel-art" />
            <input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search by monster or type"
              className="w-full bg-transparent font-body text-sm text-mist outline-none placeholder:text-mist-dim"
            />
            {search ? (
              <button onClick={() => handleSearchChange('')} className="rounded px-1.5 text-lg leading-none text-mist-dim hover:text-ember-bright">
                ×
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleFilterChange(item.key)}
                className={`rounded-full border px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors ${filter === item.key ? 'border-ember/40 bg-ember/15 text-ember-bright' : 'border-white/10 bg-void text-mist-dim hover:text-ember-bright'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-void-panel px-5 py-3 sm:px-6">
        <div className="font-body text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-mist-dim">
          Showing {filteredMonsters.length} targets
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-void px-3 py-1.5 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.24em] text-ember-bright whitespace-nowrap">
          <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={14} height={14} alt="" className="pixel-art shrink-0" />
          {demandCount} open requests
        </div>
      </div>

      {filteredMonsters.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedMonsters.map((monster) => (
            <article key={monster.id} className="flex flex-col min-w-0 rounded-2xl border border-white/5 bg-void-panel p-3 transition-colors hover:border-ember/35">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <MonsterIcon imageName={monster.image_name} name={monster.name} size={48} className="shrink-0 rounded-2xl border border-white/5 bg-void" />
                  <div className="min-w-0">
                    <Link href={`/monster/${monster.name}`} className="block truncate font-display text-base uppercase tracking-wide text-mist transition-colors hover:text-ember-bright">
                      {monster.name}
                    </Link>
                    {monster.extraInfo?.type ? (
                      <p className="mt-1 font-body text-[10px] uppercase tracking-[0.24em] text-mist-dim truncate">{monster.extraInfo.type}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {monster.isCompleted ? (
                    <span className="rounded-full border border-ember/30 bg-ember/10 px-2 py-0.5 font-body text-[9px] font-semibold uppercase tracking-[0.2em] text-ember-bright">
                      Complete
                    </span>
                  ) : null}
                  {monster.isWishlisted ? (
                    <span className="rounded-full border border-blood/30 bg-blood/10 px-2 py-0.5 font-body text-[9px] font-semibold uppercase tracking-[0.2em] text-blood-bright">
                      Tracked
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-void py-2">
                  <span className="font-body text-[9px] uppercase tracking-[0.2em] text-mist-dim text-center leading-tight">Demand</span>
                  <strong className={`font-display text-sm mt-1 ${monster.demand > 0 ? 'text-blood-bright' : 'text-mist-dim'}`}>{monster.demand}</strong>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-void py-2">
                  <span className="font-body text-[9px] uppercase tracking-[0.2em] text-mist-dim text-center leading-tight">S. Hosts</span>
                  <strong className={`font-display text-sm mt-1 ${monster.hostCount?.small > 0 ? 'text-ember-bright' : 'text-mist-dim'}`}>{monster.hostCount?.small || 0}</strong>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-void py-2">
                  <span className="font-body text-[9px] uppercase tracking-[0.2em] text-mist-dim text-center leading-tight">L. Hosts</span>
                  <strong className={`font-display text-sm mt-1 ${monster.hostCount?.large > 0 ? 'text-ember-bright' : 'text-mist-dim'}`}>{monster.hostCount?.large || 0}</strong>
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-void/60 px-3 py-3">
                <div className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.24em] text-mist-dim">
                  Track Target
                  <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={12} height={12} alt="" className="pixel-art shrink-0" />
                </div>
                <WishlistToggle monsterId={monster.id} initialType={monster.wishlistType} className="w-full sm:w-auto" />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 bg-void-panel px-8 py-16 text-center">
          <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={48} height={48} alt="" className="pixel-art grayscale" />
          <p className="font-display text-xl uppercase tracking-wide text-mist">No targets match the current filters.</p>
          <span className="font-body text-sm text-mist-dim">Try broadening the search or switching to a different status.</span>
        </div>
      )}

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
