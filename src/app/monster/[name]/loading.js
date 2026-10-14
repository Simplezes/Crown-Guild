export default function Loading() {
  return (
    <div className="wrap">
      <div className="sk-b" style={{ width: 100, height: 18, borderRadius: 6 }} />

      <section className="p mh" style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sk-b" style={{ width: 140, height: 12 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div className="sk-b" style={{ width: 88, height: 88, borderRadius: 22, flex: "none" }} />
            <div className="sk-b" style={{ width: 260, height: 44 }} />
          </div>
          <div className="sk-b" style={{ width: "80%", height: 14 }} />
          <div className="sk-b" style={{ width: "60%", height: 14 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <div className="sk-b" style={{ width: 120, height: 38, borderRadius: 10 }} />
            <div className="sk-b" style={{ width: 110, height: 38, borderRadius: 10 }} />
          </div>
        </div>
        <div className="k4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="sk-b" style={{ borderRadius: 14, height: 72 }} />
          ))}
        </div>
      </section>

      <section className="mbody" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: 24 }}>
        <div className="pp">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="sk-b" style={{ width: 110, height: 11 }} />
              <div className="sk-b" style={{ width: 170, height: 22 }} />
            </div>
            <div className="sk-b" style={{ width: 140, height: 36, borderRadius: 10 }} />
          </div>
          <div className="sk-b" style={{ width: "75%", height: 13, marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[80, 65, 80, 70].map((w, i) => (
              <div key={i} className="sk-b" style={{ width: w, height: 32, borderRadius: 8 }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div className="sk-b" style={{ width: 120, height: 14 }} />
            <div className="sk-b" style={{ width: 28, height: 20, borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="sk-b" style={{ height: 78, borderRadius: 16 }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="pp">
            <div className="sk-b" style={{ width: 120, height: 18, marginBottom: 16 }} />
            {["Weaknesses", "Elements", "Ailments"].map((label, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div className="sk-b" style={{ width: 80, height: 11, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {[70, 90, 60].map((w, j) => (
                    <div key={j} className="sk-b" style={{ width: w, height: 26, borderRadius: 99 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pp">
            <div className="sk-b" style={{ width: 100, height: 18, marginBottom: 16 }} />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 1 ? "1px solid rgba(255,255,255,.07)" : "none" }}>
                <div className="sk-b" style={{ width: 60, height: 13 }} />
                <div className="sk-b" style={{ width: 30, height: 20 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
