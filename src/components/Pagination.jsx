/** Previous / Next buttons with "Page X of Y". Renders nothing when there is only one page. */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const button = "rounded-full border border-navy/20 bg-white px-5 py-2 font-semibold enabled:hover:border-navy disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
      <button className={button} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="text-sm font-semibold">
        Page {page} of {totalPages}
      </span>
      <button className={button} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
