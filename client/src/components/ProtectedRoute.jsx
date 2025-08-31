import React from "react";
import { Navigate } from "react-router-dom"; // For redirecting unauthorized users
import { useAuth } from "../hooks/useAuth";   // Custom hook to get auth status from context/state

// This ProtectedRoute is used to secure admin-only pages
// It renders the child component only if the user is authenticated
const ProtectedRoute = ({ children }) => {
  // Get the authentication status from your auth context
  const { isAuthenticated, isLoading, userType } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If the user is not logged in => redirect them to Admin Login page
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user is not admin, redirect to appropriate login
  if (userType !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  // If logged in => allow access to the requested page
  return children;
};

export default ProtectedRoute;
