import Image from "next/image";
import type { HomeData } from "@/server/services/home";
import { UserAvatar } from "@/shared/ui";
import { WantedActions } from "./HomeActions";

interface WantedSpotlightProps {
  spotlight: HomeData["demand"][number];
  meta: HomeData["spotlightMeta"];
  seekers: HomeData["seekers"];
  signedIn: boolean;
  tracked: string | null | undefined;
}

export function WantedSpotlight({
  spotlight,
  meta,
  seekers,
  signedIn,
  tracked,
}: WantedSpotlightProps) {
  const peak = Math.max(1, meta.small, meta.large);

  return (
    <section className="wd s7 hm-wanted">
      <div className="hm-tile">
        <Image
          src={`/monsters/${spotlight.image}`}
          alt=""
          width={104}
          height={104}
          unoptimized
          className="px"
        />
      </div>
      <div className="hm-wt">
        <span className="eyebrow">
          <Image
            src="/icons/MHWilds-Favorite_Icon.png"
            alt=""
            width={16}
            height={16}
            className="px"
          />
          Most wanted
        </span>
        <h3>{spotlight.name}</h3>
        <div className="hm-seek">
          <div className="hm-av">
            {seekers.map((seeker, index) => (
              <UserAvatar
                key={index}
                src={seeker.avatar}
                alt={seeker.name}
                size={28}
                className="h5a"
              />
            ))}
          </div>
          <p>
            <b>{spotlight.demand}</b> hunters seeking
          </p>
        </div>
        <div className="hm-split">
          {(["small", "large"] as const).map((kind) => (
            <div key={kind}>
              <span>
                <Image
                  src={`/icons/${kind}crown.png`}
                  alt=""
                  width={16}
                  height={16}
                  className="px"
                />
                {kind === "small" ? "Small crown" : "Large crown"}
              </span>
              <div className="meter">
                <i style={{ width: `${Math.round((meta[kind] / peak) * 100)}%` }} />
              </div>
              <b>{meta[kind]}</b>
            </div>
          ))}
          <p>{meta.claimed} claimed guild-wide</p>
        </div>
        <div className="hm-acts">
          <WantedActions
            monster={{ id: spotlight.id, name: spotlight.name }}
            signedIn={signedIn}
            tracked={tracked}
          />
        </div>
      </div>
    </section>
  );
}
