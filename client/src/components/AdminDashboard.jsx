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
import ContactDetails from "./ContactDetails"; // Contact details management

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
      <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
           style={{width: '120px', height: '120px'}}>
        <span className="fs-1 text-white">👋</span>
      </div>
      <h2 className="text-dark fw-bold mb-3">Welcome to Admin Dashboard</h2>
      <p className="text-muted fs-5 mb-4">
        Select a section from the sidebar to get started managing your SVD MilkSync operations.
      </p>
      <div className="row g-4 justify-content-center">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <span className="fs-2 text-white">👥</span>
              </div>
              <h6 className="card-title">Staff Management</h6>
              <p className="card-text small text-muted">Manage your team members</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <span className="fs-2 text-white">🚚</span>
              </div>
              <h6 className="card-title">Distributors</h6>
              <p className="card-text small text-muted">Handle distribution network</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <span className="fs-2 text-white">📦</span>
              </div>
              <h6 className="card-title">Products</h6>
              <p className="card-text small text-muted">Manage your product catalog</p>
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
