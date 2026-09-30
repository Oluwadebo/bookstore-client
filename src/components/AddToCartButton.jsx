/**
 * The buy button on a book page. It has three states:
 *  - already owned  -> link to the library
 *  - already in cart -> link to the cart
 *  - otherwise       -> "Add to cart" button
 * Errors (for example "You already own this book") appear underneath.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function AddToCartButton({ book }) {
  const { user } = useAuth();
  const { has, add } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const secondary = "inline-block rounded-full border-2 border-navy px-6 py-3 font-semibold hover:bg-navy hover:text-cream";

  if (user?.library?.includes(book._id)) {
    return (
      <Link to="/library" className={secondary}>
        In your library
      </Link>
    );
  }
  if (has(book._id)) {
    return (
      <Link to="/cart" className={secondary}>
        In your cart. View cart
      </Link>
    );
  }

  async function handleAdd() {
    setBusy(true);
    setError("");
    try {
      await add(book);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAdd}
        disabled={busy}
        className="rounded-full bg-coral px-8 py-3 text-lg font-semibold text-navy hover:bg-coral/90 disabled:opacity-60"
      >
        {busy ? "Adding..." : "Add to cart"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
