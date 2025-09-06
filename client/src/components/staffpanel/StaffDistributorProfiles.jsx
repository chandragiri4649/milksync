import React, { useState, useEffect } from "react";
import StaffNavbar from "./StaffNavbar";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";

const StaffDistributorProfiles = () => {
  const { token } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all distributors from the backend
  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("🔍 StaffDistributorProfiles - Starting fetch...");
        console.log("🔍 Token available:", !!token);
        
        const data = await apiService.get('/distributor');
        console.log("🔍 StaffDistributorProfiles - Fetched data:", data);
        console.log("🔍 StaffDistributorProfiles - Data type:", typeof data);
        console.log("🔍 StaffDistributorProfiles - Data length:", Array.isArray(data) ? data.length : 'Not an array');
        
        setDistributors(data || []);
      } catch (err) {
        console.error("❌ StaffDistributorProfiles - Error fetching distributors:", err);
        console.error("❌ Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(`Failed to load distributor profiles: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDistributors();
    } else {
      console.log("❌ StaffDistributorProfiles - No token available");
      setError("Authentication required. Please login again.");
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <StaffNavbar />

      <div className="container-fluid px-3 px-md-5" style={{ maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8f9fa', paddingTop: '100px', paddingBottom: '120px' }}>
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="display-4 fw-bold text-primary mb-2">
              Distributor Profiles
            </h1>
            <p className="lead text-muted">
              View all registered distributor details and contact information
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading distributor profiles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <br />
            <button 
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={() => {
                setError("");
                setLoading(true);
                // Retry the fetch
                const fetchDistributors = async () => {
                  try {
                    console.log("🔄 Retrying fetch...");
                    const data = await apiService.get('/distributor');
                    console.log("🔄 Retry result:", data);
                    setDistributors(data || []);
                  } catch (err) {
                    console.error("🔄 Retry failed:", err);
                    setError(`Retry failed: ${err.message}`);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchDistributors();
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Retry
            </button>
          </div>
        )}

        {/* Distributors Grid */}
        {!loading && !error && (
          <>
            {distributors.length === 0 ? (
              <div className="text-center py-5">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-4">
                  <i className="bi bi-people fs-1 text-muted"></i>
                </div>
                <h4 className="text-muted">No Distributors Found</h4>
                <p className="text-muted">There are currently no registered distributors in the system.</p>
              </div>
            ) : (
              <>
                {/* Stats Summary */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="alert alert-info d-flex align-items-center" role="alert">
                      <i className="bi bi-info-circle-fill me-3 fs-4"></i>
                      <div>
                        <strong>Total Distributors:</strong> {distributors.length}
                        <br />
                        <small>Active distributor partners in the network</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distributor Cards Grid */}
                <div className="row g-4">
                  {distributors.map((distributor, index) => (
                    <div key={distributor._id || index} className="col-lg-4 col-md-6">
                      <div className="card border shadow-sm h-100 hover-shadow-lg" style={{ transition: 'all 0.3s ease' }}>
                        {/* Card Header with Icon */}
                        <div className="card-header bg-primary text-white text-center py-3">
                          <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-3">
                            <i className="bi bi-building text-primary fs-3"></i>
                          </div>
                          <h5 className="mb-0 fw-bold">Distributor #{index + 1}</h5>
                        </div>

                        {/* Card Body with Details */}
                        <div className="card-body p-4">
                          <div className="mb-3">
                            <label className="form-label text-muted small fw-semibold">DISTRIBUTOR NAME</label>
                            <p className="fs-5 fw-bold text-dark mb-0">
                              {distributor.distributorName || "N/A"}
                            </p>
                          </div>

                          <div className="mb-3">
                            <label className="form-label text-muted small fw-semibold">COMPANY NAME</label>
                            <p className="fs-6 text-dark mb-0">
                              <i className="bi bi-building-fill text-primary me-2"></i>
                              {distributor.companyName || "N/A"}
                            </p>
                          </div>

                          <div className="mb-3">
                            <label className="form-label text-muted small fw-semibold">MOBILE NUMBER</label>
                            <p className="fs-6 text-dark mb-0">
                              <i className="bi bi-telephone-fill text-success me-2"></i>
                              {distributor.contact || "N/A"}
                            </p>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-4 pt-3 border-top">
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                <i className="bi bi-calendar-check me-1"></i>
                                Active Distributor
                              </small>
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Verified
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="card-footer bg-light border-0 py-3">
                          <div className="d-flex justify-content-center">
                            <button className="btn btn-outline-primary btn-sm">
                              <i className="bi bi-eye me-2"></i>
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="row mt-5">
                  <div className="col-12">
                    <div className="text-center p-4 bg-white rounded border">
                      <i className="bi bi-shield-check text-success fs-2 mb-3"></i>
                      <h5 className="text-dark">Secure Information</h5>
                      <p className="text-muted mb-0">
                        Only essential contact information is displayed. Sensitive data is protected and not shown for security purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffDistributorProfiles;
