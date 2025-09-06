import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";
import Modal from "./Modal"; // Keep your modal import

export default function UserDetailsButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [distributorData, setDistributorData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;

    setLoading(true);
    apiService.get('/distributor/profile')
      .then((data) => setDistributorData(data))
      .catch((err) => {
        console.error(err);
        setDistributorData(null);
      })
      .finally(() => setLoading(false));
  }, [isModalOpen]);

  // ======= Logout function =======
  const handleLogout = async () => {
    try {
      setLoading(true);
      // Call server logout endpoint to destroy session
      await apiService.post('/distributor/logout');
      // Use the logout function from useAuth hook
      logout();
      navigate("/distributor/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server logout fails, clear local state and redirect
      logout();
      navigate("/distributor/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-link p-0"
        onClick={() => setIsModalOpen(true)}
        aria-label="User Details"
        title="User Details"
        style={{ fontSize: '2rem', color: "#007bff", marginTop: '-5px'}} // Blue color to match logo theme, moved slightly upwards
      >
        <i className="bi bi-person-circle"></i>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Distributor Details"
      >
        {loading && <p>Loading...</p>}
        {!loading && distributorData && (
          <>
            <p><strong>Name:</strong> {distributorData.distributorName}</p>
            <p><strong>Contact:</strong> {distributorData.contact || "N/A"}</p>
            <p><strong>Company name:</strong> {distributorData.name}</p>
            <div className="d-flex justify-content-end mt-3">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="btn btn-outline-danger"
                title="Logout from account"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging out...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </>
                )}
              </button>
            </div>
          </>
        )}
        {!loading && !distributorData && (
          <>
            <p>Failed to load distributor details.</p>
            <div className="d-flex justify-content-end mt-3">
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger"
                title="Logout from account"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
