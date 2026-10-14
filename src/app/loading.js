export default function Loading() {
  return (
    <div className="pad">
      <div className="greet">
        <div className="animate-pulse rounded-lg bg-white/[0.08]" style={{ width: 280, height: 32, marginBottom: 8 }} />
        <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 230, height: 15 }} />
      </div>

      <div className="bento">
        <div className="wd s12 gc3 gc4">
          <div className="g4-top">
            <div className="g4e">
              <div className="animate-pulse rounded-full bg-white/[0.08]" style={{ width: 62, height: 62 }} />
            </div>
            <div className="g4w" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 95, height: 10 }} />
              <div className="animate-pulse rounded bg-white/[0.08]" style={{ width: 160, height: 26 }} />
              <div className="g4s" style={{ display: "flex", gap: "14px", marginTop: "2px" }}>
                <div className="animate-pulse rounded bg-white/[0.06]" style={{ width: 65, height: 14 }} />
                <div className="animate-pulse rounded bg-white/[0.06]" style={{ width: 65, height: 14 }} />
                <div className="animate-pulse rounded bg-white/[0.06]" style={{ width: 75, height: 14 }} />
              </div>
            </div>
            <div className="g4mp" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <div className="animate-pulse rounded bg-white/[0.08]" style={{ width: 70, height: 30 }} />
              <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 22, height: 10 }} />
            </div>
          </div>

          <div className="g4-next">
            <div className="g4row">
              <div className="g4bar" style={{ background: "rgba(255,255,255,0.06)" }}>
                <i className="animate-pulse" style={{ width: "55%", background: "rgba(201,162,74,0.4)" }} />
              </div>
              <div className="g4ne">
                <div className="animate-pulse rounded-full bg-white/[0.06]" style={{ width: 38, height: 38 }} />
              </div>
            </div>
            <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 175, height: 13, marginTop: 6 }} />
          </div>

          <div className="g4-shelf">
            <div className="g4-shelf-bar">
              <div className="animate-pulse rounded bg-white/[0.08]" style={{ width: 110, height: 18 }} />
              <div className="animate-pulse rounded-lg bg-white/[0.07]" style={{ width: 115, height: 32 }} />
            </div>
            <div className="g4r">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="g4t animate-pulse" style={{ border: "1px solid rgba(255,255,255,0.06)", flex: "none" }} />
              ))}
            </div>
          </div>
        </div>

        <div className="s12 wanted3">
          <div className="w3a">
            <div className="animate-pulse rounded-2xl bg-white/[0.08]" style={{ width: 92, height: 92 }} />
          </div>
          <div className="w3t" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="animate-pulse rounded-full bg-white/[0.06]" style={{ width: 85, height: 18 }} />
            <div className="animate-pulse rounded bg-white/[0.08]" style={{ width: 170, height: 26 }} />
            <div className="w3h" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-full bg-white/[0.07]" style={{ width: 26, height: 26 }} />
                ))}
              </div>
              <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 120, height: 13 }} />
            </div>
          </div>
          <div className="w3s">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div className="animate-pulse rounded bg-white/[0.08]" style={{ width: 36, height: 20 }} />
                <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 50, height: 10 }} />
              </div>
            ))}
          </div>
          <div className="w3c" style={{ display: "flex", gap: "8px" }}>
            <div className="animate-pulse rounded-lg bg-white/[0.08]" style={{ width: 110, height: 34 }} />
            <div className="animate-pulse rounded-lg bg-white/[0.06]" style={{ width: 70, height: 34 }} />
          </div>
        </div>

        <div className="wd s12 board">
          <div className="tabs3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <div className="animate-pulse rounded-lg bg-white/[0.08]" style={{ width: 68, height: 28 }} />
              <div className="animate-pulse rounded-lg bg-white/[0.05]" style={{ width: 60, height: 28 }} />
              <div className="animate-pulse rounded-lg bg-white/[0.05]" style={{ width: 68, height: 28 }} />
              <div className="animate-pulse rounded-lg bg-white/[0.05]" style={{ width: 60, height: 28 }} />
            </div>
            <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 85, height: 14 }} />
          </div>

          <div className="b3">
            <div className="b3m" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h5r notrk" style={{ cursor: "default" }}>
                  <div className="animate-pulse rounded bg-white/[0.06]" style={{ width: 16, height: 16 }} />
                  <div className="animate-pulse rounded-xl bg-white/[0.08]" style={{ width: 40, height: 40, flex: "none" }} />
                  <div className="h5m" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="h5t">
                      <div className="animate-pulse rounded bg-white/[0.08]" style={{ width: 110, height: 14 }} />
                      <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 65, height: 12 }} />
                    </div>
                    <div className="animate-pulse rounded-full bg-white/[0.05]" style={{ height: 4, width: "100%" }} />
                  </div>
                  <div className="animate-pulse rounded-xl bg-white/[0.06]" style={{ width: 34, height: 34, flex: "none" }} />
                </div>
              ))}
            </div>

            <aside className="b3s" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div className="animate-pulse rounded bg-white/[0.06]" style={{ width: 90, height: 12, marginBottom: 8 }} />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h5f" style={{ cursor: "default" }}>
                  <div className="animate-pulse rounded-lg bg-white/[0.08]" style={{ width: 26, height: 26, flex: "none" }} />
                  <div className="h5x" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div className="animate-pulse rounded bg-white/[0.08]" style={{ width: 100, height: 13 }} />
                    <div className="animate-pulse rounded bg-white/[0.05]" style={{ width: 140, height: 11 }} />
                  </div>
                  <div className="animate-pulse rounded bg-white/[0.06]" style={{ width: 18, height: 18, flex: "none" }} />
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
