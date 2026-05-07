import db from "@/lib/db";
import styles from "./monster.module.css";
import Link from "next/link";
import Image from "next/image";
import MonsterIcon from "@/components/ui/MonsterIcon";
import HunterItem from "@/components/registry/HunterItem";
import { notFound } from "next/navigation";
import { getCrownById } from "@/lib/profile";
import { getMonsterByName, getQuestIcon } from "@/lib/monsters";

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

async function getMonsterData(name) {
  try {
    const monster = await getMonsterByName(name);
    if (!monster) return null;

    const crownsRes = await db.execute({
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
    });

    const wishlistRes = await db.execute({
      sql: `
        SELECT w.*, u.username, u.avatar_url, u.id as user_id, u.status_message
        FROM wishlist w
        JOIN users u ON w.user_id = u.id
        WHERE w.monster_id = ?
        ORDER BY u.username ASC
      `,
      args: [monster.id]
    });

    return {
      monster,
      extraInfo: monster.extraInfo,
      crowns: crownsRes.rows.map(r => ({ ...r })),
      wishlist: wishlistRes.rows.map(r => ({ ...r }))
    };
  } catch (e) {
    console.error("Monster fetch error", e);
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

function renderPagination({ page, totalPages, search, pageKey, activeTab, sectionLabel }) {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <Link
        href={buildMonsterPageHref(search, { tab: activeTab, [pageKey]: page > 1 ? page - 1 : 1 })}
        className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ''}`}
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        scroll={false}
      >
        Previous
      </Link>
      <span className={styles.pageInfo}>{sectionLabel} Page {page} of {totalPages}</span>
      <Link
        href={buildMonsterPageHref(search, { tab: activeTab, [pageKey]: page < totalPages ? page + 1 : totalPages })}
        className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ''}`}
        aria-disabled={page === totalPages}
        tabIndex={page === totalPages ? -1 : undefined}
        scroll={false}
      >
        Next
      </Link>
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
  let highlightCrownId = search?.crownId;
  const userId = search?.user;
  const activeTab = search?.tab || 'hosts';
  const pairsPage = parsePageParam(search?.pairsPage);
  const largePage = parsePageParam(search?.largePage);
  const smallPage = parsePageParam(search?.smallPage);
  const seekingPage = parsePageParam(search?.seekingPage);

  const data = await getMonsterData(name);
  if (!data) notFound();

  if (!highlightCrownId && userId) {
    const userCrown = data.crowns.find(c => String(c.user_id) === String(userId));
    if (userCrown) highlightCrownId = userCrown.id;
  }

  const { monster, extraInfo, crowns, wishlist } = data;

  const pairMap = new Map();
  for (const c of crowns) {
    if (c.pair_id) {
      if (!pairMap.has(c.pair_id)) pairMap.set(c.pair_id, []);
      pairMap.get(c.pair_id).push(c);
    }
  }
  const pairedGroups = [...pairMap.values()].filter(g => g.length >= 2);
  const pairedCrownIds = new Set(pairedGroups.flatMap(g => g.map(c => c.id)));

  const smallCrowns = crowns.filter(c => c.type === 'small' && !pairedCrownIds.has(c.id));
  const largeCrowns = crowns.filter(c => c.type === 'large' && !pairedCrownIds.has(c.id));
  const pagedPairs = paginateItems(pairedGroups, pairsPage);
  const pagedLarge = paginateItems(largeCrowns, largePage);
  const pagedSmall = paginateItems(smallCrowns, smallPage);
  const pagedSeeking = paginateItems(wishlist, seekingPage);
  const gameInfo = extraInfo?.games?.find(g => g.game === "Monster Hunter Wilds");

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <header className={styles.header + " animate-mh"}>
          <Link href="/registry" className={styles.backBtn}>← Ledger</Link>
          <div className={styles.hero}>
            <div className={styles.monsterIcon}>
              <Image src={`/monsters/${monster.image_name}`} width={140} height={140} alt="" className="pixel-art" />
            </div>
            <div className={styles.titles}>
              <h1 className="gold-text">{monster.name}</h1>
              <div className={styles.meta}>
                <span>{extraInfo?.type || (monster.is_large ? 'Large Monster' : 'Small Monster')}</span>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.infoGrid + " animate-mh"}>
          <div className={styles.tacticalCard}>
              <div className={styles.tacticalHeader}>
                <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={40} height={40} alt="" className="pixel-art" />
                <h3 className="mh-title">Guild Intelligence</h3>
              </div>
              <p className={styles.description}>
                {gameInfo?.info || "No field guide data currently available for this specimen."}
              </p>

              <div className={styles.attributes}>
                <div className={styles.attrGroup}>
                  <label>Weaknesses</label>
                  <div className={styles.tags}>
                    {extraInfo?.weakness?.map((w, i) => <span key={i} className={styles.tagGold}>{w}</span>) || "Unknown"}
                  </div>
                </div>
                <div className={styles.attrGroup}>
                  <label>Elements</label>
                  <div className={styles.tags}>
                    {extraInfo?.elements?.map((e, i) => <span key={i} className={styles.tag}>{e}</span>) || "None"}
                  </div>
                </div>
                <div className={styles.attrGroup}>
                  <label>Ailments</label>
                  <div className={styles.tags}>
                    {extraInfo?.ailments?.map((a, i) => <span key={i} className={styles.tagRed}>{a}</span>) || "None"}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.records}>
              <div className={styles.tabs}>
                <Link
                  href={`?tab=hosts`}
                  className={`${styles.tab} ${activeTab === 'hosts' ? styles.tabActive : ''}`}
                  scroll={false}
                >
                  Hosts ({crowns.length})
                </Link>
                <Link
                  href={`?tab=seeking`}
                  className={`${styles.tab} ${activeTab === 'seeking' ? styles.tabActive : ''}`}
                  scroll={false}
                >
                  Seeking ({wishlist.length})
                </Link>
              </div>

              {activeTab === 'hosts' ? (
                <>
                  {pairedGroups.length > 0 && (
                    <section className={styles.crownSection} style={{ marginBottom: '40px' }}>
                      <div className={styles.sectionTitle}>
                        <Image src="/icons/largecrown.png" width={20} height={20} alt="" className="pixel-art" />
                        <Image src="/icons/smallcrown.png" width={16} height={16} alt="" className="pixel-art" style={{ marginLeft: -8 }} />
                        <h2 className="mh-title">Crown Pairs</h2>
                      </div>
                      <div className={styles.hunterList}>
                        {pagedPairs.items.map((group) => {
                          const smallC = group.find(c => c.type === 'small');
                          const largeC = group.find(c => c.type === 'large');
                          const isHl = group.some(c => String(c.id) === String(highlightCrownId));
                          return (
                            <HunterItem
                              key={smallC.id}
                              crown={smallC}
                              linkedCrown={largeC}
                              monsterName={monster.name}
                              monsterImageName={monster.image_name}
                              isHighlighted={isHl}
                            />
                          );
                        })}
                      </div>
                      {renderPagination({
                        page: pagedPairs.page,
                        totalPages: pagedPairs.totalPages,
                        search,
                        pageKey: 'pairsPage',
                        activeTab: 'hosts',
                        sectionLabel: 'Pairs',
                      })}
                    </section>
                  )}

                  <section className={styles.crownSection} style={{ marginBottom: '40px' }}>
                    <div className={styles.sectionTitle}>
                      <Image src="/icons/largecrown.png" width={24} height={24} alt="" className="pixel-art" />
                      <h2 className="mh-title">Large Crowns</h2>
                    </div>
                    <div className={styles.hunterList}>
                      {largeCrowns.length > 0 ? pagedLarge.items.map((c, i) => (
                        <HunterItem key={i} crown={c} monsterName={monster.name} monsterImageName={monster.image_name} isHighlighted={String(c.id) === String(highlightCrownId)} />
                      )) : (
                        <p className={styles.empty}>No large crowns recorded yet.</p>
                      )}
                    </div>
                    {renderPagination({
                      page: pagedLarge.page,
                      totalPages: pagedLarge.totalPages,
                      search,
                      pageKey: 'largePage',
                      activeTab: 'hosts',
                      sectionLabel: 'Large',
                    })}
                  </section>

                  <section className={styles.crownSection}>
                    <div className={styles.sectionTitle}>
                      <Image src="/icons/smallcrown.png" width={24} height={24} alt="" className="pixel-art" />
                      <h2 className="mh-title">Small Crowns</h2>
                    </div>
                    <div className={styles.hunterList}>
                      {smallCrowns.length > 0 ? pagedSmall.items.map((c, i) => (
                        <HunterItem key={i} crown={c} monsterName={monster.name} monsterImageName={monster.image_name} isHighlighted={String(c.id) === String(highlightCrownId)} />
                      )) : (
                        <p className={styles.empty}>No small crowns recorded yet.</p>
                      )}
                    </div>
                    {renderPagination({
                      page: pagedSmall.page,
                      totalPages: pagedSmall.totalPages,
                      search,
                      pageKey: 'smallPage',
                      activeTab: 'hosts',
                      sectionLabel: 'Small',
                    })}
                  </section>
                </>
              ) : (
                <section className={styles.crownSection}>
                  <div className={styles.sectionTitle}>
                    <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={24} height={24} alt="" className="pixel-art" />
                    <h2 className="mh-title">Hunters Seeking This Monster</h2>
                  </div>
                  <div className={styles.hunterList}>
                    {wishlist.length > 0 ? pagedSeeking.items.map((w, i) => (
                      <Link href={`/profile/${w.user_id}`} key={i} className={styles.wishlistUser}>
                        <div className={styles.userLeft}>
                          {w.avatar_url && <img src={w.avatar_url} alt="" className={styles.userAvatar} />}
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>{w.username}</span>
                            <span className={styles.userStatus}>{w.status_message || "Active Hunter"}</span>
                          </div>
                        </div>
                        <div className={styles.userRight}>
                          <div className={styles.needsLabel}>NEEDS:</div>
                          <div className={styles.needsIcons}>
                            {(w.type === 'small' || w.type === 'both') && <Image src="/icons/smallcrown.png" width={16} height={16} alt="S" className="pixel-art" />}
                            {(w.type === 'large' || w.type === 'both') && <Image src="/icons/largecrown.png" width={16} height={16} alt="L" className="pixel-art" />}
                          </div>
                        </div>
                      </Link>
                    )) : (
                      <p className={styles.empty}>No hunters are currently tracking this monster.</p>
                    )}
                  </div>
                  {renderPagination({
                    page: pagedSeeking.page,
                    totalPages: pagedSeeking.totalPages,
                    search,
                    pageKey: 'seekingPage',
                    activeTab: 'seeking',
                    sectionLabel: 'Seeking',
                  })}
                </section>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}
