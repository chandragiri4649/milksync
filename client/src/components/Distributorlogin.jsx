import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For redirecting after successful login
import config from "../config"; // Import config for API base URL

const DistributorLogin = () => {
  // State variables to store input field values and feedback messages
  const [username, setUsername] = useState(""); // Stores entered username
  const [password, setPassword] = useState(""); // Stores entered password
  const [message, setMessage] = useState("");   // Success or error feedback
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const navigate = useNavigate(); // Navigation hook for page redirection

  // Login form submit handler
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page reload
    setMessage(""); // Clear previous messages
    setIsLoading(true); // Start loading

    try {
      // Send login credentials to backend API
      const response = await fetch(`${config.API_BASE}/distributor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data = {};
      // Try parsing the JSON response
      try {
        data = await response.json();
      } catch {
        setMessage("Invalid server response.");
        return;
      }

      // If login is successful and token is received
      if (response.ok && data.token) {
        localStorage.setItem("distributorToken", data.token); // Save token locally
        setMessage("Login successful!");

        // Redirect to distributor dashboard
        setTimeout(() => navigate("/distributor/dashboard"), 100);
      } else {
        // Show error message from server or default message
        setMessage(data.message || "Login failed.");
      }
    } catch {
      // Handle network/request errors
      setMessage("An error occurred. Please try again.");
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
                  <h2 className="h3 mb-2 text-dark fw-bold">Distributor Login</h2>
                  <p className="text-muted mb-0">Access your distribution dashboard</p>
                </div>

                {/* Login form */}
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

export default DistributorLogin;
