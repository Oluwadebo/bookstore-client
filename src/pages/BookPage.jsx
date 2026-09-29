/**
 * Book detail page (/books/:slug): cover, description, price, details,
 * and related titles. The "Add to cart" button is added here in step 4.
 */
import { Link, useParams } from "react-router-dom";
import BookCover from "../components/BookCover.jsx";
import BookGrid from "../components/BookGrid.jsx";
import { formatPrice } from "../lib/format.js";
import { useApi } from "../lib/useApi.js";
import { usePageTitle } from "../lib/usePageTitle.js";

export default function BookPage() {
  const { slug } = useParams();
  const { data, error, loading } = useApi(`/api/books/${slug}`);
  const book = data?.book;

  usePageTitle(book?.title || "Book");

  if (loading && !data) return <p className="px-4 py-24 text-center">Loading...</p>;

  if (error || !book) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Book not found</h1>
        <p className="mt-3">{error || "We could not find that book."}</p>
        <Link to="/browse" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy">
          Browse all books
        </Link>
      </main>
    );
  }

  const details = [
    ["Format", book.format.toUpperCase()],
    ["Language", book.language.toUpperCase()],
    ["Published", book.publishedYear],
  ].filter(([, value]) => value);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Stacks on phones; cover beside the text from `md` upwards */}
      <div className="grid gap-8 md:grid-cols-[280px_1fr] md:gap-12">
        <div className="mx-auto w-full max-w-[240px] md:max-w-none">
          <BookCover book={book} />
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {book.categories.map((c) => (
              <Link
                key={c._id}
                to={`/category/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-white px-3 py-1 text-sm font-semibold hover:border-navy"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </Link>
            ))}
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">{book.title}</h1>
          <p className="mt-2 text-lg">by {book.authors.join(", ")}</p>

          <p className="mt-6 text-3xl font-bold">{formatPrice(book.priceCents, book.currency)}</p>
          {/* Step 4: the "Add to cart" button goes here. */}

          <h2 className="mt-8 font-display text-xl font-bold">About this book</h2>
          <p className="mt-2 max-w-2xl whitespace-pre-line leading-relaxed">{book.description || "No description yet."}</p>

          {details.length > 0 && (
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 rounded-2xl bg-white p-5 shadow-sm">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">You might also like</h2>
          <BookGrid books={data.related} />
        </section>
      )}
    </main>
  );
}
