import React, { useState, useEffect } from "react";
import apiService from "../../utils/apiService";

export default function DistributorDeliveryHistory() {
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  // Get distributor token from localStorage
  const getDistributorToken = () => {
    return localStorage.getItem("distributorToken");
  };

  // Fetch delivered orders for the logged-in distributor
  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      try {
        setLoading(true);
        
        // Fetch all orders for this distributor and filter for delivered ones
        const data = await apiService.get('/orders/distributor/my-orders');
        
        // Filter only delivered orders
        if (Array.isArray(data)) {
          const delivered = data.filter(order => order.status === 'delivered');
          setDeliveredOrders(delivered);
        } else if (data && typeof data === 'object') {
          if (data.error) {
            setMessage(data.error);
            setDeliveredOrders([]);
          } else {
            setDeliveredOrders([]);
            setMessage("No orders data received");
          }
        } else {
          setDeliveredOrders([]);
          setMessage("No orders data received");
        }
      } catch (error) {
        console.error("Error fetching delivered orders:", error);
        setMessage("Failed to load delivered orders. Please try again.");
        setDeliveredOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredOrders();
  }, []);

  // Filter delivered orders based on search criteria
  const getFilteredDeliveredOrders = () => {
    let filtered = deliveredOrders;
    
    // Filter by search term (search in order ID, customer name, product names)
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.items?.some(item => 
          item.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || false)
      );
    }
    
    return filtered;
  };

  const filteredDeliveredOrders = getFilteredDeliveredOrders();

  // Get delivery date in readable format
  const getDeliveryDate = (order) => {
    if (order.deliveryDate) {
      return new Date(order.deliveryDate).toLocaleDateString();
    }
    // If no delivery date, use the order date as fallback
    return new Date(order.orderDate).toLocaleDateString();
  };

  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const costPerUnit = parseFloat(item.costPerUnit) || 0;
      return sum + (quantity * costPerUnit);
    }, 0);
  };



  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted fs-5">Loading your delivery history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-2" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="text-center mb-3 p-3 bg-success bg-gradient rounded-4 text-white shadow">
        <h2 className="mb-1 fw-semibold" style={{ fontSize: '1.5rem' }}>Delivery History</h2>
        <p className="mb-0 small opacity-75">Orders you have successfully delivered to customers</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          {message}
          <button 
            type="button" 
            className="btn-close" 
            aria-label="Close"
            onClick={() => setMessage("")}
          ></button>
        </div>
      )}

      {/* Search Box */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="position-relative">
            <input
              type="text"
              placeholder="Search delivered orders by ID, customer, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control ps-5"
            />
            <span className="position-absolute top-50 start-0 translate-middle-y ms-3">🔍</span>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="card bg-info bg-opacity-10 border-info border-start border-3 h-100">
            <div className="card-body text-center py-2">
              <div className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Total Delivered Orders</div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>{filteredDeliveredOrders.length}</div>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card bg-warning bg-opacity-10 border-warning border-start border-3 h-100">
            <div className="card-body text-center py-2">
              <div className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>This Month</div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>
                {filteredDeliveredOrders.filter(order => {
                  const deliveryDate = new Date(order.deliveryDate || order.orderDate);
                  const now = new Date();
                  return deliveryDate.getMonth() === now.getMonth() && 
                         deliveryDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-12">
          <div className="card bg-success bg-opacity-10 border-success border-start border-3 h-100">
            <div className="card-body text-center py-2">
              <div className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Total Value Delivered</div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>
                ₹{filteredDeliveredOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivered Orders List */}
      <div>
        {filteredDeliveredOrders.length === 0 ? (
          <div className="text-center py-5">
            <div className="text-muted fs-5">No delivered orders found. Start delivering orders to see your history!</div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredDeliveredOrders.map((order) => (
              <div key={order._id} className="col-lg-6">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <span className="me-2">🚚</span>
                      <span className="fw-bold">Order #{order._id.slice(-6)}</span>
                    </div>
                    <div className="badge bg-success">
                      <span className="me-1">✅</span>
                      Delivered
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="row g-2 mb-3">
                      <div className="col-12">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Delivery Date:</span>
                          <span className="fw-semibold text-primary">
                            {getDeliveryDate(order)}
                          </span>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Items Delivered:</span>
                          <span className="fw-semibold text-dark">{order.items?.length || 0}</span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Total Amount:</span>
                          <span className="fw-bold text-dark">₹{calculateOrderTotal(order).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="fw-semibold text-muted small mb-2">Items Delivered ({order.items?.length || 0}):</div>
                      <div className="row g-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="col-12">
                            <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded border">
                              <div className="d-flex align-items-center">
                                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                     style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                  ✓
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
                                <div className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>
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
                    
                    {/* Damaged Products Information */}
                    {order.damagedProducts && order.damagedProducts.length > 0 ? (
                      <div className="mb-3">
                        <div className="fw-semibold text-danger small mb-2">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Damaged Products
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Total Damaged:</span>
                            <span className="fw-bold text-danger">
                              {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                            </span>
                          </div>
                        </div>
                        <div className="small">
                          {order.damagedProducts.map((item, idx) => (
                            <div key={idx} className="text-danger mb-1">
                              • <strong>{item.productName}</strong> - {item.damagedPackets || item.quantity || 0} packets
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <div className="alert alert-success py-2 mb-0">
                          <i className="bi bi-check-circle me-1"></i>
                          <strong>No Damaged Products</strong>
                        </div>
                      </div>
                    )}
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
