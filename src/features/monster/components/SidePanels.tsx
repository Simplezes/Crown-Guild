interface TagListProps {
  values: string[] | undefined;
  tone?: "default" | "gold" | "red";
  fallback: string;
}

function TagList({ values, tone = "default", fallback }: TagListProps) {
  if (!values?.length) return <span className="pl">{fallback}</span>;
  const className = tone === "gold" ? "pl w" : tone === "red" ? "pl a" : "pl";
  return (
    <div className="pills2">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className={className}>
          {value}
        </span>
      ))}
    </div>
  );
}

interface SidePanelsProps {
  weakness: string[] | undefined;
  elements: string[] | undefined;
  ailments: string[] | undefined;
  breakdown: [string, number][];
}

export function SidePanels({ weakness, elements, ailments, breakdown }: SidePanelsProps) {
  return (
    <div>
      <div className="pp phys">
        <div className="sec-h">
          <h2>Physiology</h2>
        </div>
        <div className="grp">
          <small>Weaknesses</small>
          <TagList values={weakness} tone="gold" fallback="Unknown" />
        </div>
        <div className="grp">
          <small>Elements</small>
          <TagList values={elements} fallback="None" />
        </div>
        <div className="grp">
          <small>Ailments</small>
          <TagList values={ailments} tone="red" fallback="None" />
        </div>
      </div>
      <div className="pp" style={{ marginTop: 16 }}>
        <div className="sec-h">
          <h2>Breakdown</h2>
        </div>
        {breakdown.map(([label, value]) => (
          <div key={label} className="bd">
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
