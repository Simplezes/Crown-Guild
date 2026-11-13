import type { ProfileData } from "@/server/services/profile";
import { pickIconSize } from "../lib/icon-fit";
import { OG_COLORS } from "../lib/palette";
import type { ProfileMonster, ProfileMonsterGroups } from "../lib/profile-monsters";

const c = { ...OG_COLORS, mistFaint: "#5c564e" };
const GAP = 3;

function Group({
  label,
  items,
  size,
  images,
}: {
  label: string;
  items: ProfileMonster[];
  size: number;
  images: Map<string, string>;
}) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "7px" }}>
        <span
          style={{
            fontSize: 8,
            color: c.ember,
            letterSpacing: "3px",
            fontWeight: "bold",
            display: "flex",
            flexShrink: 0,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 8, color: c.mistFaint, display: "flex", flexShrink: 0 }}>
          ×{items.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: `${GAP}px` }}>
        {items.map((monster) => (
          <div
            key={monster.name}
            style={{
              width: size,
              height: size,
              flexShrink: 0,
              border: `1px solid ${c.border}`,
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: c.voidRaised,
            }}
          >
            <img
              alt=""
              src={images.get(monster.name)}
              width={size - 6}
              height={size - 6}
              style={{ objectFit: "contain", imageRendering: "pixelated" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProfileMonstersCardProps {
  data: ProfileData;
  rankTitle: string;
  groups: ProfileMonsterGroups;
  avatar: string;
  images: Map<string, string>;
}

export function ProfileMonstersCard({
  data,
  rankTitle,
  groups,
  avatar,
  images,
}: ProfileMonstersCardProps) {
  const { stats, user } = data;
  const size = pickIconSize({
    groups: [groups.smallOnly.length, groups.largeOnly.length, groups.multi.length],
    candidates: [112, 104, 96, 88, 80, 72, 64, 56, 48, 40],
    gap: GAP,
    groupGap: 8,
    headerHeight: 20,
    width: 1128,
    height: 504,
    fallback: 32,
  });

  const figures = [
    { label: "TOTAL CROWNS", value: stats.total || 0, color: c.emberBright },
    { label: "LARGE", value: stats.large || 0, color: c.ember },
    { label: "SMALL", value: stats.small || 0, color: c.blue },
    { label: "TEMPERED", value: stats.tempered || 0, color: c.bloodBright },
    { label: "SPECIES", value: groups.all.length, color: c.mist },
  ];

  return (
    <div
      style={{
        background: c.void,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 10% 0%, rgba(201,162,74,0.14) 0%, transparent 50%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: "90px",
          flexShrink: 0,
          paddingLeft: "36px",
          paddingRight: "36px",
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "14px",
            paddingRight: "28px",
            borderRight: `1px solid ${c.border}`,
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              border: "2px solid rgba(201,162,74,0.4)",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <img
              alt=""
              src={avatar}
              width={48}
              height={48}
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span
              style={{
                fontSize: 22,
                color: c.mist,
                fontFamily: "serif",
                display: "flex",
                lineHeight: "1",
              }}
            >
              {user.username}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                background: "rgba(201,162,74,0.15)",
                border: "1px solid rgba(201,162,74,0.3)",
                padding: "2px 10px",
                borderRadius: "20px",
              }}
            >
              <span style={{ fontSize: 8, color: c.ember, letterSpacing: "2px", display: "flex" }}>
                {rankTitle.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        {figures.map(({ label, value, color }, index) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "4px",
              paddingLeft: "28px",
              paddingRight: index < 4 ? "28px" : "0px",
              borderRight: index < 4 ? `1px solid ${c.border}` : "none",
              height: "100%",
              flexShrink: 0,
            }}
          >
            <span
              style={{ fontSize: 7, color: c.mistFaint, letterSpacing: "2px", display: "flex" }}
            >
              {label}
            </span>
            <span
              style={{ fontSize: 30, fontWeight: "bold", color, display: "flex", lineHeight: "1" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "18px 36px",
          gap: "12px",
          overflow: "hidden",
        }}
      >
        <Group label="SMALL CROWNS" items={groups.smallOnly} size={size} images={images} />
        <Group label="LARGE CROWNS" items={groups.largeOnly} size={size} images={images} />
        <Group label="SMALL & LARGE" items={groups.multi} size={size} images={images} />
        {groups.all.length === 0 && (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, color: c.mistDim, display: "flex" }}>
              No crowns recorded yet.
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingRight: "36px",
          paddingBottom: "12px",
        }}
      >
        <span
          style={{
            fontSize: 7,
            color: c.mistFaint,
            opacity: 0.4,
            letterSpacing: "3px",
            display: "flex",
          }}
        >
          CROWN GUILD
        </span>
      </div>
    </div>
  );
}
