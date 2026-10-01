/**
 * Every loading state in the app lives here, so it looks the same everywhere.
 * Never write a plain "Loading..." line. Pick one of these instead:
 *
 *   <PageLoader />            a whole page is waiting (the animated books, centred)
 *   <BookLoader label="..." /> the same animation, inline
 *   <Skeleton className="h-4 w-24" />   a grey pulsing block; build your own placeholder from it
 *   <SkeletonRows />, <SkeletonStats />, <SkeletonShelves />, <SkeletonCards />,
 *   <BookPageSkeleton />, <FormSkeleton />     ready-made placeholders shaped like each screen
 *   <BusyLabel busy={saving} busyText="Saving...">Save</BusyLabel>   spinner + text inside a button
 *   <TopLoadingBar />         the thin progress bar (already placed once, in Layout)
 *
 * Skeletons copy the layout of the real content, so nothing jumps when the data arrives.
 * Each one announces itself to screen readers, and animations pause for people who prefer
 * reduced motion.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { pendingRequests } from "../lib/api.js";
import "./loading.css";

// ------------------------------------------------------------------ the brand loader

export function BookLoader({ label = "Loading", className = "" }) {
  return (
    <div role="status" className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="bookload" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="text-sm font-semibold opacity-70">{label}</p>
    </div>
  );
}

/** Fills the space of a page while its first data loads. */
export function PageLoader({ label = "Loading" }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <BookLoader label={label} />
    </div>
  );
}

// ------------------------------------------------------------------ small pieces

/** A spinning ring, for inside buttons. */
export function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Button content that shows a spinner while busy: <BusyLabel busy={x} busyText="Saving...">Save</BusyLabel> */
export function BusyLabel({ busy, busyText, children }) {
  return busy ? (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner />
      {busyText}
    </span>
  ) : (
    children
  );
}

/** One grey pulsing block. */
export function Skeleton({ className = "" }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded bg-navy/10 ${className}`} />;
}

/** Wrapper that tells screen readers what is loading, and hides the pieces from them. */
function Group({ label, className = "", children }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ ready-made placeholders

/** A list of rows: small picture, two lines, a price. (Admin books, orders...) */
export function SkeletonRows({ count = 5, label = "Loading" }) {
  return (
    <Group label={label} className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
          <Skeleton className="h-16 w-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </Group>
  );
}

/** A row of number cards. (Dashboard) */
export function SkeletonStats({ count = 4 }) {
  return (
    <Group label="Loading dashboard" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-16" />
          <Skeleton className="mt-3 h-3 w-28" />
        </div>
      ))}
    </Group>
  );
}

/** Shelf rows with a colour dot. (Admin shelves) */
export function SkeletonShelves({ count = 5 }) {
  return (
    <Group label="Loading shelves" className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </Group>
  );
}

/** Cards with a coloured top edge. (Home page shelves) */
export function SkeletonCards({ count = 4 }) {
  return (
    <Group label="Loading shelves" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border-t-8 border-navy/10 bg-white p-5 shadow-sm">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <Skeleton className="mt-4 h-3 w-16" />
        </div>
      ))}
    </Group>
  );
}

/** Same shape as the book page: cover on the left, text on the right. */
export function BookPageSkeleton() {
  return (
    <Group label="Loading book" className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="grid gap-8 md:grid-cols-[280px_1fr] md:gap-12">
        <Skeleton className="mx-auto aspect-[2/3] w-full max-w-[240px] rounded-xl md:max-w-none" />
        <div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-10 w-3/4" />
          <Skeleton className="mt-3 h-5 w-1/3" />
          <Skeleton className="mt-8 h-9 w-28" />
          <Skeleton className="mt-5 h-12 w-44 rounded-full" />
          <div className="mt-10 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    </Group>
  );
}

/** A form card next to a side card. (Admin book form) */
export function FormSkeleton({ fields = 6 }) {
  return (
    <Group label="Loading form" className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
        <Skeleton className="h-7 w-40" />
        {Array.from({ length: fields }, (_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    </Group>
  );
}

// ------------------------------------------------------------------ the top progress bar

/**
 * A thin bar across the top of the screen whenever the app is waiting on the server (any page,
 * any action). It only appears after 200ms, so quick requests don't make it flicker.
 */
export function TopLoadingBar() {
  const pending = useSyncExternalStore(pendingRequests.subscribe, pendingRequests.getSnapshot);
  const busy = pending > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, [busy]);

  if (!visible) return null;
  return (
    <div role="progressbar" aria-label="Loading" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-coral/20">
      <div className="topbar-run h-full w-1/4 rounded-full bg-coral" />
    </div>
  );
}
