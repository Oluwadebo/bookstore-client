/**
 * Home page (/): hero with search, the shelves, featured books and new arrivals.
 * Everything comes from the API, so content changes made in the admin area
 * (step 5) show up here without touching code.
 */
import { Link } from "react-router-dom";
import BookGrid from "../components/BookGrid.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { useApi } from "../lib/useApi.js";
import { usePageTitle } from "../lib/usePageTitle.js";

function Section({ title, action, children }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  usePageTitle("");
  const shelves = useApi("/api/categories");
  const featured = useApi("/api/books?featured=true&limit=4");
  const newest = useApi("/api/books?limit=8");

  return (
    <>
      {/* Hero */}
      <section className="bg-coral">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-navy sm:text-6xl">
            Your next favourite read is one search away.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-navy">Digital books, delivered the moment you check out.</p>
          <div className="mt-8 max-w-xl">
            <SearchBar large />
          </div>
        </div>
      </section>

      {/* Shelves */}
      <Section title="Browse the shelves">
        {shelves.error && <p role="alert">Could not load the shelves. {shelves.error}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shelves.data?.categories.map((category) => (
            <Link
              key={category._id}
              to={`/category/${category.slug}`}
              // A thick top border in the shelf's own colour keeps the page colourful and the text readable.
              style={{ borderTopColor: category.color }}
              className="rounded-2xl border-t-8 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1"
            >
              <h3 className="font-display text-xl font-bold">{category.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm opacity-80">{category.description}</p>
              <p className="mt-3 text-sm font-semibold">
                {category.bookCount} {category.bookCount === 1 ? "book" : "books"}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Featured */}
      {featured.data?.books.length > 0 && (
        <Section title="Featured reads">
          <BookGrid books={featured.data.books} />
        </Section>
      )}

      {/* New arrivals */}
      <Section
        title="New arrivals"
        action={
          <Link to="/browse" className="text-sm font-semibold underline">
            See all books
          </Link>
        }
      >
        {newest.loading && !newest.data && <p>Loading books...</p>}
        {newest.error && <p role="alert">Could not load books. Is the server running?</p>}
        {newest.data && <BookGrid books={newest.data.books} />}
      </Section>
    </>
  );
}
