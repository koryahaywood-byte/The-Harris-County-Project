/* Branded loading skeleton: navy shimmer blocks instead of spinners.
   Usage: <Skeleton className="h-12 rounded-xl" /> or <SkeletonRows n={4} /> */

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ background: "linear-gradient(90deg, rgba(26,58,92,0.08), rgba(26,58,92,0.14), rgba(26,58,92,0.08))", ...style }}
      aria-hidden
    />
  );
}

export function SkeletonRows({ n = 4, rowClassName = "h-12 rounded-xl" }: { n?: number; rowClassName?: string }) {
  return (
    <div className="flex flex-col gap-2" aria-label="Loading" role="status">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </div>
  );
}

export default Skeleton;
