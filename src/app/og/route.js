import { ImageResponse } from 'next/og';
import db from '@/lib/db';

export const runtime = 'edge';

async function getGuildData(baseUrl) {
  const [crownsRes, statsRes] = await Promise.all([
    db.execute(`
      SELECT c.type, c.pair_id, m.name, m.image_name
      FROM crowns c
      JOIN monsters m ON c.monster_id = m.id
    `),
    db.execute(`
      SELECT
        COUNT(*)                                        AS total_crowns,
        COUNT(DISTINCT c.user_id)                       AS total_hunters,
        COUNT(DISTINCT c.monster_id)                    AS unique_monsters,
        SUM(CASE WHEN c.type = 'small' THEN 1 ELSE 0 END) AS small,
        SUM(CASE WHEN c.type = 'large' THEN 1 ELSE 0 END) AS large,
        SUM(CASE WHEN c.tempered = 1   THEN 1 ELSE 0 END) AS tempered
      FROM crowns c
    `),
  ]);

  const crowns = crownsRes.rows;
  const guildStats = statsRes.rows[0];
  const monsterData = {};
  const smallSet = new Set();
  const largeSet = new Set();

  for (const c of crowns) {
    monsterData[c.name] = { name: c.name, image_name: c.image_name };
    if (c.type === 'small') smallSet.add(c.name);
    if (c.type === 'large') largeSet.add(c.name);
  }

  const smallOnly = [...smallSet].map(n => monsterData[n]);
  const largeOnly = [...largeSet].map(n => monsterData[n]);
  const all       = [...new Set([...smallSet, ...largeSet])].map(n => monsterData[n]);

  const uniqueNames = [...new Set(all.map(m => m.image_name).filter(Boolean))];
  const validImageSet = new Set(
    (await Promise.all(
      uniqueNames.map(async (name) => {
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

  return {
    guildStats,
    smallOnly: filterValid(smallOnly),
    largeOnly: filterValid(largeOnly),
  };
}

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const { guildStats, smallOnly, largeOnly } = await getGuildData(baseUrl);

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

  const iconGap = 4;
  const availW = 819;
  const availH = 486;
  const iconSizeCandidates = [96, 80, 72, 64, 56, 48, 40, 32];
  const groups = [smallOnly.length, largeOnly.length].filter(n => n > 0);
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

  const renderGroup = (label, items) => {
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

  const size = { width: 1200, height: 630 };

  return new ImageResponse(
    (
      <div style={{
        background: colors.black,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px',
        color: colors.tan,
        fontFamily: 'serif',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.gold} 1px, transparent 0)`, backgroundSize: '28px 28px' }} />

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          background: colors.glass,
          border: `1px solid ${colors.border}`,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `linear-gradient(to bottom, ${colors.red}, transparent)` }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '22px 16px 22px 28px',
            borderRight: `1px solid ${colors.border}`,
            gap: '10px',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
              <img src={`${baseUrl}/icons/MHWilds-Expedition_Record_Board_Icon.png`} width={24} height={24} style={{ imageRendering: 'pixelated' }} />
              <span style={{ fontSize: 16, letterSpacing: '4px', color: colors.gold, display: 'flex' }}>GUILD CROWN REGISTRY</span>
              <span style={{ fontSize: 11, color: colors.tanDark, marginLeft: '6px', display: 'flex' }}>
                — {[...new Set([...smallOnly.map(m => m.name), ...largeOnly.map(m => m.name)])].length} species
              </span>
            </div>

            {renderGroup('SMALL', smallOnly)}
            {renderGroup('LARGE', largeOnly)}

            {(smallOnly.length + largeOnly.length) === 0 && (
              <span style={{ fontSize: 16, color: colors.tanDark, display: 'flex' }}>No crowns recorded yet.</span>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '280px',
            padding: '22px 20px',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={`${baseUrl}/icons/MHWilds-Hunt_Icon.png`} width={32} height={32} style={{ imageRendering: 'pixelated' }} />
                <span style={{ fontSize: 22, color: colors.goldBright, letterSpacing: '2px', display: 'flex', lineHeight: '1.1' }}>CROWN GUILD</span>
              </div>
              <span style={{ fontSize: 11, color: colors.tanDark, letterSpacing: '3px', display: 'flex' }}>OFFICIAL REGISTRY</span>
            </div>

            <div style={{ display: 'flex', height: '1px', background: colors.border }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>GUILD STATS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {[
                  { label: 'TOTAL CROWNS',   value: guildStats.total_crowns   || 0 },
                  { label: 'HUNTERS',        value: guildStats.total_hunters  || 0 },
                  { label: 'SPECIES',        value: guildStats.unique_monsters || 0 },
                  { label: 'LARGE',          value: guildStats.large           || 0 },
                  { label: 'SMALL',          value: guildStats.small           || 0 },
                  { label: 'TEMPERED',       value: guildStats.tempered        || 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', border: `1px solid ${colors.border}`, gap: '3px', flex: 1, minWidth: '70px' }}>
                    <span style={{ fontSize: 8, color: colors.tanDark, letterSpacing: '0.5px', display: 'flex' }}>{label}</span>
                    <span style={{ fontSize: 20, fontWeight: 'bold', color: colors.goldBright, display: 'flex' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', height: '1px', background: colors.border }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>BY CROWN TYPE</span>
              {[
                { label: 'SMALL', count: smallOnly.length, color: '#4a9fd4' },
                { label: 'LARGE', count: largeOnly.length, color: colors.gold },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>{label}</span>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color, display: 'flex' }}>{count}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', marginTop: 'auto' }}>
              <span style={{ fontSize: 10, color: colors.tanDark, opacity: 0.5, letterSpacing: '2px', display: 'flex' }}>© 2026 CROWN GUILD</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
