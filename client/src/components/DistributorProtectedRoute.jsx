import React from "react";
import { Navigate } from "react-router-dom"; // Redirects users who are not allowed to see the route
import { useAuth } from "../hooks/useAuth"; // Import useAuth hook for session-based authentication

// This component ensures only logged-in distributors can access the route
const DistributorProtectedRoute = ({ children }) => {
  const { isAuthenticated, userType, isLoading } = useAuth();

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

  // Check if user is authenticated and is a distributor
  const isValidDistributor = isAuthenticated && userType === "distributor";

  // If user is a valid distributor, render the protected page content
  // If not, redirect user to distributor login page
  return isValidDistributor ? children : <Navigate to="/distributor/login" replace />;
};

export default DistributorProtectedRoute;
