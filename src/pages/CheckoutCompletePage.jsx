/**
 * Where the payment provider sends the customer after paying (/checkout/complete?reference=...).
 *
 * We never trust the page address: we ask our server, which asks the payment provider,
 * whether the payment really succeeded. Bank transfers and some cards confirm a few
 * seconds late, so a pending payment is re-checked a few times before we give up.
 * (The provider's webhook also completes the order, so the books arrive even if the
 * customer never reaches this page.)
 */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookLoader } from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../lib/api.js";
import { usePageTitle } from "../lib/usePageTitle.js";

const MAX_CHECKS = 6;
const CHECK_EVERY_MS = 2000;

export default function CheckoutCompletePage() {
  usePageTitle("Order status");
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const { refreshUser } = useAuth();
  const { refresh: refreshCart } = useCart();

  // status: checking | paid | failed | pending | error
  const [state, setState] = useState({ status: "checking", error: "" });

  useEffect(() => {
    if (!reference) {
      setState({ status: "error", error: "This page needs a payment reference." });
      return;
    }

    let cancelled = false;
    let timer;
    let checks = 0;

    async function check() {
      try {
        const data = await api(`/api/orders/verify?reference=${encodeURIComponent(reference)}`);
        if (cancelled) return;

        if (data.status === "paid") {
          setState({ status: "paid", error: "" });
          refreshCart().catch(() => {}); // the paid books leave the cart
          refreshUser(); // and appear in the library
        } else if (data.status === "failed") {
          setState({ status: "failed", error: "" });
        } else if (++checks < MAX_CHECKS) {
          timer = setTimeout(check, CHECK_EVERY_MS);
        } else {
          setState({ status: "pending", error: "" });
        }
      } catch (err) {
        if (!cancelled) setState({ status: "error", error: err.message });
      }
    }

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // refreshCart / refreshUser are intentionally left out: re-running would re-verify needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const button = "mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90";

  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center" aria-live="polite">
      {state.status === "checking" && (
        <>
          <BookLoader label="Checking with your bank" className="mb-8" />
          <h1 className="font-display text-3xl font-bold">Confirming your payment...</h1>
          <p className="mt-3">This usually takes a few seconds. Please don't close this page.</p>
        </>
      )}

      {state.status === "paid" && (
        <>
          <h1 className="font-display text-3xl font-bold">Thank you! Your books are ready.</h1>
          <p className="mt-3">They are in your library now, and you can download them any time.</p>
          <Link to="/library" className={button}>
            Go to my library
          </Link>
        </>
      )}

      {state.status === "pending" && (
        <>
          <h1 className="font-display text-3xl font-bold">Still waiting for confirmation</h1>
          <p className="mt-3">
            Your bank hasn't confirmed the payment yet. If you were charged, your books will appear in your library
            automatically once it clears.
          </p>
          <Link to="/library" className={button}>
            Check my library
          </Link>
        </>
      )}

      {state.status === "failed" && (
        <>
          <h1 className="font-display text-3xl font-bold">Payment did not go through</h1>
          <p className="mt-3">You have not been charged for this order. Your cart is still saved, so you can try again.</p>
          <Link to="/cart" className={button}>
            Back to cart
          </Link>
        </>
      )}

      {state.status === "error" && (
        <>
          <h1 className="font-display text-3xl font-bold">We could not check that payment</h1>
          <p role="alert" className="mt-3">
            {state.error}
          </p>
          <Link to="/library" className={button}>
            Check my library
          </Link>
        </>
      )}
    </main>
  );
}
