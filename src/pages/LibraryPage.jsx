/**
 * My Library (/library): books the customer has bought, with download buttons.
 *
 * Downloads work in two steps so files stay private: we ask the server for a link
 * that only works for 5 minutes, then the browser follows it and saves the file.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import BookCover from "../components/BookCover.jsx";
import BookGridSkeleton from "../components/BookGridSkeleton.jsx";
import { BusyLabel } from "../components/Loading.jsx";
import { api, apiUrl } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { usePageTitle } from "../lib/usePageTitle.js";

export default function LibraryPage() {
  usePageTitle("My library");
  const { data, error, loading } = useApi("/api/library");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function handleDownload(book) {
    setBusyId(book._id);
    setMessage("");
    try {
      const { url } = await api(`/api/library/${book._id}/link`, { method: "POST" });
      window.location.assign(apiUrl(url)); // the browser downloads the file
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">My library</h1>

      {message && (
        <p role="alert" className="mt-4 rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      )}
      {error && <p role="alert" className="mt-4">Could not load your library: {error}</p>}

      <div className="mt-8">
        {loading && !data && <BookGridSkeleton count={4} />}

        {data && data.books.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center">
            <p className="font-display text-xl font-bold">Your library is empty</p>
            <p className="mt-2">Books you buy will appear here.</p>
            <Link to="/browse" className="mt-4 inline-block font-semibold underline">
              Browse books
            </Link>
          </div>
        )}

        {data && data.books.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {data.books.map((book) => (
              <div key={book._id}>
                <Link to={`/books/${book.slug}`}>
                  <BookCover book={book} />
                </Link>
                <h2 className="mt-3 line-clamp-2 font-semibold leading-snug">{book.title}</h2>
                <p className="line-clamp-1 text-sm opacity-70">{book.authors.join(", ")}</p>
                <button
                  onClick={() => handleDownload(book)}
                  disabled={busyId === book._id}
                  className="mt-3 w-full rounded-full bg-navy px-4 py-2 text-sm font-semibold text-cream hover:bg-navy/90 disabled:opacity-60"
                >
                  <BusyLabel busy={busyId === book._id} busyText="Preparing...">{`Download ${book.format.toUpperCase()}`}</BusyLabel>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
