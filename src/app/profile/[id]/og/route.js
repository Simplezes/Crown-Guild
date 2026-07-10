import { ImageResponse } from 'next/og';
import { getProfileData, getRankProgress } from "@/lib/profile";
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function urlToDataUrl(url, fallbackMime = 'image/png') {
  const parsedUrl = new URL(url);
  const isLocalAsset = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  if (isLocalAsset) {
    const bytes = new Uint8Array(await readFile(path.join(process.cwd(), 'public', parsedUrl.pathname.replace(/^\
    let binary = '';

    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }

    return `data:${fallbackMime};base64,${btoa(binary)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${url}`);
  }

  const mimeType = response.headers.get('content-type') || fallbackMime;
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }

  return `data:${mimeType};base64,${btoa(binary)}`;
}

export async function GET(request, { params }) {
  const { id } = await params;
  const data = await getProfileData(id);
  const cardMode = new URL(request.url).searchParams.get('card') === 'monsters' ? 'monsters' : 'full';

  
  const c = {
    void:        '#08070a',
    voidPanel:   '#151217',
    voidRaised:  '#1e1a20',
    ember:       '#c9a24a',
    emberBright: '#e8cc7d',
    mist:        '#c9c2b8',
    mistDim:     '#8a8378',
    mistFaint:   '#5c564e',
    blood:       '#9a3b3b',
    blue:        '#7ab8d4',
    border:      'rgba(255,255,255,0.08)',
    borderEmber: 'rgba(201,162,74,0.25)',
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
  const wishlistPreview = filterValid(wishlistItems).slice(0, 8);
  const renderMonsterRows = filterValid(allMonsters);
  const avatarImageUrl = await urlToDataUrl(user.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`);
  const boardIconUrl = await urlToDataUrl(`${baseUrl}/icons/MHWilds-Expedition_Record_Board_Icon.png`);
  const monsterImageUrlMap = new Map();

  if (cardMode === 'monsters') {
    for (const monster of renderMonsterRows) {
      if (!monster.image_name) continue;
      const imageUrl = `${baseUrl}/monsters/${monster.image_name}`;
      if (!monsterImageUrlMap.has(imageUrl)) monsterImageUrlMap.set(imageUrl, await urlToDataUrl(imageUrl));
    }

    
    const iconGap = 3;
    const availW = 1128;
    const availH = 504;
    const iconSizeCandidates = [112, 104, 96, 88, 80, 72, 64, 56, 48, 40];
    const groups = [smallOnly.length, largeOnly.length, multi.length].filter(n => n > 0);
    const iconSize = iconSizeCandidates.find(s => {
      const perRow = Math.floor(availW / (s + iconGap));
      if (perRow === 0) return false;
      let h = 0;
      for (let i = 0; i < groups.length; i++) { if (i > 0) h += 8; h += 20; h += Math.ceil(groups[i] / perRow) * (s + iconGap); }
      return h <= availH;
    }) ?? 32;

    const renderMonsterGroup = (label, rawItems) => {
      const items = filterValid(rawItems);
      if (items.length === 0) return null;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: 8, color: c.ember, letterSpacing: '3px', fontWeight: 'bold', display: 'flex', flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 8, color: c.mistFaint, display: 'flex', flexShrink: 0 }}>×{items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: `${iconGap}px` }}>
            {items.map(monster => (
              <div key={monster.name} style={{ width: iconSize, height: iconSize, flexShrink: 0, border: `1px solid ${c.border}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.voidRaised }}>
                <img src={monsterImageUrlMap.get(`${baseUrl}/monsters/${monster.image_name}`)} width={iconSize - 6} height={iconSize - 6} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              </div>
            ))}
          </div>
        </div>
      );
    };

    return new ImageResponse(
      (
        <div style={{ background: c.void, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 10% 0%, rgba(201,162,74,0.14) 0%, transparent 50%)' }} />

          
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '90px', flexShrink: 0, paddingLeft: '36px', paddingRight: '36px', borderBottom: `1px solid ${c.border}`, gap: '0px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px', paddingRight: '28px', borderRight: `1px solid ${c.border}`, height: '100%' }}>
              <div style={{ display: 'flex', width: '52px', height: '52px', borderRadius: '50%', border: '2px solid rgba(201,162,74,0.4)', flexShrink: 0, overflow: 'hidden' }}>
                <img src={avatarImageUrl} width={48} height={48} style={{ objectFit: 'cover', borderRadius: '50%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: 22, color: c.mist, fontFamily: 'serif', display: 'flex', lineHeight: '1' }}>{user.username}</span>
                <div style={{ display: 'flex', flexDirection: 'row', background: 'rgba(201,162,74,0.15)', border: '1px solid rgba(201,162,74,0.3)', padding: '2px 10px', borderRadius: '20px' }}>
                  <span style={{ fontSize: 8, color: c.ember, letterSpacing: '2px', display: 'flex' }}>{userRank.toUpperCase()}</span>
                </div>
              </div>
            </div>
            {[
              { label: 'TOTAL CROWNS', value: stats.total || 0, color: c.emberBright },
              { label: 'LARGE', value: stats.large || 0, color: c.ember },
              { label: 'SMALL', value: stats.small || 0, color: c.blue },
              { label: 'TEMPERED', value: stats.tempered || 0, color: '#d3554f' },
              { label: 'SPECIES', value: allMonsters.length, color: c.mist },
            ].map(({ label, value, color }, i) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', paddingLeft: '28px', paddingRight: i < 4 ? '28px' : '0px', borderRight: i < 4 ? `1px solid ${c.border}` : 'none', height: '100%', flexShrink: 0 }}>
                <span style={{ fontSize: 7, color: c.mistFaint, letterSpacing: '2px', display: 'flex' }}>{label}</span>
                <span style={{ fontSize: 30, fontWeight: 'bold', color, display: 'flex', lineHeight: '1' }}>{value}</span>
              </div>
            ))}
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '18px 36px', gap: '12px', overflow: 'hidden' }}>
            {renderMonsterGroup('SMALL CROWNS', smallOnly)}
            {renderMonsterGroup('LARGE CROWNS', largeOnly)}
            {renderMonsterGroup('SMALL & LARGE', multi)}
            {allMonsters.length === 0 && (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, color: c.mistDim, display: 'flex' }}>No crowns recorded yet.</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', paddingRight: '36px', paddingBottom: '12px' }}>
            <span style={{ fontSize: 7, color: c.mistFaint, opacity: 0.4, letterSpacing: '3px', display: 'flex' }}>CROWN GUILD</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630, headers: { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } }
    );
  }

  for (const monster of renderMonsterRows) {
    if (!monster.image_name) continue;
    const imageUrl = `${baseUrl}/monsters/${monster.image_name}`;
    if (!monsterImageUrlMap.has(imageUrl)) {
      monsterImageUrlMap.set(imageUrl, await urlToDataUrl(imageUrl));
    }
  }

  for (const item of wishlistPreview) {
    if (!item.image_name) continue;
    const imageUrl = `${baseUrl}/monsters/${item.image_name}`;
    if (!monsterImageUrlMap.has(imageUrl)) {
      monsterImageUrlMap.set(imageUrl, await urlToDataUrl(imageUrl));
    }
  }

  if (topAssist?.image_name) {
    const imageUrl = `${baseUrl}/monsters/${topAssist.image_name}`;
    if (!monsterImageUrlMap.has(imageUrl)) {
      monsterImageUrlMap.set(imageUrl, await urlToDataUrl(imageUrl));
    }
  }

  
  
  
  const iconGap = 4;
  const availW = 744;
  const availH = 320;
  const iconSizeCandidates = [80, 72, 64, 56, 48, 40, 32];
  const groups = [smallOnly.length, largeOnly.length, multi.length].filter(n => n > 0);
  const iconSize = iconSizeCandidates.find(s => {
    const perRow = Math.floor(availW / (s + iconGap));
    if (perRow === 0) return false;
    let h = 0;
    for (let i = 0; i < groups.length; i++) { if (i > 0) h += 16; h += 24; h += Math.ceil(groups[i] / perRow) * (s + iconGap); }
    return h <= availH;
  }) ?? 32;

  const renderGroup = (label, rawItems) => {
    const items = filterValid(rawItems);
    if (items.length === 0) return null;
    
    const perRow = Math.floor(availW / (iconSize + iconGap));
    const rows = [];
    for (let i = 0; i < items.length; i += perRow) {
      rows.push(items.slice(i, i + perRow));
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 10, color: c.ember, letterSpacing: '4px', fontWeight: 'bold', display: 'flex', flexShrink: 0 }}>{label}</span>
          <span style={{ fontSize: 10, color: c.mistFaint, display: 'flex', flexShrink: 0 }}>×{items.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${iconGap}px` }}>
          {rows.map((rowItems, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', flexDirection: 'row', gap: `${iconGap}px` }}>
              {rowItems.map(m => (
                <div key={m.name} style={{ width: iconSize, height: iconSize, flexShrink: 0, border: `1px solid ${c.border}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.voidRaised }}>
                  <img src={monsterImageUrlMap.get(`${baseUrl}/monsters/${m.image_name}`)} width={iconSize - 8} height={iconSize - 8} style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'flex' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const statusMessage = String(user.status_message || '').trim();
  const statusPreview = statusMessage.length > 100 ? `${statusMessage.slice(0, 97)}...` : statusMessage;
  const masteryPct = Math.max(0, Math.min(100, progress));

  return new ImageResponse(
    (
      <div style={{ background: c.void, width: '100%', height: '100%', display: 'flex', flexDirection: 'row', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 85% 50%, rgba(201,162,74,0.1) 0%, transparent 60%)' }} />

        
        <div style={{ display: 'flex', flexDirection: 'column', width: '360px', flexShrink: 0, borderRight: `1px solid ${c.border}`, padding: '48px 32px', alignItems: 'center', justifyContent: 'center', gap: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `linear-gradient(to bottom, ${c.ember}, transparent 80%)` }} />
          
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', width: '160px', height: '160px', borderRadius: '50%', border: '4px solid rgba(201,162,74,0.5)', flexShrink: 0, overflow: 'hidden', boxShadow: '0 0 40px rgba(201,162,74,0.2)' }}>
              <img src={avatarImageUrl} width={152} height={152} style={{ objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: 36, color: c.mist, fontFamily: 'serif', display: 'flex', textAlign: 'center', lineHeight: '1', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{user.username}</span>
              <div style={{ display: 'flex', flexDirection: 'row', background: 'rgba(201,162,74,0.15)', border: '1px solid rgba(201,162,74,0.4)', padding: '6px 20px', borderRadius: '24px' }}>
                <span style={{ fontSize: 10, color: c.ember, letterSpacing: '4px', fontWeight: 'bold', display: 'flex' }}>{userRank.toUpperCase()}</span>
              </div>
            </div>
          </div>

          
          {statusPreview && (
            <div style={{ display: 'flex', flexDirection: 'row', padding: '12px 16px', background: 'rgba(201,162,74,0.05)', borderLeft: `3px solid ${c.ember}`, borderRadius: '0 8px 8px 0', marginTop: '8px' }}>
              <span style={{ fontSize: 14, color: c.mistDim, fontStyle: 'italic', display: 'flex', textAlign: 'center', lineHeight: '1.4' }}>"{statusPreview}"</span>
            </div>
          )}

          <div style={{ display: 'flex', width: '100%', height: '1px', background: c.border, margin: '8px 0' }} />

          
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 10, color: c.ember, letterSpacing: '4px', display: 'flex', fontWeight: 'bold' }}>HUNTER MASTERY</span>
              <span style={{ fontSize: 16, color: c.emberBright, fontWeight: 'bold', display: 'flex', lineHeight: '1' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${c.border}` }}>
              <div style={{ display: 'flex', height: '100%', width: `${masteryPct}%`, background: `linear-gradient(to right, ${c.ember}, ${c.emberBright})`, boxShadow: `0 0 10px ${c.ember}88` }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, color: c.mistFaint, display: 'flex' }}>Level {currentRank?.level || 1}</span>
              {nextRank && <span style={{ fontSize: 9, color: c.mistFaint, display: 'flex' }}>{Math.max(0, Number(nextRank.minPoints || 0) - safeMasteryPoints)} pts to next rank</span>}
            </div>
          </div>

          <div style={{ display: 'flex', width: '100%', height: '1px', background: c.border, margin: '8px 0' }} />

          
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

        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 48px', justifyContent: 'space-between' }}>
          
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: `1px solid ${c.border}`, paddingBottom: '24px', marginBottom: '24px' }}>
            <span style={{ fontSize: 12, color: c.ember, letterSpacing: '6px', fontWeight: 'bold', display: 'flex' }}>OFFICIAL RECORDS</span>
            
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '48px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>LARGE</span>
                  <span style={{ fontSize: 44, fontWeight: 'bold', color: c.ember, display: 'flex', lineHeight: '1' }}>{stats.large || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>SMALL</span>
                  <span style={{ fontSize: 44, fontWeight: 'bold', color: c.blue, display: 'flex', lineHeight: '1' }}>{stats.small || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>TEMPERED</span>
                  <span style={{ fontSize: 44, fontWeight: 'bold', color: '#d3554f', display: 'flex', lineHeight: '1' }}>{stats.tempered || 0}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ display: 'flex', paddingLeft: '4px' }}>
                  <span style={{ fontSize: 12, color: c.ember, letterSpacing: '4px', fontWeight: 'bold', display: 'flex' }}>TOTAL CROWNS</span>
                </div>
                <span style={{ fontSize: 80, fontWeight: 'bold', color: c.emberBright, display: 'flex', lineHeight: '0.85', textShadow: `0 4px 30px ${c.ember}66` }}>
                  {stats.total || 0}
                </span>
              </div>
            </div>
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px', overflow: 'hidden' }}>
            <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>CROWN REGISTRY</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderGroup('SMALL CROWNS', smallOnly)}
              {renderGroup('LARGE CROWNS', largeOnly)}
              {renderGroup('SMALL & LARGE', multi)}

              {allMonsters.length === 0 && (
                <div style={{ display: 'flex', height: '100px', width: '100%', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${c.border}`, borderRadius: '12px' }}>
                  <span style={{ fontSize: 16, color: c.mistDim, display: 'flex' }}>No crowns recorded yet.</span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } }
  );
}

