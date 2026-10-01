/**
 * Wrap any page that needs a signed-in user:
 *
 *   <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
 *   <Route path="/admin"   element={<ProtectedRoute adminOnly>...</ProtectedRoute>} />   admins + owner
 *   <Route path="/team"    element={<ProtectedRoute ownerOnly>...</ProtectedRoute>} />   owner only
 *
 * Signed-out visitors are sent to /login and returned to the page they wanted
 * after signing in. This is a convenience for the UI only: the server enforces
 * the real permissions on every API request.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { PageLoader } from "./Loading.jsx";
import { isOwner, isStaff } from "../lib/roles.js";

export default function ProtectedRoute({ children, adminOnly = false, ownerOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (ownerOnly && !isOwner(user)) return <Navigate to="/admin" replace />;
  if (adminOnly && !isStaff(user)) return <Navigate to="/" replace />;

  return children;
}
