import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import InfoTrigger from "@/components/ui/InfoTrigger";
import UserAvatar from "@/components/ui/UserAvatar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guild Hub | Crown Guild",
  description: "The central command for Monster Hunter Wilds crown hunting.",
};

function getDiscordBotInviteUrl() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({ client_id: clientId, scope: "bot applications.commands", permissions: "0" });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

async function getHomeData() {
  try {
    const [
      huntersRes, crownsCountRes, wantedRes, recentRes, renownRes,
      temperedRes, investigationsRes, whiteWhaleRes, rarestRes,
    ] = await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM users"),
      db.execute(`
        SELECT COUNT(*) as count,
          SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) as small,
          SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) as large
        FROM crowns
      `),
      db.execute(`
        SELECT m.id, m.name, m.image_name, m.emoji, COUNT(w.id) as demand
        FROM monsters m
        JOIN wishlist w ON m.id = w.monster_id
        GROUP BY m.id
        ORDER BY demand DESC
        LIMIT 10
      `),
      db.execute(`
        SELECT c.id, c.type, c.strength_rating, m.name as monster_name, m.image_name, u.username, u.id as user_id
        FROM crowns c
        JOIN monsters m ON c.monster_id = m.id
        JOIN users u ON c.user_id = u.id
        ORDER BY c.id DESC
        LIMIT 5
      `),
      db.execute(`
        SELECT u.id, u.username, u.avatar_url, COUNT(c.id) as crown_count
        FROM users u
        JOIN crowns c ON c.user_id = u.id
        GROUP BY u.id
        ORDER BY crown_count DESC
        LIMIT 5
      `),
      db.execute("SELECT COUNT(*) as count FROM crowns WHERE tempered = 1"),
      db.execute("SELECT COUNT(*) as count FROM investigations"),
      db.execute(`
        SELECT m.id, m.name, m.image_name, COUNT(w.id) as demand
        FROM monsters m
        JOIN wishlist w ON m.id = w.monster_id
        LEFT JOIN crowns c ON c.monster_id = m.id
        WHERE c.id IS NULL
        GROUP BY m.id
        ORDER BY demand DESC
        LIMIT 5
      `),
      db.execute(`
        SELECT m.id, m.name, m.image_name, COUNT(c.id) as crown_count
        FROM monsters m
        JOIN crowns c ON c.monster_id = m.id
        GROUP BY m.id
        ORDER BY crown_count ASC, m.name ASC
        LIMIT 5
      `),
    ]);

    const crowns = crownsCountRes.rows[0] || {};

    return {
      stats: {
        hunters: huntersRes.rows[0]?.count || 0,
        crowns: crowns.count || 0,
        small: crowns.small || 0,
        large: crowns.large || 0,
        tempered: temperedRes.rows[0]?.count || 0,
        investigations: investigationsRes.rows[0]?.count || 0,
      },
      wanted: wantedRes.rows || [],
      recent: recentRes.rows || [],
      topRenown: renownRes.rows || [],
      whiteWhale: whiteWhaleRes.rows || [],
      rarest: rarestRes.rows || [],
    };
  } catch (e) {
    console.error(e);
    return { stats: { hunters: 0, crowns: 0, small: 0, large: 0, tempered: 0, investigations: 0 }, wanted: [], recent: [], topRenown: [], whiteWhale: [], rarest: [] };
  }
}

function RankRow({ href, icon, iconClass = "pixel-art", title, meta, trailing, className = "" }) {
  const isAvatar = iconClass.includes("rounded-full");

  return (
    <Link href={href} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-void">
        {isAvatar ? (
          <UserAvatar src={icon} alt={title} size={40} className={`h-10 w-10 shrink-0 ${iconClass}`} fallbackClassName={iconClass} />
        ) : (
          <Image src={icon} width={28} height={28} alt="" unoptimized className={iconClass} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium text-mist group-hover:text-ember-bright">{title}</p>
        <p className="truncate font-body text-xs text-mist-dim">{meta}</p>
      </div>
      {trailing}
    </Link>
  );
}

function StatChip({ value, label }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-full border border-white/5 bg-void px-3.5 py-2">
      <span className="font-display text-sm text-ember-bright">{value}</span>
      <span className="font-body text-[9px] uppercase tracking-[0.2em] text-mist-dim">{label}</span>
    </div>
  );
}

const PODIUM_STYLES = [
  { badge: "bg-ember/20 border-ember/40 text-ember-bright", order: "lg:order-2", ring: "border-ember/40" },
  { badge: "bg-mist/10 border-mist/30 text-mist", order: "lg:order-1", ring: "border-white/10" },
  { badge: "bg-blood/20 border-blood/40 text-blood-bright", order: "lg:order-3", ring: "border-blood/30" },
];

function PodiumCard({ user, place }) {
  const style = PODIUM_STYLES[place - 1];
  return (
    <Link
      href={`/profile/${user.id}`}
      className={`group flex flex-1 flex-col items-center gap-2 rounded-2xl border ${style.ring} bg-void px-4 py-5 text-center transition-colors hover:bg-white/5 ${style.order}`}
    >
      <span className={`rounded-full border px-2.5 py-0.5 font-display text-[10px] uppercase tracking-widest ${style.badge}`}>#{place}</span>
      <UserAvatar src={user.avatar_url} alt={user.username} size={56} className="h-14 w-14 rounded-full object-cover" fallbackClassName="rounded-full" />
      <p className="truncate max-w-full font-body text-sm font-medium text-mist group-hover:text-ember-bright">{user.username}</p>
      <p className="font-display text-lg text-ember-bright">{user.crown_count}</p>
      <p className="-mt-1 font-body text-[9px] uppercase tracking-[0.2em] text-mist-dim">crowns</p>
    </Link>
  );
}

function PanelHeader({ title, tooltip, action }) {
  return (
    <div className="mb-1 flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-sm uppercase tracking-[0.15em] text-mist">{title}</h2>
        {tooltip && <InfoTrigger title={title} content={tooltip} align="left" />}
      </div>
      {action}
    </div>
  );
}

const HYPE_LINES = [
  (n) => `${n} hunters have this circled in red on their whiteboard.`,
  (n) => `${n} hunters would skip a raid night for this crown.`,
  (n) => `${n} hunters are one cart away from rage-quitting over this thing.`,
];

export default async function Home() {
  const { stats, wanted, recent, topRenown, whiteWhale, rarest } = await getHomeData();
  const temperedRate = stats.crowns ? Math.round((stats.tempered / stats.crowns) * 100) : 0;
  const discordBotInviteUrl = getDiscordBotInviteUrl();
  const spotlight = wanted[0];
  const hypeLine = spotlight ? HYPE_LINES[spotlight.id % HYPE_LINES.length](spotlight.demand) : null;
  const [gold, silver, bronze, ...legendsRest] = topRenown;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">

      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/5 bg-void-panel p-6 lg:col-span-3 lg:p-7">
          <div>
            <span className="inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-ember-dim">
              <Image src="/icons/MHWilds-Camp_Icon.png" width={16} height={16} alt="" className="pixel-art" />
              Guild Hub
            </span>
            <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-mist sm:text-4xl">Crown Guild</h1>
            <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-mist-dim">
              Best place to log and register your current Crown quests for everyone to see.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatChip value={stats.hunters} label="Hunters" />
            <StatChip value={stats.crowns} label="Crowns" />
            <StatChip value={`${temperedRate}%`} label="Tempered" />
            <StatChip value={stats.investigations} label="Investigations" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/registry" className="rounded-lg bg-ember px-5 py-2.5 font-display text-xs uppercase tracking-widest text-void transition-colors hover:bg-ember-bright">View Crowns</Link>
            <Link href="/investigation" className="rounded-lg border border-white/10 px-5 py-2.5 font-display text-xs uppercase tracking-widest text-mist transition-colors hover:border-ember/40 hover:text-ember-bright">Browse Monsters</Link>
            <a href="https://discord.gg/mhwilds" target="_blank" rel="noopener noreferrer" className="font-body text-xs text-mist-dim underline decoration-white/20 underline-offset-4 hover:text-ember">Join Discord</a>
            {discordBotInviteUrl && (
              <a href={discordBotInviteUrl} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-mist-dim underline decoration-white/20 underline-offset-4 hover:text-ember">Invite Bot</a>
            )}
          </div>
        </div>

        {spotlight && (
          <Link
            href={`/monster/${spotlight.name}?tab=seeking`}
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-ember/20 bg-void p-6 lg:col-span-2"
          >
            <Image
              src={`/monsters/${spotlight.image_name}`}
              alt=""
              fill
              unoptimized
              className="pixel-art object-contain object-center p-6 opacity-90 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
            <div className="relative">
              <span className="inline-flex rounded-full border border-ember/40 bg-ember/20 px-2.5 py-0.5 font-display text-[10px] uppercase tracking-widest text-ember-bright">Most Wanted</span>
              <h2 className="mt-2 font-display text-2xl uppercase tracking-wide text-mist">{spotlight.name}</h2>
              <p className="mt-1 font-body text-xs text-mist-dim">{hypeLine}</p>
            </div>
          </Link>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-void-panel p-5 lg:col-span-2">
          <PanelHeader
            title="Community Demand"
            tooltip="Monsters most requested by the community on their wishlists. Hunters are actively seeking these crowns."
          />
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {wanted.slice(1).map((m, i) => {
              const visClass =
                i < 4 ? "" :
                i < 6 ? "hidden sm:flex" :
                i < 8 ? "hidden lg:flex" :
                "hidden xl:flex";
              return (
                <RankRow
                  key={m.id}
                  href={`/monster/${m.name}?tab=seeking`}
                  icon={`/monsters/${m.image_name}`}
                  title={m.name}
                  meta={`${m.demand} hunters seeking`}
                  trailing={<span className="font-display text-xs text-mist-faint">#{i + 2}</span>}
                  className={visClass}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-void-panel p-5">
          <PanelHeader title="Latest Crowns" />
          <div className="mt-2 flex flex-col gap-1">
            {recent.map((c) => (
              <RankRow
                key={c.id}
                href={`/monster/${c.monster_name}?crownId=${c.id}&user=${c.user_id}`}
                icon={`/monsters/${c.image_name}`}
                title={c.monster_name}
                meta={`Secured by ${c.username}`}
                trailing={
                  <Image src={c.type === "small" ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={16} height={16} alt="" className="pixel-art" />
                }
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-void-panel p-5 lg:col-span-2">
          <PanelHeader title="Guild Legends" tooltip="The top crown hunters in the community, ranked by total crowns contributed to the registry." />
          {gold ? (
            <>
              <div className="mt-3 flex flex-col gap-2 lg:flex-row">
                {gold && <PodiumCard user={gold} place={1} />}
                {silver && <PodiumCard user={silver} place={2} />}
                {bronze && <PodiumCard user={bronze} place={3} />}
              </div>
              {legendsRest.length > 0 && (
                <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {legendsRest.map((u, i) => (
                    <RankRow
                      key={u.id}
                      href={`/profile/${u.id}`}
                      icon={u.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                      iconClass="rounded-full object-cover"
                      title={u.username}
                      meta={`${u.crown_count} crowns`}
                      trailing={<span className="font-display text-xs text-mist-faint">#{i + 4}</span>}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="px-1 py-2.5 font-body text-xs text-mist-dim">No crowns logged yet. Someone has to be first.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-void-panel p-5">
          <PanelHeader
            title="Guild Oddities"
            tooltip="The white whale: most wanted, least caught. The rarest finds: fewest crowns claimed guild-wide."
          />
          <div className="mt-2 flex flex-col gap-1">
            {whiteWhale.length > 0 ? (
              <RankRow
                key={whiteWhale[0].id}
                href={`/monster/${whiteWhale[0].name}?tab=seeking`}
                icon={`/monsters/${whiteWhale[0].image_name}`}
                title={`🐋 ${whiteWhale[0].name}`}
                meta={`${whiteWhale[0].demand} wanting, 0 caught`}
              />
            ) : (
              <p className="px-3 py-2 font-body text-xs text-mist-dim">Every wanted monster has been crowned. Impressive.</p>
            )}
            {rarest.slice(0, 3).map((m) => (
              <RankRow
                key={m.id}
                href={`/monster/${m.name}`}
                icon={`/monsters/${m.image_name}`}
                title={m.name}
                meta={`${m.crown_count} crown${m.crown_count === 1 ? "" : "s"} claimed guild-wide`}
                trailing={<span className="font-display text-xs text-mist-faint">rare</span>}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
