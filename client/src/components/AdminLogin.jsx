import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // For page navigation
import { useAuth } from "../hooks/useAuth"; // Custom authentication hook
import config from "../config"; // Import configuration

const AdminLogin = () => {
  // State variables for form fields and feedback message
  const [username, setUsername] = useState(""); // Stores entered username
  const [password, setPassword] = useState(""); // Stores entered password
  const [message, setMessage] = useState(""); // Displays success/error feedback
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const navigate = useNavigate(); // Navigation hook
  const location = useLocation(); // Location hook for route state
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

  // Check for success message from password reset
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      // Clear the state to prevent message from showing again
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

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

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page refresh
    setMessage(""); // Clears old messages
    setIsLoading(true); // Start loading

    try {
      // Use the new session-based login
      const response = await login({ username, password }, 'admin');
      
      setMessage("Login successful!");
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 100);
    } catch (err) {
      // Handle login errors
      setMessage(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };



  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      {/* Login form container */}
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            {/* Enhanced Bootstrap Card for form */}
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
                  <h2 className="h3 mb-2 text-dark fw-bold">Admin Login</h2>
                  <p className="text-muted mb-0">Access your admin dashboard</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin}>
                  {/* Username Field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="form-control form-control-lg border-2"
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="form-control form-control-lg border-2"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Submit Button */}
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

                  {/* Forgot Password Link */}
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="btn btn-link text-decoration-none"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <i className="fas fa-key me-1"></i>
                      Forgot Password?
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


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default AdminLogin;
