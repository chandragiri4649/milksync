import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth"; // Custom hook for authentication actions like logout
import { useNavigate } from "react-router-dom"; // Hook for programmatic navigation

import Sidebar from "./Sidebar";  // Left navigation menu component
import Topbar from "./Topbar";    // Top quick-action and logout bar

import StaffManagement from "./management/StaffManagement";         // Staff management section
import DistributorManagement from "./management/DistributorManagement"; // Distributor management section
import ProductManagement from "./management/ProductManagement";     // Product management section
import PlaceOrdersManagement from "./management/PlaceOrders";
import Bills from "./management/BillGenerateManagement";
import WalletManagement from "./management/WalletManagement";
import Payments from "./management/Payments";                       // Manage payments section

import StaffList from "./lists/StaffList";               // View list of staff members
import DistributorList from "./lists/DistributorList";   // View list of distributors
import OrdersHistory from "./lists/OrdersHistory";       // View past orders
import BillsHistory from "./lists/BillsHistory";         // View past bills
import PaymentHistory from "./lists/PaymentHistory";     // View past payments
import ProductsView from "./lists/ProductsView";         // View all products
import DistributorsData from "./lists/DistributorsData"; // View detailed distributor data
import ContactDetails from "./management/ContactDetails"; // Contact details management

// Add custom styles for the welcome page
const welcomeStyles = `
  .bg-gradient-primary {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  }
  .bg-gradient-info {
    background: linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%);
  }
  .bg-gradient-success {
    background: linear-gradient(135deg, #198754 0%, #146c43 100%);
  }
  .bg-gradient-warning {
    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  }
  .hover-lift {
    transition: all 0.3s ease;
  }
  .hover-lift:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
  }
  .transition-all {
    transition: all 0.3s ease;
  }
  .feature-card {
    transition: all 0.3s ease;
  }
  .feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1) !important;
  }
`;

const AdminDashboard = () => {
  const { logout } = useAuth(); // Get logout function from authentication hook
  const navigate = useNavigate(); // For redirecting user after logout

  const [sidebarTab, setSidebarTab] = useState("staff"); // Track active sidebar tab
  const [topbarAction, setTopbarAction] = useState(null); // Track active quick-action (or null if none)

  // Logout handler for admin
  const handleLogout = () => {
    logout(); // Sign user out
    navigate("/admin/login"); // Redirect to admin login page
  };

  let content = null; // Will hold the JSX component for current view

  // Welcome message when no content is selected
  const welcomeContent = (
    <div className="text-center py-5">
      {/* Main Welcome Section */}
      <div className="bg-gradient-primary rounded-4 p-5 mb-5 shadow-sm">
        <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
             style={{width: '100px', height: '100px'}}>
          <i className="fas fa-tachometer-alt fa-2x text-primary"></i>
        </div>
        <h1 className="text-white fw-bold mb-3 display-6">Welcome to Admin Dashboard</h1>
        <p className="text-white-75 fs-5 mb-0">
          Select a section from the sidebar to get started managing your SVD MilkSync operations.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="row g-4 justify-content-center mb-5">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100 hover-lift transition-all">
            <div className="card-body text-center p-4">
              <div className="bg-info bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '70px', height: '70px'}}>
                <i className="fas fa-users fa-lg text-white"></i>
              </div>
              <h5 className="card-title fw-semibold mb-2">Staff Management</h5>
              <p className="card-text small text-muted mb-3">Manage your team members and their roles</p>
              <div className="d-flex justify-content-center">
                <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                  <i className="fas fa-arrow-right me-1"></i>
                  Quick Access
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100 hover-lift transition-all">
            <div className="card-body text-center p-4">
              <div className="bg-success bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '70px', height: '70px'}}>
                <i className="fas fa-truck fa-lg text-white"></i>
              </div>
              <h5 className="card-title fw-semibold mb-2">Distributors</h5>
              <p className="card-text small text-muted mb-3">Handle your distribution network</p>
              <div className="d-flex justify-content-center">
                <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                  <i className="fas fa-arrow-right me-1"></i>
                  Quick Access
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100 hover-lift transition-all">
            <div className="card-body text-center p-4">
              <div className="bg-warning bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '70px', height: '70px'}}>
                <i className="fas fa-box fa-lg text-white"></i>
              </div>
              <h5 className="card-title fw-semibold mb-2">Products</h5>
              <p className="card-text small text-muted mb-3">Manage your product catalog</p>
              <div className="d-flex justify-content-center">
                <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill">
                  <i className="fas fa-arrow-right me-1"></i>
                  Quick Access
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100 hover-lift transition-all">
            <div className="card-body text-center p-4">
              <div className="bg-primary bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '70px', height: '70px'}}>
                <i className="fas fa-chart-line fa-lg text-white"></i>
              </div>
              <h5 className="card-title fw-semibold mb-2">Analytics</h5>
              <p className="card-text small text-muted mb-3">View detailed analytics and reports</p>
              <div className="d-flex justify-content-center">
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                  <i className="fas fa-arrow-right me-1"></i>
                  Quick Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="row g-4 justify-content-center">
        <div className="col-lg-4 col-md-6">
          <div className="d-flex align-items-center p-3 bg-white rounded-3 shadow-sm feature-card">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{width: '50px', height: '50px'}}>
              <i className="fas fa-file-invoice text-primary"></i>
            </div>
            <div>
              <h6 className="mb-1 fw-semibold">Order Management</h6>
              <p className="mb-0 small text-muted">Place and track orders</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6">
          <div className="d-flex align-items-center p-3 bg-white rounded-3 shadow-sm feature-card">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{width: '50px', height: '50px'}}>
              <i className="fas fa-credit-card text-success"></i>
            </div>
            <div>
              <h6 className="mb-1 fw-semibold">Payment Tracking</h6>
              <p className="mb-0 small text-muted">Monitor payment status</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6">
          <div className="d-flex align-items-center p-3 bg-white rounded-3 shadow-sm feature-card">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{width: '50px', height: '50px'}}>
              <i className="fas fa-wallet text-warning"></i>
            </div>
            <div>
              <h6 className="mb-1 fw-semibold">Wallet Management</h6>
              <p className="mb-0 small text-muted">Handle distributor wallets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (topbarAction) {
    // If quick action selected in topbar, render the matching view/list component
    switch (topbarAction) {
      case "staff-list":
        content = <StaffList />;
        break;
      case "distributors-list":
        content = <DistributorList />;
        break;
      case "products":
        content = <ProductsView />;
        break;
      case "orders-history":
        content = <OrdersHistory showAllOrders={true} />;
        break;
      case "bills-history":
        content = <BillsHistory />;
        break;

      case "payments-history":
        content = <PaymentHistory />;
        break;
        case "distributors-data":
          content = <DistributorsData />;
          break;
      default:
        content = null;
    }
  } else {
    // If no quick action, show the section from sidebar selection
    switch (sidebarTab) {
      case "staff":
        content = <StaffManagement />;
        break;
      case "distributors":
        content = <DistributorManagement />;
        break;
      case "products":
        content = <ProductManagement />;
        break;
      case "orders":
        content = <PlaceOrdersManagement />;
        break;
      case "bills":
        content = <Bills />;
        break;
      case "wallets":
        content = <WalletManagement />;
        break;
      case "payments":
        content = <Payments />;
        break;
      case "contact-details":
        content = <ContactDetails />;
        break;
      default:
        content = null;
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      <style>{welcomeStyles}</style>
      <div className="d-flex h-100">
        {/* Sidebar passes active tab and updates state */}
        <Sidebar
          activeTab={sidebarTab}
          setActiveTab={(tab) => {
            setSidebarTab(tab);    // Change active section
            setTopbarAction(null); // Reset quick action when sidebar changes
          }}
        />

        {/* Main layout area with topbar and content - adjusted for fixed sidebar */}
        <div className="flex-grow-1 d-flex flex-column main-content-area" style={{ 
          marginLeft: '280px',
          width: 'calc(100% - 280px)',
          minHeight: '100vh'
        }}>
          {/* Topbar with quick actions and logout */}
          <Topbar 
            key="topbar" 
            activeAction={topbarAction} 
            setActiveAction={setTopbarAction} 
            handleLogout={handleLogout}
          />

          {/* Content area that changes based on state */}
          <div className="flex-grow-1 p-4 bg-light overflow-auto">
            <div className="container-fluid">
              {content || welcomeContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
