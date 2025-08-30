import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import UserDetailsButton from "./UserDetailsButton";

export default function StaffNavbar() {
  const location = useLocation();

  // Helper function to check if link is active
  const isActiveLink = (path) => location.pathname === path;

  return (
    <>
      {/* Fixed Top Header */}
      <nav 
        className="navbar navbar-light bg-white border-bottom shadow-sm fixed-top"
        aria-label="Staff header"
        style={{ height: '80px', minHeight: '80px' }}
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
                  width="80" 
                  height="80"
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
        aria-label="Staff bottom navigation"
      >
        <div className="container-fluid px-2">
          <div className="d-flex justify-content-around align-items-center w-100">
            
            {/* Dashboard Link */}
            <NavLink
              to="/staff/dashboard"
              className={`btn btn-link text-decoration-none d-flex flex-column align-items-center p-2 cursor-pointer ${
                isActiveLink('/staff/dashboard') ? 'text-primary' : 'text-muted'
              }`}
              aria-label="Dashboard"
            >
              <i className="bi-house-door fs-4 mb-1"></i>
              <small className="fw-semibold">Dashboard</small>
            </NavLink>

            {/* Place Orders Link */}
            <NavLink
              to="/staff/orders"
              className={`btn btn-link text-decoration-none d-flex flex-column align-items-center p-2 cursor-pointer ${
                isActiveLink('/staff/orders') ? 'text-primary' : 'text-muted'
              }`}
              aria-label="Place Orders"
            >
              <i className="bi-box-seam fs-4 mb-1"></i>
              <small className="fw-semibold">Orders</small>
            </NavLink>

            {/* My Orders Link */}
            <NavLink
              to="/staff/my-orders"
              className={`btn btn-link text-decoration-none d-flex flex-column align-items-center p-2 cursor-pointer ${
                isActiveLink('/staff/my-orders') ? 'text-primary' : 'text-muted'
              }`}
              aria-label="My Orders"
            >
              <i className="bi-receipt fs-4 mb-1"></i>
              <small className="fw-semibold">My Orders</small>
            </NavLink>



            {/* Profile Link */}
            <NavLink
              to="/staff/profile"
              className={`btn btn-link text-decoration-none d-flex flex-column align-items-center p-2 cursor-pointer ${
                isActiveLink('/staff/profile') ? 'text-primary' : 'text-muted'
              }`}
              aria-label="Profile"
            >
              <i className="bi-person fs-4 mb-1"></i>
              <small className="fw-semibold">Profile</small>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Spacers to prevent content from being hidden behind fixed navbars */}
      <div style={{ height: '1px' }} aria-hidden="true"></div>
    </>
  );
}
