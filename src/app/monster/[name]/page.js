import db from "@/lib/db";
import styles from "./monster.module.css";
import Link from "next/link";
import Image from "next/image";
import HunterItem from "@/components/registry/HunterItem";
import { notFound } from "next/navigation";
import { getCrownById } from "@/lib/profile";
import { getMonsterByName } from "@/lib/monsters";
import CrownHighlighter from "@/components/ui/CrownHighlighter";
import WishlistToggle from "@/components/wishlist/WishlistToggle";
import { auth } from "@/auth";

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

    let userWishlistType = null;
    if (userId) {
      const userWishlistRes = await db.execute({
        sql: `
          SELECT type
          FROM wishlist
          WHERE user_id = ? AND monster_id = ?
          LIMIT 1
        `,
        args: [userId, monster.id]
      });

      userWishlistType = userWishlistRes.rows?.[0]?.type || null;
    }

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

function renderPagination({ page, totalPages, search, pageKey, activeTab }) {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <Link
        href={buildMonsterPageHref(search, { tab: activeTab, [pageKey]: page > 1 ? page - 1 : 1 })}
        className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ''}`}
        aria-label="Previous page"
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        scroll={false}
      >
        ‹
      </Link>
      <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
      <Link
        href={buildMonsterPageHref(search, { tab: activeTab, [pageKey]: page < totalPages ? page + 1 : totalPages })}
        className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ''}`}
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

function renderTagList(values, className, fallback = 'Unknown') {
  if (!values?.length) {
    return <span className={styles.tagFallback}>{fallback}</span>;
  }

  return values.map((value, index) => (
    <span key={`${value}-${index}`} className={className}>
      {value}
    </span>
  ));
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
      key: 'large',
      title: 'Large Crowns',
      count: largeCrowns.length,
      pagination: { page: pagedLarge.page, totalPages: pagedLarge.totalPages, pageKey: 'largePage' },
      empty: 'No large crowns recorded yet.',
      icons: [{ src: '/icons/largecrown.png', width: 24, height: 24 }],
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
      icons: [{ src: '/icons/smallcrown.png', width: 24, height: 24 }],
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

  if (pairedGroups.length > 0) {
    hostSections.unshift({
      key: 'pairs',
      title: 'Crown Pairs',
      count: pairedGroups.length,
      pagination: { page: pagedPairs.page, totalPages: pagedPairs.totalPages, pageKey: 'pairsPage' },
      empty: 'No pair postings logged yet.',
      icons: [
        { src: '/icons/largecrown.png', width: 20, height: 20 },
        { src: '/icons/smallcrown.png', width: 16, height: 16, className: styles.overlapIcon },
      ],
      items: pagedPairs.items.map((group) => {
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
      }),
    });
  }

  return (
    <main className={styles.main}>
      {highlightCrownId && <CrownHighlighter crownId={highlightCrownId} />}
      <div className="premium-container">
        <header className={`${styles.header} animate-mh`}>
          <Link href="/registry" className={styles.backBtn}>← Ledger</Link>
          <div className={styles.heroShell}>
            <div className={styles.heroPanel}>
              <div className={styles.heroBanner}>
                <span className={styles.heroEyebrow}>Monster Dossier</span>
                <span className={styles.heroType}>{extraInfo?.type || (monster.is_large ? 'Large Monster' : 'Small Monster')}</span>
              </div>

              <div className={styles.hero}>
                <div className={styles.monsterIcon}>
                  <Image src={`/monsters/${monster.image_name}`} width={140} height={140} alt="" className="pixel-art" />
                </div>
                <div className={styles.titles}>
                  <h1 className="gold-text">{monster.name}</h1>
                  <div className={styles.heroChips}>
                    <span className={styles.heroChip}>{monster.is_large ? 'Large Hunt' : 'Small Hunt'}</span>
                    {pairedGroups.length > 0 && <span className={styles.heroChip}>{pairedGroups.length} Pair Posts</span>}
                    {totalTemperedLogs > 0 && <span className={styles.heroChipAlert}>{totalTemperedLogs} Tempered</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles.overviewCard} mh-card`}>
              <div className={styles.overviewHeader}>
                <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                <span>Activity Snapshot</span>
              </div>

              <div className={styles.overviewGrid}>
                {overviewStats.map((stat) => (
                  <div key={stat.label} className={styles.overviewStat}>
                    <span className={styles.overviewLabel}>{stat.label}</span>
                    <strong className={stat.tone === 'alert' ? styles.overviewValueAlert : styles.overviewValue}>{stat.value}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.overviewTabs}>
                <Link
                  href={buildMonsterPageHref(search, { tab: 'hosts' })}
                  className={`${styles.overviewTab} ${activeTab === 'hosts' ? styles.overviewTabActive : ''}`}
                  scroll={false}
                >
                  Host Ledger
                </Link>
                <Link
                  href={buildMonsterPageHref(search, { tab: 'seeking' })}
                  className={`${styles.overviewTab} ${activeTab === 'seeking' ? styles.overviewTabActive : ''}`}
                  scroll={false}
                >
                  Seeking Board
                </Link>
              </div>

              <div className={styles.wishlistQuickAction}>
                <span className={styles.wishlistQuickLabel}>Track This Monster</span>
                <WishlistToggle
                  monsterId={monster.id}
                  initialType={userWishlistType}
                  className={styles.wishlistQuickToggle}
                />
              </div>
            </div>
          </div>
        </header>

        <div className={`${styles.contentGrid} animate-mh`}>
          <section className={styles.recordsColumn}>
            <div className={styles.recordShell}>
              <div className={styles.recordIntro}>
                <div>
                  <span className={styles.sectionEyebrow}>{activeTab === 'hosts' ? 'Host Coverage' : 'Hunt Demand'}</span>
                  <h2 className="mh-title">{activeTab === 'hosts' ? 'Crowns on Record' : 'Hunters Tracking This Monster'}</h2>
                </div>
                <p className={styles.recordSummary}>
                  {activeTab === 'hosts'
                    ? 'The ledger is grouped by crown type so active entries are easier to scan and contact.'
                    : 'Open demand is grouped in one place so you can see who still needs this monster and which sizes they are chasing.'}
                </p>
              </div>

              {activeTab === 'hosts' ? (
                <div className={styles.recordSections}>
                  {hostSections.map((section) => (
                    <section key={section.key} className={styles.crownSection}>
                      <div className={styles.sectionTitleRow}>
                        <div className={styles.sectionTitle}>
                          <div className={styles.sectionIcons}>
                            {section.icons.map((icon, index) => (
                              <Image
                                key={`${section.key}-${index}`}
                                src={icon.src}
                                width={icon.width}
                                height={icon.height}
                                alt=""
                                className={`pixel-art ${icon.className || ''}`.trim()}
                              />
                            ))}
                          </div>
                          <div>
                            <h3 className="mh-title">{section.title}</h3>
                            <span className={styles.sectionMeta}>{section.count} active entries</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.hunterList}>
                        {section.items || <p className={styles.empty}>{section.empty}</p>}
                      </div>

                      {renderPagination({
                        page: section.pagination.page,
                        totalPages: section.pagination.totalPages,
                        search,
                        pageKey: section.pagination.pageKey,
                        activeTab: 'hosts',
                      })}
                    </section>
                  ))}
                </div>
              ) : (
                <section className={styles.crownSection}>
                  <div className={styles.sectionTitleRow}>
                    <div className={styles.sectionTitle}>
                      <div className={styles.sectionIcons}>
                        <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={24} height={24} alt="" className="pixel-art" />
                      </div>
                      <div>
                        <h3 className="mh-title">Seeking Board</h3>
                        <span className={styles.sectionMeta}>{wishlist.length} hunters watching</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.hunterList}>
                    {wishlist.length > 0 ? pagedSeeking.items.map((entry) => (
                      <Link href={`/profile/${entry.user_id}`} key={entry.id || entry.user_id} className={styles.wishlistUser}>
                        <div className={styles.userLeft}>
                          {entry.avatar_url && <img src={entry.avatar_url} alt="" className={styles.userAvatar} />}
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>{entry.username}</span>
                            <span className={styles.userStatus}>{entry.status_message || "Active Hunter"}</span>
                          </div>
                        </div>
                        <div className={styles.userRight}>
                          <div className={styles.needsLabel}>Needs</div>
                          <div className={styles.needsIcons}>
                            {(entry.type === 'small' || entry.type === 'both') && <Image src="/icons/smallcrown.png" width={16} height={16} alt="S" className="pixel-art" />}
                            {(entry.type === 'large' || entry.type === 'both') && <Image src="/icons/largecrown.png" width={16} height={16} alt="L" className="pixel-art" />}
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
                  })}
                </section>
              )}
            </div>
          </section>

          <aside className={styles.sidebarColumn}>
            <div className={styles.tacticalCard}>
              <div className={styles.tacticalHeader}>
                <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={40} height={40} alt="" className="pixel-art" />
                <div>
                  <span className={styles.sectionEyebrow}>Field Guide</span>
                  <h3 className="mh-title">Guild Intelligence</h3>
                </div>
              </div>
              <p className={styles.description}>
                {gameInfo?.info || "No field guide data currently available for this specimen."}
              </p>

              <div className={styles.attributes}>
                <div className={styles.attrGroup}>
                  <label>Weaknesses</label>
                  <div className={styles.tags}>{renderTagList(extraInfo?.weakness, styles.tagGold, 'Unknown')}</div>
                </div>
                <div className={styles.attrGroup}>
                  <label>Elements</label>
                  <div className={styles.tags}>{renderTagList(extraInfo?.elements, styles.tag, 'None')}</div>
                </div>
                <div className={styles.attrGroup}>
                  <label>Ailments</label>
                  <div className={styles.tags}>{renderTagList(extraInfo?.ailments, styles.tagRed, 'None')}</div>
                </div>
              </div>
            </div>

            <div className={`${styles.metaPanel} mh-card`}>
              <div className={styles.metaPanelHeader}>
                <span className={styles.sectionEyebrow}>Breakdown</span>
                <h3 className="mh-title">Crown Distribution</h3>
              </div>
              <div className={styles.metaRows}>
                <div className={styles.metaRow}><span>Large</span><strong>{largeCrowns.length}</strong></div>
                <div className={styles.metaRow}><span>Small</span><strong>{smallCrowns.length}</strong></div>
                <div className={styles.metaRow}><span>Pairs</span><strong>{pairedGroups.length}</strong></div>
                <div className={styles.metaRow}><span>Tempered</span><strong>{totalTemperedLogs}</strong></div>
              </div>
            </div>

            <div className={`${styles.metaPanel} mh-card`}>
              <div className={styles.metaPanelHeader}>
                <span className={styles.sectionEyebrow}>Pursuit Status</span>
                <h3 className="mh-title">Current Demand</h3>
              </div>
              <p className={styles.metaNote}>
                {wishlist.length > 0
                  ? `${wishlist.length} hunters still need this monster in their collection log.`
                  : 'No open wishlist demand is currently registered for this monster.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
