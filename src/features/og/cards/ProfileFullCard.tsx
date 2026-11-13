import type { RankProgress } from "@/config/mastery";
import type { ProfileData } from "@/server/services/profile";
import { pickIconSize } from "../lib/icon-fit";
import { OG_COLORS } from "../lib/palette";
import type { ProfileMonster, ProfileMonsterGroups } from "../lib/profile-monsters";

const c = {
  ...OG_COLORS,
  mistFaint: "#5c564e",
  voidPanel: "#151217",
  voidRaised: "#1e1a20",
  border: "rgba(255,255,255,0.08)",
  borderEmber: "rgba(201,162,74,0.25)",
};
const GAP = 4;
const WIDTH = 744;

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
  const perRow = Math.floor(WIDTH / (size + GAP));
  const rows: ProfileMonster[][] = [];
  for (let index = 0; index < items.length; index += perRow)
    rows.push(items.slice(index, index + perRow));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontSize: 10,
            color: c.ember,
            letterSpacing: "4px",
            fontWeight: "bold",
            display: "flex",
            flexShrink: 0,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 10, color: c.mistFaint, display: "flex", flexShrink: 0 }}>
          ×{items.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: "flex", flexDirection: "row", gap: `${GAP}px` }}>
            {row.map((monster) => (
              <div
                key={monster.name}
                style={{
                  width: size,
                  height: size,
                  flexShrink: 0,
                  border: `1px solid ${c.border}`,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: c.voidRaised,
                }}
              >
                <img
                  alt=""
                  src={images.get(monster.name)}
                  width={size - 8}
                  height={size - 8}
                  style={{ objectFit: "contain", imageRendering: "pixelated", display: "flex" }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Figure({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: "4px", display: "flex" }}>
        {label}
      </span>
      <span style={{ fontSize: 44, fontWeight: "bold", color, display: "flex", lineHeight: "1" }}>
        {value}
      </span>
    </div>
  );
}

interface ProfileFullCardProps {
  data: ProfileData;
  rank: RankProgress;
  groups: ProfileMonsterGroups;
  avatar: string;
  images: Map<string, string>;
}

export function ProfileFullCard({ data, rank, groups, avatar, images }: ProfileFullCardProps) {
  const { user, stats, masteryPoints } = data;
  const { currentRank, nextRank, progress } = rank;
  const note = String(user.status_message || "").trim();
  const preview = note.length > 100 ? `${note.slice(0, 97)}...` : note;
  const percent = Math.max(0, Math.min(100, progress));
  const size = pickIconSize({
    groups: [groups.smallOnly.length, groups.largeOnly.length, groups.multi.length],
    candidates: [80, 72, 64, 56, 48, 40, 32],
    gap: GAP,
    groupGap: 16,
    headerHeight: 24,
    width: WIDTH,
    height: 320,
    fallback: 32,
  });

  return (
    <div
      style={{
        background: c.void,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
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
            "radial-gradient(ellipse at 85% 50%, rgba(201,162,74,0.1) 0%, transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "360px",
          flexShrink: 0,
          borderRight: `1px solid ${c.border}`,
          padding: "48px 32px",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "4px",
            background: `linear-gradient(to bottom, ${c.ember}, transparent 80%)`,
          }}
        />

        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
        >
          <div
            style={{
              display: "flex",
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              border: "4px solid rgba(201,162,74,0.5)",
              flexShrink: 0,
              overflow: "hidden",
              boxShadow: "0 0 40px rgba(201,162,74,0.2)",
            }}
          >
            <img
              alt=""
              src={avatar}
              width={152}
              height={152}
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}
          >
            <span
              style={{
                fontSize: 36,
                color: c.mist,
                fontFamily: "serif",
                display: "flex",
                textAlign: "center",
                lineHeight: "1",
                textShadow: "0 4px 10px rgba(0,0,0,0.5)",
              }}
            >
              {user.username}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                background: "rgba(201,162,74,0.15)",
                border: "1px solid rgba(201,162,74,0.4)",
                padding: "6px 20px",
                borderRadius: "24px",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: c.ember,
                  letterSpacing: "4px",
                  fontWeight: "bold",
                  display: "flex",
                }}
              >
                {currentRank.title.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {preview && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              padding: "12px 16px",
              background: "rgba(201,162,74,0.05)",
              borderLeft: `3px solid ${c.ember}`,
              borderRadius: "0 8px 8px 0",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: c.mistDim,
                fontStyle: "italic",
                display: "flex",
                textAlign: "center",
                lineHeight: "1.4",
              }}
            >
              &quot;{preview}&quot;
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "1px",
            background: c.border,
            margin: "8px 0",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: c.ember,
                letterSpacing: "4px",
                display: "flex",
                fontWeight: "bold",
              }}
            >
              HUNTER MASTERY
            </span>
            <span
              style={{
                fontSize: 16,
                color: c.emberBright,
                fontWeight: "bold",
                display: "flex",
                lineHeight: "1",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              height: "8px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "4px",
              overflow: "hidden",
              border: `1px solid ${c.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                height: "100%",
                width: `${percent}%`,
                background: `linear-gradient(to right, ${c.ember}, ${c.emberBright})`,
                boxShadow: `0 0 10px ${c.ember}88`,
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: c.mistFaint, display: "flex" }}>
              Rank {currentRank.rank}
            </span>
            {nextRank && (
              <span style={{ fontSize: 9, color: c.mistFaint, display: "flex" }}>
                {Math.max(0, nextRank.minPoints - Number(masteryPoints || 0))} pts to next rank
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "48px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            borderBottom: `1px solid ${c.border}`,
            paddingBottom: "24px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: c.ember,
              letterSpacing: "6px",
              fontWeight: "bold",
              display: "flex",
            }}
          >
            OFFICIAL RECORDS
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", gap: "48px" }}>
              <Figure label="LARGE" value={stats.large || 0} color={c.ember} />
              <Figure label="SMALL" value={stats.small || 0} color={c.blue} />
              <Figure label="TEMPERED" value={stats.tempered || 0} color={c.bloodBright} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", paddingLeft: "4px" }}>
                <span
                  style={{
                    fontSize: 12,
                    color: c.ember,
                    letterSpacing: "4px",
                    fontWeight: "bold",
                    display: "flex",
                  }}
                >
                  TOTAL CROWNS
                </span>
              </div>
              <span
                style={{
                  fontSize: 80,
                  fontWeight: "bold",
                  color: c.emberBright,
                  display: "flex",
                  lineHeight: "0.85",
                  textShadow: `0 4px 30px ${c.ember}66`,
                }}
              >
                {stats.total || 0}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "16px",
            overflow: "hidden",
          }}
        >
          <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: "4px", display: "flex" }}>
            CROWN REGISTRY
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Group label="SMALL CROWNS" items={groups.smallOnly} size={size} images={images} />
            <Group label="LARGE CROWNS" items={groups.largeOnly} size={size} images={images} />
            <Group label="SMALL & LARGE" items={groups.multi} size={size} images={images} />
            {groups.all.length === 0 && (
              <div
                style={{
                  display: "flex",
                  height: "100px",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px dashed ${c.border}`,
                  borderRadius: "12px",
                }}
              >
                <span style={{ fontSize: 16, color: c.mistDim, display: "flex" }}>
                  No crowns recorded yet.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
