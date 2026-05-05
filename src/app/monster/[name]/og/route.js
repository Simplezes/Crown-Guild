import { ImageResponse } from 'next/og';
import { getMonsterByName, getQuestIcon, getMonsterStats } from "@/lib/monsters";
import { getCrownById } from "@/lib/profile";
import db from "@/lib/db";

export const runtime = 'edge';

export async function GET(request, { params }) {
  const { name } = await params;
  const { searchParams } = new URL(request.url);
  const crownId = searchParams.get('crownId');

  const monster = await getMonsterByName(name);
  if (!monster) {
    return new Response('Monster Not Found', { status: 404 });
  }

  const crown = crownId ? await getCrownById(crownId) : null;
  const stats = !crown ? await getMonsterStats(monster.id) : null;
  const seekerRes = !crown && monster.id
    ? await db.execute({ sql: 'SELECT COUNT(*) as count FROM wishlist WHERE monster_id = ?', args: [monster.id] }).catch(() => null)
    : null;
  const seekerCount = seekerRes?.rows?.[0]?.count ?? 0;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let avatarUrl = crown?.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`;
  if (avatarUrl.includes('cdn.discordapp.com') && avatarUrl.endsWith('.webp')) {
    avatarUrl = avatarUrl.replace('.webp', '.png');
  }

  const colors = {
    black: '#0c0a09',
    umber: '#1a1614',
    tan: '#d4c4a1',
    tanDark: '#a1937a',
    gold: '#b59a5d',
    goldBright: '#e0cc96',
    red: '#8b2e2e',
    redBright: '#c0392b',
    border: 'rgba(61, 52, 45, 0.6)',
    glass: 'rgba(12, 10, 9, 0.85)',
  };

  const elementColors = {
    'Fire': '#e07040',
    'Water': '#4a9fd4',
    'Thunder': '#d4a840',
    'Ice': '#80c8e8',
    'Dragon': '#9a5cb4',
  };
  const getElemColor = (el) => elementColors[el] || colors.gold;

  const weaknesses = monster.weaknesses || monster.extraInfo?.weakness || [];
  const elements   = monster.elements   || monster.extraInfo?.elements  || [];
  const ailments   = monster.ailments   || monster.extraInfo?.ailments  || [];
  const monsterType = monster.type || monster.extraInfo?.type || '';
  const description = monster.info
    || monster.extraInfo?.games?.find(g => g.game === "Monster Hunter Wilds")?.info
    || '';

  const accentColor = crown
    ? (crown.type === 'large' ? colors.gold : '#4a9fd4')
    : colors.red;

  const starSrc = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#e0cc96"/></svg>')}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: colors.black,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          color: colors.tan,
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.12,
          backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.gold} 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }} />

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse at 80% 50%, ${accentColor}18 0%, transparent 65%)`,
        }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: colors.glass,
            border: `1px solid ${colors.border}`,
            position: 'relative',
            padding: '26px 28px',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
            background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src={`${baseUrl}/icons/MHWilds-Hunt_Icon.png`} width={36} height={36} style={{ imageRendering: 'pixelated' }} />
              <span style={{ fontSize: 22, letterSpacing: '5px', color: colors.gold, display: 'flex' }}>
                {crown ? 'CROWN RECORD' : 'MONSTER LEDGER'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {crown && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: colors.umber, padding: '5px 14px', border: `1px solid ${colors.border}` }}>
                  <img src={`${baseUrl}/icons/${crown.type}crown.png`} width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                  <span style={{ fontSize: 13, color: colors.gold, fontWeight: 'bold', display: 'flex', letterSpacing: '2px' }}>
                    {crown.type.toUpperCase()} CROWN
                  </span>
                </div>
              )}
              {!!crown?.tempered && (
                <div style={{ display: 'flex', background: colors.red, padding: '5px 14px', border: `1px solid ${colors.redBright}` }}>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 'bold', display: 'flex', letterSpacing: '2px' }}>
                    ⚠ TEMPERED
                  </span>
                </div>
              )}
              {!crown && monster.is_large && (
                <div style={{ display: 'flex', background: colors.umber, padding: '5px 14px', border: `1px solid ${colors.border}` }}>
                  <span style={{ fontSize: 13, color: colors.gold, display: 'flex', letterSpacing: '2px' }}>CROWNABLE</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: '0px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '36%',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: `1px solid ${colors.border}`,
              paddingRight: '26px',
              gap: '10px',
            }}>
              <img
                src={`${baseUrl}/monsters/${monster.image_name}`}
                width={240}
                height={240}
                style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
              />
              <span style={{ fontSize: 34, color: colors.goldBright, textAlign: 'center', display: 'flex', lineHeight: '1.1' }}>
                {monster.name}
              </span>
              {monsterType && (
                <div style={{ display: 'flex', background: 'rgba(181,154,93,0.1)', border: `1px solid rgba(181,154,93,0.3)`, padding: '4px 14px' }}>
                  <span style={{ fontSize: 11, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>
                    {monsterType.toUpperCase()}
                  </span>
                </div>
              )}
              {elements.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {elements.map((el, i) => (
                    <span key={i} style={{
                      padding: '3px 10px',
                      background: `${getElemColor(el)}22`,
                      border: `1px solid ${getElemColor(el)}77`,
                      color: getElemColor(el),
                      fontSize: 12,
                      letterSpacing: '1px',
                      display: 'flex',
                    }}>{el.toUpperCase()}</span>
                  ))}
                </div>
              )}
            </div>

              <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '64%',
              paddingLeft: '26px',
              gap: '14px',
              justifyContent: 'space-between',
            }}>

              {crown ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                      src={avatarUrl}
                      width={70}
                      height={70}
                      style={{ borderRadius: '8px', border: `2px solid ${colors.border}` }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: 12, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>RECORDED BY</span>
                      <span style={{ fontSize: 28, color: '#fff', display: 'flex', lineHeight: '1' }}>{crown.username}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', padding: '16px 18px', border: `1px solid ${colors.border}`, gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={`${baseUrl}/icons/${getQuestIcon(crown.quest)}`} width={28} height={28} style={{ imageRendering: 'pixelated' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>HUNT TYPE</span>
                        <span style={{ fontSize: 20, color: crown.tempered ? colors.redBright : colors.gold, fontWeight: 'bold', display: 'flex' }}>
                          {crown.quest || 'Hunt'}{crown.tempered ? ' (Tempered)' : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', borderTop: `1px dashed ${colors.border}`, paddingTop: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '5px' }}>
                        <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>STRENGTH RATING</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {Array.from({ length: 10 }).map((_, i) => (
                            <img key={i} src={starSrc} width={20} height={20} style={{
                              opacity: i < (crown.strength_rating || 0) ? 1 : 0.15,
                            }} />
                          ))}
                        </div>
                      </div>
                      {crown.investigation_id && crown.remaining_uses !== null && crown.remaining_uses !== undefined && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '5px', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>REMAINING USES</span>
                          <span style={{
                            fontSize: 38,
                            fontWeight: 'bold',
                            color: (crown.remaining_uses || 0) > 0 ? colors.goldBright : colors.tanDark,
                            display: 'flex',
                            lineHeight: '1',
                          }}>{crown.remaining_uses}</span>
                        </div>
                      )}
                    </div>

                    {crown.status_message && (
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 14px', background: 'rgba(181,154,93,0.05)', borderLeft: `2px solid ${colors.gold}` }}>
                        <span style={{ fontSize: 10, color: colors.gold, letterSpacing: '2px', marginBottom: '4px', display: 'flex' }}>HUNTER'S NOTES</span>
                        <span style={{ fontSize: 14, color: colors.tan, fontStyle: 'italic', display: 'flex' }}>"{crown.status_message}"</span>
                      </div>
                    )}

                    {(weaknesses.length > 0 || ailments.length > 0) && (
                      <div style={{ display: 'flex', gap: '20px', borderTop: `1px dashed ${colors.border}`, paddingTop: '12px' }}>
                        {weaknesses.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>WEAK TO</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {weaknesses.map((w, i) => (
                                <span key={i} style={{ padding: '2px 9px', background: 'rgba(181,154,93,0.15)', color: colors.gold, fontSize: 11, display: 'flex' }}>{w}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ailments.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>AILMENTS</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {ailments.map((a, i) => (
                                <span key={i} style={{ padding: '2px 9px', background: 'rgba(142,68,173,0.15)', color: '#c39bd3', fontSize: 11, display: 'flex' }}>{a}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: 11, color: colors.gold, letterSpacing: '3px', display: 'flex' }}>GUILD INTELLIGENCE</span>
                    <span style={{ fontSize: 16, lineHeight: '1.5', display: 'flex', color: colors.tan }}>
                      {description.length > 240 ? description.slice(0, 237) + '...' : (description || 'Information pending from the research commission.')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                      <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>WEAKNESSES</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {weaknesses.length > 0
                          ? weaknesses.map((w, i) => (
                              <span key={i} style={{ padding: '3px 9px', background: 'rgba(181,154,93,0.15)', border: `1px solid rgba(181,154,93,0.3)`, color: colors.gold, fontSize: 12, display: 'flex' }}>{w}</span>
                            ))
                          : <span style={{ fontSize: 12, color: colors.tanDark, display: 'flex' }}>—</span>
                        }
                      </div>
                    </div>
                    {elements.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                        <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>ELEMENTS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {elements.map((el, i) => (
                            <span key={i} style={{ padding: '3px 9px', background: `${getElemColor(el)}22`, border: `1px solid ${getElemColor(el)}66`, color: getElemColor(el), fontSize: 12, display: 'flex' }}>{el}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ailments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                        <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '2px', display: 'flex' }}>AILMENTS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {ailments.map((a, i) => (
                            <span key={i} style={{ padding: '3px 9px', background: 'rgba(142,68,173,0.15)', border: `1px solid rgba(142,68,173,0.4)`, color: '#c39bd3', fontSize: 12, display: 'flex' }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    {[
                      { icon: 'largecrown.png', label: 'GUILD LARGE CROWNS', value: stats?.large || 0 },
                      { icon: 'smallcrown.png', label: 'GUILD SMALL CROWNS', value: stats?.small || 0 },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', border: `1px solid ${colors.border}` }}>
                        <img src={`${baseUrl}/icons/${icon}`} width={30} height={30} style={{ imageRendering: 'pixelated' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>{label}</span>
                          <span style={{ fontSize: 30, fontWeight: 'bold', color: value > 0 ? colors.gold : colors.tanDark, display: 'flex', lineHeight: '1' }}>{value}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', border: `1px solid ${colors.border}` }}>
                      <img src={`${baseUrl}/icons/MHWilds-Wishlist_Pin_Icon.png`} width={28} height={28} style={{ imageRendering: 'pixelated' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>SEEKERS</span>
                        <span style={{ fontSize: 30, fontWeight: 'bold', color: seekerCount > 0 ? '#4a9fd4' : colors.tanDark, display: 'flex', lineHeight: '1' }}>{seekerCount}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', border: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: 10, color: colors.tanDark, letterSpacing: '1px', display: 'flex' }}>GUILD TOTAL</span>
                        <span style={{ fontSize: 30, fontWeight: 'bold', color: colors.goldBright, display: 'flex', lineHeight: '1' }}>
                          {(stats?.large || 0) + (stats?.small || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${colors.border}`, opacity: 0.45 }}>
            <span style={{ fontSize: 11, letterSpacing: '2px', display: 'flex' }}>CROWN GUILD OFFICIAL LEDGER</span>
            <span style={{ fontSize: 11, display: 'flex' }}>© 2026 CROWN GUILD</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
