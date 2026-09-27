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

// Exact tokens from src/app/template.css :root
const c = {
  void: '#08070a',
  panel: '#151217',
  raised: '#1e1a20',
  ember: '#c9a24a',
  emberB: '#e8cc7d',
  mist: '#c9c2b8',
  mistD: '#948d82',
  faint: '#6b655c',
  blood: '#d3554f',
  tempered: '#b45ff0',
  line: 'rgba(255,255,255,0.07)',
};

function CrownRow({ icon, label, n }) {
  const on = n > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: c.void, border: `1px solid ${on ? 'rgba(201,162,74,0.4)' : c.line}`, borderRadius: '16px' }}>
      <img src={icon} width={30} height={30} style={{ imageRendering: 'pixelated', opacity: on ? 1 : 0.3, filter: on ? 'none' : 'grayscale(1)', display: 'flex' }} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: c.mist, display: 'flex' }}>{label}</span>
        <span style={{ fontSize: 13, color: on ? c.mistD : c.faint, display: 'flex' }}>{on ? `${n} logged` : 'Not logged yet'}</span>
      </div>
      <span style={{ fontSize: 30, fontWeight: 600, color: on ? c.emberB : c.faint, display: 'flex' }}>{n}</span>
    </div>
  );
}

function StatTile({ label, value, color, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, background: c.void, border: `1px solid ${c.line}`, borderRadius: '14px', padding: '16px 6px', gap: '5px' }}>
      <span style={{ fontSize: small ? 18 : 22, fontWeight: 600, color: color || c.emberB, display: 'flex', lineHeight: '1.1', whiteSpace: 'nowrap' }}>{value}</span>
      <span style={{ fontSize: 10, letterSpacing: '2px', color: c.mistD, textTransform: 'uppercase', display: 'flex' }}>{label}</span>
    </div>
  );
}

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
      <div style={{ background: c.void, width: '100%', height: '100%', display: 'flex', flexDirection: 'row', fontFamily: 'sans-serif', overflow: 'hidden' }}>
        {/* Left: mirrors .d2hero on the real monster drawer */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
            width: '440px', flexShrink: 0, padding: '40px', position: 'relative',
            background: crown?.tempered
              ? 'radial-gradient(70% 90% at 50% 40%, rgba(180,95,240,0.22) 0%, transparent 70%)'
              : 'radial-gradient(70% 90% at 50% 40%, rgba(201,162,74,0.2) 0%, transparent 70%)',
          }}
        >
          <div style={{ position: 'relative', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%', border: `1px dashed ${crown?.tempered ? 'rgba(180,95,240,0.45)' : 'rgba(201,162,74,0.28)'}`, display: 'flex' }} />
            <img src={`${baseUrl}/monsters/${monster.image_name}`} width={200} height={200} style={{ objectFit: 'contain', display: 'flex' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: 40, color: c.mist, fontFamily: 'serif', textTransform: 'uppercase', letterSpacing: '.03em', textAlign: 'center', lineHeight: '1.1', display: 'flex' }}>{monster.name}</span>
            <span style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', color: c.emberB, background: 'rgba(201,162,74,0.12)', border: `1px solid rgba(201,162,74,0.35)`, borderRadius: '99px', padding: '4px 16px', display: 'flex' }}>
              {crown ? `${crown.type.toUpperCase()} CROWN` : (monster.type || 'Monster')}
            </span>
          </div>
        </div>

        {/* Right: content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '56px 60px', gap: '24px', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, letterSpacing: '3px', color: c.mistD, textTransform: 'uppercase', display: 'flex' }}>
            {crown ? 'Crown Record' : 'Monster Ledger'} · Crown Guild
          </span>

          {crown ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: c.void, border: `1px solid rgba(201,162,74,0.4)`, borderRadius: '16px' }}>
                <img
                  src={crown.avatar_url || `${baseUrl}/icons/MHWilds-Quest_Members_Icon.png`}
                  width={48} height={48}
                  style={{ borderRadius: '50%', border: `1px solid rgba(201,162,74,0.4)`, objectFit: 'cover', display: 'flex' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: c.mist, display: 'flex' }}>{crown.username}</span>
                  <span style={{ fontSize: 13, color: c.mistD, display: 'flex' }}>{crown.quest || 'Hunt'}</span>
                </div>
                <img src={`${baseUrl}/icons/${getQuestIcon(crown.quest)}`} width={26} height={26} style={{ display: 'flex' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <StatTile label="Rating" value={`${crown.strength_rating}/10`} small />
                <StatTile label="Size" value={crown.type === 'large' ? 'Large' : 'Small'} />
                {crown.size_cm != null && <StatTile label="Length" value={`${Math.round(Number(crown.size_cm) * 10) / 10} cm`} small />}
                {crown.remaining_uses !== null && <StatTile label="Uses Left" value={crown.remaining_uses} />}
              </div>

              {crown.status_message && (
                <div style={{ display: 'flex', padding: '14px 18px', background: 'rgba(201,162,74,0.06)', borderLeft: `3px solid ${c.ember}`, borderRadius: '0 12px 12px 0' }}>
                  <span style={{ fontSize: 15, color: c.mistD, display: 'flex' }}>&quot;{crown.status_message}&quot;</span>
                </div>
              )}
            </>
          ) : (
            <>
              <span style={{ fontSize: 16, lineHeight: '1.5', color: c.mistD, maxWidth: '560px', display: 'flex' }}>
                {monster.extraInfo?.games?.find(g => g.game === "Monster Hunter Wilds")?.info || 'Information pending from the research commission.'}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <CrownRow icon={`${baseUrl}/icons/largecrown.png`} label="Large crown" n={stats.large || 0} />
                <CrownRow icon={`${baseUrl}/icons/smallcrown.png`} label="Small crown" n={stats.small || 0} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: c.faint, display: 'flex' }}>Weaknesses</span>
                <span style={{ fontSize: 16, color: c.mist, display: 'flex' }}>
                  {monster.extraInfo?.weakness?.length ? monster.extraInfo.weakness.join(', ') : 'Unknown'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
