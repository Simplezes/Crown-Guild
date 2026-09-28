import { ImageResponse } from 'next/og';
import { getProfileData, getRankProgress, MASTERY_RANKS } from "@/lib/profile";

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
  panel: '#151217',
  raised: '#1e1a20',
  ember: '#c9a24a',
  emberB: '#e8cc7d',
  emberD: '#8a723a',
  mist: '#c9c2b8',
  mistD: '#948d82',
  faint: '#6b655c',
  blood: '#d3554f',
  tempered: '#b45ff0',
  line: 'rgba(255,255,255,0.07)',
  line2: 'rgba(255,255,255,0.12)',
};

function StatTile({ label, value, icon, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, background: c.void, border: `1px solid ${c.line}`, borderRadius: '14px', padding: '22px 8px', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <img src={icon} width={18} height={18} style={{ imageRendering: 'pixelated' }} />}
        <span style={{ fontSize: 28, fontWeight: 600, color: color || c.emberB, display: 'flex', lineHeight: '1' }}>{value}</span>
      </div>
      <span style={{ fontSize: 11, letterSpacing: '2px', color: c.mistD, textTransform: 'uppercase', display: 'flex' }}>{label}</span>
    </div>
  );
}

export default async function Image({ params }) {
  const { id } = await params;
  const data = await getProfileData(id);

  if (!data) {
    return new ImageResponse(
      (
        <div style={{ fontSize: 48, background: c.void, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.mist }}>
          Hunter Not Found
        </div>
      ),
      { ...size }
    );
  }

  const { user, stats, activity, wishlist, masteryPoints } = data;
  const safeMasteryPoints = Number(masteryPoints || 0);
  const { currentRank, nextRank } = getRankProgress(safeMasteryPoints);
  const rankIndex = currentRank?.rank || 1;
  const userRank = currentRank?.title || 'Fledgling';
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let avatarUrl = user.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`;
  if (avatarUrl.includes('cdn.discordapp.com') && avatarUrl.endsWith('.webp')) {
    avatarUrl = avatarUrl.replace('.webp', '.png');
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: `radial-gradient(60% 140% at 0% 0%, rgba(201,162,74,0.16) 0%, transparent 70%), ${c.void}`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          padding: '52px 60px',
          gap: '40px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '30px' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0, display: 'flex' }}>
            <img src={avatarUrl} width={150} height={150} style={{ objectFit: 'cover', borderRadius: '50%', border: `3px solid rgba(201,162,74,0.4)` }} />
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', width: '62px', height: '62px', borderRadius: '50%', background: c.panel, border: `3px solid ${c.panel}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={`${baseUrl}/rank-icons/rk${rankIndex}.png`} width={56} height={56} style={{ display: 'flex' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 54, color: c.mist, fontFamily: 'serif', textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: '1.05', display: 'flex' }}>{user.username}</span>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '14px', alignItems: 'center' }}>
              <span style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', color: c.emberB, border: `1px solid rgba(201,162,74,0.4)`, background: 'rgba(201,162,74,0.12)', borderRadius: '99px', padding: '4px 14px', display: 'flex' }}>{userRank}</span>
              <span style={{ fontSize: 13, color: c.faint, display: 'flex' }}>ID {user.id}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
            <span style={{ fontSize: 64, fontWeight: 400, color: c.emberB, fontFamily: 'serif', lineHeight: '1', display: 'flex' }}>{safeMasteryPoints}</span>
            <span style={{ fontSize: 11, letterSpacing: '3px', color: c.mistD, textTransform: 'uppercase', display: 'flex' }}>Mastery Points</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
          <StatTile label="Crowns" value={stats.total || 0} />
          <StatTile label="Large" value={stats.large || 0} icon={`${baseUrl}/icons/largecrown.png`} />
          <StatTile label="Small" value={stats.small || 0} icon={`${baseUrl}/icons/smallcrown.png`} />
          <StatTile label="Tempered" value={stats.tempered || 0} color={c.tempered} />
          <StatTile label="Missions" value={Number(activity?.hosted || 0) + Number(activity?.joined || 0)} />
          <StatTile label="Wishlist" value={wishlistCount} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, letterSpacing: '3px', color: c.mistD, textTransform: 'uppercase', display: 'flex' }}>Mastery Ladder</span>
            {nextRank && (
              <span style={{ fontSize: 13, color: c.mistD, display: 'flex' }}>
                <span style={{ color: c.emberB, fontWeight: 600, marginRight: '5px', display: 'flex' }}>{Math.max(0, Number(nextRank.minPoints || 0) - safeMasteryPoints)} MP</span>
                to reach {nextRank.title}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', background: c.raised, border: `1px solid ${c.line}`, borderRadius: '18px', padding: '22px 18px' }}>
            {MASTERY_RANKS.map((r) => {
              const cur = r.rank === rankIndex;
              const lock = r.rank > rankIndex;
              return (
                <div
                  key={r.rank}
                  style={{
                    display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '14px',
                    background: cur ? 'rgba(201,162,74,0.14)' : 'transparent',
                    border: cur ? `2px solid ${c.ember}` : '2px solid transparent',
                  }}
                >
                  <img
                    src={`${baseUrl}/rank-icons/rk${r.rank}.png`}
                    width={46}
                    height={46}
                    style={{ display: 'flex', opacity: lock ? 0.3 : 1, filter: lock ? 'grayscale(1)' : 'none' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
