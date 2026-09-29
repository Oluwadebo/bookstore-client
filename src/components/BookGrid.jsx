/**
 * Responsive grid of BookCards: 2 columns on phones, 3 on tablets, 4 on desktops.
 * Add more columns for wider screens here and every list in the site follows.
 */
import BookCard from "./BookCard.jsx";

export default function BookGrid({ books }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
}
