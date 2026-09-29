/**
 * Browse and search page. One component serves three URLs:
 *   /browse                      every book
 *   /browse?search=holmes        keyword search results
 *   /category/fantasy            one shelf
 * Search text, sort order and page number live in the address bar, so results
 * can be bookmarked, shared, and the browser's back button works.
 */
import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import BookGrid from "../components/BookGrid.jsx";
import CategoryChips from "../components/CategoryChips.jsx";
import Pagination from "../components/Pagination.jsx";
import { useApi } from "../lib/useApi.js";
import { usePageTitle } from "../lib/usePageTitle.js";

const PAGE_SIZE = 12;

export default function BrowsePage() {
  const { slug } = useParams(); // present on /category/:slug
  const [params, setParams] = useSearchParams();

  const search = params.get("search") || "";
  const category = slug || params.get("category") || "";
  const sort = params.get("sort") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // Build the API request from the current filters.
  const query = new URLSearchParams({ page, limit: PAGE_SIZE });
  if (search) query.set("search", search);
  if (category) query.set("category", category);
  if (sort) query.set("sort", sort);

  const books = useApi(`/api/books?${query}`);
  const shelves = useApi("/api/categories");

  const shelf = shelves.data?.categories.find((c) => c.slug === category);
  const heading = search ? `Results for "${search}"` : shelf ? shelf.name : "All books";
  usePageTitle(heading);

  // Jump back to the top whenever the visitor changes page.
  useEffect(() => window.scrollTo({ top: 0 }), [page]);

  /** Change one URL setting. Changing anything except the page returns to page 1. */
  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  }

  const data = books.data;
  const notFound = books.error === "Category not found";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{notFound ? "Shelf not found" : heading}</h1>
      {shelf?.description && !search && <p className="mt-2 max-w-2xl">{shelf.description}</p>}

      <div className="mt-6">
        <CategoryChips categories={shelves.data?.categories} activeSlug={category} />
      </div>

      {!notFound && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            {data ? `${data.total} ${data.total === 1 ? "book" : "books"}` : "\u00A0"}
          </p>
          <label className="flex items-center gap-2 text-sm font-semibold">
            Sort by
            <select
              value={sort || (search ? "relevance" : "newest")}
              onChange={(event) => updateParam("sort", event.target.value)}
              className="rounded-full border border-navy/20 bg-white px-3 py-2 text-base"
            >
              {search && <option value="relevance">Best match</option>}
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="title">Title A-Z</option>
            </select>
          </label>
        </div>
      )}

      <div className={`mt-6 transition-opacity ${books.loading && data ? "opacity-50" : ""}`}>
        {books.error && !notFound && <p role="alert">Something went wrong: {books.error}</p>}
        {books.loading && !data && <p>Loading books...</p>}

        {data && data.books.length > 0 && <BookGrid books={data.books} />}

        {data && data.books.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center">
            <p className="font-display text-xl font-bold">No books found</p>
            <p className="mt-2">Try a different word, or browse a shelf above.</p>
            <Link to="/browse" className="mt-4 inline-block font-semibold underline">
              See all books
            </Link>
          </div>
        )}

        {notFound && (
          <Link to="/browse" className="font-semibold underline">
            Browse all books instead
          </Link>
        )}
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => updateParam("page", String(next))} />}
    </main>
  );
}
