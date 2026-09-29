/**
 * A book cover. Shows the real image when the book has a `coverUrl`;
 * otherwise draws a colourful cover from the title and author, so the shelves
 * look lively even before real cover art is uploaded. The colour is picked
 * from the title, so a book always gets the same colour.
 *
 * Full class names are written out below (not built from pieces) because
 * Tailwind only generates classes it can find as complete strings.
 */
const COVER_STYLES = [
  "bg-coral text-navy",
  "bg-sunshine text-navy",
  "bg-teal text-navy",
  "bg-grape text-white",
  "bg-navy text-cream",
];

/** Small, stable number derived from text. */
function hash(text) {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

export default function BookCover({ book }) {
  const shape = "aspect-[2/3] w-full rounded-xl shadow-md";

  if (book.coverUrl) {
    return <img src={book.coverUrl} alt={`Cover of ${book.title}`} loading="lazy" className={`${shape} object-cover`} />;
  }

  const style = COVER_STYLES[hash(book.title) % COVER_STYLES.length];
  return (
    <div
      role="img"
      aria-label={`Cover of ${book.title} by ${book.authors.join(", ")}`}
      // The thick left edge suggests the spine of a real book.
      className={`${shape} ${style} flex flex-col justify-between overflow-hidden border-l-8 border-black/15 p-4`}
    >
      <span className="h-1 w-10 rounded-full bg-current opacity-60" />
      <span className="line-clamp-5 font-display text-lg font-bold leading-tight sm:text-xl">{book.title}</span>
      <span className="line-clamp-2 text-xs font-semibold uppercase tracking-wider opacity-80">
        {book.authors.join(", ")}
      </span>
    </div>
  );
}
