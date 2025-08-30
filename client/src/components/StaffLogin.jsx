import React, { useState } from "react";
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
  const { login } = useAuth(); // Get login function from auth context

  // Form submit handler
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form refresh
    setMessage(""); // Clear previous messages
    setIsLoading(true); // Start loading

    try {
      console.log("🚀 StaffLogin - Starting login process for username:", username);
      console.log("🚀 StaffLogin - API endpoint:", `${config.API_BASE}/staff/login`);
      
      // Send login request to backend
      const response = await fetch(`${config.API_BASE}/staff/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data = {};
      // Try parsing JSON response
      try {
        data = await response.json();
      } catch {
        setMessage("Invalid server response.");
        return;
      }

      // If login is successful
      if (response.ok && data.token) {
        console.log("✅ StaffLogin - Login successful, token received:", { 
          hasToken: !!data.token, 
          tokenLength: data.token?.length,
          responseData: data 
        });
        
        // Use the useAuth login function with staff type
        login(data.token, "staff");
        setMessage("Login successful!");

        // Check if token was stored properly
        setTimeout(() => {
          const storedToken = localStorage.getItem("staffToken");
          console.log("🔍 StaffLogin - Token storage check:", { 
            stored: !!storedToken, 
            storedLength: storedToken?.length,
            willNavigate: !!storedToken 
          });
          
          if (storedToken) {
            // Test JWT decode to see if token is valid
            try {
              const decoded = jwtDecode(storedToken);
              console.log("🔍 StaffLogin - Token decode test:", { 
                decoded, 
                role: decoded.role, 
                exp: decoded.exp,
                isValid: decoded.role === "staff" && Date.now() < decoded.exp * 1000
              });
              
              if (decoded.role === "staff" && Date.now() < decoded.exp * 1000) {
                console.log("🚀 StaffLogin - Token valid, navigating to dashboard...");
                navigate("/staff/dashboard");
              } else {
                console.error("❌ StaffLogin - Token invalid:", { 
                  role: decoded.role, 
                  expired: Date.now() >= decoded.exp * 1000 
                });
                setMessage("Login failed - invalid token");
              }
            } catch (error) {
              console.error("❌ StaffLogin - Token decode error:", error);
              setMessage("Login failed - token decode error");
            }
          } else {
            console.error("❌ StaffLogin - Token not stored, login failed");
            setMessage("Login failed - token not stored");
          }
        }, 500);
      } else {
        console.error("❌ StaffLogin - Login failed:", { response: response.status, data });
        setMessage(data.message || "Login failed."); // Use API error or generic
      }
    } catch (error) {
      console.error("❌ StaffLogin - Network error:", error);
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
