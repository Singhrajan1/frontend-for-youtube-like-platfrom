import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy-loaded Pages for peak performance
const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage }))
);
const SearchPage = lazy(() =>
  import("./pages/SearchPage").then((module) => ({ default: module.SearchPage }))
);
const WatchPage = lazy(() =>
  import("./pages/WatchPage").then((module) => ({ default: module.WatchPage }))
);
const ChannelPage = lazy(() =>
  import("./pages/ChannelPage").then((module) => ({ default: module.ChannelPage }))
);
const CommunityPage = lazy(() =>
  import("./pages/CommunityPage").then((module) => ({ default: module.CommunityPage }))
);
const UploadPage = lazy(() =>
  import("./pages/UploadPage").then((module) => ({ default: module.UploadPage }))
);
const PlaylistsPage = lazy(() =>
  import("./pages/PlaylistsPage").then((module) => ({ default: module.PlaylistsPage }))
);
const PlaylistDetailPage = lazy(() =>
  import("./pages/PlaylistDetailPage").then((module) => ({
    default: module.PlaylistDetailPage,
  }))
);
const SubscriptionsPage = lazy(() =>
  import("./pages/SubscriptionsPage").then((module) => ({
    default: module.SubscriptionsPage,
  }))
);
const HistoryPage = lazy(() =>
  import("./pages/HistoryPage").then((module) => ({ default: module.HistoryPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage }))
);

// Fallback loader
const PageLoadingFallback = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      gap: "12px",
      color: "var(--text-secondary)",
    }}
  >
    <Loader2 className="animate-spin" size={26} color="var(--accent-primary)" />
    <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Loading page...</span>
  </div>
);

// Redirects already authenticated users away from Login and Register
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoadingFallback />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Routes wrapped in standard Layout */}
                <Route element={<Layout />}>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/watch/:videoId" element={<WatchPage />} />
                  <Route path="/channel/:username" element={<ChannelPage />} />
                  <Route path="/community" element={<CommunityPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute>
                        <UploadPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/playlists"
                    element={
                      <ProtectedRoute>
                        <PlaylistsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/playlist/:playlistId"
                    element={<PlaylistDetailPage />}
                  />
                  <Route
                    path="/subscriptions"
                    element={
                      <ProtectedRoute>
                        <SubscriptionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <HistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />

                {/* Catch-all redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
