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
    const [huntersRes, crownsCountRes, wantedRes, recentRes, renownRes] = await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM users"),
      db.execute("SELECT COUNT(*) as count FROM crowns"),
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
    ]);

    return {
      stats: { hunters: huntersRes.rows[0]?.count || 0, crowns: crownsCountRes.rows[0]?.count || 0 },
      wanted: wantedRes.rows || [],
      recent: recentRes.rows || [],
      topRenown: renownRes.rows || []
    };
  } catch (e) {
    console.error(e);
    return { stats: { hunters: 0, crowns: 0 }, wanted: [], recent: [], topRenown: [] };
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

export default async function Home() {
  const { stats, wanted, recent, topRenown } = await getHomeData();
  const discordBotInviteUrl = getDiscordBotInviteUrl();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      
      
      <section className="mb-8 overflow-hidden rounded-3xl border border-white/5 bg-void-panel">
        <div className="border-b border-white/5 bg-gradient-to-r from-ember/10 via-transparent to-transparent px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-ember-dim">
                <Image src="/icons/MHWilds-Camp_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                Guild Hub
              </span>
              <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-mist sm:text-4xl">Crown Guild</h1>
              <p className="mt-3 font-body text-sm leading-relaxed text-mist-dim">
                Track your crown collection and see what the community is chasing right now.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:min-w-[16rem]">
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-ember-bright">{stats.hunters}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Hunters</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-ember-bright">{stats.crowns}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Crowns</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/registry" className="rounded-lg bg-ember px-5 py-2.5 font-display text-xs uppercase tracking-widest text-void transition-colors hover:bg-ember-bright">View Crowns</Link>
            <Link href="/investigation" className="rounded-lg border border-white/10 px-5 py-2.5 font-display text-xs uppercase tracking-widest text-mist transition-colors hover:border-ember/40 hover:text-ember-bright">Browse Monsters</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://discord.gg/mhwilds" target="_blank" rel="noopener noreferrer" className="font-body text-xs text-mist-dim underline decoration-white/20 underline-offset-4 hover:text-ember">Join Discord</a>
            {discordBotInviteUrl && (
              <a href={discordBotInviteUrl} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-mist-dim underline decoration-white/20 underline-offset-4 hover:text-ember">Invite Bot</a>
            )}
          </div>
        </div>
      </section>

      
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-void-panel p-5 lg:col-span-2">
          <PanelHeader
            title="Community Demand"
            tooltip="Monsters most requested by the community on their wishlists. Hunters are actively seeking these crowns."
          />
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {wanted.map((m, i) => {
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
                  trailing={<span className="font-display text-xs text-mist-faint">#{i + 1}</span>}
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

        <div className="rounded-2xl border border-white/5 bg-void-panel p-5 lg:col-span-3">
          <PanelHeader title="Guild Legends" tooltip="The top crown hunters in the community, ranked by total crowns contributed to the registry." />
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-5">
            {topRenown.map((u, i) => (
              <RankRow
                key={u.id}
                href={`/profile/${u.id}`}
                icon={u.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                iconClass="rounded-full object-cover"
                title={u.username}
                meta={`${u.crown_count} crowns`}
                trailing={<span className="font-display text-xs text-mist-faint">#{i + 1}</span>}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
