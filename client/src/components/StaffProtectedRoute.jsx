import React from "react";
import { Navigate } from "react-router-dom"; // For redirecting unauthorized users
import { useAuth } from "../hooks/useAuth";   // Custom hook to get auth status from context/state

// A protected route for staff users only
const StaffProtectedRoute = ({ children }) => {
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

  // If the user is not logged in => redirect them to Staff Login page
  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  // If user is not staff, redirect to appropriate login
  if (userType !== 'staff') {
    return <Navigate to="/staff/login" replace />;
  }

  // If logged in => allow access to the requested page
  return children;
};

export default StaffProtectedRoute;
