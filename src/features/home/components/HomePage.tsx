import { auth } from "@/server/auth";
import { getHomeData } from "@/server/services/home";
import { getMonsterCount } from "@/server/services/monsters";
import { getProfileData } from "@/server/services/profile";
import { getShareUrl } from "@/server/services/settings";
import { getUserSummary } from "@/server/services/summary";
import { GuildCard } from "./GuildCard";
import { HomeBoard } from "./HomeBoard";
import { Roster, StatsStrip } from "./HomeSections";
import { SignedOutCard } from "./SignedOutCard";
import { WantedSpotlight } from "./WantedSpotlight";

export async function HomePage() {
  const [session, data] = await Promise.all([auth(), getHomeData()]);
  const userId = session?.user?.id ?? null;
  const [summary, profile, shareUrl] = userId
    ? await Promise.all([getUserSummary(userId), getProfileData(userId), getShareUrl(userId)])
    : [null, null, false];

  const spotlight = data.demand[0];
  const cardClass = spotlight ? "s5" : "s12";
  const name = session?.user?.name;
  const tracked = profile
    ? Object.fromEntries(profile.wishlist.map((w) => [w.monster_id, w.type]))
    : null;

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
          <WantedSpotlight
            spotlight={spotlight}
            meta={data.spotlightMeta}
            seekers={data.seekers}
            signedIn={!!userId}
            tracked={tracked?.[spotlight.id]}
          />
        )}

        {profile && summary ? (
          <GuildCard
            profile={profile}
            summary={summary}
            monsterCount={getMonsterCount() || 1}
            shareUrl={shareUrl}
            className={cardClass}
          />
        ) : (
          <SignedOutCard className={cardClass} />
        )}

        <StatsStrip stats={data.stats} />
        <HomeBoard
          demand={data.demand.slice(0, 5)}
          latest={data.latest}
          legends={data.legends}
          rarest={data.rarest}
          tracked={tracked}
        />
        <Roster roster={data.roster} />
      </div>
    </div>
  );
}
