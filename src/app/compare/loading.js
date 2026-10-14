export default function Loading() {
  return (
    <div className="pad cmp-page">
      <header className="cmp-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="sk-b" style={{ width: 200, height: 28 }} />
          <div className="sk-b" style={{ width: 320, height: 14 }} />
        </div>
        <div className="sk-b" style={{ width: 120, height: 28, borderRadius: 99 }} />
      </header>

      <section className="cmp-pair" style={{ background: "rgba(21,18,23,.74)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sk-b" style={{ width: 140, height: 18 }} />
            <div className="sk-b" style={{ width: 260, height: 13 }} />
          </div>
          <div className="sk-b" style={{ width: 110, height: 28, borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
          <div className="sk-b" style={{ flex: 1, minWidth: 200, height: 70, borderRadius: 14 }} />
          <div className="sk-b" style={{ width: 40, height: 40, borderRadius: 50, alignSelf: "center", flex: "none" }} />
          <div className="sk-b" style={{ flex: 1, minWidth: 200, height: 70, borderRadius: 14 }} />
          <div className="sk-b" style={{ width: 160, height: 44, borderRadius: 10, alignSelf: "center", flex: "none" }} />
        </div>
      </section>

      <section style={{ background: "rgba(21,18,23,.74)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 20, padding: "28px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="sk-b" style={{ height: 72, borderRadius: 14 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[1, 2].map((i) => (
            <div key={i} className="sk-b" style={{ height: 100, borderRadius: 16 }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="sk-b" style={{ width: 180, height: 20 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sk-b" style={{ height: 46, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
