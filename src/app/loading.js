export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      backdropFilter: 'blur(5px)'
    }}>
      <style>{`
        @keyframes upanddown {
          0% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 10px rgba(181, 154, 93, 0.5);
          }
          50% {
            opacity: 0.7;
            text-shadow: 0 0 15px rgba(181, 154, 93, 0.8);
          }
        }

        @media (max-width: 768px) {
          .loading-icon {
            width: 48px !important;
            height: 48px !important;
          }
          .loading-text {
            font-size: 0.9rem !important;
            letter-spacing: 0.15em !important;
          }
        }
      `}</style>
      <img
        src="/icons/MHWilds-Field_Survey_Icon.png"
        alt="Loading..."
        className="pixel-art loading-icon"
        style={{
          width: '80px',
          height: '80px',
          animation: 'upanddown 2s linear infinite',
          marginBottom: '24px'
        }}
      />
      <h2
        className="loading-text"
        style={{
          fontFamily: "'Marcellus', serif",
          color: 'var(--mh-gold)',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontSize: '1.2rem',
          animation: 'pulse 1.5s infinite',
          textShadow: '0 0 10px rgba(181, 154, 93, 0.5)'
        }}
      >
        Gathering Intelligence...
      </h2>
    </div>
  );
}
