export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <section className="mb-8 rounded-2xl border border-white/5 bg-void-panel p-6 lg:p-8">
        <div className="sk-b" style={{ width: 120, height: 12, borderRadius: 6, marginBottom: 12 }} />
        <div className="sk-b" style={{ width: 220, height: 36, borderRadius: 8, marginBottom: 12 }} />
        <div className="sk-b" style={{ width: "70%", maxWidth: 520, height: 14, borderRadius: 6 }} />
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(21,18,23,.74)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 16 }}>
          <div className="sk-b" style={{ flex: 1, height: 20, borderRadius: 6 }} />
          <div className="sk-b" style={{ width: 120, height: 16, borderRadius: 6 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {Array.from({ length: 4 }).map((_, gi) => (
            <section key={gi} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <div className="sk-b" style={{ width: 40, height: 40, borderRadius: 12, flex: "none" }} />
                <div className="sk-b" style={{ width: 140, height: 22, borderRadius: 6 }} />
                <div className="sk-b" style={{ width: 60, height: 18, borderRadius: 99, marginLeft: "auto" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {Array.from({ length: 3 }).map((_, hi) => (
                  <div key={hi} className="sk-b" style={{ height: 96, borderRadius: 16 }} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
