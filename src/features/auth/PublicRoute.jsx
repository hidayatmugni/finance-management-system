import { Navigate, Outlet } from "react-router-dom";
import { AuthLoading } from "./AuthLoading";
import { useAuth } from "./AuthProvider";

export function PublicRoute() {
  const { status, isAuthenticated, isFirebaseReady } = useAuth();

  if (status === "loading") return <AuthLoading />;

  if (isFirebaseReady && isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
