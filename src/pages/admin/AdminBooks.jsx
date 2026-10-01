/** Book list (/admin/books): search, filter drafts, and jump to the edit screen. */
import { useState } from "react";
import { Link } from "react-router-dom";
import BookCover from "../../components/BookCover.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatPrice } from "../../lib/format.js";
import { isOwner } from "../../lib/roles.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

const badge = "rounded-full px-2.5 py-0.5 text-xs font-semibold";

export default function AdminBooks() {
  usePageTitle("Admin: books");
  const { user } = useAuth();
  const owner = isOwner(user);
  const [searchBox, setSearchBox] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({ page, limit: 20 });
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  const { data, error, loading } = useApi(`/api/admin/books?${query}`);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchBox.trim());
  }

  return (
    <>
      {!owner && <p className="mb-4 text-sm opacity-80">You see the books you added. The site owner can see every book.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2 sm:max-w-md">
          <input
            type="search"
            value={searchBox}
            onChange={(event) => setSearchBox(event.target.value)}
            placeholder="Search title or author"
            aria-label="Search books"
            className="min-w-0 flex-1 rounded-full border border-navy/20 bg-white px-4 py-2 text-base outline-none focus:border-coral"
          />
          <button className="rounded-full bg-navy px-5 py-2 font-semibold text-cream">Search</button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            aria-label="Filter by status"
            className="rounded-full border border-navy/20 bg-white px-3 py-2 text-base"
          >
            <option value="">All books</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <Link to="/admin/books/new" className="rounded-full bg-coral px-5 py-2 font-semibold text-navy hover:bg-coral/90">
            Add book
          </Link>
        </div>
      </div>

      {error && <p role="alert" className="mt-6">Could not load books: {error}</p>}
      {loading && !data && <p className="mt-6">Loading...</p>}
      {data && data.books.length === 0 && (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center">
          {!owner && !search && !status ? "You haven't added any books yet. Click Add book to start." : "No books found."}
        </p>
      )}

      <ul className={`mt-6 space-y-3 ${loading && data ? "opacity-60" : ""}`}>
        {data?.books.map((book) => (
          <li key={book._id}>
            <Link to={`/admin/books/${book._id}`} className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm hover:shadow-md">
              <div className="w-12 shrink-0"><BookCover book={book} /></div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-semibold">{book.title}</p>
                <p className="line-clamp-1 text-sm opacity-70">{book.authors.join(", ")}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className={`${badge} ${book.isPublished ? "bg-teal/30" : "bg-sunshine/50"}`}>{book.isPublished ? "Published" : "Draft"}</span>
                  {!book.hasFile && <span className={`${badge} bg-coral/25`}>No file yet</span>}
                  {book.featured && <span className={`${badge} bg-grape/20`}>Featured</span>}
                </div>
              </div>
              <p className="font-bold">{formatPrice(book.priceCents, book.currency)}</p>
            </Link>
          </li>
        ))}
      </ul>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}
