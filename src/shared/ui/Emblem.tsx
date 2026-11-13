interface EmblemProps {
  rank?: number;
  className?: string;
}

export function Emblem({ rank, className = "" }: EmblemProps) {
  const n = Math.max(1, Math.min(8, rank || 1));
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={`Rank ${n}`}>
      <use href={`/sprite.svg#rk${n}`} />
    </svg>
  );
}
