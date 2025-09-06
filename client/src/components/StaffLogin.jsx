import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // For redirecting after login
import { useAuth } from "../hooks/useAuth"; // Import useAuth hook
import config from "../config"; // Import config for API base URL
import { jwtDecode } from "jwt-decode"; // For JWT token decoding

const StaffLogin = () => {
  // State variables for username, password, and status message
  const [username, setUsername] = useState(""); // Stores entered username
  const [password, setPassword] = useState(""); // Stores entered password
  const [message, setMessage] = useState("");   // Holds success or error feedback
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const navigate = useNavigate(); // Navigation hook
  const { login, isAuthenticated, userType, isLoading: authLoading } = useAuth(); // Get auth state and login function

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && userType) {
      // Redirect to appropriate dashboard based on user type
      switch (userType) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'staff':
          navigate('/staff/dashboard');
          break;
        case 'distributor':
          navigate('/distributor/dashboard');
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, userType, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
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

  // Don't render login form if already authenticated
  if (isAuthenticated && userType) {
    return null; // Will redirect in useEffect
  }

  // Form submit handler
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form refresh
    setMessage(""); // Clear previous messages
    setIsLoading(true); // Start loading

    try {
      console.log("🚀 StaffLogin - Starting login process for username:", username);
      
      // Use the new session-based login
      const response = await login({ username, password }, 'staff');
      
      console.log("✅ StaffLogin - Login successful:", response);
      setMessage("Login successful!");

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate("/staff/dashboard");
      }, 100);
    } catch (error) {
      console.error("❌ StaffLogin - Login error:", error);
      setMessage(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      {/* Main container with responsive width */}
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            {/* Card wrapper for form with modern design */}
            <div className="card shadow-lg border-0">
              <div className="card-body p-3">
                {/* Header with icon and title */}
                <div className="text-center mb-3">
                  <div className="d-inline-flex align-items-center justify-content-center mb-1">
                    <img
                      src="/Milksync_logo.png"
                      alt="MilkSync Logo"
                      style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                      className="rounded"
                    />
                  </div>
                  <h2 className="h3 mb-2 text-dark fw-bold">Staff Login</h2>
                  <p className="text-muted mb-0">Access your staff dashboard</p>
                </div>

                {/* Login form */}
                <form onSubmit={handleLogin}>
                  {/* Username field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      className="form-control form-control-lg border-2"
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </div>

                  {/* Password field */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="form-control form-control-lg border-2"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="d-grid mb-3">
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="btn btn-primary btn-lg fw-bold py-3"
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing In...
                        </>
                      ) : (
                        "Login to Dashboard"
                      )}
                    </button>
                  </div>

                  {/* Feedback message */}
                  {message && (
                    <div
                      className={`alert mt-3 ${message.includes("successful") ? "alert-success" : "alert-danger"
                        }`}
                      role="alert"
                    >
                      {message}
                    </div>
                  )}
                </form>

                {/* Footer */}
                <div className="mt-4 text-center">
                  <p className="text-muted small mb-0">
                    Need help? Contact your administrator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
