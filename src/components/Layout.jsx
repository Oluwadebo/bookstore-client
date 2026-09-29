/**
 * Shared page frame: header on top, the current page in the middle
 * (<Outlet /> is where the matched route renders), footer at the bottom.
 */
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-navy/10 px-4 py-6 text-center text-sm">
        &copy; {new Date().getFullYear()} Bookstore. Happy reading.
      </footer>
    </div>
  );
}
