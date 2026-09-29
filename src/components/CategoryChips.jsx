/**
 * Row of shelf links, each with the shelf's own colour dot.
 * Wraps onto several lines on phones. `activeSlug` highlights the current shelf.
 * Because shelves come from the database, new shelves (non-fiction, educational...)
 * appear here automatically.
 */
import { Link } from "react-router-dom";

export default function CategoryChips({ categories = [], activeSlug = "" }) {
  const base = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors";

  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/browse" className={`${base} ${!activeSlug ? "border-navy bg-navy text-cream" : "border-navy/20 bg-white hover:border-navy"}`}>
        All books
      </Link>
      {categories.map((category) => (
        <Link
          key={category._id}
          to={`/category/${category.slug}`}
          className={`${base} ${activeSlug === category.slug ? "border-navy bg-navy text-cream" : "border-navy/20 bg-white hover:border-navy"}`}
        >
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
          {category.name}
        </Link>
      ))}
    </div>
  );
}
