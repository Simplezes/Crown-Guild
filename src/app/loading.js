export default function Loading() {
  return (
    <div className="pad sk-home">
      <div className="sk-greet">
        <div className="sk-b" style={{ width: 220, height: 28, borderRadius: 8 }} />
        <div className="sk-b" style={{ width: 280, height: 16, borderRadius: 6, marginTop: 8 }} />
      </div>

      <div className="bento">
        <div className="wd s12 gc4 sk-card">
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div className="sk-b" style={{ width: 64, height: 64, borderRadius: 50 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="sk-b" style={{ width: "40%", height: 14 }} />
              <div className="sk-b" style={{ width: "65%", height: 24 }} />
              <div className="sk-b" style={{ width: "50%", height: 12 }} />
            </div>
            <div className="sk-b" style={{ width: 60, height: 40, borderRadius: 10 }} />
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sk-b" style={{ width: "100%", height: 8, borderRadius: 99 }} />
            <div className="sk-b" style={{ width: "60%", height: 12 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sk-b" style={{ width: 46, height: 46, borderRadius: 12, flex: "none" }} />
            ))}
          </div>
        </div>

        <div className="s12 wd sk-card" style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 22px" }}>
          <div className="sk-b" style={{ width: 92, height: 92, borderRadius: 14, flex: "none" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sk-b" style={{ width: 90, height: 18, borderRadius: 99 }} />
            <div className="sk-b" style={{ width: 160, height: 26 }} />
            <div className="sk-b" style={{ width: 120, height: 14 }} />
          </div>
          <div style={{ display: "flex", gap: 0, marginLeft: "auto" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 22px", borderLeft: "1px solid rgba(255,255,255,.07)" }}>
                <div className="sk-b" style={{ width: 44, height: 28 }} />
                <div className="sk-b" style={{ width: 60, height: 12 }} />
              </div>
            ))}
          </div>
        </div>

        <div className="s12 wd sk-board">
          <div style={{ display: "flex", gap: 28, borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: 10, padding: "0 22px" }}>
            {[110, 90, 120].map((w, i) => (
              <div key={i} className="sk-b" style={{ width: w, height: 14, borderRadius: 4, margin: "16px 0" }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)", gap: 28, padding: "0 22px 18px", minHeight: 270 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: 14, alignItems: "center", padding: "7px 8px" }}>
                  <div className="sk-b" style={{ width: 34, height: 34, borderRadius: 9 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="sk-b" style={{ width: `${60 + Math.random() * 30}%`, height: 13 }} />
                    <div className="sk-b" style={{ width: "40%", height: 4, borderRadius: 99 }} />
                  </div>
                  <div className="sk-b" style={{ width: 36, height: 13 }} />
                </div>
              ))}
            </div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,.07)", paddingLeft: 26, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="sk-b" style={{ width: 90, height: 10 }} />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 40px 1fr auto", gap: 12, alignItems: "center", padding: "8px 2px" }}>
                  <div className="sk-b" style={{ width: 22, height: 16, borderRadius: 4 }} />
                  <div className="sk-b" style={{ width: 40, height: 40, borderRadius: 50 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="sk-b" style={{ width: "80%", height: 13 }} />
                    <div className="sk-b" style={{ width: "55%", height: 10 }} />
                  </div>
                  <div className="sk-b" style={{ width: 40, height: 18 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
