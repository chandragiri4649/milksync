import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${config.API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("If the email exists, a password reset link has been sent to your email address.");
      } else {
        setMessage(data.message || "Failed to send reset email. Please try again.");
      }
    } catch (error) {
      setMessage("Network error. Please check your connection and try again.");
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/admin/login");
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-3">
                    <img
                      src="/Milksync_logo.png"
                      alt="MilkSync Logo"
                      style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                      className="rounded"
                    />
                  </div>
                  <h2 className="h3 mb-2 text-dark fw-bold">Forgot Password</h2>
                  <p className="text-muted mb-0">Enter your email to reset your password</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="fas fa-envelope me-2"></i>Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>

                  <div className="d-grid gap-2 mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Send Reset Link
                        </>
                      )}
                    </button>
                  </div>

                  {/* Back to Login */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="btn btn-link text-decoration-none"
                    >
                      <i className="fas fa-arrow-left me-1"></i>
                      Back to Login
                    </button>
                  </div>

                  {/* Message */}
                  {message && (
                    <div
                      className={`alert mt-3 ${
                        message.includes("sent") ? "alert-success" : "alert-danger"
                      }`}
                      role="alert"
                    >
                      <i className={`fas ${message.includes("sent") ? "fa-check-circle" : "fa-exclamation-triangle"} me-2`}></i>
                      {message}
                    </div>
                  )}
                </form>

                {/* Help Section */}
                <div className="mt-4">
                  <div className="card bg-light border-0">
                    <div className="card-body p-3">
                      <h6 className="card-title text-dark mb-2">
                        <i className="fas fa-info-circle me-2"></i>
                        Password Reset Help
                      </h6>
                      <ul className="list-unstyled mb-0 small text-muted">
                        <li className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          Enter the email address associated with your admin account
                        </li>
                        <li className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          Check your email inbox and spam folder
                        </li>
                        <li className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          Reset link expires in 15 minutes
                        </li>
                        <li>
                          <i className="fas fa-shield-alt text-primary me-2"></i>
                          Contact system administrator if you need assistance
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
