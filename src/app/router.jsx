import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { AppErrorPage } from "./AppErrorPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { TransactionsPage } from "../features/transactions/TransactionsPage";
import { AddTransactionPage } from "../features/transactions/AddTransactionPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SavingsPage } from "../features/savings/SavingsPage";
import { DebtsPage } from "../features/debts/DebtsPage";
import { AdminPage } from "../features/admin/AdminPage";
import { AuthPage } from "../features/auth/AuthPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { PublicRoute } from "../features/auth/PublicRoute";

export const router = createBrowserRouter([
  {
    errorElement: <AppErrorPage />,
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />
      },
      {
        element: <PublicRoute />,
        children: [{ path: "/auth", element: <AuthPage /> }]
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/dashboard",
            element: <AppShell />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "transactions", element: <TransactionsPage /> },
              { path: "add", element: <AddTransactionPage /> },
              { path: "reports", element: <ReportsPage /> },
              { path: "savings", element: <SavingsPage /> },
              { path: "debts", element: <DebtsPage /> },
              { path: "admin", element: <AdminPage /> }
            ]
          }
        ]
      }
    ]
  }
]);
