import React, { useState } from "react";

// Sidebar component that receives activeTab (current tab) and setActiveTab (to change the tab)
const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sidebar menu items with icons and descriptions
  const sidebarItems = [
    {
      key: "staff",
      label: "Staff Management",
      icon: "bi-people-fill",
      description: "Manage staff members"
    },
    {
      key: "distributors",
      label: "Distributors",
      icon: "bi-truck",
      description: "Manage distributors"
    },
    {
      key: "products",
      label: "Products",
      icon: "bi-box-seam",
      description: "Manage products"
    },
    {
      key: "orders",
      label: "Place Orders",
      icon: "bi-clipboard-plus",
      description: "Create new orders"
    },
    {
      key: "bills",
      label: "Bills",
      icon: "bi-receipt",
      description: "Generate bills"
    },
    {
      key: "wallets",
      label: "Wallets",
      icon: "bi-wallet2",
      description: "Manage wallets"
    },
    {
      key: "payments",
      label: "Payments",
      icon: "bi-credit-card",
      description: "Handle payments"
    },
    {
      key: "contact-details",
      label: "Contact Details",
      icon: "bi-person-lines-fill",
      description: "Manage contact information"
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="btn btn-primary d-md-none position-fixed"
        style={{
          top: '10px',
          left: '10px',
          zIndex: 1040,
          borderRadius: '50%',
          width: '50px',
          height: '50px'
        }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <i className="bi bi-list fs-5"></i>
      </button>

      {/* Fixed Bootstrap sidebar with responsive design */}
      <aside className={`position-fixed d-flex flex-column bg-light border-end vh-100 ${isMobileOpen ? 'd-flex' : 'd-none d-md-flex'
        }`}
        style={{
          minWidth: '280px',
          maxWidth: '320px',
          left: 0,
          top: 0,
          zIndex: 1050,
          height: '100vh',
          overflowY: 'auto'
        }}>

        {/* Logo / Branding Section */}
        <div className="pt-0 pb-0 px-4 border-bottom bg-white" style={{ paddingBottom: '0.5rem' }}>
          <div className="text-center">
            <div className="d-inline-flex align-items-center justify-content-center mb-0">
              <img
                src="/Milksync_logo.png"
                alt="MilkSync Logo"
                style={{ width: '160px', height: '160px', objectFit: 'contain' }}
                className="rounded"
              />
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow-1 p-3 overflow-auto">
          <div className="d-flex flex-column gap-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                className={`btn ${
                  activeTab === item.key 
                    ? 'btn-primary shadow-sm' 
                    : 'btn-outline-secondary'
                }`}
                style={{
                  padding: '1rem 1.5rem',
                  minHeight: '70px',
                  fontSize: '1rem'
                }}
                onClick={() => {
                  // Same toggle behavior as topbar
                  setActiveTab(activeTab === item.key ? null : item.key);
                  // Close mobile sidebar after selection
                  if (window.innerWidth < 768) {
                    setIsMobileOpen(false);
                  }
                }}
                type="button"
              >
                <i className={`bi ${item.icon} me-2`}></i>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="position-fixed d-md-none"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1025
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
