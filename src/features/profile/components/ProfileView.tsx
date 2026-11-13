"use client";

import { useEffect, useState } from "react";
import type { RankView } from "@/config/mastery";
import { formatWishlistShare } from "@/features/crowns";
import type { MonsterOption } from "@/shared/hooks/useMonsterOptions";
import { copyText } from "@/shared/lib/clipboard";
import { useToast } from "@/shared/providers";
import type { ProfileCrown } from "@/server/services/profile";
import { useCrownSelection } from "../hooks/useCrownSelection";
import { useListing } from "../hooks/useListing";
import { useSettings } from "../settings/SettingsProvider";
import { CrownsTab } from "./CrownsTab";
import { ProfileHero } from "./ProfileHero";
import { ProfileSidebar } from "./ProfileSidebar";
import { SizesTab } from "./SizesTab";

type Tab = "Crowns" | "Collected" | "Wishlist";

interface ListingEntry {
  monster_id: number;
  type: string;
}

export interface ProfileViewProps {
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    status_message: string;
    lobby_id: string;
    quest_password: string;
  };
  crowns: ProfileCrown[];
  stats: { total: number; small: number; large: number; tempered: number };
  mp: number;
  rank: RankView;
  collection: ListingEntry[];
  wishlist: ListingEntry[];
  allMonsters: MonsterOption[];
  isOwner: boolean;
  viewerId: string | null;
  openSettings: boolean;
}

const toMap = (entries: ListingEntry[]) =>
  Object.fromEntries(entries.map((entry) => [entry.monster_id, entry.type]));

const countOf = (map: Record<number, string | null | undefined>) =>
  Object.values(map).filter(Boolean).length;

export function ProfileView(props: ProfileViewProps) {
  const { user, crowns, allMonsters, isOwner } = props;
  const toast = useToast();
  const { openSettings: showSettings } = useSettings();
  const [tab, setTab] = useState<Tab>("Crowns");
  const selection = useCrownSelection();
  const collection = useListing("/api/collection", "collection", toMap(props.collection));
  const wishlist = useListing("/api/wishlist", "wishlist", toMap(props.wishlist));

  useEffect(() => {
    if (props.openSettings && isOwner) showSettings();
  }, [props.openSettings, isOwner, showSettings]);

  const copyWishlist = async () => {
    const entries = allMonsters
      .filter((monster) => wishlist.map[monster.id])
      .map((monster) => ({
        name: monster.name,
        emoji: monster.emoji,
        type: String(wishlist.map[monster.id]),
      }));
    const copied = await copyText(formatWishlistShare(entries));
    if (copied) toast.success("Wishlist copied to your clipboard.");
    else toast.error("Could not copy your wishlist. Check clipboard permissions and try again.");
  };

  const tabs: [Tab, number][] = [
    ["Crowns", crowns.length],
    ["Collected", countOf(collection.map)],
    ["Wishlist", countOf(wishlist.map)],
  ];

  return (
    <div className="pad pf">
      <ProfileHero
        user={user}
        rank={props.rank}
        crowns={crowns}
        isOwner={isOwner}
        viewerId={props.viewerId}
        onEdit={showSettings}
      />
      <div className="pf-cols">
        <ProfileSidebar
          rank={props.rank}
          mp={props.mp}
          stats={props.stats}
          user={user}
          isOwner={isOwner}
          onEdit={showSettings}
        />
        <section className="wd pf-main">
          <div className="tabs3" role="tablist">
            {tabs.map(([name, count]) => (
              <button
                key={name}
                role="tab"
                aria-selected={tab === name}
                onClick={() => {
                  setTab(name);
                  selection.reset();
                }}
              >
                {name}
                <i>{count}</i>
              </button>
            ))}
          </div>
          <div className="pf-body">
            {tab === "Crowns" && (
              <CrownsTab
                crowns={crowns}
                monsters={allMonsters}
                isOwner={isOwner}
                profileUserId={user.id}
                selection={selection}
              />
            )}
            {tab === "Collected" && (
              <SizesTab
                monsters={allMonsters}
                map={collection.map}
                noun="collected"
                isOwner={isOwner}
                username={user.username}
                onToggle={collection.toggle}
              />
            )}
            {tab === "Wishlist" && (
              <SizesTab
                monsters={allMonsters}
                map={wishlist.map}
                noun="wishlisted"
                isOwner={isOwner}
                username={user.username}
                onToggle={wishlist.toggle}
                onCopyWishlist={copyWishlist}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
