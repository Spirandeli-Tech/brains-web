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
import { ContractsPage } from "@/pages/Contracts";
import { FinancePage } from "@/pages/Finance";
import { CategoriesPage } from "@/pages/Finance/Categories";
import { BalancesPage } from "@/pages/Finance/Balances";
import { SettingsPage } from "@/pages/Settings";
import { ProductivityPage } from "@/pages/Productivity";
import { ProductivityUserPage } from "@/pages/ProductivityUser";
import { ImplementationsPage } from "@/pages/Implementations";
import { AutomationsPage } from "@/pages/Automations";
import { AutomationDetailPage } from "@/pages/Automations/AutomationDetail";
import { WatchersPage } from "@/pages/Watchers";
import { InsightsPage } from "@/pages/Insights";
import { RunnerPage } from "@/pages/Runner";
import { CodeReviewPage } from "@/pages/CodeReview";
import { AddressPrPage } from "@/pages/AddressPr";
import { IdeasPage } from "@/pages/Ideas";
import { VideosPage } from "@/pages/Videos";
import { VideoDetailPage } from "@/pages/Videos/VideoDetail";
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
          { path: "contracts", element: <ContractsPage /> },
        ],
      },
      {
        path: "finance",
        children: [
          { path: "", element: <FinancePage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "balances", element: <BalancesPage /> },
        ],
      },
      {
        path: "productivity",
        children: [
          { path: "", element: <ProductivityPage /> },
          { path: "user", element: <ProductivityUserPage /> },
        ],
      },
      { path: "implementations", element: <ImplementationsPage /> },
      { path: "code-review", element: <CodeReviewPage /> },
      { path: "address-pr-comments", element: <AddressPrPage /> },
      {
        path: "automations",
        children: [
          { path: "", element: <AutomationsPage /> },
          { path: ":id", element: <AutomationDetailPage /> },
        ],
      },
      {
        path: "content",
        children: [
          { index: true, element: <Navigate to="/content/videos" replace /> },
          { path: "ideas", element: <IdeasPage /> },
          { path: "videos", element: <VideosPage /> },
          { path: "videos/:id", element: <VideoDetailPage /> },
        ],
      },
      { path: "watchers", element: <WatchersPage /> },
      { path: "insights", element: <InsightsPage /> },
      { path: "runner", element: <RunnerPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "settings", element: <SettingsPage /> },
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
