import type { Monster } from "@/server/services/monsters";
import type { CrownDetail } from "@/server/services/profile";
import { OG_COLORS as c } from "../lib/palette";

const STAR = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#e8cc7d"/></svg>',
)}`;

function Badge({
  background,
  border,
  children,
}: {
  background: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "10px",
        background,
        border,
        padding: "8px 18px",
        borderRadius: "10px",
      }}
    >
      {children}
    </div>
  );
}

const label = (color: string, bold = true) => ({
  fontSize: 14,
  color,
  fontWeight: bold ? ("bold" as const) : ("normal" as const),
  letterSpacing: "2px",
  display: "flex" as const,
});

interface CrownPostingCardProps {
  monster: Monster;
  crown: CrownDetail;
  images: { monster: string; quest: string; crown: string; avatar: string };
}

export function CrownPostingCard({ monster, crown, images }: CrownPostingCardProps) {
  const accent = crown.type === "large" ? c.ember : c.blue;
  const hasUses = crown.remaining_uses !== null && crown.remaining_uses !== undefined;

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
          background: `radial-gradient(circle at 80% 50%, ${accent}20 0%, ${c.void} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-40px",
          top: "15px",
          display: "flex",
          width: "600px",
          height: "600px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          alt=""
          src={images.monster}
          width={550}
          height={550}
          style={{ objectFit: "contain", imageRendering: "pixelated", opacity: 0.95 }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "700px",
          height: "100%",
          padding: "44px 48px",
          background: `linear-gradient(to right, ${c.void} 70%, transparent 100%)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: c.ember,
              letterSpacing: "6px",
              fontWeight: "bold",
              display: "flex",
            }}
          >
            QUEST POSTING
          </span>
          <div
            style={{
              display: "flex",
              flex: 1,
              height: "1px",
              background: `linear-gradient(to right, ${c.borderEmber}, transparent)`,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "18px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              border: `2px solid ${accent}66`,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <img
              alt=""
              src={images.avatar}
              width={72}
              height={72}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{ fontSize: 10, color: c.mistFaint, letterSpacing: "4px", display: "flex" }}
            >
              POSTED BY
            </span>
            <span
              style={{
                fontSize: 32,
                color: c.mist,
                fontFamily: "serif",
                display: "flex",
                lineHeight: "1",
              }}
            >
              {crown.username}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
          <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: "4px", display: "flex" }}>
            TARGET
          </span>
          <span
            style={{
              fontSize: 64,
              color: "#fff",
              fontFamily: "serif",
              display: "flex",
              lineHeight: "1",
              textShadow: `0 4px 20px ${accent}66`,
            }}
          >
            {monster.name}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "12px",
            marginBottom: "36px",
            flexWrap: "wrap",
          }}
        >
          <Badge background={c.voidRaised} border={`1px solid ${c.border}`}>
            <img
              alt=""
              src={images.quest}
              width={22}
              height={22}
              style={{ imageRendering: "pixelated" }}
            />
            <span style={label(c.mist)}>{crown.quest || "Hunt"}</span>
          </Badge>
          <Badge background={`${accent}1a`} border={`1px solid ${accent}55`}>
            <img
              alt=""
              src={images.crown}
              width={22}
              height={22}
              style={{ imageRendering: "pixelated" }}
            />
            <span style={label(accent)}>{crown.type.toUpperCase()}</span>
          </Badge>
          {!!crown.tempered && (
            <Badge background={c.blood} border={`1px solid ${c.bloodBright}`}>
              <span style={label("#fff")}>TEMPERED</span>
            </Badge>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "44px",
            padding: "24px 32px",
            background: c.voidRaised,
            border: `1px solid ${c.border}`,
            borderRadius: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span
              style={{ fontSize: 10, color: c.mistFaint, letterSpacing: "4px", display: "flex" }}
            >
              DIFFICULTY
            </span>
            <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
              {Array.from({ length: Math.max(1, crown.strength_rating || 0) }).map((_, index) => (
                <img
                  alt=""
                  key={index}
                  src={STAR}
                  width={26}
                  height={26}
                  style={{ display: "flex" }}
                />
              ))}
            </div>
          </div>
          {hasUses && (
            <>
              <div style={{ display: "flex", width: "1px", background: c.border }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontSize: 10,
                    color: c.mistFaint,
                    letterSpacing: "4px",
                    display: "flex",
                  }}
                >
                  REMAINING
                </span>
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: "bold",
                    color: (crown.remaining_uses || 0) > 0 ? c.emberBright : c.mistFaint,
                    display: "flex",
                    lineHeight: "1",
                  }}
                >
                  {crown.remaining_uses}
                </span>
              </div>
            </>
          )}
        </div>

        {crown.status_message && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingLeft: "16px",
              borderLeft: `2px solid ${c.borderEmber}`,
            }}
          >
            <span style={{ fontSize: 9, color: c.ember, letterSpacing: "3px", display: "flex" }}>
              HUNTER&apos;S NOTES
            </span>
            <span style={{ fontSize: 18, color: c.mistDim, fontStyle: "italic", display: "flex" }}>
              &quot;{crown.status_message}&quot;
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "row", marginTop: "auto" }}>
          <span
            style={{
              fontSize: 8,
              color: c.mistFaint,
              opacity: 0.4,
              letterSpacing: "4px",
              display: "flex",
            }}
          >
            CROWN GUILD OFFICIAL POSTING
          </span>
        </div>
      </div>
    </div>
  );
}
