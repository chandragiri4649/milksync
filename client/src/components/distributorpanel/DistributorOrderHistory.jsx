import React, { useState, useEffect } from "react";
import apiService from "../../utils/apiService";

export default function DistributorOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Get distributor token from localStorage
  const getDistributorToken = () => {
    return localStorage.getItem("distributorToken");
  };

  // Fetch only pending orders for the logged-in distributor
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        setLoading(true);
        
        // Fetch only pending orders for this distributor
        const data = await apiService.get('/orders/tomorrow');
        
        // Ensure data is always an array
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && typeof data === 'object') {
          if (data.error) {
            setMessage(data.error);
            setOrders([]);
          } else {
            setOrders([]);
            setMessage("No pending orders received");
          }
        } else {
          setOrders([]);
          setMessage("No pending orders received");
        }
      } catch (error) {
        console.error("Error fetching pending orders:", error);
        setMessage("Failed to load pending orders. Please try again.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);









  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted fs-5">Loading your pending orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-2" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="text-center mb-3 p-3 bg-warning bg-gradient rounded-4 text-dark shadow">
        <h2 className="mb-1 fw-semibold" style={{ fontSize: '1.5rem' }}>Pending Orders</h2>
        <p className="mb-0 small opacity-75">Orders that need to be delivered tomorrow</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
          {message}
          <button 
            type="button" 
            className="btn-close" 
            aria-label="Close"
            onClick={() => setMessage("")}
          ></button>
        </div>
      )}



      {/* Summary Statistics */}
      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="card bg-warning bg-opacity-10 border-warning border-start border-3 h-100">
            <div className="card-body text-center py-2">
              <div className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Total Pending Orders</div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>{orders.length}</div>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card bg-info bg-opacity-10 border-info border-start border-3 h-100">
            <div className="card-body text-center py-2">
              <div className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Ready for Delivery</div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>{orders.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div>
        {orders.length === 0 ? (
          <div className="text-center py-5">
            <div className="text-muted fs-5">No pending orders found. All orders have been delivered!</div>
          </div>
        ) : (
          <div className="row g-4">
            {orders.map((order) => (
              <div key={order._id} className="col-lg-6">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <span className="me-2">📦</span>
                      <span className="fw-bold">Order #{order._id.slice(-6)}</span>
                    </div>
                    <div className="badge bg-warning text-dark">
                      <span className="me-1">⏳</span>
                      Pending Delivery
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="row g-2 mb-3">
                      <div className="col-12">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Delivery Date:</span>
                          <span className="fw-semibold text-primary">
                            {new Date(order.deliveryDate || order.orderDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Order Placed:</span>
                          <span className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Items:</span>
                          <span className="fw-semibold text-dark">{order.items?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="fw-semibold text-muted small mb-2">Order Items ({order.items?.length || 0}):</div>
                      <div className="row g-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="col-12">
                            <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded border">
                              <div className="d-flex align-items-center">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                     style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                    {item.productId?.name || 'N/A'}
                                  </div>
                                  {item.productId?.productQuantity && item.productId?.productUnit && (
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                      {item.productId.productQuantity}{item.productId.productUnit} pack
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                  {item.quantity} {item.unit || 'units'}
                                </div>
                                {item.costPerUnit && (
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    ₹{item.costPerUnit} each
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom spacer to prevent content from being hidden behind bottom navigation */}
      <div className="pb-5 mb-5" aria-hidden="true"></div>
    </div>
  );
}
