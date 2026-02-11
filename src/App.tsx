import { ConfigProvider } from "antd";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useAuth } from "@/context/auth";
import { LoginPage, DashboardPage, LoadingPage } from "@/pages";
import { UsersPage } from "@/pages/Users";
import { InvoicesPage } from "@/pages/Invoices";
import { CustomersPage } from "@/pages/Customers";
import { BankAccountsPage } from "@/pages/BankAccounts";
import { ServicesPage } from "@/pages/Services";
import { AppLayout } from "@/components/templates";
import { theme } from "@/theme/antd-theme";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "invoices",
        children: [
          { path: "", element: <InvoicesPage /> },
          { path: "customers", element: <CustomersPage /> },
          { path: "bank-accounts", element: <BankAccountsPage /> },
          { path: "services", element: <ServicesPage /> },
        ],
      },
      { path: "users", element: <UsersPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

function AppContent() {
  const { loading, authenticated } = useAuth();

  if (loading) return <LoadingPage />;
  if (!authenticated) return <LoginPage />;

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AppContent />
    </ConfigProvider>
  );
}

export default App;
