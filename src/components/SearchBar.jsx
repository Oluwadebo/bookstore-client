/**
 * Keyword search box. Submitting opens /browse?search=... which lists matches.
 * Used in the header (compact) and on the home page (`large`).
 * The input keeps the current search text when you are on the results page.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SearchBar({ large = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("search") || "");

  // Keep the box in step with the address bar (back/forward buttons, new searches).
  useEffect(() => {
    setValue(params.get("search") || "");
  }, [params]);

  function handleSubmit(event) {
    event.preventDefault();
    const term = value.trim();
    navigate(term ? `/browse?search=${encodeURIComponent(term)}` : "/browse");
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full gap-2">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by title or author"
        aria-label="Search books"
        enterKeyHint="search"
        // text-base (16px) stops iOS Safari from zooming in when the box is focused.
        className={`min-w-0 flex-1 rounded-full border border-navy/20 bg-white px-4 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40 ${large ? "py-4" : "py-2"}`}
      />
      <button
        type="submit"
        className={`rounded-full bg-navy px-5 font-semibold text-cream hover:bg-navy/90 ${large ? "py-4" : "py-2"}`}
      >
        Search
      </button>
    </form>
  );
}
