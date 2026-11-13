"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useDrawer } from "@/features/monster";
import { TrackPin } from "@/features/wishlist";
import type { HomeData } from "@/server/services/home";
import { Emblem, UserAvatar } from "@/shared/ui";

const TABS = [
  ["Demand", "MHWilds-Wishlist_Pin_Icon.png"],
  ["Latest", "MHWilds-Hunt_Icon.png"],
  ["Legends", "MHWilds-Expedition_Record_Board_Icon.png"],
  ["Rarest", "MHWilds-Notes_4_Star_Icon.png"],
] as const;

type Tab = (typeof TABS)[number][0];

function MonsterTile({
  image,
  size = 40,
  small = false,
}: {
  image: string | null;
  size?: number;
  small?: boolean;
}) {
  return (
    <div className={`mi ${small ? "sm" : ""}`}>
      <Image
        src={`/monsters/${image}`}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="px"
      />
    </div>
  );
}

function Crown({ type }: { type: string }) {
  return (
    <Image
      src={type === "small" ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
      alt=""
      width={20}
      height={20}
      className="px"
    />
  );
}

interface HomeBoardProps {
  demand: HomeData["demand"];
  latest: HomeData["latest"];
  legends: HomeData["legends"];
  rarest: HomeData["rarest"];
  tracked: Record<number, string> | null;
}

export function HomeBoard({ demand, latest, legends, rarest, tracked }: HomeBoardProps) {
  const [tab, setTab] = useState<Tab>("Demand");
  const { openDrawer } = useDrawer();
  const open = (name: string) => (event: MouseEvent | KeyboardEvent) => {
    if (
      event.type === "click" ||
      ("key" in event && (event.key === "Enter" || event.key === " "))
    ) {
      event.preventDefault();
      openDrawer(name);
    }
  };
  const maxDemand = Math.max(1, ...demand.map((d) => d.demand));
  const maxLegend = Math.max(1, ...legends.map((l) => l.crowns));

  const feedRows = latest.map((crown) => (
    <div
      key={crown.id}
      className={`h5f ${crown.tempered ? "tp" : ""}`}
      role="button"
      tabIndex={0}
      onClick={open(crown.monster)}
      onKeyDown={open(crown.monster)}
    >
      <MonsterTile image={crown.image} size={26} small />
      <div className="h5x">
        <b className="mo">{crown.monster}</b>
        <span>
          {crown.type === "small" ? "Small" : "Large"} crown{crown.tempered ? " · Tempered" : ""}{" "}
          &middot; {crown.username}
        </span>
      </div>
      <Crown type={crown.type} />
    </div>
  ));

  const demandRows = demand.map((entry, index) => (
    <div
      key={entry.id}
      className={`h5r ${tracked ? "" : "notrk"}`}
      role="button"
      tabIndex={0}
      onClick={open(entry.name)}
      onKeyDown={open(entry.name)}
    >
      <span className="h5n">{index + 1}</span>
      <MonsterTile image={entry.image} size={30} />
      <div className="h5m">
        <div className="h5t">
          <b>{entry.name}</b>
          <span>{entry.demand} seeking</span>
        </div>
        <div className="meter">
          <i style={{ width: `${(entry.demand / maxDemand) * 100}%` }} />
        </div>
      </div>
      {tracked && (
        <TrackPin
          trigger="h5b"
          monsterId={entry.id}
          name={entry.name}
          initialType={tracked[entry.id] || null}
        />
      )}
    </div>
  ));

  const legendRows = legends.map((legend, index) => (
    <Link
      key={legend.id}
      className={`h5l ${index === 0 ? "first" : ""}`}
      href={`/profile/${legend.id}`}
    >
      <span className="h5n">{index + 1}</span>
      <span className="h5pf">
        <UserAvatar src={legend.avatar} alt={legend.name} size={32} className="h5pv" />
        <span className="h5rb" title={legend.rankTitle}>
          <Emblem rank={legend.rank} />
        </span>
      </span>
      <b>{legend.name}</b>
      <div className="meter">
        <i style={{ width: `${(legend.crowns / maxLegend) * 100}%` }} />
      </div>
      <span className="h5lc">
        {legend.crowns}
        <Crown type="large" />
      </span>
    </Link>
  ));

  const rareRows = (
    <div className="h5rare">
      {rarest.map((monster) => (
        <div
          key={monster.id}
          className="h5q"
          role="button"
          tabIndex={0}
          onClick={open(monster.name)}
          onKeyDown={open(monster.name)}
        >
          <div className="h5qa">
            <Image
              src={`/monsters/${monster.image}`}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="px"
            />
          </div>
          <b>{monster.name}</b>
          <span>{monster.crowns} claimed guild-wide</span>
          <div className="h5dots">
            {Array.from({ length: 12 }, (_, index) => (
              <i key={index} className={index < Math.min(12, monster.crowns) ? "on" : ""} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const main = { Demand: demandRows, Latest: feedRows, Legends: legendRows, Rarest: rareRows }[tab];

  const sideRows =
    tab === "Latest"
      ? demand.slice(0, 5).map((entry) => (
          <div
            key={entry.id}
            className="h5f"
            role="button"
            tabIndex={0}
            onClick={open(entry.name)}
            onKeyDown={open(entry.name)}
          >
            <MonsterTile image={entry.image} size={26} small />
            <div className="h5x">
              <b className="mo">{entry.name}</b>
              <span>{entry.demand} seeking</span>
            </div>
          </div>
        ))
      : feedRows;

  return (
    <div className="wd s12 board hm-board">
      <div className="tabs3">
        <div role="tablist" style={{ display: "contents" }}>
          {TABS.map(([name, icon]) => (
            <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
              <Image src={`/icons/${icon}`} alt="" width={18} height={18} className="px" />
              {name}
            </button>
          ))}
        </div>
        <Link className="all" href="/investigation">
          All monsters
        </Link>
      </div>
      <div className="b3">
        <div className="b3m">{main}</div>
        <aside className="b3s">
          <small>{tab === "Latest" ? "In demand" : "Just crowned"}</small>
          {sideRows}
        </aside>
      </div>
      <Link className="hm-allm" href="/investigation">
        All monsters
      </Link>
    </div>
  );
}
