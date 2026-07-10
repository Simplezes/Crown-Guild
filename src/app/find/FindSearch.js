'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MonsterIcon from '@/components/ui/MonsterIcon';
import UserAvatar from '@/components/ui/UserAvatar';

const HOST_PREVIEW_COUNT = 6;

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function FindSearch({ initialHosts }) {
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const filteredHosts = useMemo(() => {
    if (!search.trim()) return initialHosts;
    const term = search.toLowerCase();
    return initialHosts.filter(h =>
      h.monster_name.toLowerCase().includes(term) ||
      h.username.toLowerCase().includes(term) ||
      (h.quest && h.quest.toLowerCase().includes(term))
    );
  }, [search, initialHosts]);

  const groupedHosts = useMemo(() => {
    const groups = {};
    filteredHosts.forEach(host => {
      if (!groups[host.monster_name]) {
        groups[host.monster_name] = {
          name: host.monster_name,
          image: host.monster_image,
          emoji: host.monster_emoji,
          hosts: []
        };
      }
      groups[host.monster_name].hosts.push(host);
    });
    return Object.values(groups);
  }, [filteredHosts]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-void-panel p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-void px-4 py-3 focus-within:border-ember/40">
          <svg className="h-5 w-5 shrink-0 text-mist-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by Monster, Hunter, or Quest type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-body text-sm text-mist outline-none placeholder:text-mist-faint"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-lg leading-none text-mist-dim hover:text-mist" aria-label="Clear search">×</button>
          )}
        </div>
        <span className="whitespace-nowrap font-body text-xs uppercase tracking-widest text-ember-bright">
          {filteredHosts.length} Active Hosts
        </span>
      </div>

      {groupedHosts.length > 0 ? (
        <div className="flex flex-col gap-8">
          {groupedHosts.map((group) => {
            const isExpanded = !!expandedGroups[group.name];
            const visibleHosts = isExpanded ? group.hosts : group.hosts.slice(0, HOST_PREVIEW_COUNT);
            const remaining = group.hosts.length - visibleHosts.length;

            return (
              <section key={group.name} className="flex flex-col gap-3">
                <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                  <MonsterIcon imageName={group.image} name={group.name} size={40} />
                  <h2 className="font-display text-lg uppercase tracking-wide text-mist">{group.name}</h2>
                  <span className="ml-auto rounded-full border border-white/10 px-2.5 py-0.5 font-body text-xs text-mist-dim">{group.hosts.length}</span>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {visibleHosts.map((host) => (
                    <div key={host.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-void-panel p-4 transition-colors hover:border-ember/30">
                      <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar
                            src={host.avatar_url}
                            alt={host.username}
                            size={40}
                            className="h-10 w-10 shrink-0 rounded-full border border-ember/40 bg-void object-cover"
                          />
                          <div className="min-w-0">
                            <Link href={`/profile/${host.user_id}`} className="block truncate font-body text-sm font-semibold text-mist hover:text-ember-bright">
                              {host.username}
                            </Link>
                            <div className="font-body text-xs">
                              {host.lobby_id ? (
                                <span className="inline-flex items-center gap-1.5 text-green-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> In Lobby
                                </span>
                              ) : (
                                <span className="text-mist-dim">Available</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 font-body text-sm font-semibold">
                            <Image
                              src={host.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
                              width={16} height={16} alt="" className="pixel-art"
                            />
                            <span className={host.tempered ? "text-tempered" : "text-ember-bright"}>
                              {host.type} Crown
                            </span>
                          </div>
                          <p className="font-body text-xs text-mist-dim">
                            {host.quest || "Hunt"} • {host.strength_rating}★
                            {host.inv_remaining_uses !== null && host.inv_remaining_uses !== undefined
                              ? ` • ${host.inv_remaining_uses} Left`
                              : ""}
                          </p>
                          {host.inv_monster_id && String(host.inv_monster_id) !== String(host.monster_id) && (
                            <p className="mt-0.5 flex items-center gap-1.5 font-body text-[11px] uppercase tracking-wide text-mist-dim">
                              <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={10} height={10} alt="" className="pixel-art" />
                              <span>
                                {host.inv_monster_name ? titleCase(host.inv_monster_name) : "??"}
                                {host.quest === "Field Survey Quests" ? " Field Survey" : " Investigation"}
                              </span>
                            </p>
                          )}
                          {host.pair_monster && (
                            <p className="mt-0.5 flex items-center gap-1.5 font-body text-[11px] uppercase tracking-wide text-ember-bright">
                              <Image src="/icons/largecrown.png" width={10} height={10} alt="" className="pixel-art" />
                              <span>+ {titleCase(host.pair_monster.name)} in same quest</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`https://discord.com/users/${host.user_id}`}
                        target="_blank"
                        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 font-body text-xs font-semibold text-mist transition-colors hover:border-ember/40 hover:text-ember-bright"
                      >
                        <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                        Contact
                      </Link>
                    </div>
                  ))}
                </div>

                {remaining > 0 && (
                  <button
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [group.name]: true }))}
                    className="self-center rounded-lg border border-white/10 px-5 py-2 font-body text-xs uppercase tracking-widest text-mist-dim transition-colors hover:border-ember/40 hover:text-ember-bright"
                  >
                    Show {remaining} more host{remaining === 1 ? '' : 's'}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-void-panel py-24 text-center">
          <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={64} height={64} alt="" className="pixel-art grayscale opacity-50" />
          <h3 className="font-display text-lg uppercase tracking-wide text-mist">No hosts found for &quot;{search}&quot;</h3>
          <p className="font-body text-sm text-mist-dim">Try searching for a different monster or broaden your search criteria.</p>
        </div>
      )}
    </div>
  );
}
