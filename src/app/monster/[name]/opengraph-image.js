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

export default async function Image({ params, searchParams }) {
  const { name } = await params;
  const crownId = (await searchParams)?.crownId;

  const monster = await getMonsterByName(name);
  if (!monster) {
    return new ImageResponse(
      (
        <div style={{ fontSize: 48, background: '#0c0a09', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4c4a1' }}>
          Monster Not Found
        </div>
      ),
      { ...size }
    );
  }

  const crown = crownId ? await getCrownById(crownId) : null;
  const stats = !crown ? await getMonsterStats(monster.id) : null;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

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

  return new ImageResponse(
    (
      <div
        style={{
          background: colors.black,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          color: colors.tan,
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.15,
            backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.gold} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: colors.glass,
            border: `1px solid ${colors.border}`,
            position: 'relative',
            padding: '30px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '4px',
              background: `linear-gradient(to bottom, ${colors.red}, transparent)`,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={`${baseUrl}/icons/MHWilds-Hunt_Icon.png`} width={44} height={44} style={{ marginRight: '15px' }} />
              <span style={{ fontSize: 28, letterSpacing: '4px', color: colors.gold, display: 'flex' }}>
                {crown ? 'CROWN RECORD' : 'MONSTER LEDGER'}
              </span>
            </div>
            {crown && (
              <div style={{ display: 'flex', alignItems: 'center', background: colors.umber, padding: '5px 15px', border: `1px solid ${colors.border}` }}>
                <img src={`${baseUrl}/icons/${crown.type}crown.png`} width={24} height={24} style={{ marginRight: '10px' }} />
                <span style={{ fontSize: 16, color: colors.gold, fontWeight: 'bold', display: 'flex' }}>
                  {crown.type.toUpperCase()} CROWN
                </span>
              </div>
            )}
            {!crown && monster.is_large && (
              <div style={{ display: 'flex', alignItems: 'center', background: colors.umber, padding: '5px 15px', border: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 16, color: colors.gold, fontWeight: 'bold', display: 'flex' }}>
                  CROWNABLE
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '40%',
                justifyContent: 'center',
                alignItems: 'center',
                borderRight: `1px solid ${colors.border}`,
              }}
            >
              <img
                src={`${baseUrl}/monsters/${monster.image_name}`}
                width={300}
                height={300}
                style={{ objectFit: 'contain' }}
              />
              <span style={{ fontSize: 42, color: colors.goldBright, marginTop: '20px', textAlign: 'center', display: 'flex' }}>
                {monster.name}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '60%',
                paddingLeft: '50px',
                justifyContent: 'center',
              }}
            >
              {crown ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                    <img
                      src={crown.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`}
                      width={80}
                      height={80}
                      style={{ borderRadius: '10px', border: `1px solid ${colors.border}`, marginRight: '20px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 18, color: colors.tanDark, display: 'flex' }}>RECORDED BY</span>
                      <span style={{ fontSize: 32, color: '#fff', display: 'flex' }}>{crown.username}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', padding: '25px', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <img src={`${baseUrl}/icons/${getQuestIcon(crown.quest)}`} width={32} height={32} style={{ marginRight: '15px' }} />
                      <span style={{ fontSize: 24, color: crown.tempered ? colors.red : colors.gold, fontWeight: 'bold', display: 'flex' }}>
                        {crown.quest || 'Hunt'}
                        {crown.tempered && ' (Tempered)'}
                      </span>
                    </div>

                    {crown.status_message && (
                      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px', padding: '10px', background: 'rgba(181, 154, 93, 0.05)', borderLeft: `2px solid ${colors.gold}` }}>
                        <span style={{ fontSize: 12, color: colors.gold, letterSpacing: '1px', marginBottom: '4px', display: 'flex' }}>HUNTER'S NOTES</span>
                        <span style={{ fontSize: 16, color: colors.tan, fontStyle: 'italic', display: 'flex' }}>"{crown.status_message}"</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${colors.border}`, paddingTop: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, color: colors.tanDark, display: 'flex' }}>STRENGTH RATING</span>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: 24, fontWeight: 'bold', display: 'flex' }}>{crown.strength_rating}★</span>
                        </div>
                      </div>
                      {crown.remaining_uses !== null && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: 14, color: colors.tanDark, display: 'flex' }}>REMAINING USES</span>
                          <span style={{ fontSize: 24, fontWeight: 'bold', display: 'flex' }}>{crown.remaining_uses}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
                    <span style={{ fontSize: 18, color: colors.tanDark, marginBottom: '10px', display: 'flex' }}>GUILD INTELLIGENCE</span>
                    <span style={{ fontSize: 20, lineHeight: '1.4', display: 'flex' }}>
                      {monster.extraInfo?.games?.find(g => g.game === "Monster Hunter Wilds")?.info || 'Information pending from the research commission.'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                      <span style={{ fontSize: 14, color: colors.tanDark, display: 'flex' }}>WEAKNESSES</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                        {monster.extraInfo?.weakness?.map((w, i) => (
                          <span key={i} style={{ padding: '2px 8px', background: 'rgba(181, 154, 93, 0.2)', color: colors.gold, fontSize: 12, borderRadius: '4px', display: 'flex' }}>{w}</span>
                        )) || 'Unknown'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                      <span style={{ fontSize: 14, color: colors.tanDark, display: 'flex' }}>LARGE CROWNS</span>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                        <img src={`${baseUrl}/icons/largecrown.png`} width={20} height={20} style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: 24, fontWeight: 'bold', color: stats.large > 0 ? colors.gold : colors.tanDark, display: 'flex' }}>
                          {stats.large || 0} HOSTS
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                      <span style={{ fontSize: 14, color: colors.tanDark, display: 'flex' }}>SMALL CROWNS</span>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                        <img src={`${baseUrl}/icons/smallcrown.png`} width={20} height={20} style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: 24, fontWeight: 'bold', color: stats.small > 0 ? colors.gold : colors.tanDark, display: 'flex' }}>
                          {stats.small || 0} HOSTS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', opacity: 0.5 }}>
                <span style={{ fontSize: 14, display: 'flex' }}>CROWN GUILD OFFICIAL LEDGER</span>
                <span style={{ fontSize: 14, display: 'flex' }}>© 2026 CROWN GUILD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
