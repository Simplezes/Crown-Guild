import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  className?: string;
}

export function Skeleton({ width, height, radius, className = "" }: SkeletonProps) {
  return (
    <span
      className={`sk-b ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
