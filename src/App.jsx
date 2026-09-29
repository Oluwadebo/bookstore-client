/**
 * Top-level route table. Each URL maps to one page component.
 * Pages inside <Layout> share the header and footer.
 * New pages are added here as they are built:
 *   /books/:slug (step 3), /cart and /checkout (step 4), /admin (step 5)...
 */
import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";

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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
