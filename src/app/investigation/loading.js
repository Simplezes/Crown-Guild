export default function Loading() {
  return (
    <div className="pad">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sk-b" style={{ width: 200, height: 32 }} />
            <div className="sk-b" style={{ width: 260, height: 14 }} />
          </div>
          <div style={{ display: "flex", background: "rgba(21,18,23,.8)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ padding: "10px 20px", borderLeft: i > 1 ? "1px solid rgba(255,255,255,.07)" : "none", display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="sk-b" style={{ width: 44, height: 24 }} />
                <div className="sk-b" style={{ width: 60, height: 10 }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "rgba(21,18,23,.8)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 18, flexWrap: "wrap" }}>
          <div className="sk-b" style={{ flex: "0 1 280px", minWidth: 180, height: 40, borderRadius: 12 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            {[100, 130, 110, 95, 120].map((w, i) => (
              <div key={i} className="sk-b" style={{ width: w, height: 36, borderRadius: 10 }} />
            ))}
          </div>
          <div className="sk-b" style={{ width: 120, height: 36, borderRadius: 10, marginLeft: "auto" }} />
          <div className="sk-b" style={{ width: 76, height: 36, borderRadius: 12 }} />
        </div>
      </div>

      <div className="m2g" style={{ marginTop: 14 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="sk-b" style={{ borderRadius: 20, height: 178 }} />
        ))}
      </div>
    </div>
  );
}
