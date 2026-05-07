import styles from "./compare.module.css";
import Image from "next/image";
import CompareForm from "./CompareForm";
import { getRankProgress } from "@/lib/profile";
import { getCompareData } from "./compareData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toPlainUser(user, fallback) {
  if (!user) return fallback || null;
  return {
    id: String(user.id || fallback?.id || ""),
    username: user.username || fallback?.username || "Unknown Hunter",
    avatar_url: user.avatar_url || null,
  };
}

export async function generateMetadata({ searchParams }) {
  const { a, b } = await searchParams;

  if (!a || !b) {
    return {
      title: "Compare Hunters",
      description: "Compare two hunters across crowns, collection progress, and wishlist overlap.",
    };
  }

  const data = await getCompareData(a, b);
  if (!data) {
    return {
      title: "Compare Hunters",
      description: "Compare two hunters across crowns, collection progress, and wishlist overlap.",
    };
  }

  const overlapCount = data.both?.length || 0;
  const totalTracked = overlapCount + (data.onlyA?.length || 0) + (data.onlyB?.length || 0);
  const overlapRate = totalTracked > 0 ? Math.round((overlapCount / totalTracked) * 100) : 0;

  return {
    title: `${data.userA.username} vs ${data.userB.username} | Hunter Compare`,
    description: `${overlapCount} shared targets • ${data.sharedOwnedCount} shared crown species • ${overlapRate}% match`,
  };
}

function CrownIcons({ type }) {
  return (
    <span className={styles.crownIcons}>
      {(type === "small" || type === "both") && (
        <Image src="/icons/smallcrown.png" width={12} height={12} alt="S" className="pixel-art" />
      )}
      {(type === "large" || type === "both") && (
        <Image src="/icons/largecrown.png" width={12} height={12} alt="L" className="pixel-art" />
      )}
    </span>
  );
}

function WishlistColumn({ title, items, emptyText }) {
  return (
    <div className={styles.column}>
      <div className={styles.sectionTitle}>
        {title}
        <span className={styles.count}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className={styles.emptyMessage}>{emptyText}</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.monster_id} className={styles.item}>
              <Image
                src={`/monsters/${item.image_name}`}
                alt={item.monster_name}
                width={28}
                height={28}
                className="pixel-art"
              />
              <span className={styles.monsterName}>{item.monster_name}</span>
              <CrownIcons type={item.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ComparePage({ searchParams }) {
  const { a, b } = await searchParams;
  const data = a && b ? await getCompareData(a, b) : null;
  const initialA = toPlainUser(data?.userA, a ? { id: a, username: "Hunter A" } : null);
  const initialB = toPlainUser(data?.userB, b ? { id: b, username: "Hunter B" } : null);
  const overlapCount = data?.both?.length || 0;
  const onlyACount = data?.onlyA?.length || 0;
  const onlyBCount = data?.onlyB?.length || 0;
  const totalTracked = overlapCount + onlyACount + onlyBCount;
  const overlapRate = totalTracked > 0 ? Math.round((overlapCount / totalTracked) * 100) : 0;
  const rankA = data ? getRankProgress(Number(data.profileA?.masteryPoints || 0)).currentRank?.title : null;
  const rankB = data ? getRankProgress(Number(data.profileB?.masteryPoints || 0)).currentRank?.title : null;

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <div className={styles.pageHeader}>
          <div className={styles.heroShell}>
            <div className={styles.heroPanel}>
              <div className={styles.titleGroup}>
                <h1>Compare Wishlists</h1>
                <span className={styles.indicator}>📊 Wishlist Tools</span>
              </div>
              <p className={styles.description}>
                Find which crowns two hunters share, and where their goals diverge.
              </p>
            </div>
            {data && (
              <div className={styles.snapshotCard}>
                <div className={styles.snapshotHeader}>
                  <span>📈 Match Summary</span>
                </div>
                <div className={styles.snapshotGrid}>
                  <div className={styles.snapshotStat}>
                    <span>Shared Targets</span>
                    <strong>{overlapCount}</strong>
                  </div>
                  <div className={styles.snapshotStat}>
                    <span>Match Rate</span>
                    <strong>{overlapRate}%</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className={styles.controlDock}>
          <div className={styles.controlTitle}>Hunter Pairing Console</div>
          <CompareForm initialA={initialA} initialB={initialB} />
        </section>

        {data && (
          <>
            <section className={styles.summaryBoard}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Shared Targets</span>
                <span className={styles.metricValue}>{overlapCount}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>{data.userA.username}'s Wishlist</span>
                <span className={styles.metricValue}>{onlyACount}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>{data.userB.username}'s Wishlist</span>
                <span className={styles.metricValue}>{onlyBCount}</span>
              </div>
              <div className={styles.metricCard + " " + styles.metricCardEmphasis}>
                <span className={styles.metricLabel}>Shared Match</span>
                <span className={styles.metricValue}>{overlapRate}%</span>
              </div>
            </section>

            <section className={styles.accountCompareGrid}>
              <article className={styles.accountPanel}>
                <header className={styles.accountHeader}>
                  <img
                    src={data.userA.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                    alt=""
                    className={styles.accountAvatar}
                  />
                  <div>
                    <h3 className={styles.accountName}>{data.userA.username}</h3>
                    <p className={styles.accountRank}>{rankA || "Fledgling"}</p>
                  </div>
                </header>
                <div className={styles.accountStats}>
                  <div className={styles.statRow}><span>Total Crowns</span><strong>{data.profileA?.stats?.total || 0}</strong></div>
                  <div className={styles.statRow}><span>Mastery Points</span><strong>{data.profileA?.masteryPoints || 0}</strong></div>
                  <div className={styles.statRow}><span>Collection Completion</span><strong>{data.profileA?.completion || 0}%</strong></div>
                  <div className={styles.statRow}><span>Small Crowns</span><strong>{data.profileA?.stats?.small || 0}</strong></div>
                  <div className={styles.statRow}><span>Large Crowns</span><strong>{data.profileA?.stats?.large || 0}</strong></div>
                  <div className={styles.statRow}><span>Tempered Crowns</span><strong>{data.profileA?.stats?.tempered || 0}</strong></div>
                </div>
              </article>

              <article className={styles.accountPanel}>
                <header className={styles.accountHeader}>
                  <img
                    src={data.userB.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                    alt=""
                    className={styles.accountAvatar}
                  />
                  <div>
                    <h3 className={styles.accountName}>{data.userB.username}</h3>
                    <p className={styles.accountRank}>{rankB || "Fledgling"}</p>
                  </div>
                </header>
                <div className={styles.accountStats}>
                  <div className={styles.statRow}><span>Total Crowns</span><strong>{data.profileB?.stats?.total || 0}</strong></div>
                  <div className={styles.statRow}><span>Mastery Points</span><strong>{data.profileB?.masteryPoints || 0}</strong></div>
                  <div className={styles.statRow}><span>Collection Completion</span><strong>{data.profileB?.completion || 0}%</strong></div>
                  <div className={styles.statRow}><span>Small Crowns</span><strong>{data.profileB?.stats?.small || 0}</strong></div>
                  <div className={styles.statRow}><span>Large Crowns</span><strong>{data.profileB?.stats?.large || 0}</strong></div>
                  <div className={styles.statRow}><span>Tempered Crowns</span><strong>{data.profileB?.stats?.tempered || 0}</strong></div>
                </div>
              </article>
            </section>

            <section className={styles.summaryBoard}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Shared Crown Species</span>
                <span className={styles.metricValue}>{data.sharedOwnedCount}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Unique Species {data.userA.username}</span>
                <span className={styles.metricValue}>{data.onlyOwnedA}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Unique Species {data.userB.username}</span>
                <span className={styles.metricValue}>{data.onlyOwnedB}</span>
              </div>
              <div className={styles.metricCard + " " + styles.metricCardEmphasis}>
                <span className={styles.metricLabel}>Combined Species</span>
                <span className={styles.metricValue}>{data.sharedOwnedCount + data.onlyOwnedA + data.onlyOwnedB}</span>
              </div>
            </section>

            <div className={styles.sharedSection}>
              <div className={styles.sharedTitle}>
                Shared Hunt Board
                <span className={styles.count}>{data.both.length}</span>
              </div>
              {data.both.length > 0 ? (
                <div className={styles.list}>
                  {data.both.map((item) => (
                    <div key={item.monster_id} className={styles.item}>
                      <Image
                        src={`/monsters/${item.image_name}`}
                        alt={item.monster_name}
                        width={30}
                        height={30}
                        className="pixel-art"
                      />
                      <span className={styles.monsterName}>{item.monster_name}</span>
                      <CrownIcons type={item.type} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyMessage}>No overlap yet. Try comparing another pair to find matching hunts.</p>
              )}
            </div>

            <div className={styles.columns}>
              <WishlistColumn
                title={`${data.userA.username}'s Wishlist`}
                items={data.onlyA}
                emptyText="Nothing exclusive to this hunter."
              />
              <WishlistColumn
                title={`${data.userB.username}'s Wishlist`}
                items={data.onlyB}
                emptyText="Nothing exclusive to this hunter."
              />
            </div>
          </>
        )}

        {a && b && !data && (
          <div className={styles.errorState}>Could not load comparison. Try selecting both hunters again.</div>
        )}
      </div>
    </main>
  );
}
