import type { GuildCardData, GuildCardMonster } from "@/server/services/guild-card";
import { pickIconSize } from "../lib/icon-fit";
import { OG_COLORS as c } from "../lib/palette";

const ICON_GAP = 3;

interface GroupProps {
  label: string;
  items: GuildCardMonster[];
  size: number;
  images: Map<string, string>;
}

function Group({ label, items, size, images }: GroupProps) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
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
      <div
        style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: `${ICON_GAP}px` }}
      >
        {items.map((monster) => (
          <div
            key={monster.name}
            style={{
              width: size,
              height: size,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: c.voidRaised,
              borderRadius: "4px",
              border: `1px solid ${c.border}`,
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

interface GuildCardProps {
  data: GuildCardData;
  huntIcon: string;
  images: Map<string, string>;
}

export function GuildCard({ data, huntIcon, images }: GuildCardProps) {
  const { stats, smallOnly, largeOnly } = data;
  const size = pickIconSize({
    groups: [smallOnly.length, largeOnly.length],
    candidates: [96, 84, 72, 64, 56, 48, 40, 32],
    gap: ICON_GAP,
    groupGap: 10,
    headerHeight: 20,
    width: 1200 - 220 - 60,
    height: 630 - 130 - 48,
    fallback: 28,
  });
  const percent = (value: number) =>
    Math.min(100, stats.total > 0 ? (value / stats.total) * 100 : 0);

  const headline = [
    { label: "TOTAL CROWNS", value: stats.total, color: c.emberBright },
    { label: "HUNTERS", value: stats.hunters, color: c.mist },
    { label: "SPECIES CROWNED", value: stats.species, color: c.mist },
  ];
  const breakdown = [
    { label: "LARGE", value: stats.large, color: c.ember },
    { label: "SMALL", value: stats.small, color: c.blue },
    { label: "TEMPERED", value: stats.tempered, color: c.bloodBright },
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
            "radial-gradient(ellipse at 20% 0%, rgba(201,162,74,0.18) 0%, transparent 50%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: "130px",
          flexShrink: 0,
          paddingLeft: "40px",
          paddingRight: "40px",
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "6px",
            paddingRight: "40px",
            borderRight: `1px solid ${c.border}`,
            height: "100%",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px" }}>
            <img
              alt=""
              src={huntIcon}
              width={32}
              height={32}
              style={{ imageRendering: "pixelated", flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: 26,
                color: c.emberBright,
                letterSpacing: "3px",
                display: "flex",
                fontFamily: "serif",
                lineHeight: "1",
              }}
            >
              CROWN GUILD
            </span>
          </div>
          <span style={{ fontSize: 8, color: c.mistFaint, letterSpacing: "5px", display: "flex" }}>
            OFFICIAL CROWN REGISTRY
          </span>
        </div>
        {headline.map(({ label, value, color }, index) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "5px",
              paddingLeft: "40px",
              paddingRight: index < 2 ? "40px" : "0px",
              borderRight: index < 2 ? `1px solid ${c.border}` : "none",
              height: "100%",
              flex: 1,
            }}
          >
            <span
              style={{ fontSize: 8, color: c.mistFaint, letterSpacing: "3px", display: "flex" }}
            >
              {label}
            </span>
            <span
              style={{ fontSize: 48, fontWeight: "bold", color, display: "flex", lineHeight: "1" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "row", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "22px 24px 22px 40px",
            gap: "14px",
            overflow: "hidden",
          }}
        >
          <Group label="SMALL CROWNS" items={smallOnly} size={size} images={images} />
          <Group label="LARGE CROWNS" items={largeOnly} size={size} images={images} />
          {!smallOnly.length && !largeOnly.length && (
            <span style={{ fontSize: 16, color: c.mistDim, display: "flex" }}>
              No crowns recorded yet.
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "220px",
            flexShrink: 0,
            borderLeft: `1px solid ${c.border}`,
            padding: "22px 22px",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 8,
              color: c.ember,
              letterSpacing: "3px",
              display: "flex",
              marginBottom: "14px",
            }}
          >
            BREAKDOWN
          </span>
          {breakdown.map(({ label, value, color }) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "18px" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{ fontSize: 8, color: c.mistFaint, letterSpacing: "2px", display: "flex" }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: "bold",
                    color,
                    display: "flex",
                    lineHeight: "1",
                  }}
                >
                  {value}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  height: "3px",
                  background: c.voidRaised,
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    width: `${percent(value)}%`,
                    background: color,
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", marginTop: "auto" }}>
            <span
              style={{
                fontSize: 7,
                color: c.mistFaint,
                opacity: 0.4,
                letterSpacing: "2px",
                display: "flex",
              }}
            >
              © 2026 CROWN GUILD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
