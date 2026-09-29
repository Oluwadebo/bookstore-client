/** One book in a grid: cover, title, author and price. The whole card links to the book page. */
import { Link } from "react-router-dom";
import BookCover from "./BookCover.jsx";
import { formatPrice } from "../lib/format.js";

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.slug}`} className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-coral">
      <div className="transition-transform duration-200 group-hover:-translate-y-1">
        <BookCover book={book} />
      </div>
      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug group-hover:underline">{book.title}</h3>
      <p className="line-clamp-1 text-sm opacity-70">{book.authors.join(", ")}</p>
      <p className="mt-1 font-bold">{formatPrice(book.priceCents, book.currency)}</p>
    </Link>
  );
}
