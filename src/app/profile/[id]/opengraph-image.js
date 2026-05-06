import { ImageResponse } from 'next/og';
import { getProfileData, getRankProgress } from "@/lib/profile";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const alt = 'Hunter Card';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }) {
  const { id } = await params;
  const data = await getProfileData(id);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: '#0c0a09',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d4c4a1',
          }}
        >
          Hunter Not Found
        </div>
      ),
      { ...size }
    );
  }

  const { user, stats, activity, topAssist, wishlist, masteryPoints } = data;
  const safeMasteryPoints = Number(masteryPoints || 0);
  const { currentRank, nextRank, progress } = getRankProgress(safeMasteryPoints);
  const userRank = currentRank?.title || 'Fledgling';
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let avatarUrl = user.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`;
  if (avatarUrl.includes('cdn.discordapp.com') && avatarUrl.endsWith('.webp')) {
    avatarUrl = avatarUrl.replace('.webp', '.png');
  }

  let topAssistImageOk = false;
  if (topAssist?.image_name) {
    try {
      const res = await fetch(`${baseUrl}/monsters/${topAssist.image_name}`, { method: 'HEAD' });
      const ct = res.headers.get('content-type') || '';
      topAssistImageOk = !ct.includes('webp');
    } catch {
      topAssistImageOk = false;
    }
  }

  const colors = {
    black: '#0c0a09',
    umber: '#1a1614',
    tan: '#d4c4a1',
    tanDark: '#a1937a',
    gold: '#b59a5d',
    goldBright: '#e0cc96',
    red: '#8b2e2e',
    border: 'rgba(61, 52, 45, 0.6)',
    glass: 'rgba(12, 10, 9, 0.85)',
  };

  return new ImageResponse(
    (
      <div
        style={{
          background: colors.black,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          color: colors.tan,
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.15,
            backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.gold} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: colors.glass,
            border: `1px solid ${colors.border}`,
            position: 'relative',
            padding: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '4px',
              background: `linear-gradient(to bottom, ${colors.red}, transparent)`,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <img
              src={`${baseUrl}/icons/MHWilds-Expedition_Record_Board_Icon.png`}
              width={44}
              height={44}
              style={{ marginRight: '15px' }}
            />
            <span style={{ fontSize: 28, letterSpacing: '4px', color: colors.gold, display: 'flex' }}>
              HUNTER CARD
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '35%',
                alignItems: 'center',
                paddingRight: '40px',
                borderRight: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  border: `1px solid ${colors.border}`,
                  padding: '4px',
                  display: 'flex',
                }}
              >
                <img
                  src={avatarUrl}
                  width={190}
                  height={190}
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '25px' }}>
                <span
                  style={{
                    fontSize: 42,
                    color: colors.goldBright,
                    textAlign: 'center',
                    marginBottom: '5px',
                    display: 'flex'
                  }}
                >
                  {user.username}
                </span>
                <span
                  style={{
                    fontSize: 18,
                    color: colors.gold,
                    letterSpacing: '2px',
                    fontWeight: 'bold',
                    display: 'flex'
                  }}
                >
                  {userRank}
                </span>
                <span style={{ fontSize: 14, color: colors.tanDark, marginTop: '10px', display: 'flex' }}>
                  MEMBER ID: {user.id}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '65%',
                paddingLeft: '50px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', gap: '30px', marginBottom: '35px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    padding: '15px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <span style={{ fontSize: 14, color: colors.tanDark, marginBottom: '5px', display: 'flex' }}>CROWNS COLLECTED</span>
                  <span style={{ fontSize: 36, fontWeight: 'bold', color: '#fff', display: 'flex' }}>{stats.total || 0}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    padding: '15px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <span style={{ fontSize: 14, color: colors.tanDark, marginBottom: '5px', display: 'flex' }}>GUILD MISSIONS</span>
                  <span style={{ fontSize: 36, fontWeight: 'bold', color: '#fff', display: 'flex' }}>{Number(activity.hosted || 0) + Number(activity.joined || 0)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', gap: '30px', marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    padding: '15px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <span style={{ fontSize: 14, color: colors.tanDark, marginBottom: '5px', display: 'flex' }}>MASTERY POINTS</span>
                  <span style={{ fontSize: 30, fontWeight: 'bold', color: colors.goldBright, display: 'flex' }}>{safeMasteryPoints}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    padding: '15px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <span style={{ fontSize: 14, color: colors.tanDark, marginBottom: '5px', display: 'flex' }}>WISHLIST TARGETS</span>
                  <span style={{ fontSize: 30, fontWeight: 'bold', color: colors.goldBright, display: 'flex' }}>{wishlistCount}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: 14, color: colors.tanDark, display: 'flex' }}>MASTERY PROGRESS</span>
                  <span style={{ fontSize: 18, color: colors.gold, fontWeight: 'bold', display: 'flex' }}>{Math.round(progress)}%</span>
                </div>
                <div
                  style={{
                    height: '10px',
                    width: '100%',
                    background: colors.umber,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(0, Math.min(100, progress))}%`,
                      background: colors.gold,
                    }}
                  />
                </div>
                {nextRank && (
                  <span style={{ fontSize: 12, color: colors.tanDark, marginTop: '6px', display: 'flex' }}>
                    {Math.max(0, Number(nextRank.minPoints || 0) - safeMasteryPoints)} to {nextRank.title}
                  </span>
                )}
              </div>

              {topAssist && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    background: 'rgba(181, 154, 93, 0.05)',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {topAssistImageOk && (
                    <img
                      src={`${baseUrl}/monsters/${topAssist.image_name}`}
                      width={80}
                      height={80}
                      style={{ marginRight: '20px' }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, color: colors.gold, fontWeight: 'bold', display: 'flex' }}>TOP ASSIST</span>
                    <span style={{ fontSize: 24, color: colors.tan, display: 'flex' }}>{topAssist.name}</span>
                    <span style={{ fontSize: 14, color: colors.tanDark, display: 'flex' }}>SHARED {topAssist.count} TIMES</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', opacity: 0.5 }}>
                <span style={{ fontSize: 14, display: 'flex' }}>CROWN GUILD OFFICIAL RECORD</span>
                <span style={{ fontSize: 14, display: 'flex' }}>© 2026 CROWN GUILD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
