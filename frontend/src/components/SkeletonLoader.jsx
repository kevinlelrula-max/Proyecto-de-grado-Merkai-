export function SkeletonCard({ height = 120 }) {
  return (
    <>
      <style>{`
        @keyframes sk-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sk-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 600px 100%;
          animation: sk-shimmer 1.4s infinite linear;
          border-radius: 12px;
        }
      `}</style>
      <div className="sk-shimmer" style={{ height, borderRadius: 14 }} />
    </>
  );
}

export function SkeletonRow() {
  return (
    <>
      <style>{`
        @keyframes sk-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        .sk-shimmer { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 600px 100%; animation: sk-shimmer 1.4s infinite linear; border-radius: 8px; }
      `}</style>
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
        <div className="sk-shimmer" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="sk-shimmer" style={{ height: 13, width: "55%" }} />
          <div className="sk-shimmer" style={{ height: 11, width: "35%" }} />
        </div>
        <div className="sk-shimmer" style={{ width: 70, height: 26, borderRadius: 20 }} />
        <div className="sk-shimmer" style={{ width: 60, height: 28, borderRadius: 8 }} />
      </div>
    </>
  );
}

export function SkeletonGrid({ count = 4, height = 160 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ padding: "0 4px" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
