import { LogButton } from "@/features/crowns";
import { TrackPin } from "@/features/wishlist";
import type { Monster } from "@/server/services/monsters";
import { Icon, MonsterIcon } from "@/shared/ui";

interface Stat {
  label: string;
  value: number;
  alert?: boolean;
}

interface MonsterHeaderProps {
  monster: Monster;
  info: string | null;
  stats: Stat[];
  signedIn: boolean;
  wishlistType: string | null;
}

export function MonsterHeader({
  monster,
  info,
  stats,
  signedIn,
  wishlistType,
}: MonsterHeaderProps) {
  return (
    <section className="p mh">
      <div>
        <span className="eyebrow">
          <Icon name="monsters" />
          Monster profile
        </span>
        <div className="top2">
          <div className="big">
            <MonsterIcon imageName={monster.image_name} name={monster.name} size={88} />
          </div>
          <h1 className="h1">{monster.name}</h1>
        </div>
        <p className="quote">
          &ldquo;{info || "No field guide data currently available for this specimen."}&rdquo;
        </p>
        {signedIn && (
          <div className="acts" style={{ marginTop: 20 }}>
            <LogButton monsterId={monster.id} />
            <TrackPin
              trigger="btn-o"
              monsterId={monster.id}
              name={monster.name}
              initialType={wishlistType}
            />
          </div>
        )}
      </div>
      <div className="k4">
        {stats.map((stat) => (
          <div key={stat.label} className="tile">
            <b className={stat.alert ? "dm" : ""}>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
