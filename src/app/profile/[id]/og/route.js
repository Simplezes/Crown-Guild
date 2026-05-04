import { ImageResponse } from 'next/og';
import { getProfileData, getHunterRank } from "@/lib/profile";

export const runtime = 'edge';

export async function GET(request, { params }) {
  const { id } = await params;
  const data = await getProfileData(id);

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

  const size = {
    width: 1200,
    height: 630,
  };

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: colors.black,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.tan,
          }}
        >
          Hunter Not Found
        </div>
      ),
      { ...size }
    );
  }

  const { user, crowns, stats, activity, completion, topAssist } = data;
  const userRank = getHunterRank(activity.hosted || 0, activity.joined || 0);
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const linkedNames = new Set();
  const pairMap = {};

  for (const crown of (crowns || [])) {
    if (crown.pair_id) {
      if (!pairMap[crown.pair_id]) pairMap[crown.pair_id] = [];
      pairMap[crown.pair_id].push(crown);
    }
  }
  for (const pair of Object.values(pairMap)) {
    const perName = {};
    for (const c of pair) {
      if (!perName[c.name]) perName[c.name] = { small: false, large: false };
      if (c.type === 'small') perName[c.name].small = true;
      if (c.type === 'large') perName[c.name].large = true;
    }
    for (const [name, types] of Object.entries(perName)) {
      if (types.small && types.large) linkedNames.add(name);
    }
  }

  const byMonster = {};
  for (const crown of (crowns || [])) {
    if (!byMonster[crown.name]) {
      byMonster[crown.name] = { name: crown.name, image_name: crown.image_name, small: false, large: false, linked: false };
    }
    if (crown.type === 'small') byMonster[crown.name].small = true;
    if (crown.type === 'large') byMonster[crown.name].large = true;
    if (linkedNames.has(crown.name)) byMonster[crown.name].linked = true;
  }
  const allMonsters = Object.values(byMonster);
  const multi      = allMonsters.filter(m => m.linked);
  const smallOnly  = allMonsters.filter(m => m.small && !m.linked);
  const largeOnly  = allMonsters.filter(m => m.large && !m.linked);
  const MAX_ROW    = 14;

  const uniqueImageNames = [...new Set(allMonsters.map(m => m.image_name).filter(Boolean))];
  const validImageSet = new Set(
    (await Promise.all(
      uniqueImageNames.map(async (name) => {
        try {
          const res = await fetch(`${baseUrl}/monsters/${name}`, { method: 'HEAD' });
          const ct = res.headers.get('content-type') || '';
          return ct.includes('webp') ? null : name;
        } catch {
          return null;
        }
      })
    )).filter(Boolean)
  );

  const filterValid = (list) => list.filter(m => !m.image_name || validImageSet.has(m.image_name));

  let avatarUrl = user.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`;
  if (avatarUrl.includes('cdn.discordapp.com') && avatarUrl.endsWith('.webp')) {
    avatarUrl = avatarUrl.replace('.webp', '.png');
  }

  const iconSize = 70;
  const iconGap  = 6;

  const renderGroup = (label, rawItems) => {
    const items = filterValid(rawItems);
    if (items.length === 0) return null;
    const visible = items.slice(0, MAX_ROW);
    const overflow = items.length - MAX_ROW;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 13, color: colors.gold, letterSpacing: '3px', fontWeight: 'bold', display: 'flex' }}>{label}</span>
          <span style={{ fontSize: 11, color: colors.tanDark, display: 'flex' }}>×{rawItems.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: `${iconGap}px` }}>
          {visible.map(m => (
            <div key={m.name} style={{ width: iconSize, height: iconSize, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}>
              <img src={`${baseUrl}/monsters/${m.image_name}`} width={iconSize - 6} height={iconSize - 6} style={{ objectFit: 'contain' }} />
            </div>
          ))}
          {overflow > 0 && (
            <div style={{ width: iconSize, height: iconSize, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', fontSize: 12, color: colors.tanDark }}>
              +{overflow}
            </div>
          )}
        </div>
      </div>
    );
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
          padding: '28px',
          color: colors.tan,
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.gold} 1px, transparent 0)`, backgroundSize: '28px 28px' }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: colors.glass,
            border: `1px solid ${colors.border}`,
            position: 'relative',
            padding: '24px 28px',
            gap: '0px',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `linear-gradient(to bottom, ${colors.red}, transparent)` }} />

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <img src={`${baseUrl}/icons/MHWilds-Expedition_Record_Board_Icon.png`} width={30} height={30} />
              <span style={{ fontSize: 22, letterSpacing: '4px', color: colors.gold, display: 'flex' }}>CROWN IN STOCK</span>
              <span style={{ fontSize: 14, color: colors.tanDark, marginLeft: '8px', display: 'flex' }}>— {allMonsters.length} monsters</span>
            </div>

            {renderGroup('SMALL', smallOnly)}
            {renderGroup('LARGE', largeOnly)}
            {renderGroup('S & L', multi)}

            {allMonsters.length === 0 && (
              <span style={{ fontSize: 18, color: colors.tanDark, display: 'flex' }}>No crowns recorded yet.</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, marginTop: '16px' }}>
            <div style={{ width: '72px', height: '72px', border: `1px solid ${colors.border}`, display: 'flex', flexShrink: 0 }}>
              <img src={avatarUrl} width={72} height={72} style={{ objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: 'auto' }}>
              <span style={{ fontSize: 30, color: colors.goldBright, display: 'flex' }}>{user.username}</span>
              <span style={{ fontSize: 13, color: colors.gold, letterSpacing: '2px', display: 'flex' }}>{userRank}</span>
            </div>

            {[
              { label: 'CROWNS',     value: stats.total || 0 },
              { label: 'SMALL',      value: stats.small  || 0 },
              { label: 'LARGE',      value: stats.large  || 0 },
              { label: 'COMPLETION', value: `${completion}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', border: `1px solid ${colors.border}`, gap: '2px' }}>
                <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>{label}</span>
                <span style={{ fontSize: 22, fontWeight: 'bold', color: colors.goldBright, display: 'flex' }}>{value}</span>
              </div>
            ))}

            <span style={{ fontSize: 11, color: colors.tanDark, opacity: 0.5, display: 'flex', alignSelf: 'flex-end' }}>CROWN GUILD</span>
          </div>
        </div>
      </div>
    ),
    { ...size,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
