import { ImageResponse } from 'next/og';
import { getMonsterByName, getQuestIcon, getMonsterStats } from "@/lib/monsters";
import { getCrownById } from "@/lib/profile";
import db from "@/lib/db";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  const { name } = await params;
  const { searchParams } = new URL(request.url);
  const crownId = searchParams.get('crownId');

  const monster = await getMonsterByName(name);
  if (!monster) return new Response('Monster Not Found', { status: 404 });

  const crown = crownId ? await getCrownById(crownId) : null;
  const stats = !crown ? await getMonsterStats(monster.id) : null;
  const seekerRes = !crown && monster.id
    ? await db.execute({ sql: 'SELECT COUNT(*) as count FROM wishlist WHERE monster_id = ?', args: [monster.id] }).catch(() => null)
    : null;
  const seekerCount = seekerRes?.rows?.[0]?.count ?? 0;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let avatarUrl = crown?.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`;
  if (avatarUrl.includes('cdn.discordapp.com') && avatarUrl.endsWith('.webp')) avatarUrl = avatarUrl.replace('.webp', '.png');

  const c = {
    void: '#08070a', voidPanel: '#0f0d12', voidRaised: '#1a1720',
    ember: '#c9a24a', emberBright: '#e8cc7d',
    mist: '#c9c2b8', mistDim: '#8a8378', mistFaint: '#4e4840',
    blue: '#7ab8d4', blood: '#9a3b3b', bloodBright: '#d3554f',
    border: 'rgba(255,255,255,0.07)', borderEmber: 'rgba(201,162,74,0.28)',
  };

  const elementColors = { Fire: '#e07040', Water: '#4a9fd4', Thunder: '#d4a840', Ice: '#80c8e8', Dragon: '#9a5cb4' };
  const getElemColor = el => elementColors[el] || c.ember;

  const weaknesses  = monster.weaknesses || monster.extraInfo?.weakness || [];
  const elements    = monster.elements   || monster.extraInfo?.elements  || [];
  const ailments    = monster.ailments   || monster.extraInfo?.ailments  || [];
  const monsterType = monster.type || monster.extraInfo?.type || '';
  const description = monster.info
    || monster.extraInfo?.games?.find(g => g.game === 'Monster Hunter Wilds')?.info
    || '';

  const accentColor = crown ? (crown.type === 'large' ? c.ember : c.blue) : c.ember;

  const starSrc = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#e8cc7d"/></svg>')}`;

  
  if (!crown) {
    const desc = description.length > 450 ? description.slice(0, 447) + '...' : (description || 'Information pending from the research commission.');

    return new ImageResponse(
      (
        <div style={{ background: c.void, width: '100%', height: '100%', display: 'flex', flexDirection: 'row', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(201,162,74,0.12) 0%, transparent 60%)' }} />

          
          <div style={{ display: 'flex', flexDirection: 'column', width: '500px', flexShrink: 0, alignItems: 'center', justifyContent: 'center', padding: '40px', borderRight: `1px solid ${c.border}`, gap: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% 45%, ${accentColor}18 0%, transparent 65%)` }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '380px', height: '380px', flexShrink: 0 }}>
              <img src={`${baseUrl}/monsters/${monster.image_name}`} width={380} height={380} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </div>

            <span style={{ fontSize: 48, color: c.mist, fontFamily: 'serif', textAlign: 'center', display: 'flex', lineHeight: '1.1', flexShrink: 0, textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              {monster.name}
            </span>

            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {monsterType && (
                <div style={{ display: 'flex', background: `${accentColor}1a`, border: `1px solid ${accentColor}55`, padding: '6px 18px', borderRadius: '20px', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: c.ember, letterSpacing: '3px', fontWeight: 'bold', display: 'flex' }}>{monsterType.toUpperCase()}</span>
                </div>
              )}
              {elements.map((el, i) => (
                <div key={i} style={{ display: 'flex', background: `${getElemColor(el)}1a`, border: `1px solid ${getElemColor(el)}55`, padding: '6px 18px', borderRadius: '20px', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: getElemColor(el), letterSpacing: '2px', fontWeight: 'bold', display: 'flex' }}>{el.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '44px 48px', gap: '0px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '6px', fontWeight: 'bold', display: 'flex' }}>MONSTER LEDGER</span>
              {monster.is_large && (
                <div style={{ display: 'flex', background: `${c.ember}18`, border: `1px solid ${c.borderEmber}`, padding: '6px 16px', borderRadius: '20px' }}>
                  <span style={{ fontSize: 10, color: c.ember, letterSpacing: '3px', fontWeight: 'bold', display: 'flex' }}>CROWNABLE</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
              <span style={{ fontSize: 10, color: c.ember, letterSpacing: '4px', fontWeight: 'bold', display: 'flex' }}>FIELD GUIDE</span>
              <span style={{ fontSize: 18, color: c.mistDim, lineHeight: '1.6', display: 'flex' }}>{desc}</span>
            </div>

            {(weaknesses.length > 0 || ailments.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'row', gap: '36px', paddingTop: '24px', borderTop: `1px solid ${c.border}`, marginBottom: '32px' }}>
                {weaknesses.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>WEAK TO</span>
                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '6px' }}>
                      {weaknesses.map((w, i) => (
                        <span key={i} style={{ display: 'flex', padding: '5px 14px', background: `${c.ember}18`, border: `1px solid ${c.borderEmber}`, color: c.ember, fontSize: 14, borderRadius: '20px' }}>{w}</span>
                      ))}
                    </div>
                  </div>
                )}
                {ailments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>AILMENTS</span>
                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '6px' }}>
                      {ailments.map((a, i) => (
                        <span key={i} style={{ display: 'flex', padding: '5px 14px', background: 'rgba(142,68,173,0.15)', border: `1px solid rgba(142,68,173,0.4)`, color: '#c39bd3', fontSize: 14, borderRadius: '20px' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', paddingTop: '28px', borderTop: `1px solid ${c.border}` }}>
              {[
                { label: 'LARGE CROWNS', value: stats?.large || 0, color: c.ember },
                { label: 'SMALL CROWNS', value: stats?.small || 0, color: c.blue },
                { label: 'SEEKERS', value: seekerCount, color: c.mist },
                { label: 'GUILD TOTAL', value: (stats?.large || 0) + (stats?.small || 0), color: c.emberBright },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: 10, color: label === 'GUILD TOTAL' ? c.ember : c.mistFaint, letterSpacing: '4px', fontWeight: label === 'GUILD TOTAL' ? 'bold' : 'normal', display: 'flex' }}>{label}</span>
                  <span style={{ fontSize: 44, fontWeight: 'bold', color: Number(value) > 0 ? color : c.mistDim, display: 'flex', lineHeight: '1' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '20px' }}>
              <span style={{ fontSize: 8, color: c.mistFaint, opacity: 0.4, letterSpacing: '4px', display: 'flex' }}>CROWN GUILD OFFICIAL LEDGER</span>
              <span style={{ fontSize: 8, color: c.mistFaint, opacity: 0.4, display: 'flex' }}>© 2026</span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, headers: { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } }
    );
  }

  
  return new ImageResponse(
    (
      <div style={{ background: c.void, width: '100%', height: '100%', display: 'flex', flexDirection: 'row', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 80% 50%, ${accentColor}20 0%, ${c.void} 70%)` }} />
        
        
        <div style={{ position: 'absolute', right: '-40px', top: '15px', display: 'flex', width: '600px', height: '600px', justifyContent: 'center', alignItems: 'center' }}>
          <img src={`${baseUrl}/monsters/${monster.image_name}`} width={550} height={550} style={{ objectFit: 'contain', imageRendering: 'pixelated', opacity: 0.95 }} />
        </div>

        
        <div style={{ display: 'flex', flexDirection: 'column', width: '700px', height: '100%', padding: '44px 48px', background: `linear-gradient(to right, ${c.void} 70%, transparent 100%)`, zIndex: 10 }}>
          
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <span style={{ fontSize: 10, color: c.ember, letterSpacing: '6px', fontWeight: 'bold', display: 'flex' }}>QUEST POSTING</span>
            <div style={{ display: 'flex', flex: 1, height: '1px', background: `linear-gradient(to right, ${c.borderEmber}, transparent)` }} />
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', width: '76px', height: '76px', borderRadius: '50%', border: `2px solid ${accentColor}66`, flexShrink: 0, overflow: 'hidden' }}>
              <img src={avatarUrl} width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>POSTED BY</span>
              <span style={{ fontSize: 32, color: c.mist, fontFamily: 'serif', display: 'flex', lineHeight: '1' }}>{crown.username}</span>
            </div>
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>TARGET</span>
            <span style={{ fontSize: 64, color: '#fff', fontFamily: 'serif', display: 'flex', lineHeight: '1', textShadow: `0 4px 20px ${accentColor}66` }}>
              {monster.name}
            </span>
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', background: c.voidRaised, border: `1px solid ${c.border}`, padding: '8px 18px', borderRadius: '10px' }}>
              <img src={`${baseUrl}/icons/${getQuestIcon(crown.quest)}`} width={22} height={22} style={{ imageRendering: 'pixelated' }} />
              <span style={{ fontSize: 14, color: c.mist, fontWeight: 'bold', letterSpacing: '2px', display: 'flex' }}>{crown.quest || 'Hunt'}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', background: `${accentColor}1a`, border: `1px solid ${accentColor}55`, padding: '8px 18px', borderRadius: '10px' }}>
              <img src={`${baseUrl}/icons/${crown.type}crown.png`} width={22} height={22} style={{ imageRendering: 'pixelated' }} />
              <span style={{ fontSize: 14, color: accentColor, fontWeight: 'bold', letterSpacing: '2px', display: 'flex' }}>{crown.type.toUpperCase()}</span>
            </div>

            {!!crown.tempered && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', background: c.blood, border: `1px solid ${c.bloodBright}`, padding: '8px 18px', borderRadius: '10px' }}>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 'bold', letterSpacing: '2px', display: 'flex' }}>TEMPERED</span>
              </div>
            )}
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'row', gap: '44px', padding: '24px 32px', background: c.voidRaised, border: `1px solid ${c.border}`, borderRadius: '14px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>DIFFICULTY</span>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
                {Array.from({ length: Math.max(1, crown.strength_rating || 0) }).map((_, i) => (
                  <img key={i} src={starSrc} width={26} height={26} style={{ display: 'flex' }} />
                ))}
              </div>
            </div>
            
            {crown.investigation_id && crown.remaining_uses !== null && crown.remaining_uses !== undefined && (
              <>
                <div style={{ display: 'flex', width: '1px', background: c.border }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: 10, color: c.mistFaint, letterSpacing: '4px', display: 'flex' }}>REMAINING</span>
                  <span style={{ fontSize: 34, fontWeight: 'bold', color: (crown.remaining_uses || 0) > 0 ? c.emberBright : c.mistFaint, display: 'flex', lineHeight: '1' }}>
                    {crown.remaining_uses}
                  </span>
                </div>
              </>
            )}
          </div>

          
          {crown.status_message && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px', borderLeft: `2px solid ${c.borderEmber}` }}>
              <span style={{ fontSize: 9, color: c.ember, letterSpacing: '3px', display: 'flex' }}>HUNTER'S NOTES</span>
              <span style={{ fontSize: 18, color: c.mistDim, fontStyle: 'italic', display: 'flex' }}>"{crown.status_message}"</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'row', marginTop: 'auto' }}>
            <span style={{ fontSize: 8, color: c.mistFaint, opacity: 0.4, letterSpacing: '4px', display: 'flex' }}>CROWN GUILD OFFICIAL POSTING</span>
          </div>

        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } }
  );
}
