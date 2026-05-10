import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminPage } from "./pages/AdminPage";
import { ProtectedLayout } from "./lib/auth";
import { Dashboard } from "./pages/Dashboard";
import { UserManagement } from "./pages/UserManagement";
import { UploadPage } from "./pages/UploadPage";
import { AnalysisResultPage } from "./pages/AnalysisResultPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ContactSupportPage } from "./pages/ContactSupportPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/features",
    Component: FeaturesPage,
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/contact",
    Component: ContactPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/admin/login",
    Component: AdminLoginPage,
  },
  {
    path: "/admin",
    Component: AdminPage,
  },
  {
    path: "/app",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "users", Component: UserManagement },
      { path: "upload", Component: UploadPage },
      { path: "analysis/:id", Component: AnalysisResultPage },
      { path: "history", Component: HistoryPage },
      { path: "support", Component: ContactSupportPage },
    ],
  },
]);
