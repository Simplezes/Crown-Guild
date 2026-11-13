import Image from "next/image";
import Link from "next/link";
import type { MonsterSummary } from "@/server/services/monster-summary";
import { Icon, UserAvatar } from "@/shared/ui";

export function CrownCount({
  kind,
  label,
  count,
}: {
  kind: "small" | "large";
  label: string;
  count: number;
}) {
  return (
    <div className={`d2c ${count ? "on" : ""}`}>
      <span className="d2ci">
        <Image src={`/icons/${kind}crown.png`} alt="" width={22} height={22} className="px" />
      </span>
      <div className="d2ct">
        <b>{label}</b>
        <span>{count ? `${count} logged` : "Not logged yet"}</span>
      </div>
      <span className="d2cn">{count}</span>
    </div>
  );
}

interface HostsSectionProps {
  summary: MonsterSummary;
  href: string;
  onClose: () => void;
}

export function HostsSection({ summary: data, href, onClose }: HostsSectionProps) {
  return (
    <section className="d2s">
      <h3>
        Hosts <em>{data.hostCount.small + data.hostCount.large} total</em>
      </h3>
      <div className="d2hs">
        {data.hosts.map((host, index) => (
          <Link
            key={index}
            className="d2ho"
            href={`${href}?user=${host.user_id}`}
            onClick={onClose}
          >
            <UserAvatar
              src={host.avatar_url}
              alt={host.username || "?"}
              size={38}
              className="d2av"
            />
            <div className="d2hn">
              <b>{host.username}</b>
              <span>
                {host.strength_rating}★ &middot; {host.type === "large" ? "Large" : "Small"}
                {host.tempered ? " · Tempered" : ""}
                {host.remaining_uses != null ? ` · ${host.remaining_uses} left` : ""}
              </span>
            </div>
            <span className="d2ct2">
              <Icon name="open" />
            </span>
          </Link>
        ))}
        {data.hosts.length === 0 && (
          <p className="ptip" style={{ margin: 0 }}>
            No hosts yet.
          </p>
        )}
      </div>
      <Link className="d2more" href={href} onClick={onClose}>
        See all hosts
      </Link>
    </section>
  );
}
