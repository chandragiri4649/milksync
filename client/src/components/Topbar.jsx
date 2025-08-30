import React from "react";

// An array of actions for the topbar buttons with Bootstrap icons
const topbarActions = [
  { key: "staff-list", label: "Staff List", icon: "bi-people-fill" },
  { key: "distributors-list", label: "Distributors List", icon: "bi-truck" },
  { key: "products", label: "Products", icon: "bi-box-seam" },
  { key: "orders-history", label: "Order History", icon: "bi-clipboard-data" },
  { key: "bills-history", label: "Bills History", icon: "bi-cash-stack" },
  { key: "payments-history", label: "Payment History", icon: "bi-credit-card" },
  { key: "distributors-data", label: "Distributors Data", icon: "bi-graph-up" },

];

// Topbar header component for the admin dashboard
const Topbar = React.memo(({ activeAction, setActiveAction, handleLogout }) => (
  <header className="bg-white shadow-sm border-bottom sticky-top" style={{ zIndex: 1020 }}>
    
    {/* Header Title Section */}
    <div className="py-4 border-bottom d-flex align-items-center justify-content-between" style={{ height: '100px' }}>
      <div className="text-center flex-grow-1">
        <h4 className="fs-4 fw-bold text-primary mb-2">
          <i className="bi bi-building me-2"></i>
          Admin Panel Dashboard
        </h4>
        <small className="text-muted">Manage your SVD MilkSync operations</small>
      </div>
      
      {/* Logout Button */}
      <div className="me-4">
        <button
          className="btn btn-danger btn-sm d-flex align-items-center gap-2"
          onClick={handleLogout}
          type="button"
        >
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </div>
    </div>

    {/* Actions & Logout Section */}
    <div className="d-flex align-items-center justify-content-between p-4 flex-wrap gap-3" style={{ height: '68px' }}>
      
      {/* Quick Action Buttons */}
      <nav className="d-flex flex-wrap gap-4 ms-3">
        {topbarActions.map((btn) => (
          <button
            key={btn.key}
            className={`btn btn-sm ${
              activeAction === btn.key 
                ? 'btn-primary shadow-sm' 
                : 'btn-outline-secondary'
            }`}
            onClick={() =>
              setActiveAction(
                activeAction === btn.key ? null : btn.key // toggle button action
              )
            }
            type="button"
          >
            <i className={`bi ${btn.icon} me-2`}></i>
            {btn.label}
          </button>
        ))}
      </nav>


    </div>
  </header>
));

export default Topbar;
