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

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home | Crown Guild",
  description: "The central command for Monster Hunter Wilds crown hunting.",
};

async function getHomeData() {
  try {
    const [huntersRes, crownsRes, wantedRes, recentRes, renownRes, temperedRes, investigationsRes, rarestRes] = await Promise.all([
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
    ]);

    const top = wantedRes.rows[0];
    const legendIds = renownRes.rows.map((r) => r.id);
    const marks = legendIds.map(() => "?").join(",");
    await ensureGuildArchiveTempered();
    const [seekersRes, legendArch, tierMap] = await Promise.all([
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
    ]);

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
      seekers: seekersRes.rows.map((u) => ({ name: u.username || "Hunter", avatar: u.avatar_url || null })),
    };
  } catch (e) {
    console.error(e);
    return { stats: { hunters: 0, crowns: 0, temperedRate: 0, investigations: 0 }, demand: [], latest: [], legends: [], rarest: [], seekers: [] };
  }
}

function GuildCard({ profile, summary, monsterCount }) {
  const { stats, collection } = profile;
  const nextRank = summary.rank < 8 ? summary.rank + 1 : null;
  const shelf = collection.slice(0, 8);
  return (
    <div className="wd s12 gc3 gc4">
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
        <span className="g4c"><b>{collection.length}</b>/{monsterCount} collected</span>
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
    </div>
  );
}

export default async function Home() {
  const [session, data] = await Promise.all([auth(), getHomeData()]);
  const userId = session?.user?.id || null;
  const [summary, profile] = userId ? await Promise.all([getUserSummary(userId), getProfileData(userId)]) : [null, null];
  const monsterCount = getMonsterCount() || 1;
  const spotlight = data.demand[0];
  const name = session?.user?.name;

  return (
    <div className="pad">
      <div className="greet">
        <h2>{userId ? `Welcome back${name ? `, ${name}` : ""}` : "Welcome to the guild"}</h2>
        <p>Here is what is happening across the guild.</p>
      </div>

      <div className="bento">
        {userId && profile && summary ? (
          <GuildCard profile={profile} summary={summary} monsterCount={monsterCount} />
        ) : (
          <div className="wd s12 gc-out">
            <div className="gco-badge"><Emblem rank={1} /></div>
            <div className="gco-body">
              <span className="eyebrow">Your Guild Card</span>
              <h3>Sign in to start</h3>
              <p className="gco-desc">Log crowns, collect monsters and climb from Fledgling to Legend.</p>
            </div>
            <div className="gco-ranks" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="gco-rank"><Emblem rank={i + 1} /></div>
              ))}
            </div>
            <div className="gco-actions">
              <a className="btn ln" href="https://discord.gg/mhwilds" target="_blank" rel="noopener noreferrer">Join Discord</a>
              <SignInButton />
            </div>
          </div>
        )}

        {spotlight && (
          <div className="s12 wanted3">
            <div className="w3a"><Image src={`/monsters/${spotlight.image}`} alt="" width={92} height={92} unoptimized className="px" /></div>
            <div className="w3t">
              <span className="tag">Most wanted</span>
              <h4>{spotlight.name}</h4>
              <div className="w3h">
                {data.seekers.map((s, i) => (
                  <UserAvatar key={i} src={s.avatar} alt={s.name} size={26} className="h5a" />
                ))}
                <p><b>{spotlight.demand}</b> hunters seeking</p>
              </div>
            </div>
            <div className="w3s">
              <div><b>{data.stats.hunters}</b><span>Hunters</span></div>
              <div><b>{data.stats.crowns}</b><span>Crowns</span></div>
              <div><b>{data.stats.temperedRate}<i>%</i></b><span>Tempered</span></div>
              <div><b>{data.stats.investigations}</b><span>Investigations</span></div>
            </div>
            <div className="w3c">
              <WantedActions monster={{ id: spotlight.id, name: spotlight.name }} signedIn={!!userId} tracked={profile?.wishlist.find((w) => String(w.monster_id) === String(spotlight.id))?.type} />
            </div>
          </div>
        )}

        <HomeBoard demand={data.demand.slice(0, 5)} latest={data.latest} legends={data.legends} rarest={data.rarest} tracked={profile ? Object.fromEntries(profile.wishlist.map((w) => [w.monster_id, w.type])) : null} />
      </div>
    </div>
  );
}
