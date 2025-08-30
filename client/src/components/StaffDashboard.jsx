import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import config from "../config";
import StaffNavbar from "./staffpanel/StaffNavbar";


export default function StaffDashboard() {
  const { token } = useAuth();
  const [todayOrders, setTodayOrders] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch today's activities
  useEffect(() => {
    const fetchTodayActivities = async () => {
      if (!token) return;

      try {
        setActivityLoading(true);
        setActivityError("");
        const today = getTodayDate();

        // Fetch all orders placed by this staff
        const ordersResponse = await fetch(`${config.API_BASE}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (ordersResponse.ok) {
          const allOrders = await ordersResponse.json();
          console.log('📦 Sample order data:', allOrders[0]);
          console.log('📦 Distributor data:', allOrders[0]?.distributorId);
          
          // Filter orders created today
          const todaysOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === today;
          });
          setTodayOrders(todaysOrders);
        }

        // Note: Staff typically only place orders, deliveries are handled by distributors
        // So we'll focus on showing only the orders placed by this staff member today

      } catch (err) {
        console.error("Error fetching today's activities:", err);
        setActivityError("Failed to load today's activities");
      } finally {
        setActivityLoading(false);
      }
    };

    fetchTodayActivities();
  }, [token]);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <StaffNavbar />

      <div className="container-fluid px-3 px-md-5" style={{ maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8f9fa', paddingTop: '100px', paddingBottom: '120px' }}>
        {/* Page Header */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">
             Staff Dashboard
          </h1>
          <p className="lead text-muted">
            Welcome! Place orders for distributors, track order history, and mark deliveries with ease.          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="row g-4 mb-5">
          {/* Place Orders Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-info text-white text-center py-3">
                <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-3">
                  <i className="bi bi-cart4 text-info" style={{ fontSize: '30px' }}></i>
                </div>
                <h4 className="mb-1">Place Orders</h4>
                <p className="mb-0 small">Create new orders for distributors</p>
              </div>
              <div className="card-body d-flex flex-column justify-content-center text-center">
                <NavLink to="/staff/orders" className="btn btn-info text-white w-100">
                  Start Ordering
                </NavLink>
              </div>
            </div>
          </div>

          {/* My Orders Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-success text-white text-center py-3">
                <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-3">
                  <i className="bi bi-clipboard-check text-success" style={{ fontSize: '30px' }}></i>
                </div>
                <h4 className="mb-1">My Orders</h4>
                <p className="mb-0 small">View and track your order history</p>
              </div>
              <div className="card-body d-flex flex-column justify-content-center text-center">
                <NavLink to="/staff/my-orders" className="btn btn-success text-white w-100">
                  View Orders
                </NavLink>
              </div>
            </div>
          </div>

          {/* Distributor Profiles Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-primary text-white text-center py-3">
                <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-3">
                  <i className="bi bi-people-fill text-primary" style={{ fontSize: '30px' }}></i>
                </div>
                <h4 className="mb-1">Distributor Profiles</h4>
                <p className="mb-0 small">View distributor contact details</p>
              </div>
              <div className="card-body d-flex flex-column justify-content-center text-center">
                <NavLink to="/staff/profile" className="btn btn-primary text-white w-100">
                  View Profiles
                </NavLink>
              </div>
            </div>
          </div>

          {/* Help & Support Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-danger text-white text-center py-3">
                <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-3">
                  <i className="bi bi-life-preserver text-danger" style={{ fontSize: '30px' }}></i>
                </div>
                <h4 className="mb-1">Help & Support</h4>
                <p className="mb-0 small">Get assistance when needed</p>
              </div>
              <div className="card-body d-flex flex-column justify-content-center text-center">
                <button className="btn btn-danger text-white w-100">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="card border shadow-sm">
          <div className="card-header bg-secondary text-white">
            <h3 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Today's Activity
            </h3>
          </div>
          <div className="card-body">
            {activityLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-secondary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading today's activities...</p>
              </div>
            ) : activityError ? (
              <div className="text-center py-4">
                <div className="text-danger">
                  <i className="bi bi-exclamation-triangle fs-3"></i>
                  <p className="mt-2">{activityError}</p>
                </div>
              </div>
            ) : (todayOrders.length === 0) ? (
              <div className="text-center py-4">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-4">
                  <i className="bi bi-calendar-check text-muted fs-2"></i>
                </div>
                <h5 className="text-muted">No orders placed today</h5>
                <p className="text-muted mb-0">Your daily order activities will appear here once you start placing orders for distributors.</p>
              </div>
            ) : (
              <div>
                {/* Today's Orders */}
                <div>
                  <h6 className="text-primary fw-bold mb-3">
                    <i className="bi bi-cart-plus me-2"></i>
                    Orders Placed Today ({todayOrders.length})
                  </h6>
                  <div className="list-group list-group-flush">
                    {todayOrders.map((order, index) => (
                      <div key={order._id || index} className="list-group-item border-start border-3 border-info bg-light">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">
                              <i className="bi bi-building text-info me-2"></i>
                              Distributor: {order.distributorId?.name || 'Unknown Company'}
                            </h6>
                            <p className="mb-1 text-muted small">
                              <strong>Order ID:</strong> {order._id?.slice(-6) || 'N/A'}
                            </p>
                            <p className="mb-0 text-muted small">
                              <i className="bi bi-box me-1"></i>
                              {order.items?.length || 0} item(s) • 
                              <i className="bi bi-calendar3 ms-2 me-1"></i>
                              {new Date(order.createdAt).toLocaleTimeString()}
                              <span className="ms-3">
                                <i className="bi bi-info-circle me-1"></i>
                                Status: {order.status || 'pending'}
                              </span>
                            </p>
                          </div>
                          <span className={`badge ${order.status === 'delivered' ? 'bg-success' : order.status === 'confirmed' ? 'bg-warning' : 'bg-info'}`}>
                            <i className="bi bi-check-circle me-1"></i>
                            {order.status === 'delivered' ? 'Delivered' : order.status === 'confirmed' ? 'Confirmed' : 'Placed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
