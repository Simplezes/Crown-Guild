export default function Loading() {
  return (
    <div className="pad pf">
      <section className="pf-hero">
        <div className="pf-av">
          <div className="sk-b" style={{ width: 104, height: 104, borderRadius: 28 }} />
        </div>
        <div className="pf-id" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="sk-b" style={{ width: 130, height: 11 }} />
          <div className="sk-b" style={{ width: 240, height: 38 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <div className="sk-b" style={{ width: 100, height: 24, borderRadius: 99 }} />
            <div className="sk-b" style={{ width: 80, height: 16 }} />
          </div>
        </div>
        <div className="pf-act" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="sk-b" style={{ width: 140, height: 36, borderRadius: 10 }} />
          <div className="sk-b" style={{ width: 100, height: 36, borderRadius: 10 }} />
        </div>
      </section>

      <div className="pf-cols">
        <aside className="pf-side">
          <section className="wd">
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <div className="sk-b" style={{ width: 76, height: 76, borderRadius: 50, flex: "none" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="sk-b" style={{ width: 60, height: 10 }} />
                <div className="sk-b" style={{ width: 120, height: 22 }} />
                <div className="sk-b" style={{ width: 80, height: 14 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 3, padding: "10px 8px", background: "rgba(8,7,10,.7)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, marginBottom: 12 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="sk-b" style={{ height: 30, borderRadius: 8 }} />
              ))}
            </div>
            <div className="sk-b" style={{ width: "70%", height: 12, marginBottom: 14 }} />
            <div className="pf-tiles">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="sk-b" style={{ borderRadius: 12, height: 60 }} />
              ))}
            </div>
          </section>

          <section className="wd" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="sk-b" style={{ width: 100, height: 16 }} />
            <div className="sk-b" style={{ height: 50, borderRadius: 14 }} />
          </section>
        </aside>

        <section className="wd">
          <div style={{ display: "flex", gap: 28, borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: 16 }}>
            {[80, 90, 80].map((w, i) => (
              <div key={i} className="sk-b" style={{ width: w, height: 14, margin: "16px 0", borderRadius: 4 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div className="sk-b" style={{ flex: 1, height: 38, borderRadius: 12 }} />
            <div className="sk-b" style={{ width: 38, height: 38, borderRadius: 10 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="sk-b" style={{ height: 110, borderRadius: 16 }} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
