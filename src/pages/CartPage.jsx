/**
 * Cart page (/cart). Lists the books, the total, and the checkout button.
 *
 * Checkout flow: the button asks the server to create an order, the server
 * returns the payment provider's hosted payment page, and we send the customer
 * there. Card details are entered on the provider's page, never on this site.
 * Afterwards the provider sends the customer back to /checkout/complete.
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BookCover from "../components/BookCover.jsx";
import { BusyLabel, Skeleton, SkeletonRows } from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../lib/api.js";
import { formatMoney, formatPrice } from "../lib/format.js";
import { usePageTitle } from "../lib/usePageTitle.js";

export default function CartPage() {
  usePageTitle("Your cart");
  const { user, refreshUser } = useAuth();
  const { items, totalCents, currency, mixedCurrencies, remove, refresh, loading, fee } = useCart();
  const showFee = Boolean(fee && fee.processingFeeCents > 0 && !mixedCurrencies);
  const navigate = useNavigate();
  const location = useLocation();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleRemove(bookId) {
    setError("");
    try {
      await remove(bookId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCheckout() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/orders/checkout", { method: "POST" });
      if (data.free) {
        // Zero-priced books need no payment: they are already in the library.
        await refresh();
        await refreshUser();
        navigate("/library");
      } else {
        window.location.assign(data.url); // off to the payment page; stay "busy"
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  // Still finding out what is in the cart (e.g. right after a page reload while signed in).
  if (loading && items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Skeleton className="h-10 w-48" />
        <div className="mt-8">
          <SkeletonRows count={2} label="Loading your cart" />
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3">Find something good to read.</p>
        <Link to="/browse" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy">
          Browse books
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((book) => (
            <li key={book._id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="w-16 shrink-0 sm:w-20">
                <BookCover book={book} />
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/books/${book.slug}`} className="line-clamp-2 font-semibold hover:underline">
                  {book.title}
                </Link>
                <p className="line-clamp-1 text-sm opacity-70">{book.authors.join(", ")}</p>
                <button onClick={() => handleRemove(book._id)} className="mt-2 text-sm font-semibold underline">
                  Remove
                </button>
              </div>
              <p className="font-bold">{formatPrice(book.priceCents, book.currency)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
          {showFee ? (
            <dl className="space-y-2">
              <div className="flex justify-between"><dt>Books</dt><dd>{formatMoney(totalCents, currency)}</dd></div>
              <div className="flex justify-between"><dt>Payment processing fee</dt><dd>{formatMoney(fee.processingFeeCents, currency)}</dd></div>
              <div className="flex justify-between border-t border-navy/10 pt-2 text-lg font-bold"><dt>Total to pay</dt><dd>{formatMoney(fee.payableCents, currency)}</dd></div>
            </dl>
          ) : (
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{mixedCurrencies ? "-" : formatPrice(totalCents, currency)}</span>
            </div>
          )}
          {showFee && <p className="mt-2 text-xs opacity-70">The fee is charged on card payments, so the book prices stay as listed.</p>}
          {!user && items.length > 0 && !mixedCurrencies && <p className="mt-2 text-xs opacity-70">A small payment processing fee is added at checkout.</p>}
          <p className="mt-2 text-sm opacity-80">Digital books. They appear in your library as soon as payment is confirmed.</p>

          {mixedCurrencies && (
            <p role="alert" className="mt-4 rounded-xl bg-sunshine/40 px-4 py-3 text-sm font-semibold">
              Your cart has books priced in different currencies. Please remove some to check out.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">
              {error}
            </p>
          )}

          {user ? (
            <button
              onClick={handleCheckout}
              disabled={busy || mixedCurrencies}
              className="mt-6 w-full rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60"
            >
              <BusyLabel busy={busy} busyText="Taking you to payment...">Checkout</BusyLabel>
            </button>
          ) : (
            <div className="mt-6 space-y-2">
              {/* Returning to the cart after signing in keeps the flow short. */}
              <Link to="/login" state={{ from: location }} className="block rounded-full bg-coral px-6 py-3 text-center font-semibold text-navy hover:bg-coral/90">
                Log in to check out
              </Link>
              <Link to="/signup" state={{ from: location }} className="block text-center text-sm font-semibold underline">
                New here? Create an account
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
