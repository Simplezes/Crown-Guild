"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon, Emblem } from "@/components/shell/Icon";
import { useDrawer } from "@/components/monster/DrawerProvider";
import TrackPin from "@/components/registry/TrackPin";
import UserAvatar from "@/components/ui/UserAvatar";

const TABS = ["Demand", "Latest", "Legends", "Rarest"];

function MonsterTile({ image, size = 40, sm = false }) {
  return (
    <div className={`mi ${sm ? "sm" : ""}`}>
      <Image src={`/monsters/${image}`} alt="" width={size} height={size} unoptimized className="px" />
    </div>
  );
}

function Crown({ type }) {
  return <Image src={type === "small" ? "/icons/smallcrown.png" : "/icons/largecrown.png"} alt="" width={20} height={20} className="px" />;
}

export default function HomeBoard({ demand, latest, legends, rarest, tracked = null }) {
  const [tab, setTab] = useState("Demand");
  const { openDrawer } = useDrawer();
  const open = (name) => (e) => { if (e.type === "click" || e.key === "Enter" || e.key === " ") { e.preventDefault(); openDrawer(name); } };
  const maxDemand = Math.max(1, ...demand.map((d) => d.demand));
  const maxLegend = Math.max(1, ...legends.map((l) => l.crowns));

  const feedRows = (rows) =>
    rows.map((c) => (
      <div key={c.id} className="h5f" role="button" tabIndex={0} onClick={open(c.monster)} onKeyDown={open(c.monster)}>
        <MonsterTile image={c.image} size={26} sm />
        <div className="h5x">
          <b className="mo">{c.monster}</b>
          <span>{c.type === "small" ? "Small" : "Large"} crown &middot; {c.username}</span>
        </div>
        <Crown type={c.type} />
      </div>
    ));

  let main = null;
  if (tab === "Demand") {
    main = demand.map((d, i) => (
      <div key={d.id} className="h5r" role="button" tabIndex={0} onClick={open(d.name)} onKeyDown={open(d.name)}>
        <span className="h5n">{i + 1}</span>
        <MonsterTile image={d.image} size={30} />
        <div className="h5m">
          <div className="h5t"><b>{d.name}</b><span>{d.demand} seeking</span></div>
          <div className="meter"><i style={{ width: `${(d.demand / maxDemand) * 100}%` }} /></div>
        </div>
        {tracked && <TrackPin trigger="h5b" monsterId={d.id} name={d.name} initialType={tracked[d.id] || null} />}
      </div>
    ));
  } else if (tab === "Latest") {
    main = feedRows(latest);
  } else if (tab === "Legends") {
    main = legends.map((l, i) => (
      <Link key={l.id} className={`h5l ${i === 0 ? "first" : ""}`} href={`/profile/${l.id}`}>
        <span className="h5n">{i + 1}</span>
        <span className="h5pf">
          <UserAvatar src={l.avatar} alt={l.name} size={44} className="h5pv" />
          <span className="h5rb" title={l.rankTitle}><Emblem rank={l.rank} /></span>
        </span>
        <b>{l.name}</b>
        <div className="meter"><i style={{ width: `${(l.crowns / maxLegend) * 100}%` }} /></div>
        <span className="h5lc">{l.crowns}<Crown type="large" /></span>
      </Link>
    ));
  } else {
    main = (
      <div className="h5rare">
        {rarest.map((m) => (
          <div key={m.id} className="h5q" role="button" tabIndex={0} onClick={open(m.name)} onKeyDown={open(m.name)}>
            <div className="h5qa"><Image src={`/monsters/${m.image}`} alt="" width={96} height={96} unoptimized className="px" /></div>
            <b>{m.name}</b>
            <span>{m.crowns} claimed guild-wide</span>
            <div className="h5dots">
              {Array.from({ length: 12 }, (_, i) => <i key={i} className={i < Math.min(12, m.crowns) ? "on" : ""} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sideTitle = tab === "Latest" ? "In demand" : "Just crowned";
  const side =
    tab === "Latest"
      ? demand.slice(0, 5).map((d) => (
          <div key={d.id} className="h5f" role="button" tabIndex={0} onClick={open(d.name)} onKeyDown={open(d.name)}>
            <MonsterTile image={d.image} size={26} sm />
            <div className="h5x"><b className="mo">{d.name}</b><span>{d.demand} seeking</span></div>
          </div>
        ))
      : feedRows(latest);

  return (
    <div className="wd s12 board">
      <div className="tabs3" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
        <Link className="all" href="/investigation">All monsters</Link>
      </div>
      <div className="b3">
        <div className="b3m">{main}</div>
        <aside className="b3s">
          <small>{sideTitle}</small>
          {side}
        </aside>
      </div>
    </div>
  );
}
