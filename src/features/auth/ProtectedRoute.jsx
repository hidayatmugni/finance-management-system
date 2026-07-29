import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthLoading } from "./AuthLoading";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const location = useLocation();
  const { status, isAuthenticated, isFirebaseReady } = useAuth();

  if (status === "loading") return <AuthLoading />;

  if (!isFirebaseReady || !isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
