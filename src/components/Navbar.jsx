/**
 * Site header. Shows Log in / Sign up for visitors and the user's name plus
 * Log out for signed-in customers. Search and the cart icon are added in
 * steps 3 and 4. `flex-wrap` keeps it tidy on narrow phone screens.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  return (
    <header className="sticky top-0 z-20 border-b border-navy/10 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          Bookstore
        </Link>

        <div className="flex items-center gap-2 text-sm font-semibold">
          {user ? (
            <>
              <Link to="/account" className="rounded-full px-3 py-2 hover:bg-navy/5">
                Hi, {firstName}
              </Link>
              <button onClick={logout} className="rounded-full px-3 py-2 hover:bg-navy/5">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 hover:bg-navy/5">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-coral px-4 py-2 text-navy hover:bg-coral/90">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
