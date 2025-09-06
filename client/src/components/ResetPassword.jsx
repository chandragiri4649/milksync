import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../utils/apiService";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [username, setUsername] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  
  const navigate = useNavigate();
  const { token } = useParams();

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const data = await apiService.get(`/auth/reset-password/${token}`);
        setIsValidToken(true);
        setUsername(data.username);
        setMessage("");
      } catch (error) {
        setIsValidToken(false);
        setMessage(error.message || "Invalid or expired reset token");
        console.error("Token validation error:", error);
      } finally {
        setIsValidatingToken(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setIsValidatingToken(false);
      setIsValidToken(false);
      setMessage("Invalid reset link");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.post(`/auth/reset-password/${token}`, { newPassword });
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/admin/login", { 
          state: { message: "Password reset successfully! You can now login with your new password." }
        });
      }, 2000);
    } catch (error) {
      setMessage(error.message || "Failed to reset password. Please try again.");
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/admin/login");
  };

  // Show loading while validating token
  if (isValidatingToken) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isValidToken) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="card shadow-lg border-0">
                <div className="card-body p-4 text-center">
                  <div className="mb-4">
                    <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h2 className="h4 mb-3 text-dark">Invalid Reset Link</h2>
                  <p className="text-muted mb-4">{message}</p>
                  <button
                    onClick={handleBackToLogin}
                    className="btn btn-primary"
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <h2 className="h3 mb-2 text-dark fw-bold">Reset Password</h2>
                  <p className="text-muted mb-0">Set a new password for <strong>{username}</strong></p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      <i className="fas fa-lock me-2"></i>New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength="6"
                    />
                    <div className="form-text">
                      <i className="fas fa-info-circle me-1"></i>
                      Password must be at least 6 characters long
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      <i className="fas fa-lock me-2"></i>Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength="6"
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
                          Resetting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Reset Password
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
                        message.includes("successfully") ? "alert-success" : "alert-danger"
                      }`}
                      role="alert"
                    >
                      <i className={`fas ${message.includes("successfully") ? "fa-check-circle" : "fa-exclamation-triangle"} me-2`}></i>
                      {message}
                    </div>
                  )}
                </form>

                {/* Security Notice */}
                <div className="mt-4">
                  <div className="card bg-light border-0">
                    <div className="card-body p-3">
                      <h6 className="card-title text-dark mb-2">
                        <i className="fas fa-shield-alt me-2"></i>
                        Security Notice
                      </h6>
                      <ul className="list-unstyled mb-0 small text-muted">
                        <li className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          Choose a strong, unique password
                        </li>
                        <li className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          This reset link can only be used once
                        </li>
                        <li className="mb-1">
                          <i className="fas fa-check text-success me-2"></i>
                          Link expires in 15 minutes
                        </li>
                        <li>
                          <i className="fas fa-lock text-primary me-2"></i>
                          Your password is encrypted and secure
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

export default ResetPassword;
