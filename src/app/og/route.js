import { ImageResponse } from 'next/og';
import db from '@/lib/db';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

async function urlToDataUrl(url, fallbackMime = 'image/png') {
  const parsedUrl = new URL(url);
  const isLocal = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  if (isLocal) {
    const bytes = new Uint8Array(await readFile(path.join(process.cwd(), 'public', parsedUrl.pathname.replace(/^\
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${fallbackMime};base64,${btoa(binary)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${url}`);
  const mime = res.headers.get('content-type') || fallbackMime;
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(binary)}`;
}

async function getGuildData(baseUrl) {
  const [crownsRes, statsRes] = await Promise.all([
    db.execute(`SELECT c.type, m.name, m.image_name FROM crowns c JOIN monsters m ON c.monster_id = m.id`),
    db.execute(`
      SELECT COUNT(*) AS total_crowns, COUNT(DISTINCT c.user_id) AS total_hunters,
        COUNT(DISTINCT c.monster_id) AS unique_monsters,
        SUM(CASE WHEN c.type='small' THEN 1 ELSE 0 END) AS small,
        SUM(CASE WHEN c.type='large' THEN 1 ELSE 0 END) AS large,
        SUM(CASE WHEN c.tempered=1 THEN 1 ELSE 0 END) AS tempered
      FROM crowns c
    `),
  ]);

  const crowns = crownsRes.rows;
  const guildStats = statsRes.rows[0];
  const monsterData = {};
  const smallSet = new Set();
  const largeSet = new Set();

  for (const cr of crowns) {
    monsterData[cr.name] = { name: cr.name, image_name: cr.image_name };
    if (cr.type === 'small') smallSet.add(cr.name);
    if (cr.type === 'large') largeSet.add(cr.name);
  }

  const smallOnly = [...smallSet].map(n => monsterData[n]);
  const largeOnly = [...largeSet].map(n => monsterData[n]);
  const all = [...new Set([...smallSet, ...largeSet])].map(n => monsterData[n]);

  const uniqueNames = [...new Set(all.map(m => m.image_name).filter(Boolean))];
  const validImageSet = new Set(
    (await Promise.all(uniqueNames.map(async n => {
      try { const r = await fetch(`${baseUrl}/monsters/${n}`, { method: 'HEAD' }); return (r.headers.get('content-type') || '').includes('webp') ? null : n; }
      catch { return null; }
    }))).filter(Boolean)
  );
  const filterValid = list => list.filter(m => !m.image_name || validImageSet.has(m.image_name));

  const huntIconUrl = await urlToDataUrl(`${baseUrl}/icons/MHWilds-Hunt_Icon.png`);
  const monsterImageUrlMap = new Map();
  for (const m of [...smallOnly, ...largeOnly]) {
    if (!m.image_name) continue;
    const u = `${baseUrl}/monsters/${m.image_name}`;
    if (!monsterImageUrlMap.has(u)) monsterImageUrlMap.set(u, await urlToDataUrl(u));
  }

  return { guildStats, smallOnly: filterValid(smallOnly), largeOnly: filterValid(largeOnly), huntIconUrl, monsterImageUrlMap };
}

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const { guildStats, smallOnly, largeOnly, huntIconUrl, monsterImageUrlMap } = await getGuildData(baseUrl);

  const c = {
    void: '#08070a', voidPanel: '#0f0d12', voidRaised: '#1a1720',
    ember: '#c9a24a', emberBright: '#e8cc7d',
    mist: '#c9c2b8', mistDim: '#8a8378', mistFaint: '#4e4840',
    blue: '#7ab8d4', blood: '#c0392b',
    border: 'rgba(255,255,255,0.07)', borderEmber: 'rgba(201,162,74,0.3)',
  };

  
  const iconGap = 3;
  const availW = 1200 - 220 - 60; 
  const availH = 630 - 130 - 48; 
  const iconSizeCandidates = [96, 84, 72, 64, 56, 48, 40, 32];
  const groups = [smallOnly.length, largeOnly.length].filter(n => n > 0);
  const iconSize = iconSizeCandidates.find(s => {
    const perRow = Math.floor(availW / (s + iconGap));
    if (perRow === 0) return false;
    let h = 0;
    for (let i = 0; i < groups.length; i++) { if (i > 0) h += 10; h += 20; h += Math.ceil(groups[i] / perRow) * (s + iconGap); }
    return h <= availH;
  }) ?? 28;

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 8, color: c.ember, letterSpacing: '3px', fontWeight: 'bold', display: 'flex', flexShrink: 0 }}>{label}</span>
          <span style={{ fontSize: 8, color: c.mistFaint, display: 'flex', flexShrink: 0 }}>×{items.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: `${iconGap}px` }}>
          {items.map(m => (
            <div key={m.name} style={{ width: iconSize, height: iconSize, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.voidRaised, borderRadius: '4px', border: `1px solid ${c.border}` }}>
              <img src={monsterImageUrlMap.get(`${baseUrl}/monsters/${m.image_name}`)} width={iconSize - 6} height={iconSize - 6} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const total = Number(guildStats.total_crowns || 0);
  const hunters = Number(guildStats.total_hunters || 0);
  const species = Number(guildStats.unique_monsters || 0);
  const large = Number(guildStats.large || 0);
  const small = Number(guildStats.small || 0);
  const tempered = Number(guildStats.tempered || 0);

  return new ImageResponse(
    (
      <div style={{ background: c.void, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 20% 0%, rgba(201,162,74,0.18) 0%, transparent 50%)' }} />

        
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '130px', flexShrink: 0, paddingLeft: '40px', paddingRight: '40px', borderBottom: `1px solid ${c.border}`, gap: '0px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', paddingRight: '40px', borderRight: `1px solid ${c.border}`, height: '100%', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
              <img src={huntIconUrl} width={32} height={32} style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
              <span style={{ fontSize: 26, color: c.emberBright, letterSpacing: '3px', display: 'flex', fontFamily: 'serif', lineHeight: '1' }}>CROWN GUILD</span>
            </div>
            <span style={{ fontSize: 8, color: c.mistFaint, letterSpacing: '5px', display: 'flex' }}>OFFICIAL CROWN REGISTRY</span>
          </div>

          
          {[
            { label: 'TOTAL CROWNS', value: total, color: c.emberBright },
            { label: 'HUNTERS', value: hunters, color: c.mist },
            { label: 'SPECIES CROWNED', value: species, color: c.mist },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px', paddingLeft: '40px', paddingRight: i < 2 ? '40px' : '0px', borderRight: i < 2 ? `1px solid ${c.border}` : 'none', height: '100%', flex: 1 }}>
              <span style={{ fontSize: 8, color: c.mistFaint, letterSpacing: '3px', display: 'flex' }}>{label}</span>
              <span style={{ fontSize: 48, fontWeight: 'bold', color, display: 'flex', lineHeight: '1' }}>{value}</span>
            </div>
          ))}
        </div>

        
        <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '22px 24px 22px 40px', gap: '14px', overflow: 'hidden' }}>
            {renderGroup('SMALL CROWNS', smallOnly)}
            {renderGroup('LARGE CROWNS', largeOnly)}
            {!smallOnly.length && !largeOnly.length && (
              <span style={{ fontSize: 16, color: c.mistDim, display: 'flex' }}>No crowns recorded yet.</span>
            )}
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', width: '220px', flexShrink: 0, borderLeft: `1px solid ${c.border}`, padding: '22px 22px', gap: '0px', overflow: 'hidden' }}>
            <span style={{ fontSize: 8, color: c.ember, letterSpacing: '3px', display: 'flex', marginBottom: '14px' }}>BREAKDOWN</span>

            {[
              { label: 'LARGE', value: large, color: c.ember, pct: Math.min(100, total > 0 ? (large / total) * 100 : 0) },
              { label: 'SMALL', value: small, color: c.blue, pct: Math.min(100, total > 0 ? (small / total) * 100 : 0) },
              { label: 'TEMPERED', value: tempered, color: '#d3554f', pct: Math.min(100, total > 0 ? (tempered / total) * 100 : 0) },
            ].map(({ label, value, color, pct }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 8, color: c.mistFaint, letterSpacing: '2px', display: 'flex' }}>{label}</span>
                  <span style={{ fontSize: 34, fontWeight: 'bold', color, display: 'flex', lineHeight: '1' }}>{value}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', height: '3px', background: c.voidRaised, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', marginTop: 'auto' }}>
              <span style={{ fontSize: 7, color: c.mistFaint, opacity: 0.4, letterSpacing: '2px', display: 'flex' }}>© 2026 CROWN GUILD</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
