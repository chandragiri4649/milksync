import React from "react";
import { Navigate } from "react-router-dom"; // For redirecting unauthorized users
import { useAuth } from "../hooks/useAuth";   // Custom hook to get auth status from context/state

// This ProtectedRoute is used to secure admin-only pages
// It renders the child component only if the user is authenticated
const ProtectedRoute = ({ children }) => {
  // Get the authentication status from your auth context
  const { isAuthenticated } = useAuth();

  // If the user is not logged in => redirect them to Admin Login page
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // If logged in => allow access to the requested page
  return children;
};

export default ProtectedRoute;
