import Image from "next/image";
import Link from "next/link";
import type { HomeData } from "@/server/services/home";

export function StatsStrip({ stats }: { stats: HomeData["stats"] }) {
  const items = [
    { icon: "MHWilds-Quest_Members_Icon.png", value: stats.hunters, label: "Hunters" },
    { icon: "largecrown.png", value: stats.crowns, label: "Crowns" },
    {
      icon: "MHWilds-Favorite_Icon.png",
      value: `${stats.temperedRate}%`,
      label: "Tempered",
      tempered: true,
    },
    { icon: "MHWilds-Field_Survey_Icon.png", value: stats.investigations, label: "Investigations" },
  ];

  return (
    <section className="wd s12 hm-stats" aria-label="Guild numbers">
      {items.map((item) => (
        <div key={item.label}>
          <Image src={`/icons/${item.icon}`} alt="" width={30} height={30} className="px" />
          <span>
            <b className={item.tempered ? "tp" : undefined}>{item.value}</b>
            {item.label}
          </span>
        </div>
      ))}
    </section>
  );
}

export function Roster({ roster }: { roster: HomeData["roster"] }) {
  if (roster.length === 0) return null;
  return (
    <section className="wd s12 hm-roster">
      <div className="hm-sech">
        <h3>
          <Image
            src="/icons/MHWilds-Quest_Menu_Icon.png"
            alt=""
            width={22}
            height={22}
            className="px"
          />
          The roster
        </h3>
        <Link href="/investigation">Open investigations</Link>
      </div>
      <div className="hm-rost">
        {roster.map((monster) => (
          <Link key={monster.name} href={`/monster/${encodeURIComponent(monster.name)}`}>
            <Image
              src={`/monsters/${monster.image}`}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="px"
            />
            <span>{monster.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
