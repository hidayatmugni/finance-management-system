import { lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { AppErrorPage } from "./AppErrorPage";
import { AuthPage } from "../features/auth/AuthPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { PublicRoute } from "../features/auth/PublicRoute";

/**
 * Every feature page is code-split. The shell, auth and error screens stay in
 * the entry chunk because they are always needed; everything else loads on
 * first visit behind the shell's Suspense skeleton.
 */
const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const QuickAddPage = lazy(() =>
  import("../features/transactions/QuickAddPage").then((module) => ({ default: module.QuickAddPage })),
);
const TransactionsPage = lazy(() =>
  import("../features/transactions/TransactionsPage").then((module) => ({
    default: module.TransactionsPage
  })),
);
const BudgetPage = lazy(() =>
  import("../features/budget/BudgetPage").then((module) => ({ default: module.BudgetPage })),
);
const SavingsPage = lazy(() =>
  import("../features/savings/SavingsPage").then((module) => ({ default: module.SavingsPage })),
);
const DebtsPage = lazy(() =>
  import("../features/debts/DebtsPage").then((module) => ({ default: module.DebtsPage })),
);
const InstallmentsPage = lazy(() =>
  import("../features/installments/InstallmentsPage").then((module) => ({
    default: module.InstallmentsPage
  })),
);
const ReportsPage = lazy(() =>
  import("../features/reports/ReportsPage").then((module) => ({ default: module.ReportsPage })),
);
const CategoriesPage = lazy(() =>
  import("../features/categories/CategoriesPage").then((module) => ({
    default: module.CategoriesPage
  })),
);
const MembersPage = lazy(() =>
  import("../features/members/MembersPage").then((module) => ({ default: module.MembersPage })),
);
const AdminDataPage = lazy(() =>
  import("../features/admin/AdminDataPage").then((module) => ({ default: module.AdminDataPage })),
);
const ConfigurationPage = lazy(() =>
  import("../features/cms/ConfigurationPage").then((module) => ({
    default: module.ConfigurationPage
  })),
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);

export const router = createBrowserRouter([
  {
    errorElement: <AppErrorPage />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
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
              { path: "add", element: <QuickAddPage /> },
              { path: "transactions", element: <TransactionsPage /> },
              { path: "budget", element: <BudgetPage /> },
              { path: "savings", element: <SavingsPage /> },
              { path: "debts", element: <DebtsPage /> },
              { path: "installments", element: <InstallmentsPage /> },
              { path: "reports", element: <ReportsPage /> },
              { path: "categories", element: <CategoriesPage /> },
              { path: "members", element: <MembersPage /> },
              { path: "admin", element: <AdminDataPage /> },
              { path: "configuration", element: <ConfigurationPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "*", element: <Navigate to="/dashboard" replace /> }
            ]
          }
        ]
      }
    ]
  }
]);
