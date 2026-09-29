/**
 * Wrap any page that needs a signed-in user:
 *
 *   <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
 *   <Route path="/admin"   element={<ProtectedRoute adminOnly>...</ProtectedRoute>} />
 *
 * Signed-out visitors are sent to /login and returned to the page they wanted
 * after signing in. This is a convenience for the UI only: the server enforces
 * the real permissions on every API request.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="px-4 py-24 text-center">Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
