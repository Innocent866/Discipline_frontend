import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./state/AuthProvider.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import CasesPage from "./pages/CasesPage.jsx";
import OffenseTypesPage from "./pages/OffenseTypesPage.jsx";
import PunishmentsPage from "./pages/PunishmentsPage.jsx";
import MembersPage from "./pages/MembersPage.jsx";
import AuditLogsPage from "./pages/AuditLogsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

const AppShell = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || location.pathname === "/login") {
    return children;
  }
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
};

const App = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offense-types"
          element={
            <ProtectedRoute roles={["admin"]}>
              <OffenseTypesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/punishments"
          element={
            <ProtectedRoute roles={["admin"]}>
              <PunishmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute roles={["admin"]}>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default App;

