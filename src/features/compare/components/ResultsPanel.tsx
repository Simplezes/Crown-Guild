import Image from "next/image";
import Link from "next/link";
import type { CompareItem, CompareResult, CompareSide } from "../types";
import { HunterAvatar } from "./HunterAvatar";

function Stat({
  value,
  label,
  primary,
}: {
  value: number | string;
  label: string;
  primary?: boolean;
}) {
  return (
    <div className={`cmp-stat ${primary ? "primary" : ""}`}>
      <b>{value}</b>
      <span title={label}>{label}</span>
    </div>
  );
}

function Items({ items, empty }: { items: CompareItem[]; empty: string }) {
  if (!items.length) return <div className="cmp-empty-list">{empty}</div>;
  return (
    <div className="cmp-items">
      {items.map((item) => (
        <Link key={item.id} className="cmp-item" href={`/monster/${encodeURIComponent(item.name)}`}>
          <div className="mi sm">
            <Image
              src={`/monsters/${item.image}`}
              alt=""
              width={30}
              height={30}
              unoptimized
              className="px"
            />
          </div>
          <b>{item.name}</b>
          <span
            className="cmp-crowns"
            title={`${item.type} crown${item.type === "both" ? "s" : ""}`}
          >
            {(item.type === "small" || item.type === "both") && (
              <Image
                src="/icons/smallcrown.png"
                alt="Small"
                width={16}
                height={16}
                className="px"
              />
            )}
            {(item.type === "large" || item.type === "both") && (
              <Image
                src="/icons/largecrown.png"
                alt="Large"
                width={16}
                height={16}
                className="px"
              />
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}

function ProfileCard({ hunter }: { hunter: CompareSide }) {
  const stats = hunter.stats;
  return (
    <article className="cmp-profile">
      <div className="cmp-profile-top">
        <HunterAvatar hunter={hunter} />
        <div>
          <b>{hunter.name}</b>
          <small>
            {hunter.rank} &middot; {hunter.mp} MP &middot; {hunter.completion}% collection
          </small>
        </div>
      </div>
      {stats && (
        <div className="cmp-profile-stats">
          <div>
            <b>{stats.total}</b>
            <span>Crowns</span>
          </div>
          <div>
            <b>{stats.small}</b>
            <span>Small</span>
          </div>
          <div>
            <b>{stats.large}</b>
            <span>Large</span>
          </div>
          <div>
            <b>{stats.tempered}</b>
            <span>Tempered</span>
          </div>
        </div>
      )}
    </article>
  );
}

function ExclusiveColumn({ hunter, items }: { hunter: CompareSide; items: CompareItem[] }) {
  return (
    <section className="cmp-section">
      <div className="cmp-section-head">
        <h3>{hunter.name} only</h3>
        <span>
          {items.length} target{items.length === 1 ? "" : "s"}
        </span>
      </div>
      <Items items={items} empty="No exclusive targets." />
    </section>
  );
}

interface ResultsPanelProps {
  a: CompareSide;
  b: CompareSide;
  result: CompareResult;
}

export function ResultsPanel({ a, b, result }: ResultsPanelProps) {
  const { shared, onlyA, onlyB, sharedSpecies, onlyOwnedA, onlyOwnedB } = result;
  const total = shared.length + onlyA.length + onlyB.length;
  const match = total ? Math.round((shared.length / total) * 100) : 0;

  return (
    <div className="cmp-results">
      <div className="cmp-results-head">
        <div>
          <h3>
            {a.name} <em>vs</em> {b.name}
          </h3>
          <p className="sub">Comparison snapshot</p>
        </div>
        <span className="cmp-tag">Wishlist overlap {match}%</span>
      </div>
      <div className="cmp-stats">
        <Stat value={shared.length} label="Shared targets" primary />
        <Stat value={onlyA.length} label={`${a.name} only`} />
        <Stat value={onlyB.length} label={`${b.name} only`} />
        <Stat value={`${match}%`} label="Match rate" />
      </div>
      <div className="cmp-profiles">
        <ProfileCard hunter={a} />
        <ProfileCard hunter={b} />
      </div>
      <div className="cmp-species">
        <Stat value={sharedSpecies} label="Shared crown species" primary />
        <Stat value={onlyOwnedA} label={`${a.name} unique species`} />
        <Stat value={onlyOwnedB} label={`${b.name} unique species`} />
        <Stat value={sharedSpecies + onlyOwnedA + onlyOwnedB} label="Combined species" />
      </div>
      <section className="cmp-section">
        <div className="cmp-section-head">
          <h3>Shared hunt board</h3>
          <span>{shared.length} shared</span>
        </div>
        <Items items={shared} empty="No shared targets yet. Try another hunter pair." />
      </section>
      <div className="cmp-wishes">
        <ExclusiveColumn hunter={a} items={onlyA} />
        <ExclusiveColumn hunter={b} items={onlyB} />
      </div>
    </div>
  );
}
