import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";

const ProtectedRoute = ({ children, roles }) => {
  const { user, token, initializing } = useAuth();
  if (initializing) return null; // avoid redirect while hydrating
  if (!user && token) return null; // still hydrating
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;

