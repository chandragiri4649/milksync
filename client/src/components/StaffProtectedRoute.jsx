import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom"; // For redirecting unauthorized users
import { jwtDecode } from "jwt-decode"; // To decode JWT token payload

// A protected route for staff users only
const StaffProtectedRoute = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = () => {
      // Retrieve staff's JWT token from local storage
      const token = localStorage.getItem("staffToken");
      console.log("🔒 StaffProtectedRoute - useEffect triggered, checking token:", { 
        hasToken: !!token, 
        token: token ? token.substring(0, 20) + "..." : null 
      });

      if (token) {
        try {
          // Decode token to get expiration time and role
          const decoded = jwtDecode(token);
          const { exp, role } = decoded;
          console.log("🔒 StaffProtectedRoute - Token decoded:", { exp, role, now: Date.now() / 1000, decoded });

          // Token is valid if:
          // 1. Current time is before token's expiry time (exp * 1000 to convert seconds to ms)
          // 2. The role inside the token is "staff"
          const valid = (Date.now() < exp * 1000) && role === "staff";
          console.log("🔒 StaffProtectedRoute - Token validation result:", { 
            valid, 
            currentTime: Date.now(), 
            expiry: exp * 1000,
            timeRemaining: (exp * 1000) - Date.now()
          });
          
          setIsValid(valid);
        } catch (error) {
          console.log("🔒 StaffProtectedRoute - Token decode error:", error.message);
          setIsValid(false);
        }
      } else {
        console.log("🔒 StaffProtectedRoute - No token found");
        setIsValid(false);
      }
      
      setIsValidating(false);
    };

    // Small delay to ensure token is properly stored
    const timer = setTimeout(validateToken, 100);
    return () => clearTimeout(timer);
  }, []);

  console.log("🔒 StaffProtectedRoute - Render state:", { isValidating, isValid, willRender: !isValidating && isValid ? 'children' : 'redirect' });

  // Show loading while validating
  if (isValidating) {
    return <div>Loading...</div>;
  }

  // If valid, render the protected page's content; otherwise, redirect to Staff Login
  // TEMPORARY: Allow access for debugging
  if (isValid) {
    return children;
  } else {
    console.log("🔒 StaffProtectedRoute - Redirecting to login, token invalid");
    return <Navigate to="/staff/login" replace />;
  }
};

export default StaffProtectedRoute;
