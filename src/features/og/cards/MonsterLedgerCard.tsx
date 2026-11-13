import type { Monster } from "@/server/services/monsters";
import { OG_COLORS as c } from "../lib/palette";

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#e07040",
  Water: "#4a9fd4",
  Thunder: "#d4a840",
  Ice: "#80c8e8",
  Dragon: "#9a5cb4",
};

const elementColor = (element: string) => ELEMENT_COLORS[element] ?? c.ember;

function Pill({
  color,
  children,
  spacing = "2px",
}: {
  color: string;
  children: string;
  spacing?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: `${color}1a`,
        border: `1px solid ${color}55`,
        padding: "6px 18px",
        borderRadius: "20px",
        flexShrink: 0,
      }}
    >
      <span
        style={{ fontSize: 12, color, letterSpacing: spacing, fontWeight: "bold", display: "flex" }}
      >
        {children}
      </span>
    </div>
  );
}

function TagGroup({
  title,
  values,
  color,
  background,
  border,
}: {
  title: string;
  values: string[];
  color: string;
  background: string;
  border: string;
}) {
  if (!values.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: "4px", display: "flex" }}>
        {title}
      </span>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "6px" }}>
        {values.map((value, index) => (
          <span
            key={index}
            style={{
              display: "flex",
              padding: "5px 14px",
              background,
              border,
              color,
              fontSize: 14,
              borderRadius: "20px",
            }}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

interface MonsterLedgerCardProps {
  monster: Monster;
  image: string;
  stats: { small: number; large: number };
  seekers: number;
}

export function MonsterLedgerCard({ monster, image, stats, seekers }: MonsterLedgerCardProps) {
  const description = monster.info || "";
  const text =
    description.length > 450
      ? `${description.slice(0, 447)}...`
      : description || "Information pending from the research commission.";
  const total = stats.large + stats.small;
  const figures = [
    { label: "LARGE CROWNS", value: stats.large, color: c.ember },
    { label: "SMALL CROWNS", value: stats.small, color: c.blue },
    { label: "SEEKERS", value: seekers, color: c.mist },
    { label: "GUILD TOTAL", value: total, color: c.emberBright },
  ];

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
            "radial-gradient(ellipse at 30% 50%, rgba(201,162,74,0.12) 0%, transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "500px",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          borderRight: `1px solid ${c.border}`,
          gap: "16px",
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
            background: `radial-gradient(circle at 50% 45%, ${c.ember}18 0%, transparent 65%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "380px",
            height: "380px",
            flexShrink: 0,
          }}
        >
          <img
            alt=""
            src={image}
            width={380}
            height={380}
            style={{ objectFit: "contain", imageRendering: "pixelated" }}
          />
        </div>
        <span
          style={{
            fontSize: 48,
            color: c.mist,
            fontFamily: "serif",
            textAlign: "center",
            display: "flex",
            lineHeight: "1.1",
            flexShrink: 0,
            textShadow: "0 4px 10px rgba(0,0,0,0.5)",
          }}
        >
          {monster.name}
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "center",
          }}
        >
          {monster.type && (
            <Pill color={c.ember} spacing="3px">
              {monster.type.toUpperCase()}
            </Pill>
          )}
          {monster.elements.map((element, index) => (
            <Pill key={index} color={elementColor(element)}>
              {element.toUpperCase()}
            </Pill>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "44px 48px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: c.mistFaint,
              letterSpacing: "6px",
              fontWeight: "bold",
              display: "flex",
            }}
          >
            MONSTER LEDGER
          </span>
          {monster.is_large && (
            <div
              style={{
                display: "flex",
                background: `${c.ember}18`,
                border: `1px solid ${c.borderEmber}`,
                padding: "6px 16px",
                borderRadius: "20px",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: c.ember,
                  letterSpacing: "3px",
                  fontWeight: "bold",
                  display: "flex",
                }}
              >
                CROWNABLE
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "32px",
            flex: 1,
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
            FIELD GUIDE
          </span>
          <span style={{ fontSize: 18, color: c.mistDim, lineHeight: "1.6", display: "flex" }}>
            {text}
          </span>
        </div>

        {(monster.weaknesses.length > 0 || monster.ailments.length > 0) && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "36px",
              paddingTop: "24px",
              borderTop: `1px solid ${c.border}`,
              marginBottom: "32px",
            }}
          >
            <TagGroup
              title="WEAK TO"
              values={monster.weaknesses}
              color={c.ember}
              background={`${c.ember}18`}
              border={`1px solid ${c.borderEmber}`}
            />
            <TagGroup
              title="AILMENTS"
              values={monster.ailments}
              color="#c39bd3"
              background="rgba(142,68,173,0.15)"
              border="1px solid rgba(142,68,173,0.4)"
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "20px",
            paddingTop: "28px",
            borderTop: `1px solid ${c.border}`,
          }}
        >
          {figures.map(({ label, value, color }) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: label === "GUILD TOTAL" ? c.ember : c.mistFaint,
                  letterSpacing: "4px",
                  fontWeight: label === "GUILD TOTAL" ? "bold" : "normal",
                  display: "flex",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: "bold",
                  color: value > 0 ? color : c.mistDim,
                  display: "flex",
                  lineHeight: "1",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
          <span
            style={{
              fontSize: 8,
              color: c.mistFaint,
              opacity: 0.4,
              letterSpacing: "4px",
              display: "flex",
            }}
          >
            CROWN GUILD OFFICIAL LEDGER
          </span>
          <span style={{ fontSize: 8, color: c.mistFaint, opacity: 0.4, display: "flex" }}>
            © 2026
          </span>
        </div>
      </div>
    </div>
  );
}
