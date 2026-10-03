/**
 * Shopping cart state for the whole app.
 *
 *   const { items, count, totalCents, currency, has, add, remove } = useCart();
 *
 * Two modes, chosen automatically:
 * - Guests: the cart lives in this browser (localStorage), so visitors can shop
 *   before creating an account.
 * - Signed-in customers: the cart lives on the server, so it follows them to any device.
 *   When a guest signs in, their browser cart is merged into their account cart.
 *
 * Prices shown here are for display only. At checkout the server recalculates every
 * price from the database, so a tampered browser cart can never change what is charged.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "./AuthContext.jsx";

const STORAGE_KEY = "bookstore.cart";

// localStorage can be unavailable (private mode, blocked storage), so every access is guarded.
function readGuestCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable: the cart simply won't survive a reload */
  }
}

/** The few book fields a guest cart needs to display itself. */
const snapshot = (book) => ({
  _id: book._id,
  slug: book.slug,
  title: book.title,
  authors: book.authors,
  priceCents: book.priceCents,
  currency: book.currency,
  coverUrl: book.coverUrl || "",
});

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id;
  const [items, setItems] = useState(readGuestCart);
  // The payment processing fee the server adds on top of the list prices (signed-in customers only;
  // a guest's cart is only in this browser, so the server hasn't priced it yet).
  const [fee, setFee] = useState(null);
  const applyCart = useCallback((cart) => {
    setItems(cart.items);
    setFee({ processingFeeCents: cart.processingFeeCents ?? 0, payableCents: cart.payableCents ?? cart.totalCents });
  }, []);
  // Which customer's cart has finished loading. Until it matches the signed-in customer we are
  // "loading", which also covers the instant between login finishing and the request starting.
  const [loadedFor, setLoadedFor] = useState(null);
  // Counts refresh calls so a slow, outdated response can never overwrite a newer one
  // (for example a cart that finishes loading just after the customer logged out).
  const latestRefresh = useRef(0);

  /** Load the right cart whenever the visitor signs in or out. */
  const refresh = useCallback(async () => {
    const thisRefresh = ++latestRefresh.current;
    if (!userId) {
      setItems(readGuestCart());
      setFee(null);
      return;
    }
    try {
      const guestItems = readGuestCart();
      // Merge anything collected while signed out, then clear the browser copy.
      const data =
        guestItems.length > 0
          ? await api("/api/cart", { method: "POST", body: { bookIds: guestItems.map((book) => book._id) } })
          : await api("/api/cart");
      if (guestItems.length > 0) writeGuestCart([]);
      if (thisRefresh === latestRefresh.current) applyCart(data.cart);
    } finally {
      if (thisRefresh === latestRefresh.current) setLoadedFor(userId);
    }
  }, [userId, applyCart]);

  useEffect(() => {
    if (authLoading) return;
    refresh().catch(() => {
      /* keep what we have; actions on the cart page will surface real errors */
    });
  }, [refresh, authLoading]);

  const add = useCallback(
    async (book) => {
      if (userId) {
        const data = await api("/api/cart", { method: "POST", body: { bookId: book._id } });
        applyCart(data.cart);
        return;
      }
      setItems((previous) => {
        if (previous.some((item) => item._id === book._id)) return previous;
        const next = [...previous, snapshot(book)];
        writeGuestCart(next);
        return next;
      });
    },
    [userId, applyCart]
  );

  const remove = useCallback(
    async (bookId) => {
      if (userId) {
        const data = await api(`/api/cart/${bookId}`, { method: "DELETE" });
        applyCart(data.cart);
        return;
      }
      setItems((previous) => {
        const next = previous.filter((item) => item._id !== bookId);
        writeGuestCart(next);
        return next;
      });
    },
    [userId, applyCart]
  );

  const value = useMemo(() => {
    const currencies = [...new Set(items.map((item) => item.currency))];
    return {
      items,
      count: items.length,
      totalCents: items.reduce((sum, item) => sum + item.priceCents, 0),
      // A payment can only be in one currency. `currency` is null for an empty or mixed cart.
      currency: currencies.length === 1 ? currencies[0] : null,
      mixedCurrencies: currencies.length > 1,
      has: (bookId) => items.some((item) => item._id === bookId),
      add,
      remove,
      refresh,
      fee, // { processingFeeCents, payableCents } or null for a guest
      // True until we know what's really in the cart, so the cart page shows a skeleton
      // instead of flashing "Your cart is empty" for a signed-in customer.
      loading: authLoading || Boolean(userId && loadedFor !== userId),
    };
  }, [items, add, remove, refresh, authLoading, userId, loadedFor, fee]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Hook to read the cart and change it. Must be used inside <CartProvider>. */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
