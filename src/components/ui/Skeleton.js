export default function Skeleton({ className = "" }) {
  return <span className={`skeleton-shimmer ${className}`.trim()} />;
}
