/**
 * Top-level route table. Each URL maps to one page component.
 * Pages inside <Layout> share the header and footer.
 * New pages are added here as they are built:
 *   more admin screens go inside the /admin route below
 */
import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import BrowsePage from "./pages/BrowsePage.jsx";
import BookPage from "./pages/BookPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutCompletePage from "./pages/CheckoutCompletePage.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminBooks from "./pages/admin/AdminBooks.jsx";
import AdminBookForm from "./pages/admin/AdminBookForm.jsx";
import AdminCategories from "./pages/admin/AdminCategories.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminTeam from "./pages/admin/AdminTeam.jsx";

function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Page not found</h1>
      <p className="mt-3">That page seems to have been checked out.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy">
        Back to the shelves
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/category/:slug" element={<BrowsePage />} />
        <Route path="/books/:slug" element={<BookPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout/complete"
          element={
            <ProtectedRoute>
              <CheckoutCompletePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        {/* Admin area: only administrators get past ProtectedRoute (the server enforces it too). */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="books" element={<AdminBooks />} />
          <Route path="books/new" element={<AdminBookForm />} />
          <Route path="books/:id" element={<AdminBookForm />} />
          <Route path="categories" element={<AdminCategories />} />
          {/* Sales and customer details are the owner's business. */}
          <Route
            path="orders"
            element={
              <ProtectedRoute ownerOnly>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          {/* The site owner decides who else may be an admin. */}
          <Route
            path="team"
            element={
              <ProtectedRoute ownerOnly>
                <AdminTeam />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
