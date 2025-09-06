import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../utils/apiService";
import Modal from "./Modal"; // Keep your modal import

export default function UserDetailsButton() {
  const navigate = useNavigate();
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
  const handleLogout = () => {
    localStorage.removeItem("distributorToken");
    navigate("/distributor/login");
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-link p-0"
        onClick={() => setIsModalOpen(true)}
        aria-label="User Details"
        title="User Details"
        style={{ fontSize: '2.5rem', color: "#007bff" }} // Blue color to match logo theme
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
                className="btn btn-outline-danger"
                title="Logout from account"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
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
