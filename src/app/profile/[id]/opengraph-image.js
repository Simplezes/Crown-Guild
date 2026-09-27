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

const c = {
  void: '#08070a',
  voidPanel: '#151217',
  voidRaised: '#1e1a20',
  ember: '#c9a24a',
  emberBright: '#e8cc7d',
  mist: '#c9c2b8',
  mistDim: '#8a8378',
  mistFaint: '#5c564e',
  blue: '#7ab8d4',
  blood: '#d3554f',
  border: 'rgba(255,255,255,0.08)',
  borderEmber: 'rgba(201,162,74,0.3)',
};

export default async function Image({ params }) {
  const { id } = await params;
  const data = await getProfileData(id);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: c.void,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: c.mist,
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
  const masteryPct = Math.max(0, Math.min(100, progress));
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

  return new ImageResponse(
    (
      <div
        style={{
          background: c.void,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 85% 50%, rgba(201,162,74,0.14) 0%, transparent 60%)' }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '360px',
            flexShrink: 0,
            borderRight: `1px solid ${c.border}`,
            padding: '48px 32px',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `linear-gradient(to bottom, ${c.ember}, transparent 80%)` }} />

          <div style={{ display: 'flex', width: '160px', height: '160px', borderRadius: '50%', border: `4px solid ${c.borderEmber}`, flexShrink: 0, overflow: 'hidden', boxShadow: `0 0 40px rgba(201,162,74,0.2)` }}>
            <img src={avatarUrl} width={152} height={152} style={{ objectFit: 'cover', borderRadius: '50%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: 36, color: c.mist, fontFamily: 'serif', display: 'flex', textAlign: 'center', lineHeight: '1' }}>{user.username}</span>
            <div style={{ display: 'flex', flexDirection: 'row', background: 'rgba(201,162,74,0.15)', border: `1px solid ${c.borderEmber}`, padding: '6px 20px', borderRadius: '24px' }}>
              <span style={{ fontSize: 10, color: c.ember, letterSpacing: '4px', fontWeight: 'bold', display: 'flex' }}>{userRank.toUpperCase()}</span>
            </div>
            <span style={{ fontSize: 12, color: c.mistFaint, display: 'flex' }}>MEMBER ID: {user.id}</span>
          </div>

          <div style={{ display: 'flex', width: '100%', height: '1px', background: c.border, margin: '4px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 10, color: c.ember, letterSpacing: '4px', display: 'flex', fontWeight: 'bold' }}>HUNTER MASTERY</span>
              <span style={{ fontSize: 16, color: c.emberBright, fontWeight: 'bold', display: 'flex', lineHeight: '1' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${c.border}` }}>
              <div style={{ display: 'flex', height: '100%', width: `${masteryPct}%`, background: `linear-gradient(to right, ${c.ember}, ${c.emberBright})` }} />
            </div>
            {nextRank && (
              <span style={{ fontSize: 10, color: c.mistFaint, display: 'flex' }}>
                {Math.max(0, Number(nextRank.minPoints || 0) - safeMasteryPoints)} MP to {nextRank.title}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', width: '100%', height: '1px', background: c.border, margin: '4px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 8, color: c.mistFaint, letterSpacing: '3px', display: 'flex' }}>HOSTED</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: c.mist, display: 'flex', lineHeight: '1' }}>{activity?.hosted || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 8, color: c.mistFaint, letterSpacing: '3px', display: 'flex' }}>JOINED</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: c.mist, display: 'flex', lineHeight: '1' }}>{activity?.joined || 0}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: `1px solid ${c.border}`, paddingBottom: '24px', marginBottom: '24px' }}>
            <span style={{ fontSize: 12, color: c.ember, letterSpacing: '6px', fontWeight: 'bold', display: 'flex' }}>OFFICIAL RECORDS</span>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '48px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>GUILD MISSIONS</span>
                  <span style={{ fontSize: 44, fontWeight: 'bold', color: c.mist, display: 'flex', lineHeight: '1' }}>{Number(activity?.hosted || 0) + Number(activity?.joined || 0)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>WISHLIST</span>
                  <span style={{ fontSize: 44, fontWeight: 'bold', color: c.blue, display: 'flex', lineHeight: '1' }}>{wishlistCount}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <span style={{ fontSize: 12, color: c.ember, letterSpacing: '4px', fontWeight: 'bold', display: 'flex' }}>MASTERY POINTS</span>
                <span style={{ fontSize: 80, fontWeight: 'bold', color: c.emberBright, display: 'flex', lineHeight: '0.85', textShadow: `0 4px 30px rgba(201,162,74,0.4)` }}>
                  {safeMasteryPoints}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', border: `1px solid ${c.border}`, borderRadius: '12px' }}>
                <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '2px', marginBottom: '8px', display: 'flex' }}>CROWNS COLLECTED</span>
                <span style={{ fontSize: 40, fontWeight: 'bold', color: c.mist, display: 'flex' }}>{stats.total || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', border: `1px solid ${c.border}`, borderRadius: '12px' }}>
                <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '2px', marginBottom: '8px', display: 'flex' }}>LARGE / SMALL</span>
                <span style={{ fontSize: 40, fontWeight: 'bold', display: 'flex' }}>
                  <span style={{ color: c.ember, display: 'flex' }}>{stats.large || 0}</span>
                  <span style={{ color: c.mistFaint, display: 'flex', margin: '0 8px' }}>/</span>
                  <span style={{ color: c.blue, display: 'flex' }}>{stats.small || 0}</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px', border: `1px solid ${c.border}`, borderRadius: '12px' }}>
                <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '2px', marginBottom: '8px', display: 'flex' }}>TEMPERED</span>
                <span style={{ fontSize: 40, fontWeight: 'bold', color: c.blood, display: 'flex' }}>{stats.tempered || 0}</span>
              </div>
            </div>

            {topAssist && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  background: 'rgba(201,162,74,0.06)',
                  padding: '20px',
                  border: `1px solid ${c.border}`,
                  borderRadius: '12px',
                }}
              >
                {topAssistImageOk && (
                  <img src={`${baseUrl}/monsters/${topAssist.image_name}`} width={72} height={72} style={{ marginRight: '20px', objectFit: 'contain' }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, color: c.ember, letterSpacing: '2px', fontWeight: 'bold', display: 'flex' }}>TOP ASSIST</span>
                  <span style={{ fontSize: 24, color: c.mist, display: 'flex' }}>{topAssist.name}</span>
                  <span style={{ fontSize: 12, color: c.mistFaint, display: 'flex' }}>SHARED {topAssist.count} TIMES</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '20px' }}>
            <span style={{ fontSize: 12, color: c.mistFaint, opacity: 0.6, letterSpacing: '3px', display: 'flex' }}>CROWN GUILD OFFICIAL RECORD</span>
            <span style={{ fontSize: 12, color: c.mistFaint, opacity: 0.6, letterSpacing: '3px', display: 'flex' }}>© 2026 CROWN GUILD</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
