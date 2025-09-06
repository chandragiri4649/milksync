import React from "react";
import UserDetailsButton from "./UserDetailsButton";

const tabs = [
  { icon: "bi-box-seam", label: "Orders" },
  { icon: "bi-truck", label: "Deliveries" },
  { icon: "bi-house-door", label: "Home" },
  { icon: "bi-receipt", label: "Bills" },
  { icon: "bi-credit-card", label: "Payments" }
];

export default function DistributorNavbar({ userName, companyName, subtitle, logoSrc, activeIndex, onTabChange }) {
  return (
    <>
      {/* Fixed Top Header */}
      <nav 
        className="navbar navbar-light bg-white border-bottom shadow-sm fixed-top"
        aria-label="Distributor header"
        style={{ height: '60px',minHeight: '60px'}}
      >
        <div className="container-fluid px-3">
          <div className="row w-100 align-items-center g-0">
            {/* Logo/Avatar on Left */}
            <div className="col d-flex align-items-center">
              <div className="d-flex align-items-center">
                <img 
                  src="/Milksync_logo.png" 
                  alt="MilkSync Logo" 
                  className="me-3" 
                  width="60"
                  height="60"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* User Details on Right Corner */}
            <div className="col-auto d-flex align-items-center">
              <UserDetailsButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Fixed Bottom Navigation */}
      <nav 
        className="navbar navbar-light bg-white border-top shadow fixed-bottom"
        aria-label="Distributor bottom navigation"
        style={{ height: '65px', minHeight: '65px' }}
      >
        <div className="container-fluid px-2 py-2">
          <div className="d-flex justify-content-around align-items-center w-100">
            {tabs.map((tab, idx) => (
              <button
                key={tab.label}
                onClick={() => onTabChange(idx)}
                className={`btn btn-link text-decoration-none d-flex flex-column align-items-center p-1 cursor-pointer ${
                  activeIndex === idx 
                    ? 'text-primary' 
                    : 'text-muted'
                }`}
                aria-label={tab.label}
              >
                <i className={`${tab.icon} fs-6 mb-1`}></i>
                <small className="fw-semibold" style={{ fontSize: '0.75rem', lineHeight: '1' }}>{tab.label}</small>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Spacers to prevent content from being hidden behind fixed navbars */}
      <div className="py-5" aria-hidden="true"></div>
    </>
  );
}
