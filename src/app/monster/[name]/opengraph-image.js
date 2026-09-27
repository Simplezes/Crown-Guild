import { ImageResponse } from 'next/og';
import { getMonsterByName, getQuestIcon, getMonsterStats } from "@/lib/monsters";
import { getCrownById } from "@/lib/profile";

export const runtime = 'edge';

export const alt = 'Monster Card';
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

export default async function Image({ params, searchParams }) {
  const { name } = await params;
  const crownId = (await searchParams)?.crownId;

  const monster = await getMonsterByName(name);
  if (!monster) {
    return new ImageResponse(
      (
        <div style={{ fontSize: 48, background: c.void, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.mist }}>
          Monster Not Found
        </div>
      ),
      { ...size }
    );
  }

  const crown = crownId ? await getCrownById(crownId) : null;
  const stats = !crown ? await getMonsterStats(monster.id) : null;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return new ImageResponse(
    (
      <div
        style={{
          background: c.void,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 15% 0%, rgba(201,162,74,0.16) 0%, transparent 55%)' }} />

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: '96px', flexShrink: 0, padding: '0 40px', borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={`${baseUrl}/icons/MHWilds-Hunt_Icon.png`} width={32} height={32} style={{ imageRendering: 'pixelated' }} />
            <span style={{ fontSize: 22, letterSpacing: '4px', color: c.emberBright, fontFamily: 'serif', display: 'flex' }}>
              {crown ? 'CROWN RECORD' : 'MONSTER LEDGER'}
            </span>
          </div>
          {crown && (
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(201,162,74,0.14)', border: `1px solid ${c.borderEmber}`, padding: '7px 18px', borderRadius: '20px', gap: '10px' }}>
              <img src={`${baseUrl}/icons/${crown.type}crown.png`} width={18} height={18} />
              <span style={{ fontSize: 13, color: c.ember, fontWeight: 'bold', letterSpacing: '2px', display: 'flex' }}>
                {crown.type.toUpperCase()} CROWN
              </span>
            </div>
          )}
          {!crown && monster.is_large && (
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(201,162,74,0.14)', border: `1px solid ${c.borderEmber}`, padding: '7px 18px', borderRadius: '20px' }}>
              <span style={{ fontSize: 13, color: c.ember, fontWeight: 'bold', letterSpacing: '2px', display: 'flex' }}>CROWNABLE</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '400px',
              flexShrink: 0,
              justifyContent: 'center',
              alignItems: 'center',
              borderRight: `1px solid ${c.border}`,
              padding: '30px',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `linear-gradient(to bottom, ${c.ember}, transparent 80%)` }} />
            <img src={`${baseUrl}/monsters/${monster.image_name}`} width={280} height={280} style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: 40, color: c.emberBright, marginTop: '16px', textAlign: 'center', fontFamily: 'serif', display: 'flex' }}>
              {monster.name}
            </span>
            {monster.type && (
              <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '3px', marginTop: '6px', display: 'flex' }}>{monster.type.toUpperCase()}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '40px 48px', justifyContent: 'center' }}>
            {crown ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                  <img
                    src={crown.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`}
                    width={64}
                    height={64}
                    style={{ borderRadius: '50%', border: `2px solid ${c.borderEmber}`, marginRight: '18px', objectFit: 'cover' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '2px', display: 'flex' }}>RECORDED BY</span>
                    <span style={{ fontSize: 28, color: c.mist, display: 'flex' }}>{crown.username}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', padding: '24px', border: `1px solid ${c.border}`, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <img src={`${baseUrl}/icons/${getQuestIcon(crown.quest)}`} width={26} height={26} style={{ marginRight: '14px' }} />
                    <span style={{ fontSize: 20, color: crown.tempered ? c.blood : c.ember, fontWeight: 'bold', display: 'flex' }}>
                      {crown.quest || 'Hunt'}
                      {crown.tempered && ' (Tempered)'}
                    </span>
                  </div>

                  {crown.status_message && (
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px', padding: '12px 14px', background: 'rgba(201,162,74,0.06)', borderLeft: `3px solid ${c.ember}`, borderRadius: '0 8px 8px 0' }}>
                      <span style={{ fontSize: 11, color: c.ember, letterSpacing: '1px', marginBottom: '4px', display: 'flex' }}>HUNTER&apos;S NOTES</span>
                      <span style={{ fontSize: 15, color: c.mist, fontStyle: 'italic', display: 'flex' }}>&quot;{crown.status_message}&quot;</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${c.border}`, paddingTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, color: c.mistFaint, letterSpacing: '2px', display: 'flex' }}>STRENGTH RATING</span>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: c.mist, display: 'flex' }}>{crown.strength_rating}★</span>
                    </div>
                    {crown.remaining_uses !== null && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 11, color: c.mistFaint, letterSpacing: '2px', display: 'flex' }}>REMAINING USES</span>
                        <span style={{ fontSize: 24, fontWeight: 'bold', color: c.mist, display: 'flex' }}>{crown.remaining_uses}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '28px' }}>
                  <span style={{ fontSize: 12, color: c.ember, letterSpacing: '3px', marginBottom: '10px', fontWeight: 'bold', display: 'flex' }}>GUILD INTELLIGENCE</span>
                  <span style={{ fontSize: 18, lineHeight: '1.4', color: c.mist, display: 'flex' }}>
                    {monster.extraInfo?.games?.find(g => g.game === "Monster Hunter Wilds")?.info || 'Information pending from the research commission.'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'rgba(255,255,255,0.03)', padding: '16px', border: `1px solid ${c.border}`, borderRadius: '12px' }}>
                    <span style={{ fontSize: 11, color: c.mistFaint, letterSpacing: '2px', display: 'flex', marginBottom: '10px' }}>WEAKNESSES</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {monster.extraInfo?.weakness?.length
                        ? monster.extraInfo.weakness.map((w, i) => (
                          <span key={i} style={{ padding: '3px 10px', background: 'rgba(201,162,74,0.14)', border: `1px solid ${c.borderEmber}`, color: c.ember, fontSize: 12, borderRadius: '99px', display: 'flex' }}>{w}</span>
                        ))
                        : <span style={{ color: c.mistDim, fontSize: 13, display: 'flex' }}>Unknown</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', padding: '16px', border: `1px solid ${c.border}`, borderRadius: '12px', minWidth: '150px' }}>
                    <span style={{ fontSize: 11, color: c.mistFaint, letterSpacing: '2px', display: 'flex', marginBottom: '8px' }}>LARGE CROWNS</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={`${baseUrl}/icons/largecrown.png`} width={18} height={18} />
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: stats.large > 0 ? c.ember : c.mistFaint, display: 'flex' }}>{stats.large || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', padding: '16px', border: `1px solid ${c.border}`, borderRadius: '12px', minWidth: '150px' }}>
                    <span style={{ fontSize: 11, color: c.mistFaint, letterSpacing: '2px', display: 'flex', marginBottom: '8px' }}>SMALL CROWNS</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={`${baseUrl}/icons/smallcrown.png`} width={18} height={18} />
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: stats.small > 0 ? c.blue : c.mistFaint, display: 'flex' }}>{stats.small || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px 20px', opacity: 0.6 }}>
          <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '3px', display: 'flex' }}>CROWN GUILD OFFICIAL LEDGER</span>
          <span style={{ fontSize: 12, color: c.mistFaint, letterSpacing: '3px', display: 'flex' }}>© 2026 CROWN GUILD</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
