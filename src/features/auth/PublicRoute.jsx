import { Card, Spin, Typography } from "antd";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function PublicRoute() {
  const { status, isAuthenticated, isFirebaseReady } = useAuth();

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <Card className="finance-card finance-soft-card w-full text-center">
          <Spin />
          <Typography.Text className="mt-3 block !text-sm !text-muted">
            Memuat sesi aplikasi...
          </Typography.Text>
        </Card>
      </div>
    );
  }

  if (isFirebaseReady && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
