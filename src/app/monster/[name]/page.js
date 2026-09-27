import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import HunterItem from "@/components/registry/HunterItem";
import { notFound } from "next/navigation";
import { getCrownById } from "@/lib/profile";
import { getMonsterByName } from "@/lib/monsters";
import CrownHighlighter from "@/components/ui/CrownHighlighter";
import LiveRefresh from "@/components/ui/LiveRefresh";
import TrackPin from "@/components/registry/TrackPin";
import LogButton from "@/components/log/LogButton";
import MonsterIcon from "@/components/ui/MonsterIcon";
import { auth } from "@/auth";
import UserAvatar from "@/components/ui/UserAvatar";
import { Icon } from "@/components/shell/Icon";

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
          SELECT c.*, u.username, u.avatar_url, u.id as user_id, u.status_message, u.receive_dms,
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
    return { error: true };
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
  const go = (n) => buildMonsterPageHref(search, { tab: activeTab, [pageKey]: n });
  return (
    <div className="pgn">
      <Link href={go(Math.max(1, page - 1))} className={page === 1 ? "off" : ""} aria-label="Previous page" aria-disabled={page === 1} tabIndex={page === 1 ? -1 : undefined} scroll={false}><Icon name="back" /></Link>
      <span>Page {page} of {totalPages}</span>
      <Link href={go(Math.min(totalPages, page + 1))} className={page === totalPages ? "off" : ""} aria-label="Next page" aria-disabled={page === totalPages} tabIndex={page === totalPages ? -1 : undefined} scroll={false}><Icon name="back" className="fw" /></Link>
    </div>
  );
}

function TagList({ values, tone = "default", fallback = "Unknown" }) {
  if (!values?.length) return <span className="pl">{fallback}</span>;
  const cls = tone === "gold" ? "pl w" : tone === "red" ? "pl a" : "pl";
  return (
    <div className="pills2">
      {values.map((value, index) => <span key={`${value}-${index}`} className={cls}>{value}</span>)}
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
  if (data.error) {
    return (
      <div className="wrap">
        <Link className="back" href="/investigation"><Icon name="back" /> Monsters</Link>
        <div className="m2empty">
          <b>Couldn&apos;t load this monster</b>
          <span>The database can&apos;t be reached right now. Check your connection and try again.</span>
          <Link className="btn sm" style={{ marginTop: 14 }} href={`/monster/${encodeURIComponent(name)}`}>Try again</Link>
        </div>
      </div>
    );
  }

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
            const [crown, linkedCrown = null] = group;
            const isHighlighted = group.some((c) => String(c.id) === String(highlightCrownId));

            return (
              <HunterItem
                viewerId={currentUserId}
                key={crown.id}
                crown={crown}
                linkedCrown={linkedCrown}
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
                viewerId={currentUserId}
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
                viewerId={currentUserId}
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

  const seg = (label, href, on, icon) => (
    <Link key={label} href={href} scroll={false} className={on ? "on" : ""} aria-current={on ? "true" : undefined}>{icon}{label}</Link>
  );

  return (
    <div className="wrap">
      <LiveRefresh />
      {highlightCrownId && <CrownHighlighter crownId={highlightCrownId} />}

      <Link className="back" href="/investigation"><Icon name="back" /> Monsters</Link>

      <section className="p mh">
        <div>
          <span className="eyebrow"><Icon name="monsters" />Monster profile</span>
          <div className="top2">
            <div className="big"><MonsterIcon imageName={monster.image_name} name={monster.name} size={88} /></div>
            <h1 className="h1">{monster.name}</h1>
          </div>
          <p className="quote">&ldquo;{gameInfo?.info || "No field guide data currently available for this specimen."}&rdquo;</p>
          {currentUserId && (
            <div className="acts" style={{ marginTop: 20 }}>
              <LogButton monsterId={monster.id} />
              <TrackPin trigger="btn-o" monsterId={monster.id} name={monster.name} initialType={userWishlistType} />
            </div>
          )}
        </div>
        <div className="k4">
          {overviewStats.map((stat) => (
            <div key={stat.label} className="tile"><b className={stat.tone === "alert" ? "dm" : ""}>{stat.value}</b><span>{stat.label}</span></div>
          ))}
        </div>
      </section>

      <section className="mbody">
        <div className="pp">
          <div className="sec-h" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <div><span className="eyebrow">Host coverage</span><h2 style={{ marginTop: 6 }}>{activeTab === "hosts" ? "Crown hosts" : "Hunters seeking"}</h2></div>
            <div className="seg lk" role="group">
              {seg("Hosts", buildMonsterPageHref(search, { tab: "hosts" }), activeTab === "hosts")}
              {seg("Seeking", buildMonsterPageHref(search, { tab: "seeking" }), activeTab !== "hosts")}
            </div>
          </div>
          <p className="sub">
            {activeTab === "hosts"
              ? "Hunters who have this crown and are hosting it. Contact them to join a quest."
              : "Hunters still chasing this monster. Track it yourself to appear here and let hosts find you."}
          </p>

          {activeTab === "hosts" ? (
            <>
              <div className="seg lk" role="group" aria-label="Crown type" style={{ marginTop: 14 }}>
                {seg("All types", buildMonsterPageHref(search, { crownType: "all" }), crownTypeFilter === "all")}
                {pairedGroups.length > 0 && seg("Pairs", buildMonsterPageHref(search, { crownType: "pairs" }), crownTypeFilter === "pairs")}
                {seg("Large", buildMonsterPageHref(search, { crownType: "large" }), crownTypeFilter === "large", <Image src="/icons/largecrown.png" width={14} height={14} alt="" className="px" />)}
                {seg("Small", buildMonsterPageHref(search, { crownType: "small" }), crownTypeFilter === "small", <Image src="/icons/smallcrown.png" width={14} height={14} alt="" className="px" />)}
              </div>

              {filteredSections.map((section) => (
                <div key={section.key} className="hsec">
                  <div className="hsh"><b>{section.title}</b><span>{section.count}</span></div>
                  {section.items ? <div className="hostgrid">{section.items}</div> : <div className="m2empty"><b>{section.empty}</b></div>}
                  <Pagination page={section.pagination.page} totalPages={section.pagination.totalPages} search={search} pageKey={section.pagination.pageKey} activeTab="hosts" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="list" style={{ marginTop: 14 }}>
                {wishlist.length > 0 ? pagedSeeking.items.map((entry) => (
                  <Link className="r" href={`/profile/${entry.user_id}`} key={entry.id || entry.user_id}>
                    <UserAvatar src={entry.avatar_url} alt={entry.username} size={44} className="av" />
                    <div><div className="n">{entry.username}</div><div className="s">{entry.status_message || "Active hunter"}</div></div>
                    <span className="x">
                      {(entry.type === "small" || entry.type === "both") && <Image src="/icons/smallcrown.png" width={18} height={18} alt="Small" className="px" />}
                      {(entry.type === "large" || entry.type === "both") && <Image src="/icons/largecrown.png" width={18} height={18} alt="Large" className="px" />}
                    </span>
                  </Link>
                )) : <div className="m2empty"><b>No hunters are tracking this monster</b><span>Track it to be the first.</span></div>}
              </div>
              <Pagination page={pagedSeeking.page} totalPages={pagedSeeking.totalPages} search={search} pageKey="seekingPage" activeTab="seeking" />
            </>
          )}
        </div>

        <div>
          <div className="pp phys">
            <div className="sec-h"><h2>Physiology</h2></div>
            <div className="grp"><small>Weaknesses</small><TagList values={extraInfo?.weakness} tone="gold" fallback="Unknown" /></div>
            <div className="grp"><small>Elements</small><TagList values={extraInfo?.elements} fallback="None" /></div>
            <div className="grp"><small>Ailments</small><TagList values={extraInfo?.ailments} tone="red" fallback="None" /></div>
          </div>
          <div className="pp" style={{ marginTop: 16 }}>
            <div className="sec-h"><h2>Breakdown</h2></div>
            {[["Large", largeCrowns.length], ["Small", smallCrowns.length], ["Pairs", pairedGroups.length], ["Tempered", totalTemperedLogs]].map(([label, value]) => (
              <div key={label} className="bd"><span>{label}</span><b>{value}</b></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
