import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import config from "../../config";

export default function UserDetailsButton() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;

    const token = localStorage.getItem("staffToken");
    if (!token) {
      setStaffData(null);
      setLoading(false);
      return;
    }

    try {
      // Decode JWT token to get staff information
      const decoded = jwtDecode(token);
      console.log("🔍 UserDetailsButton - Decoded token:", decoded);
      
             setStaffData({
         username: decoded.username || "N/A",
         role: decoded.role || "Staff Member",
         employeeId: decoded.id || decoded._id || "N/A"
       });
      setLoading(false);
    } catch (error) {
      console.error("❌ UserDetailsButton - Token decode error:", error);
      setStaffData(null);
      setLoading(false);
    }
  }, [isModalOpen]);

  // ======= Logout function =======
  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    navigate("/staff/login");
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-link p-0"
        onClick={() => setIsModalOpen(true)}
        aria-label="User Details"
        title="User Details"
        style={{ fontSize: '2.5rem', color: "#007bff" }}
      >
        <i className="bi bi-person-circle"></i>
      </button>

      {/* Staff Details Modal */}
      {isModalOpen && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>
                  Staff Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                {loading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading staff details...</p>
                  </div>
                ) : staffData ? (
                  <div className="staff-profile">
                    <div className="text-center mb-3">
                      <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-person-fill" style={{ fontSize: '2rem' }}></i>
                      </div>
                      <h5 className="fw-bold mb-1">{staffData.username || "Staff Member"}</h5>
                      <span className="badge bg-primary">{staffData.role || "Staff Member"}</span>
                    </div>
                    
                    <div className="row g-2">
                      <div className="col-12">
                        <div className="d-flex align-items-center p-2 border rounded">
                          <i className="bi bi-person-badge text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                          <div>
                            <small className="text-muted d-block">Username</small>
                            <strong>{staffData.username}</strong>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-12">
                        <div className="d-flex align-items-center p-2 border rounded">
                          <i className="bi bi-card-text text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                          <div>
                            <small className="text-muted d-block">Employee ID</small>
                            <strong>{staffData.employeeId}</strong>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-12">
                        <div className="d-flex align-items-center p-2 border rounded">
                          <i className="bi bi-shield-check text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                          <div>
                            <small className="text-muted d-block">Role</small>
                            <strong>{staffData.role}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="alert alert-info mt-2">
                      <i className="bi bi-info-circle me-2"></i>
                      <small>Additional profile details (email, contact) are managed by administrators.</small>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '2.5rem' }}></i>
                    <h5 className="mt-2">Failed to Load Profile</h5>
                    <p className="text-muted">Unable to fetch staff details. Please try again.</p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleLogout}
                  title="Logout from account"
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
