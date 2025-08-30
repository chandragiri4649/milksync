import React from "react";
import { Navigate } from "react-router-dom"; // Redirects users who are not allowed to see the route
import { jwtDecode } from "jwt-decode"; // Decodes the JWT token to read its payload

// This component ensures only logged-in distributors can access the route
const DistributorProtectedRoute = ({ children }) => {
  // Get distributor's JWT token from local storage
  const token = localStorage.getItem("distributorToken");

  // Flag to determine if user is allowed to view this route
  let valid = false;

  if (token) {
    try {
      // Decode JWT token to get expiry timestamp and user role
      const { exp, role } = jwtDecode(token);

      // A valid token must:
      // 1. Not be expired (current time < expiry time)
      // 2. Have a role of "distributor"
      valid = (Date.now() < exp * 1000) && role === "distributor";
    } catch {
      // If decoding fails (invalid/malformed token), keep valid = false
    }
  }

  // If token is valid, render the protected page content
  // If invalid, redirect user to distributor login page
  return valid ? children : <Navigate to="/distributor/login" replace />;
};

export default DistributorProtectedRoute;
