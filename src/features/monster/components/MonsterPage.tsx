import Link from "next/link";
import { notFound } from "next/navigation";
import { getMonsterPageData } from "@/server/services/monster-page";
import { CrownHighlighter, Icon, LiveRefresh } from "@/shared/ui";
import { buildHostSections, pairGroups } from "../lib/host-sections";
import { buildPageHref, firstParam, parsePageParam, type SearchParams } from "../lib/pagination";
import { HostsPanel } from "./HostsPanel";
import { MonsterHeader } from "./MonsterHeader";
import { Segment } from "./PageNav";
import { SeekingPanel } from "./SeekingPanel";
import { SidePanels } from "./SidePanels";

interface MonsterPageProps {
  name: string;
  search: SearchParams;
  viewerId: string | null;
}

function BackLink() {
  return (
    <Link className="back" href="/investigation">
      <Icon name="back" /> Monsters
    </Link>
  );
}

export async function MonsterPage({ name, search, viewerId }: MonsterPageProps) {
  const data = await getMonsterPageData(name, viewerId);

  if (data.status === "missing") notFound();
  if (data.status === "error") {
    return (
      <div className="wrap">
        <BackLink />
        <div className="m2empty">
          <b>Couldn&apos;t load this monster</b>
          <span>
            The database can&apos;t be reached right now. Check your connection and try again.
          </span>
          <Link
            className="btn sm"
            style={{ marginTop: 14 }}
            href={`/monster/${encodeURIComponent(name)}`}
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  const { monster, crowns, wishlist, userWishlistType } = data;
  const activeTab = firstParam(search.tab) || "hosts";
  const crownType = firstParam(search.crownType) || "all";

  let highlightId = firstParam(search.crownId);
  const hostUser = firstParam(search.user);
  if (!highlightId && hostUser) {
    const match = crowns.find((crown) => String(crown.user_id) === hostUser);
    if (match) highlightId = String(match.id);
  }

  const { sections, pairCount, largeCount, smallCount } = buildHostSections(
    crowns,
    {
      pairs: parsePageParam(search.pairsPage),
      large: parsePageParam(search.largePage),
      small: parsePageParam(search.smallPage),
    },
    highlightId,
  );
  const tempered = crowns.filter((crown) => crown.tempered).length;
  const info = monster.info;
  const isHosts = activeTab === "hosts";

  return (
    <div className="wrap">
      <LiveRefresh />
      {highlightId && <CrownHighlighter crownId={highlightId} />}
      <BackLink />

      <MonsterHeader
        monster={monster}
        info={info}
        signedIn={!!viewerId}
        wishlistType={userWishlistType}
        stats={[
          { label: "Logged Crowns", value: crowns.length },
          { label: "Pair Posts", value: pairGroups(crowns).length },
          { label: "Tempered Logs", value: tempered, alert: tempered > 0 },
          { label: "Hunters Seeking", value: wishlist.length },
        ]}
      />

      <section className="mbody">
        <div className="pp">
          <div className="sec-h" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <span className="eyebrow">Host coverage</span>
              <h2 style={{ marginTop: 6 }}>{isHosts ? "Crown hosts" : "Hunters seeking"}</h2>
            </div>
            <div className="seg lk" role="group">
              <Segment
                label="Hosts"
                href={buildPageHref(search, { tab: "hosts" })}
                active={isHosts}
              />
              <Segment
                label="Seeking"
                href={buildPageHref(search, { tab: "seeking" })}
                active={!isHosts}
              />
            </div>
          </div>
          <p className="sub">
            {isHosts
              ? "Hunters who have this crown and are hosting it. Contact them to join a quest."
              : "Hunters still chasing this monster. Track it yourself to appear here and let hosts find you."}
          </p>
          {isHosts ? (
            <HostsPanel
              sections={sections}
              search={search}
              crownType={crownType}
              hasPairs={pairCount > 0}
              monsterName={monster.name}
              highlightId={highlightId}
              viewerId={viewerId}
            />
          ) : (
            <SeekingPanel
              wishlist={wishlist}
              page={parsePageParam(search.seekingPage)}
              search={search}
            />
          )}
        </div>
        <SidePanels
          weakness={monster.extraInfo?.weakness}
          elements={monster.extraInfo?.elements}
          ailments={monster.extraInfo?.ailments}
          breakdown={[
            ["Large", largeCount],
            ["Small", smallCount],
            ["Pairs", pairCount],
            ["Tempered", tempered],
          ]}
        />
      </section>
    </div>
  );
}
