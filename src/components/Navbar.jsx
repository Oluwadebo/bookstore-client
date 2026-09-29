/**
 * Site header. Logo, search, and account links (Log in / Sign up for visitors,
 * name + Log out for customers). The cart icon is added in step 4.
 *
 * Layout: on phones the search box drops to its own full-width row
 * (`order-last w-full`); from `sm` upwards it sits between the logo and the links.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import SearchBar from "./SearchBar.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const firstName = user?.name?.split(" ")[0];
  const link = "rounded-full px-3 py-2 hover:bg-navy/5";

  return (
    <header className="sticky top-0 z-20 border-b border-navy/10 bg-cream/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          Bookstore
        </Link>

        <div className="order-last w-full sm:order-none sm:mx-auto sm:w-auto sm:max-w-md sm:flex-1">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 text-sm font-semibold sm:ml-0">
          <Link to="/browse" className={`${link} hidden sm:block`}>
            Browse
          </Link>
          {user ? (
            <>
              <Link to="/account" className={link}>
                Hi, {firstName}
              </Link>
              <button onClick={logout} className={link}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={link}>
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
