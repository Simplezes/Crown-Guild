import db, { ensureGuildArchiveTempered } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getProfileData } from "@/lib/profile";
import { getMonsterCount } from "@/lib/monsters";
import { getUserSummary, masteryFromArchive, rankView } from "@/lib/summary";
import { getMonsterTierMap } from "@/lib/monsters";
import { Emblem } from "@/components/shell/Icon";
import HomeBoard from "@/components/home/HomeBoard";
import SignInButton from "@/components/home/SignInButton";
import UserAvatar from "@/components/ui/UserAvatar";
import { WantedActions, ShelfThumb } from "@/components/home/HomeActions";
import CopyCrownsButton from "@/components/crowns/CopyCrownsButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home | Crown Guild",
  description: "The central command for Monster Hunter Wilds crown hunting.",
};

async function getHomeData() {
  try {
    const [huntersRes, crownsRes, wantedRes, recentRes, renownRes, temperedRes, investigationsRes, rarestRes, rosterRes] = await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM users"),
      db.execute("SELECT COUNT(*) as count FROM crowns"),
      db.execute(`
        SELECT m.id, m.name, m.image_name, COUNT(w.id) as demand
        FROM monsters m JOIN wishlist w ON m.id = w.monster_id
        GROUP BY m.id ORDER BY demand DESC LIMIT 6
      `),
      db.execute(`
        SELECT c.id, c.type, c.tempered, m.name as monster_name, m.image_name, u.username, u.id as user_id
        FROM crowns c
        JOIN monsters m ON c.monster_id = m.id
        JOIN users u ON c.user_id = u.id
        ORDER BY c.id DESC LIMIT 5
      `),
      db.execute(`
        SELECT u.id, u.username, u.avatar_url, COUNT(c.id) as crown_count
        FROM users u JOIN crowns c ON c.user_id = u.id
        GROUP BY u.id ORDER BY crown_count DESC LIMIT 5
      `),
      db.execute("SELECT COUNT(*) as count FROM crowns WHERE tempered = 1"),
      db.execute("SELECT COUNT(*) as count FROM investigations"),
      db.execute(`
        SELECT m.id, m.name, m.image_name, COUNT(c.id) as crown_count
        FROM monsters m JOIN crowns c ON c.monster_id = m.id
        GROUP BY m.id ORDER BY crown_count ASC, m.name ASC LIMIT 3
      `),
      db.execute("SELECT name, image_name FROM monsters ORDER BY name ASC"),
    ]);

    const top = wantedRes.rows[0];
    const legendIds = renownRes.rows.map((r) => r.id);
    const marks = legendIds.map(() => "?").join(",");
    await ensureGuildArchiveTempered();
    const [seekersRes, legendArch, tierMap, typesRes, claimedRes] = await Promise.all([
      top
        ? db.execute({
            sql: "SELECT u.username, u.avatar_url FROM wishlist w JOIN users u ON u.id = w.user_id WHERE w.monster_id = ? GROUP BY u.id LIMIT 4",
            args: [top.id],
          })
        : { rows: [] },
      legendIds.length
        ? db.execute({ sql: `SELECT user_id, monster_id, type, tempered FROM guild_archive WHERE user_id IN (${marks})`, args: legendIds })
        : { rows: [] },
      getMonsterTierMap(),
      top ? db.execute({ sql: "SELECT type, COUNT(*) as c FROM wishlist WHERE monster_id = ? GROUP BY type", args: [top.id] }) : { rows: [] },
      top ? db.execute({ sql: "SELECT COUNT(*) as c FROM crowns WHERE monster_id = ?", args: [top.id] }) : { rows: [] },
    ]);
    const want = { small: 0, large: 0 };
    for (const r of typesRes.rows) {
      const c = Number(r.c);
      if (r.type !== "large") want.small += c;
      if (r.type !== "small") want.large += c;
    }

    const crowns = Number(crownsRes.rows[0]?.count || 0);
    const tempered = Number(temperedRes.rows[0]?.count || 0);

    const legends = renownRes.rows.map((u) => {
      const rows = legendArch.rows.filter((r) => r.user_id === u.id);
      const rv = rankView(masteryFromArchive(rows, tierMap));
      return {
        id: u.id,
        name: u.username || `Hunter ${String(u.id).slice(0, 4)}`,
        avatar: u.avatar_url || null,
        crowns: Number(u.crown_count),
        rank: rv.rank,
        rankTitle: rv.title,
      };
    });

    return {
      stats: {
        hunters: Number(huntersRes.rows[0]?.count || 0),
        crowns,
        temperedRate: crowns ? Math.round((tempered / crowns) * 100) : 0,
        investigations: Number(investigationsRes.rows[0]?.count || 0),
      },
      demand: wantedRes.rows.map((m) => ({ id: m.id, name: m.name, image: m.image_name, demand: Number(m.demand) })),
      latest: recentRes.rows.map((c) => ({ id: c.id, type: c.type, tempered: !!c.tempered, monster: c.monster_name, image: c.image_name, username: c.username, user_id: c.user_id })),
      legends,
      rarest: rarestRes.rows.map((m) => ({ id: m.id, name: m.name, image: m.image_name, crowns: Number(m.crown_count) })),
      roster: rosterRes.rows.filter((m) => m.image_name).map((m) => ({ name: m.name, image: m.image_name })),
      spotlightMeta: { ...want, claimed: Number(claimedRes.rows[0]?.c || 0) },
      seekers: seekersRes.rows.map((u) => ({ name: u.username || "Hunter", avatar: u.avatar_url || null })),
      unavailable: false,
    };
  } catch (e) {
    console.error(e);
    return { stats: { hunters: 0, crowns: 0, temperedRate: 0, investigations: 0 }, demand: [], latest: [], legends: [], rarest: [], roster: [], spotlightMeta: { small: 0, large: 0, claimed: 0 }, seekers: [], unavailable: true };
  }
}


function GuildCard({ profile, summary, monsterCount, className }) {
  const { stats, collection } = profile;
  const nextRank = summary.rank < 8 ? summary.rank + 1 : null;
  const shelf = collection.slice(0, 7);
  return (
    <section className={`wd hm-gc ${className}`}>
      <div className="g4-top">
        <div className="g4e"><Emblem rank={summary.rank} /></div>
        <div className="g4w">
          <small>Your Guild Card</small>
          <h3 className="rk">{summary.title}</h3>
          <p className="g4s">
            <span><Image src="/icons/smallcrown.png" alt="" width={15} height={15} className="px" /><b>{stats.small || 0}</b> small</span>
            <span><Image src="/icons/largecrown.png" alt="" width={15} height={15} className="px" /><b>{stats.large || 0}</b> large</span>
            <span><b>{stats.tempered || 0}</b> tempered</span>
          </p>
        </div>
        <div className="g4mp"><b>{summary.mp}</b><span>MP</span></div>
      </div>
      {nextRank ? (
        <div className="g4-next">
          <div className="g4row">
            <div className="g4bar"><i style={{ width: `${summary.progress}%` }} /></div>
            <div className="g4ne" title={summary.nextTitle}><Emblem rank={nextRank} /></div>
          </div>
          <p className="g4np"><b>{summary.toNext} MP</b> to reach {summary.nextTitle}</p>
        </div>
      ) : (
        <p className="g4-max">You have reached the highest rank.</p>
      )}
      <div className="g4-shelf">
        <div className="g4-shelf-bar">
          <span className="g4c"><b>{collection.length}</b>/{monsterCount} collected</span>
          <CopyCrownsButton crowns={profile.crowns} userId={profile.user.id} />
        </div>
        <div className="g4r">
          {shelf.map((c) => (
            <ShelfThumb key={c.monster_id} name={c.monster_name} image={c.image_name} type={c.type} />
          ))}
          {monsterCount - shelf.length > 0 && (
            <Link className="g4t empty" href={`/profile/${profile.user.id}`} title="See your full collection">
              <span>+{monsterCount - shelf.length}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function SignedOutCard({ className }) {
  return (
    <section className={`wd hm-out ${className}`}>
      <div>
        <span className="eyebrow">Your Guild Card</span>
        <h3>Sign in to start</h3>
        <p>Log crowns, collect monsters and climb from Fledgling to Legend.</p>
      </div>
      <div className="hm-ranks" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={i === 0 ? "on" : ""}><Emblem rank={i + 1} /></div>
        ))}
      </div>
      <div className="hm-outacts">
        <SignInButton className="btn sm" />
        <a className="hm-ln" href="https://discord.gg/mhwilds" target="_blank" rel="noopener noreferrer">Join Discord</a>
      </div>
    </section>
  );
}

export default async function Home() {
  const [session, data] = await Promise.all([auth(), getHomeData()]);
  const userId = session?.user?.id || null;
  const [summary, profile] = userId ? await Promise.all([getUserSummary(userId), getProfileData(userId)]) : [null, null];
  const monsterCount = getMonsterCount() || 1;
  const spotlight = data.demand[0];
  const name = session?.user?.name;
  const cardCls = spotlight ? "s5" : "s12";

  return (
    <div className="pad hm">
      <div className="hm-ghost r" aria-hidden="true" />
      <div className="hm-ghost l" aria-hidden="true" />

      <div className="greet">
        <h2>{userId ? `Welcome back${name ? `, ${name}` : ""}` : "Welcome to the guild"}</h2>
        <p>Here is what is happening across the guild.</p>
      </div>

      {data.unavailable && (
        <div className="wd s12" role="status">
          <b>Guild data is temporarily unavailable.</b>
          <p>Refresh the page to try again when the database connection is restored.</p>
        </div>
      )}

      <div className="bento">
        {spotlight && (
          <section className="wd s7 hm-wanted">
            <div className="hm-tile"><Image src={`/monsters/${spotlight.image}`} alt="" width={104} height={104} unoptimized className="px" /></div>
            <div className="hm-wt">
              <span className="eyebrow"><Image src="/icons/MHWilds-Favorite_Icon.png" alt="" width={16} height={16} className="px" />Most wanted</span>
              <h3>{spotlight.name}</h3>
              <div className="hm-seek">
                <div className="hm-av">
                  {data.seekers.map((s, i) => (
                    <UserAvatar key={i} src={s.avatar} alt={s.name} size={28} className="h5a" />
                  ))}
                </div>
                <p><b>{spotlight.demand}</b> hunters seeking</p>
              </div>
              <div className="hm-split">
                {[["small", "Small crown"], ["large", "Large crown"]].map(([k, label]) => (
                  <div key={k}>
                    <span><Image src={`/icons/${k}crown.png`} alt="" width={16} height={16} className="px" />{label}</span>
                    <div className="meter"><i style={{ width: `${Math.round((data.spotlightMeta[k] / Math.max(1, data.spotlightMeta.small, data.spotlightMeta.large)) * 100)}%` }} /></div>
                    <b>{data.spotlightMeta[k]}</b>
                  </div>
                ))}
                <p>{data.spotlightMeta.claimed} claimed guild-wide</p>
              </div>
              <div className="hm-acts">
                <WantedActions monster={{ id: spotlight.id, name: spotlight.name }} signedIn={!!userId} tracked={profile?.wishlist.find((w) => String(w.monster_id) === String(spotlight.id))?.type} />
              </div>
            </div>
          </section>
        )}

        {userId && profile && summary ? (
          <GuildCard profile={profile} summary={summary} monsterCount={monsterCount} className={cardCls} />
        ) : (
          <SignedOutCard className={cardCls} />
        )}

        <section className="wd s12 hm-stats" aria-label="Guild numbers">
          <div><Image src="/icons/MHWilds-Quest_Members_Icon.png" alt="" width={30} height={30} className="px" /><span><b>{data.stats.hunters}</b>Hunters</span></div>
          <div><Image src="/icons/largecrown.png" alt="" width={30} height={30} className="px" /><span><b>{data.stats.crowns}</b>Crowns</span></div>
          <div><Image src="/icons/MHWilds-Favorite_Icon.png" alt="" width={30} height={30} className="px" /><span><b className="tp">{data.stats.temperedRate}%</b>Tempered</span></div>
          <div><Image src="/icons/MHWilds-Field_Survey_Icon.png" alt="" width={30} height={30} className="px" /><span><b>{data.stats.investigations}</b>Investigations</span></div>
        </section>

        <HomeBoard demand={data.demand.slice(0, 5)} latest={data.latest} legends={data.legends} rarest={data.rarest} tracked={profile ? Object.fromEntries(profile.wishlist.map((w) => [w.monster_id, w.type])) : null} />

        {data.roster.length > 0 && (
          <section className="wd s12 hm-roster">
            <div className="hm-sech">
              <h3><Image src="/icons/MHWilds-Quest_Menu_Icon.png" alt="" width={22} height={22} className="px" />The roster</h3>
              <Link href="/investigation">Open investigations</Link>
            </div>
            <div className="hm-rost">
              {data.roster.map((m) => (
                <Link key={m.name} href={`/monster/${encodeURIComponent(m.name)}`}>
                  <Image src={`/monsters/${m.image}`} alt="" width={32} height={32} unoptimized className="px" />
                  <span>{m.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
