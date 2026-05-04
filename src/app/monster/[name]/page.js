import db from "@/lib/db";
import styles from "./monster.module.css";
import Link from "next/link";
import Image from "next/image";
import MonsterIcon from "@/components/MonsterIcon";
import HunterItem from "@/components/HunterItem";
import { notFound } from "next/navigation";

import { getMonsterByName, getQuestIcon } from "@/lib/monsters";

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

    return {
      monster,
      extraInfo: monster.extraInfo,
      crowns: crownsRes.rows
    };
  } catch (e) {
    console.error("Monster fetch error", e);
    return null;
  }
}

import { getCrownById } from "@/lib/profile";

export async function generateMetadata({ params, searchParams }) {
  const { name } = await params;
  const crownId = (await searchParams)?.crownId;
  const userId = (await searchParams)?.user;
  const data = await getMonsterByName(name);

  if (!data) {
    return { title: "Monster Not Found | Crown Guild" };
  }

  let title = `${data.name} | Crown Guild`;
  let description = `View hunting records and crown information for ${data.name} in Monster Hunter Wilds.`;
  let imageUrl = `/monster/${encodeURIComponent(name)}/og`;

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

  if (featuredCrown) {
    title = `${featuredCrown.username}'s ${data.name} Crown | Crown Guild`;
    description = `${featuredCrown.username} is sharing a ${featuredCrown.type} ${data.name} crown via "${featuredCrown.quest || 'Hunt'}" with strength ${featuredCrown.strength_rating}.`;
    imageUrl += `?crownId=${featuredCrown.id}`;
  }

  return {
    title,
    description,
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
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MonsterDetail({ params, searchParams }) {
  const { name } = await params;
  const search = await searchParams;
  let highlightCrownId = search?.crownId;
  const userId = search?.user;

  const data = await getMonsterData(name);
  if (!data) notFound();

  if (!highlightCrownId && userId) {
    const userCrown = data.crowns.find(c => String(c.user_id) === String(userId));
    if (userCrown) highlightCrownId = userCrown.id;
  }

  const { monster, extraInfo, crowns } = data;

  // Group complete S&L pairs by pair_id
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
          <div className={styles.tactical}>
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
          </div>

          <div className={styles.records}>
            {pairedGroups.length > 0 && (
              <section className={styles.crownSection} style={{ marginBottom: '40px' }}>
                <div className={styles.sectionTitle}>
                  <Image src="/icons/largecrown.png" width={20} height={20} alt="" className="pixel-art" />
                  <Image src="/icons/smallcrown.png" width={16} height={16} alt="" className="pixel-art" style={{ marginLeft: -8 }} />
                  <h2 className="mh-title">S&amp;L Pair Records</h2>
                </div>
                <div className={styles.hunterList}>
                  {pairedGroups.map((group) => {
                    const smallC = group.find(c => c.type === 'small');
                    const largeC = group.find(c => c.type === 'large');
                    const isHl = group.some(c => String(c.id) === String(highlightCrownId));
                    return (
                      <HunterItem
                        key={smallC.id}
                        crown={smallC}
                        linkedCrown={largeC}
                        monsterName={monster.name}
                        isHighlighted={isHl}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            <section className={styles.crownSection} style={{ marginBottom: '40px' }}>
              <div className={styles.sectionTitle}>
                <Image src="/icons/largecrown.png" width={24} height={24} alt="" className="pixel-art" />
                <h2 className="mh-title">Large Crown Records</h2>
              </div>
              <div className={styles.hunterList}>
                {largeCrowns.length > 0 ? largeCrowns.map((c, i) => (
                  <HunterItem key={i} crown={c} monsterName={monster.name} isHighlighted={String(c.id) === String(highlightCrownId)} />
                )) : (
                  <p className={styles.empty}>No large crowns recorded for this specimen.</p>
                )}
              </div>
            </section>

            <section className={styles.crownSection}>
              <div className={styles.sectionTitle}>
                <Image src="/icons/smallcrown.png" width={24} height={24} alt="" className="pixel-art" />
                <h2 className="mh-title">Small Crown Records</h2>
              </div>
              <div className={styles.hunterList}>
                {smallCrowns.length > 0 ? smallCrowns.map((c, i) => (
                  <HunterItem key={i} crown={c} monsterName={monster.name} isHighlighted={String(c.id) === String(highlightCrownId)} />
                )) : (
                  <p className={styles.empty}>No small crowns recorded for this specimen.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
