import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import HunterItem from "@/components/registry/HunterItem";
import { notFound } from "next/navigation";
import { getCrownById } from "@/lib/profile";
import { getMonsterByName } from "@/lib/monsters";
import CrownHighlighter from "@/components/ui/CrownHighlighter";
import WishlistToggle from "@/components/wishlist/WishlistToggle";
import MonsterIcon from "@/components/ui/MonsterIcon";
import { auth } from "@/auth";
import UserAvatar from "@/components/ui/UserAvatar";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MONSTER_LIST_PAGE_SIZE = 5;

function buildFeaturedCrownVersion(crown) {
  if (!crown) return '0';

  const parts = [
    Number(crown.id || 0),
    Number(crown.tempered || 0),
    Number(crown.strength_rating || 0),
    Number(crown.remaining_uses ?? 0),
    Number(crown.investigation_id || 0),
    String(crown.type || ''),
    String(crown.quest || ''),
    String(crown.username || ''),
    String(crown.status_message || ''),
  ];

  let checksum = 0;
  for (const value of parts.join('|')) {
    checksum = (checksum * 31 + value.charCodeAt(0)) >>> 0;
  }
  return `${Number(crown.id || 0)}-${checksum.toString(36)}`;
}

function buildMonsterSummaryVersion(row) {
  const total = Number(row?.total || 0);
  const small = Number(row?.small || 0);
  const large = Number(row?.large || 0);
  const tempered = Number(row?.tempered || 0);
  const latest = Number(row?.latest_id || 0);
  const wish = Number(row?.wishlist_total || 0);
  return `${latest}-${total}-${small}-${large}-${tempered}-${wish}`;
}

async function getMonsterData(name, userId) {
  try {
    const monster = await getMonsterByName(name);
    if (!monster) return null;

    const [crownsRes, wishlistRes, userWishlistRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT c.*, u.username, u.avatar_url, u.id as user_id, u.status_message,
                 inv.remaining_uses  AS inv_remaining_uses,
                 inv.monster_id      AS inv_monster_id,
                 inv_m.name          AS inv_monster_name
          FROM crowns c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN investigations inv   ON c.investigation_id = inv.id
          LEFT JOIN monsters       inv_m ON inv.monster_id     = inv_m.id
          WHERE c.monster_id = ?
          ORDER BY c.type DESC, c.tempered DESC
        `,
        args: [monster.id]
      }),
      db.execute({
        sql: `
          SELECT w.*, u.username, u.avatar_url, u.id as user_id, u.status_message
          FROM wishlist w
          JOIN users u ON w.user_id = u.id
          WHERE w.monster_id = ?
          ORDER BY u.username ASC
        `,
        args: [monster.id]
      }),
      userId
        ? db.execute({
            sql: `SELECT type FROM wishlist WHERE user_id = ? AND monster_id = ? LIMIT 1`,
            args: [userId, monster.id]
          })
        : null,
    ]);

    const userWishlistType = userWishlistRes?.rows?.[0]?.type || null;

    return {
      monster,
      extraInfo: monster.extraInfo,
      crowns: crownsRes.rows.map((row) => ({ ...row })),
      wishlist: wishlistRes.rows.map((row) => ({ ...row })),
      userWishlistType
    };
  } catch (error) {
    console.error("Monster fetch error", error);
    return null;
  }
}

function parsePageParam(value) {
  const parsed = Number.parseInt(String(value || '1'), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function paginateItems(items, page, pageSize = MONSTER_LIST_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}

function buildMonsterPageHref(search, updates) {
  const params = new URLSearchParams();

  Object.entries(search || {}).forEach(([key, value]) => {
    if (value == null) return;

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null && entry !== '') params.append(key, String(entry));
      });
      return;
    }

    if (value !== '') params.set(key, String(value));
  });

  Object.entries(updates || {}).forEach(([key, value]) => {
    if (value == null || value === '' || value === false) {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : '?';
}

function Pagination({ page, totalPages, search, pageKey, activeTab }) {
  if (totalPages <= 1) return null;

  const btnBase = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 font-display text-lg text-mist transition-colors hover:border-ember/40 hover:text-ember-bright";

  return (
    <div className="mt-5 flex items-center justify-center gap-4">
      <Link
        href={buildMonsterPageHref(search, { tab: activeTab, [pageKey]: page > 1 ? page - 1 : 1 })}
        className={`${btnBase} ${page === 1 ? 'pointer-events-none opacity-30' : ''}`}
        aria-label="Previous page"
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        scroll={false}
      >
        ‹
      </Link>
      <span className="font-display text-xs uppercase tracking-widest text-mist-dim">Page {page} of {totalPages}</span>
      <Link
        href={buildMonsterPageHref(search, { tab: activeTab, [pageKey]: page < totalPages ? page + 1 : totalPages })}
        className={`${btnBase} ${page === totalPages ? 'pointer-events-none opacity-30' : ''}`}
        aria-label="Next page"
        aria-disabled={page === totalPages}
        tabIndex={page === totalPages ? -1 : undefined}
        scroll={false}
      >
        ›
      </Link>
    </div>
  );
}

function TagList({ values, tone = 'default', fallback = 'Unknown' }) {
  if (!values?.length) {
    return <span className="font-body text-sm italic text-mist-dim">{fallback}</span>;
  }

  const toneClass = tone === 'gold'
    ? 'border-ember/40 bg-ember/10 text-ember-bright'
    : tone === 'red'
      ? 'border-blood/40 bg-blood/10 text-blood-bright'
      : 'border-white/10 bg-white/5 text-mist';

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className={`rounded-md border px-2.5 py-1 font-body text-xs font-semibold uppercase tracking-wide ${toneClass}`}>
          {value}
        </span>
      ))}
    </div>
  );
}

export async function generateMetadata({ params, searchParams }) {
  const { name } = await params;
  const search = await searchParams;
  const crownId = search?.crownId;
  const userId = search?.user;
  const shareNonce = search?.share || search?.t || null;
  const data = await getMonsterByName(name);

  if (!data) {
    return { title: "Monster Not Found | Crown Guild" };
  }

  let imageUrl = `/monster/${encodeURIComponent(name)}/og`;
  let ogVersion = '0';

  let featuredCrown = null;
  if (crownId) {
    featuredCrown = await getCrownById(crownId);
  } else if (userId) {
    const userCrowns = await db.execute({
      sql: `SELECT id FROM crowns WHERE user_id = ? AND monster_id = ? ORDER BY id DESC LIMIT 1`,
      args: [userId, data.id]
    });
    if (userCrowns.rows.length > 0) {
      featuredCrown = await getCrownById(userCrowns.rows[0].id);
    }
  }

  let title = `${data.name} | Crown Registry`;
  let description = `${data.is_large ? 'Large Monster' : 'Small Monster'} • View S&L crown records and tactical field intelligence.`;

  if (featuredCrown) {
    ogVersion = buildFeaturedCrownVersion(featuredCrown);
    imageUrl += `?crownId=${featuredCrown.id}&v=${encodeURIComponent(ogVersion)}`;
    const crownSize = featuredCrown.type === 'small' ? 'Small' : 'Large';
    const tempStr = featuredCrown.tempered ? 'Tempered ' : '';
    title = `${tempStr}${crownSize} Crown ${data.name}`;
    description = `Secured by ${featuredCrown.username} • View the full S&L ledger on Crown Guild.`;
  } else {
    const summaryRes = await db.execute({
      sql: `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) AS small,
          SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) AS large,
          SUM(CASE WHEN tempered = 1 THEN 1 ELSE 0 END) AS tempered,
          MAX(id) AS latest_id,
          (
            SELECT COUNT(*)
            FROM wishlist w
            WHERE w.monster_id = ?
          ) AS wishlist_total
        FROM crowns
        WHERE monster_id = ?
      `,
      args: [data.id, data.id],
    });

    ogVersion = buildMonsterSummaryVersion(summaryRes.rows?.[0]);
    imageUrl += `?v=${encodeURIComponent(ogVersion)}`;
  }

  if (shareNonce) {
    imageUrl += `${imageUrl.includes('?') ? '&' : '?'}share=${encodeURIComponent(String(shareNonce))}`;
  }

  return {
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
    }
  };
}

export default async function MonsterDetail({ params, searchParams }) {
  const { name } = await params;
  const search = await searchParams;
  const session = await auth();
  const currentUserId = session?.user?.id;
  let highlightCrownId = search?.crownId;
  const userId = search?.user;
  const activeTab = search?.tab || 'hosts';
  const crownTypeFilter = search?.crownType || 'all';
  const pairsPage = parsePageParam(search?.pairsPage);
  const largePage = parsePageParam(search?.largePage);
  const smallPage = parsePageParam(search?.smallPage);
  const seekingPage = parsePageParam(search?.seekingPage);

  const data = await getMonsterData(name, currentUserId);
  if (!data) notFound();

  if (!highlightCrownId && userId) {
    const userCrown = data.crowns.find((crown) => String(crown.user_id) === String(userId));
    if (userCrown) highlightCrownId = userCrown.id;
  }

  const { monster, extraInfo, crowns, wishlist, userWishlistType } = data;

  const pairMap = new Map();
  for (const crown of crowns) {
    if (crown.pair_id) {
      if (!pairMap.has(crown.pair_id)) pairMap.set(crown.pair_id, []);
      pairMap.get(crown.pair_id).push(crown);
    }
  }

  const pairedGroups = [...pairMap.values()].filter((group) => group.length >= 2);
  const pairedCrownIds = new Set(pairedGroups.flatMap((group) => group.map((crown) => crown.id)));
  const smallCrowns = crowns.filter((crown) => crown.type === 'small' && !pairedCrownIds.has(crown.id));
  const largeCrowns = crowns.filter((crown) => crown.type === 'large' && !pairedCrownIds.has(crown.id));

  let effectivePairsPage = pairsPage;
  let effectiveLargePage = largePage;
  let effectiveSmallPage = smallPage;

  if (highlightCrownId) {
    const pairGroupIdx = pairedGroups.findIndex((group) => group.some((crown) => String(crown.id) === String(highlightCrownId)));
    if (pairGroupIdx >= 0) effectivePairsPage = Math.floor(pairGroupIdx / MONSTER_LIST_PAGE_SIZE) + 1;

    const largeIdx = largeCrowns.findIndex((crown) => String(crown.id) === String(highlightCrownId));
    if (largeIdx >= 0) effectiveLargePage = Math.floor(largeIdx / MONSTER_LIST_PAGE_SIZE) + 1;

    const smallIdx = smallCrowns.findIndex((crown) => String(crown.id) === String(highlightCrownId));
    if (smallIdx >= 0) effectiveSmallPage = Math.floor(smallIdx / MONSTER_LIST_PAGE_SIZE) + 1;
  }

  const pagedPairs = paginateItems(pairedGroups, effectivePairsPage);
  const pagedLarge = paginateItems(largeCrowns, effectiveLargePage);
  const pagedSmall = paginateItems(smallCrowns, effectiveSmallPage);
  const pagedSeeking = paginateItems(wishlist, seekingPage);
  const gameInfo = extraInfo?.games?.find((game) => game.game === "Monster Hunter Wilds");
  const totalTemperedLogs = crowns.filter((crown) => crown.tempered).length;
  const overviewStats = [
    { label: 'Logged Crowns', value: crowns.length, tone: 'gold' },
    { label: 'Pair Posts', value: pairedGroups.length, tone: 'default' },
    { label: 'Tempered Logs', value: totalTemperedLogs, tone: totalTemperedLogs > 0 ? 'alert' : 'default' },
    { label: 'Hunters Seeking', value: wishlist.length, tone: 'default' },
  ];

  const hostSections = [
    {
      key: 'pairs',
      title: 'Crown Pairs',
      count: pairedGroups.length,
      pagination: { page: pagedPairs.page, totalPages: pagedPairs.totalPages, pageKey: 'pairsPage' },
      empty: 'No pair postings logged yet.',
      icon: '/icons/largecrown.png',
      items: pairedGroups.length > 0
        ? pagedPairs.items.map((group) => {
            const smallCrown = group.find((crown) => crown.type === 'small');
            const largeCrown = group.find((crown) => crown.type === 'large');
            const isHighlighted = group.some((crown) => String(crown.id) === String(highlightCrownId));

            return (
              <HunterItem
                key={smallCrown.id}
                crown={smallCrown}
                linkedCrown={largeCrown}
                monsterName={monster.name}
                monsterImageName={monster.image_name}
                isHighlighted={isHighlighted}
              />
            );
          })
        : null,
    },
    {
      key: 'large',
      title: 'Large Crowns',
      count: largeCrowns.length,
      pagination: { page: pagedLarge.page, totalPages: pagedLarge.totalPages, pageKey: 'largePage' },
      empty: 'No large crowns recorded yet.',
      icon: '/icons/largecrown.png',
      items: largeCrowns.length > 0
        ? pagedLarge.items.map((crown) => (
            <HunterItem
              key={crown.id}
              crown={crown}
              monsterName={monster.name}
              monsterImageName={monster.image_name}
              isHighlighted={String(crown.id) === String(highlightCrownId)}
            />
          ))
        : null,
    },
    {
      key: 'small',
      title: 'Small Crowns',
      count: smallCrowns.length,
      pagination: { page: pagedSmall.page, totalPages: pagedSmall.totalPages, pageKey: 'smallPage' },
      empty: 'No small crowns recorded yet.',
      icon: '/icons/smallcrown.png',
      items: smallCrowns.length > 0
        ? pagedSmall.items.map((crown) => (
            <HunterItem
              key={crown.id}
              crown={crown}
              monsterName={monster.name}
              monsterImageName={monster.image_name}
              isHighlighted={String(crown.id) === String(highlightCrownId)}
            />
          ))
        : null,
    },
  ];

  const filteredSections = crownTypeFilter === 'all' 
    ? hostSections 
    : hostSections.filter((s) => s.key === crownTypeFilter);

  const tabLinkBase = "inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 font-display text-xs uppercase tracking-widest transition-colors";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      {highlightCrownId && <CrownHighlighter crownId={highlightCrownId} />}

      <Link href="/investigation" className="mb-6 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.25em] text-mist-dim transition-colors hover:text-ember-bright">
        ← Ledger
      </Link>

      
      <section className="mb-6 overflow-hidden rounded-3xl border border-white/5 bg-void-panel">
        <div className="relative border-b border-white/5 bg-gradient-to-r from-ember/10 via-transparent to-transparent px-5 py-5 sm:px-6 lg:px-7">
          
          <div className="relative flex flex-col gap-10 lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-16 lg:items-center">
            
            
            <div className="flex flex-col min-w-0">
              <span className="mb-4 inline-flex items-center gap-2 font-body text-[10px] sm:text-xs uppercase tracking-[0.4em] text-ember-dim">
                <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                Field Guide
              </span>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 mb-6 min-w-0">
                <div className="flex h-24 w-24 sm:h-32 sm:w-32 shrink-0 items-center justify-center rounded-[2rem] border border-ember/20 bg-ember/10 backdrop-blur-sm">
                  <MonsterIcon imageName={monster.image_name} name={monster.name} size={96} className="shrink-0 drop-shadow-lg" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wider text-mist drop-shadow-md text-balance leading-[1.1] break-words">
                    {monster.name}
                  </h1>
                </div>
              </div>

              <div className="border-l-2 border-ember/30 pl-5 lg:pl-6 max-w-2xl">
                <p className="font-body text-sm sm:text-base leading-relaxed text-mist-dim italic text-balance break-words">
                  "{gameInfo?.info || "No field guide data currently available for this specimen."}"
                </p>
              </div>
            </div>

            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-white/5 bg-void p-5 sm:p-6 transition-transform hover:scale-[1.02]">
                  <p className={`font-display text-3xl sm:text-4xl drop-shadow-md ${stat.tone === 'alert' ? 'text-blood-bright' : 'text-ember-bright'}`}>
                    {stat.value}
                  </p>
                  <p className="mt-2 font-body text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-mist-dim font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)] lg:items-start">
        <section className="min-w-0 rounded-2xl border border-white/5 bg-void-panel p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 border-b border-white/5 pb-5">
            <span className="font-body text-xs uppercase tracking-[0.2em] text-ember-dim">
              {activeTab === 'hosts' ? 'Host Coverage' : 'Hunt Demand'}
            </span>
            <h2 className="font-display text-lg uppercase tracking-wide text-mist">
              {activeTab === 'hosts' ? 'Crowns on Record' : 'Hunters Tracking This Monster'}
            </h2>
            <p className="max-w-lg font-body text-sm leading-relaxed text-mist-dim">
              {activeTab === 'hosts'
                ? 'The ledger is grouped by crown type so active entries are easier to scan and contact.'
                : 'Open demand is grouped in one place so you can see who still needs this monster and which sizes they are chasing.'}
            </p>
          </div>

          {activeTab === 'hosts' ? (
            <div className="flex flex-col gap-6">
              <div className="flex gap-2 rounded-lg border border-white/10 bg-void p-1">
                <Link
                  href={buildMonsterPageHref(search, { crownType: 'all' })}
                  className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-center font-display text-[11px] sm:text-xs uppercase tracking-widest transition-colors ${
                    crownTypeFilter === 'all' ? 'bg-ember text-void' : 'text-mist hover:text-ember-bright'
                  }`}
                  scroll={false}
                >
                  All Types
                </Link>
                {pairedGroups.length > 0 && (
                  <Link
                    href={buildMonsterPageHref(search, { crownType: 'pairs' })}
                    className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-center font-display text-[11px] sm:text-xs uppercase tracking-widest transition-colors ${
                      crownTypeFilter === 'pairs' ? 'bg-ember text-void' : 'text-mist hover:text-ember-bright'
                    }`}
                    scroll={false}
                  >
                    Pairs
                  </Link>
                )}
                <Link
                  href={buildMonsterPageHref(search, { crownType: 'large' })}
                  className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-center font-display text-[11px] sm:text-xs uppercase tracking-widest transition-colors ${
                    crownTypeFilter === 'large' ? 'bg-ember text-void' : 'text-mist hover:text-ember-bright'
                  }`}
                  scroll={false}
                >
                  Large
                </Link>
                <Link
                  href={buildMonsterPageHref(search, { crownType: 'small' })}
                  className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-center font-display text-[11px] sm:text-xs uppercase tracking-widest transition-colors ${
                    crownTypeFilter === 'small' ? 'bg-ember text-void' : 'text-mist hover:text-ember-bright'
                  }`}
                  scroll={false}
                >
                  Small
                </Link>
              </div>

              {filteredSections.map((section) => (
                <section key={section.key}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-void">
                      <Image src={section.icon} width={22} height={22} alt="" className="pixel-art" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm uppercase tracking-wide text-mist">{section.title}</h3>
                      <span className="font-body text-xs uppercase tracking-wider text-mist-dim">{section.count} entries</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {section.items || (
                      <p className="rounded-xl border border-dashed border-white/10 py-8 text-center font-body text-sm italic text-mist-dim">
                        {section.empty}
                      </p>
                    )}
                  </div>

                  <Pagination
                    page={section.pagination.page}
                    totalPages={section.pagination.totalPages}
                    search={search}
                    pageKey={section.pagination.pageKey}
                    activeTab="hosts"
                  />
                </section>
              ))}
            </div>
          ) : (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-void">
                  <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={22} height={22} alt="" className="pixel-art" />
                </div>
                <div>
                  <h3 className="font-display text-sm uppercase tracking-wide text-mist">Seeking Board</h3>
                  <span className="font-body text-xs uppercase tracking-wider text-mist-dim">{wishlist.length} hunters watching</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {wishlist.length > 0 ? pagedSeeking.items.map((entry) => (
                  <Link
                    href={`/profile/${entry.user_id}`}
                    key={entry.id || entry.user_id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-void px-4 py-3 transition-colors hover:border-ember/30 hover:bg-white/5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        src={entry.avatar_url}
                        alt={entry.username}
                        size={40}
                        className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm text-ember-bright">{entry.username}</p>
                        <p className="truncate font-body text-xs italic text-mist-dim">{entry.status_message || "Active Hunter"}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mb-1 font-body text-[10px] uppercase tracking-wider text-mist-dim">Needs</p>
                      <div className="flex justify-end gap-1.5">
                        {(entry.type === 'small' || entry.type === 'both') && <Image src="/icons/smallcrown.png" width={16} height={16} alt="S" className="pixel-art" />}
                        {(entry.type === 'large' || entry.type === 'both') && <Image src="/icons/largecrown.png" width={16} height={16} alt="L" className="pixel-art" />}
                      </div>
                    </div>
                  </Link>
                )) : (
                  <p className="rounded-xl border border-dashed border-white/10 py-8 text-center font-body text-sm italic text-mist-dim">
                    No hunters are currently tracking this monster.
                  </p>
                )}
              </div>

              <Pagination
                page={pagedSeeking.page}
                totalPages={pagedSeeking.totalPages}
                search={search}
                pageKey="seekingPage"
                activeTab="seeking"
              />
            </section>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-void-panel">
            <div className="border-b border-white/5 bg-white/5 px-5 py-4">
              <div className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-mist-dim">
                <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                <span>Physiology</span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid gap-3">
                <div className="rounded-xl border border-white/5 bg-void px-3 py-3">
                  <p className="mb-2 font-body text-[10px] uppercase tracking-[0.25em] text-mist-dim">Weaknesses</p>
                  <TagList values={extraInfo?.weakness} tone="gold" fallback="Unknown" />
                </div>
                <div className="rounded-xl border border-white/5 bg-void px-3 py-3">
                  <p className="mb-2 font-body text-[10px] uppercase tracking-[0.25em] text-mist-dim">Elements</p>
                  <TagList values={extraInfo?.elements} tone="default" fallback="None" />
                </div>
                <div className="rounded-xl border border-white/5 bg-void px-3 py-3">
                  <p className="mb-2 font-body text-[10px] uppercase tracking-[0.25em] text-mist-dim">Ailments</p>
                  <TagList values={extraInfo?.ailments} tone="red" fallback="None" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-void-panel">
            <div className="border-b border-white/5 bg-white/5 px-5 py-4">
              <div className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-mist-dim">
                <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                <span>Tracking</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex gap-2 rounded-lg border border-white/10 bg-void p-1">
                <Link
                  href={buildMonsterPageHref(search, { tab: 'hosts' })}
                  className={`${tabLinkBase} flex-1 text-[11px] ${activeTab === 'hosts' ? 'bg-ember text-void' : 'text-mist hover:text-ember-bright'}`}
                  scroll={false}
                >
                  Host Ledger
                </Link>
                <Link
                  href={buildMonsterPageHref(search, { tab: 'seeking' })}
                  className={`${tabLinkBase} flex-1 text-[11px] ${activeTab === 'seeking' ? 'bg-ember text-void' : 'text-mist hover:text-ember-bright'}`}
                  scroll={false}
                >
                  Seeking Board
                </Link>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-void px-3 py-3">
                <span className="font-body text-[10px] uppercase tracking-[0.25em] text-mist-dim">Track This Monster</span>
                <WishlistToggle monsterId={monster.id} initialType={userWishlistType} />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-void-panel">
            <div className="border-b border-white/5 bg-white/5 px-5 py-4">
              <p className="font-body text-[10px] uppercase tracking-[0.3em] text-mist-dim">Breakdown</p>
            </div>
            <div className="grid gap-2 p-4">
              {[
                { label: 'Large', value: largeCrowns.length },
                { label: 'Small', value: smallCrowns.length },
                { label: 'Pairs', value: pairedGroups.length },
                { label: 'Tempered', value: totalTemperedLogs },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-void px-3 py-2.5">
                  <span className="font-body text-[10px] uppercase tracking-[0.25em] text-mist-dim">{item.label}</span>
                  <strong className="font-display text-base text-ember-bright">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-void-panel">
            <div className="border-b border-white/5 bg-white/5 px-5 py-4">
              <p className="font-body text-[10px] uppercase tracking-[0.3em] text-mist-dim">Pursuit Status</p>
            </div>
            <div className="p-5">
              <p className="font-body text-sm leading-relaxed text-mist-dim">
                {wishlist.length > 0
                  ? `${wishlist.length} hunters still need this monster in their collection log.`
                  : 'No open wishlist demand is currently registered for this monster.'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
