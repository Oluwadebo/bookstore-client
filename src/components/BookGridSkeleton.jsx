/**
 * Placeholder grid shown while books are loading. Same layout as BookGrid,
 * so the page doesn't jump when the real books arrive. The hidden text
 * ("Loading books") is read out by screen readers.
 */
export default function BookGridSkeleton({ count = 8 }) {
  return (
    <div role="status" aria-live="polite" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      <span className="sr-only">Loading books</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse" aria-hidden="true">
          <div className="aspect-[2/3] rounded-xl bg-navy/10" />
          <div className="mt-3 h-4 w-3/4 rounded bg-navy/10" />
          <div className="mt-2 h-3 w-1/2 rounded bg-navy/10" />
          <div className="mt-2 h-4 w-1/4 rounded bg-navy/10" />
        </div>
      ))}
    </div>
  );
}
