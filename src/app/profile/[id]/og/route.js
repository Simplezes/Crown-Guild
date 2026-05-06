import { ImageResponse } from 'next/og';
import { getProfileData, getRankProgress } from "@/lib/profile";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const { user, crowns, stats, activity, topAssist, wishlist, masteryPoints } = data;
  const wishlistItems = Array.isArray(wishlist) ? wishlist : [];
  const safeMasteryPoints = Number(masteryPoints || 0);
  const { currentRank, nextRank, progress } = getRankProgress(safeMasteryPoints);
  const userRank = currentRank?.title || 'Fledgling';
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


  const uniqueImageNames = [...new Set([
    ...allMonsters.map(m => m.image_name),
    ...wishlistItems.map(w => w.image_name),
  ].filter(Boolean))];
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

  const iconGap = 4;
  const availW = 799;
  const availH = 486;
  const iconSizeCandidates = [96, 80, 72, 64, 56, 48, 40, 32];
  const groups = [smallOnly.length, largeOnly.length, multi.length].filter(n => n > 0);
  const iconSize = iconSizeCandidates.find(s => {
    const perRow = Math.floor(availW / (s + iconGap));
    if (perRow === 0) return false;
    let h = 0;
    for (let i = 0; i < groups.length; i++) {
      if (i > 0) h += 10;
      h += 24;
      h += Math.ceil(groups[i] / perRow) * (s + iconGap);
    }
    return h <= availH;
  }) ?? 32;

  const renderGroup = (label, rawItems) => {
    const items = filterValid(rawItems);
    if (items.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', fontWeight: 'bold', display: 'flex' }}>{label}</span>
          <span style={{ fontSize: 9, color: colors.tanDark, display: 'flex' }}>×{items.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: `${iconGap}px` }}>
          {items.map(m => (
            <div key={m.name} style={{ width: iconSize, height: iconSize, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}>
              <img src={`${baseUrl}/monsters/${m.image_name}`} width={iconSize - 4} height={iconSize - 4} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const wishlistPreview = filterValid(wishlistItems).slice(0, 8);
  const statusMessage = String(user.status_message || '').trim();
  const statusPreview = statusMessage.length > 80 ? `${statusMessage.slice(0, 77)}...` : statusMessage;

  return new ImageResponse(
    (
      <div
        style={{
          background: colors.black,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '22px',
          color: colors.tan,
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.gold} 1px, transparent 0)`, backgroundSize: '28px 28px' }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            background: colors.glass,
            border: `1px solid ${colors.border}`,
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `linear-gradient(to bottom, ${colors.red}, transparent)` }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '18px 12px 18px 22px',
            borderRight: `1px solid ${colors.border}`,
            gap: '8px',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
              <img src={`${baseUrl}/icons/MHWilds-Expedition_Record_Board_Icon.png`} width={24} height={24} style={{ imageRendering: 'pixelated' }} />
              <span style={{ fontSize: 16, letterSpacing: '4px', color: colors.gold, display: 'flex' }}>CROWN REGISTRY</span>
              <span style={{ fontSize: 11, color: colors.tanDark, marginLeft: '6px', display: 'flex' }}>— {allMonsters.length} species</span>
            </div>

            {renderGroup('SMALL', smallOnly)}
            {renderGroup('LARGE', largeOnly)}
            {renderGroup('S & L', multi)}

            {allMonsters.length === 0 && (
              <span style={{ fontSize: 16, color: colors.tanDark, display: 'flex' }}>No crowns recorded yet.</span>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '286px',
            padding: '16px 14px',
            gap: '8px',
          }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '58px', height: '58px', border: `1px solid ${colors.border}`, display: 'flex', flexShrink: 0 }}>
                <img src={avatarUrl} width={58} height={58} style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: 20, color: colors.goldBright, display: 'flex', lineHeight: '1.1' }}>{user.username}</span>
                <div style={{ display: 'flex', background: colors.umber, padding: '3px 8px', border: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '1px', display: 'flex' }}>{userRank.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {statusPreview && (
              <div style={{ display: 'flex', padding: '8px 10px', background: 'rgba(181,154,93,0.05)', borderLeft: `2px solid ${colors.gold}` }}>
                <span style={{ fontSize: 12, color: colors.tan, fontStyle: 'italic', display: 'flex' }}>"{statusPreview}"</span>
              </div>
            )}

            <div style={{ display: 'flex', height: '1px', background: colors.border }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>CROWN STATS</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[
                  { label: 'TOTAL',    value: stats.total    || 0, color: colors.goldBright },
                  { label: 'LARGE',    value: stats.large    || 0, color: colors.gold },
                  { label: 'SMALL',    value: stats.small    || 0, color: colors.gold },
                  { label: 'TEMPERED', value: stats.tempered || 0, color: '#e06060' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 4px', border: `1px solid ${colors.border}`, flex: 1, gap: '2px' }}>
                    <span style={{ fontSize: 8, color: colors.tanDark, letterSpacing: '0.5px', display: 'flex' }}>{label}</span>
                    <span style={{ fontSize: 18, fontWeight: 'bold', color, display: 'flex' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', height: '1px', background: colors.border }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>MASTERY</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>RANK PROGRESS</span>
                  <span style={{ fontSize: 12, color: colors.goldBright, fontWeight: 'bold', display: 'flex' }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ display: 'flex', height: '6px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', height: '100%', width: `${Math.max(0, Math.min(100, progress))}%`, background: `linear-gradient(to right, ${colors.gold}, ${colors.goldBright})` }} />
                </div>
                {nextRank && (
                  <span style={{ fontSize: 9, color: colors.tanDark, display: 'flex' }}>
                    {Math.max(0, Number(nextRank.minPoints || 0) - safeMasteryPoints)} to {nextRank.title}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', height: '1px', background: colors.border }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>GUILD ACTIVITY</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: 'HUNTS HOSTED', value: activity.hosted || 0 },
                  { label: 'HUNTS JOINED', value: activity.joined || 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 4px', border: `1px solid ${colors.border}`, gap: '3px' }}>
                    <span style={{ fontSize: 8, color: colors.tanDark, letterSpacing: '0.5px', display: 'flex' }}>{label}</span>
                    <span style={{ fontSize: 22, fontWeight: 'bold', color: colors.goldBright, display: 'flex' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {topAssist && (
              <>
                <div style={{ display: 'flex', height: '1px', background: colors.border }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>TOP ASSIST</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', border: `1px solid ${colors.border}` }}>
                    {topAssist.image_name && (
                      <img src={`${baseUrl}/monsters/${topAssist.image_name}`} width={36} height={36} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: 13, color: colors.tan, display: 'flex' }}>{topAssist.name}</span>
                      <span style={{ fontSize: 10, color: colors.tanDark, display: 'flex' }}>{topAssist.count}× hosted</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {wishlistItems.length > 0 && (
              <>
                <div style={{ display: 'flex', height: '1px', background: colors.border }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>WISHLIST</span>
                    <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>{wishlistItems.length} monsters</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {wishlistPreview.map((item) => (
                      <div key={item.monster_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.03)', padding: '3px 6px', minWidth: '92px' }}>
                        <img src={`${baseUrl}/monsters/${item.image_name}`} width={24} height={24} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                        <span style={{ fontSize: 9, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>
                          {item.type === 'both' ? 'Small & Large' : item.type === 'small' ? 'Small' : 'Large'}
                        </span>
                      </div>
                    ))}
                    {wishlistItems.length > wishlistPreview.length && (
                      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.03)', padding: '3px 6px' }}>
                        <span style={{ fontSize: 9, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>+{wishlistItems.length - wishlistPreview.length} more</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', marginTop: 'auto', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10, color: colors.tanDark, opacity: 0.5, letterSpacing: '2px', display: 'flex' }}>CROWN GUILD</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}




