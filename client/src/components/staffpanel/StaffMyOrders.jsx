import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";
import { NavLink } from "react-router-dom";
import StaffNavbar from "./StaffNavbar";
import StaffDamageProductsModal from "./StaffDamageProductsModal";

const StaffMyOrders = () => {
  const { token, user } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  
  // Enhanced state for order management
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Damage modal state
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);
  
  // Filters
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"

  // Debug logging
  console.log('🔍 StaffMyOrders - Component rendered');
  console.log('🔍 StaffMyOrders - Token:', token ? 'Present' : 'Missing');
  console.log('🔍 StaffMyOrders - Orders:', orders.length);
  console.log('🔍 StaffMyOrders - Distributors:', distributors.length);

  // Fetch distributors
  const fetchDistributors = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/distributor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDistributors(data);
    } catch (err) {
      console.error('❌ Error fetching distributors:', err);
    }
  }, [token]);

  // Fetch orders - Changed from /my-orders to / to show ALL orders (not just ones placed by current staff)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch orders (${res.status})`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
        setMessage("No orders data received");
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setMessage(err.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDistributors();
    fetchOrders();
  }, [fetchDistributors, fetchOrders]);

  // Safety check - ensure orders is always an array
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Filter orders based on selected criteria (enhanced from admin panel)
  const getFilteredOrders = () => {
    let filtered = [...safeOrders];

    // Filter by distributor (fixed to use distributor name instead of ID)
    if (selectedDistributor) {
      filtered = filtered.filter(order => {
        const distributorName = order.distributorId?.name || order.distributorId?.distributorName || order.distributorId?.company || '';
        return distributorName === selectedDistributor;
      });
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(order => {
        const orderMonth = new Date(order.orderDate).getMonth() + 1;
        return orderMonth === parseInt(selectedMonth);
      });
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(order => {
        const orderYear = new Date(order.orderDate).getFullYear();
        return orderYear === parseInt(selectedYear);
      });
    }

    // Enhanced search filter (from admin panel)
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const orderId = order._id?.toString() || '';
        const distributorName = order.distributorId?.name || order.distributorId?.distributorName || order.distributorId?.company || '';
        const status = order.status || '';
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        
        const searchText = `${orderId} ${distributorName} ${status} ${orderDate}`.toLowerCase();
        return searchText.includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Separate pending and delivered orders (from admin panel)
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
  const deliveredOrders = filteredOrders.filter(order => order.status === 'delivered');

  // Group orders by distributor for better organization (from admin panel)
  const groupOrdersByDistributor = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const distributorName = order.distributorId?.name || order.distributorId?.distributorName || order.distributorId?.company || 'Unknown Distributor';
      if (!grouped[distributorName]) {
        grouped[distributorName] = [];
      }
      grouped[distributorName].push(order);
    });
    return grouped;
  };

  const groupedPendingOrders = groupOrdersByDistributor(pendingOrders);
  const groupedDeliveredOrders = groupOrdersByDistributor(deliveredOrders);

  // Generate month options (enhanced from admin panel)
  const getMonthOptions = () => {
    const options = [{ value: "", label: "All Months" }];
    for (let i = 1; i <= 12; i++) {
      const monthName = new Date(2024, i - 1, 1).toLocaleDateString('en-US', { month: 'long' });
      options.push({ value: i.toString(), label: monthName });
    }
    return options;
  };

  // Generate year options (enhanced from admin panel)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [{ value: "", label: "All Years" }];
    
    for (let year = currentYear; year >= currentYear - 5; year--) {
      options.push({ value: year.toString(), label: year.toString() });
    }
    
    return options;
  };

  // Get distributor name by ID (fixed implementation)
  const getDistributorName = (distributorId) => {
    if (!distributorId) return "Unknown Distributor";
    
    // Handle both string ID and populated object
    if (typeof distributorId === 'string') {
      const distributor = distributors.find(d => d._id === distributorId);
      return distributor ? (distributor.name || distributor.distributorName || distributor.company) : "Unknown Distributor";
    } else if (distributorId && typeof distributorId === 'object') {
      return distributorId.name || distributorId.distributorName || distributorId.company || "Unknown Distributor";
    }
    
    return "Unknown Distributor";
  };

  // Get status badge color
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return { background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' };
      case 'delivered':
        return { background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' };
      case 'cancelled':
        return { background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' };
      default:
        return { background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)' };
    }
  };



  // Enhanced order management functions (from admin panel)
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder({ ...order });
    setShowEditModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${config.API_BASE}/orders/${editingOrder._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          items: editingOrder.items,
          orderDate: editingOrder.orderDate
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update order');
      }

      setMessage('Order updated successfully!');
      setShowEditModal(false);
      setEditingOrder(null);
      fetchOrders(); // Refresh orders
    } catch (err) {
      console.error('❌ Error updating order:', err);
      setMessage(err.message || 'Failed to update order');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate bill for order (from admin panel)
  const generateBill = (order) => {
    const billContent = `
BILL
====
Order ID: ${order._id}
Date: ${new Date(order.orderDate).toLocaleDateString()}
Distributor: ${getDistributorName(order.distributorId)}

Items:
${order.items?.map((item, idx) => `${idx + 1}. ${item.productId?.name || 'N/A'} ${item.quantity} ${item.unit}`).join('\n') || 'No items'}

Total Items: ${order.items?.length || 0}
Status: ${order.status}
    `;
    
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill_order_${order._id.slice(-6)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Bill generated and downloaded successfully!");
  };

  // Print receipt (enhanced functionality)
  const printReceipt = (order) => {
    const receiptContent = `
RECEIPT
========
Order ID: ${order._id}
Date: ${new Date(order.orderDate).toLocaleDateString()}
Distributor: ${getDistributorName(order.distributorId)}
Status: ${order.status}

Items:
${order.items?.map((item, idx) => `${idx + 1}. ${item.productId?.name || 'N/A'} ${item.quantity} ${item.unit}`).join('\n') || 'No items'}

Total Items: ${order.items?.length || 0}
Generated: ${new Date().toLocaleString()}
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Order ${order._id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { border: 2px solid #333; padding: 20px; max-width: 400px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .item { margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>RECEIPT</h2>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
              <p><strong>Distributor:</strong> ${getDistributorName(order.distributorId)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
            </div>
            
            <div class="items">
              <h3>Items:</h3>
              ${order.items?.map((item, idx) => `
                <div class="item">
                  <strong>${idx + 1}.</strong> ${item.productId?.name || 'N/A'} ${item.quantity} ${item.unit}
                </div>
              `).join('') || '<p>No items</p>'}
            </div>
            
            <div class="footer">
              <p><strong>Total Items:</strong> ${order.items?.length || 0}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Copy order details to clipboard (from admin panel)
  const copyOrderDetails = async (order) => {
    const details = `Order ID: ${order._id}, Date: ${new Date(order.orderDate).toLocaleDateString()}, Distributor: ${getDistributorName(order.distributorId)}, Status: ${order.status}, Items: ${order.items?.map(item => `${item.productId?.name || 'Unknown Product'} ${item.quantity} ${item.unit}`).join(', ')}`;
    
    try {
      await navigator.clipboard.writeText(details);
      setMessage("Order details copied to clipboard!");
    } catch (err) {
      setMessage("Failed to copy to clipboard");
    }
  };

  // Resend order notification (from admin panel)
  const resendNotification = (order) => {
    setMessage(`Notification resent for order ${order._id.slice(-6)}`);
  };

  // Handle mark as delivered with damage products
  const handleMarkDelivered = (order) => {
    console.log('Marking order as delivered:', order);
    console.log('Order items:', order.items);
    console.log('First item product data:', order.items?.[0]?.productId);
    setSelectedOrderForDelivery(order);
    setShowDamageModal(true);
  };

  // Handle delivery confirmation from modal
  const handleDeliveryConfirmed = (result) => {
    console.log('Delivery confirmed with result:', result);
    setMessage(`Order marked as delivered successfully! Final bill: ₹${result.finalBillAmount}`);
    setShowDamageModal(false);
    setSelectedOrderForDelivery(null);
    fetchOrders(); // Refresh orders list
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <StaffNavbar />

      <div className="container-fluid px-3 px-md-5" style={{ maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8f9fa', paddingTop: '100px', paddingBottom: '120px' }}>
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="display-4 fw-bold text-primary mb-2">
               My Orders
            </h1>
            <p className="lead text-muted">
              View and track your order history
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card h-100 border border-light shadow-sm">
              <div className="card-body text-center">
                <div className="text-primary mb-2">
                  <i className="bi bi-clipboard-check" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4 className="card-title h6 fw-bold">Total Orders</h4>
                <p className="card-text text-muted small mb-3">All time</p>
                <h3 className="text-primary mb-1">{orders.length}</h3>
                <p className="text-muted small mb-0">Orders</p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100 border border-light shadow-sm">
              <div className="card-body text-center">
                <div className="text-warning mb-2">
                  <i className="bi bi-clock" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4 className="card-title h6 fw-bold">Pending</h4>
                <p className="card-text text-muted small mb-3">Awaiting delivery</p>
                <h3 className="text-warning mb-1">
                  {orders.filter(o => o.status === 'pending').length}
                </h3>
                <p className="text-muted small mb-0">Orders</p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100 border border-light shadow-sm">
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4 className="card-title h6 fw-bold">Delivered</h4>
                <p className="card-text text-muted small mb-3">Completed orders</p>
                <h3 className="text-success mb-1">
                  {orders.filter(o => o.status === 'delivered').length}
                </h3>
                <p className="text-muted small mb-0">Orders</p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card h-100 border border-light shadow-sm">
              <div className="card-body text-center">
                <div className="text-info mb-2">
                  <i className="bi bi-calendar-week" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4 className="card-title h6 fw-bold">This Month</h4>
                <p className="card-text text-muted small mb-3">Current month</p>
                <h3 className="text-info mb-1">
                  {orders.filter(o => {
                    const orderDate = new Date(o.orderDate);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === now.getFullYear();
                  }).length}
                </h3>
                <p className="text-muted small mb-0">Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card border border-light shadow-sm">
          <div className="card-header bg-primary text-white">
            <h3>🔍 Search & Filters</h3>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 mb-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Search</label>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Distributor</label>
                  <select
                    value={selectedDistributor}
                    onChange={(e) => setSelectedDistributor(e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Distributors</option>
                    {distributors.map(d => (
                      <option key={d._id} value={d.name || d.distributorName || d.company}>
                        {d.name || d.distributorName || d.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="form-select"
                  >
                    {getMonthOptions().map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="form-select"
                  >
                    {getYearOptions().map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">View Mode</label>
                  <div className="d-flex gap-2">
                    <button
                      className={`btn btn-secondary ${viewMode === 'cards' ? 'success' : ''}`}
                      onClick={() => setViewMode('cards')}
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      📱 Cards
                    </button>
                    <button
                      className={`btn btn-secondary ${viewMode === 'table' ? 'success' : ''}`}
                      onClick={() => setViewMode('table')}
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      <i className="bi bi-table me-1"></i>
                      Table
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Display */}
        <div className="card border border-light shadow-sm">
          <div className="card-header bg-primary text-white">
            <h3>
              <i className="bi bi-clipboard-check me-2"></i>
              Orders ({filteredOrders.length})
            </h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary">
                  <i className="bi bi-arrow-clockwise spin"></i>
                </div>
                <p>Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                </div>
                <h4 className="h5 text-muted mb-2">No Orders Found</h4>
                <p className="text-secondary">
                  {orders.length === 0 
                    ? "You haven't placed any orders yet. Start by placing your first order!"
                    : "No orders match your current filters. Try adjusting your search criteria."
                  }
                </p>
              </div>
            ) : viewMode === 'cards' ? (
              // Enhanced Cards View (from admin panel)
              <>
                                  {/* Pending Orders Section */}
                {Object.keys(groupedPendingOrders).length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold mb-3">
                      <i className="bi bi-clock me-2"></i>
                      Pending Orders
                    </h5>
                    {Object.keys(groupedPendingOrders).map((distName) => (
                      <div key={distName} className="mb-5">
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-truck me-2 text-primary"></i>
                          <h6 className="mb-0 fw-bold text-primary">{distName}</h6>
                        </div>
                        <div className="row g-3">
                          {groupedPendingOrders[distName].map((order) => (
                            <div key={order._id} className="col-md-6 col-lg-4">
                              <div className="card h-100 border border-light shadow-sm">
                                <div className="card-header bg-warning text-dark d-flex align-items-center">
                                  <span className="me-2">
                                    <i className="bi bi-clock text-warning"></i>
                                  </span>
                                  <div>
                                    <h4 className="card-title h6 mb-1">
                                      Order #{order._id.slice(-6)}
                                    </h4>
                                    <p className="text-muted small mb-0">
                                      {new Date(order.orderDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="card-body">
                                  <h6 className="fw-bold mb-3">
                                    <i className="bi bi-box-seam me-2"></i>
                                    Order Items
                                  </h6>
                                  <div>
                                  {order.items && order.items.length > 0 ? (
                                    order.items.map((item, index) => (
                                      <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                        <span className="fw-medium text-truncate me-2">
                                          {item.productId?.name || 'Unknown Product'}
                                        </span>
                                        <span className="badge bg-secondary">
                                          {item.quantity} {item.unit}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-muted fst-italic">No items found</p>
                                  )}
                                </div>
                                
                                {/* Order Information */}
                                <div className="mb-3">
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-person me-2 text-muted"></i>
                                    <span className="fw-semibold small text-muted">Placed by:</span>
                                    <span className="ms-2 small">
                                      {order.userId?.name || order.userId?.username || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Damaged Products Information */}
                                {order.damagedProducts && order.damagedProducts.length > 0 ? (
                                  <div className="mt-3">
                                    <h6 className="fw-bold mb-2 text-danger">
                                      <i className="bi bi-exclamation-triangle me-2"></i>
                                      Damaged Products
                                    </h6>
                                    <div className="mb-2">
                                      <div className="d-flex align-items-center mb-1">
                                        <i className="bi bi-dash-circle me-2 text-danger"></i>
                                        <span className="fw-semibold small text-danger">Total Damaged:</span>
                                        <span className="ms-2 small text-danger fw-bold">
                                          {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      {order.damagedProducts.map((item, idx) => (
                                        <div key={idx} className="small text-danger mb-1">
                                          • {item.productName} - {item.damagedPackets || item.quantity || 0} packets
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    <div className="alert alert-success py-2">
                                      <i className="bi bi-check-circle me-2"></i>
                                      <strong>No Damaged Products</strong>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="card-footer bg-transparent d-flex gap-2 justify-content-center">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleViewOrder(order)}
                                  title="View Order Details"
                                >
                                  <i className="bi bi-eye me-1"></i>
                                  View
                                </button>
                                <button 
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleEditOrder(order)}
                                  title="Edit Order"
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => handleMarkDelivered(order)}
                                  title="Mark as Delivered"
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Mark Delivered
                                </button>
                                <button 
                                  className="btn btn-outline-info btn-sm"
                                  onClick={() => copyOrderDetails(order)}
                                  title="Copy Order Details"
                                >
                                  <i className="bi bi-clipboard me-1"></i>
                                  Copy
                                </button>
                                <button 
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => resendNotification(order)}
                                  title="Resend Notification"
                                >
                                  <i className="bi bi-bell me-1"></i>
                                  Notify
                                </button>
                              </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                                  {/* Delivered Orders Section (Enhanced from admin panel) */}
                {Object.keys(groupedDeliveredOrders).length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold mb-3">
                      <i className="bi bi-check-circle me-2"></i>
                      Delivered Orders
                    </h5>
                    {Object.keys(groupedDeliveredOrders).map((distName) => (
                      <div key={distName} className="mb-5">
                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-truck me-2 text-success"></i>
                          <h6 className="mb-0 fw-bold text-success">{distName}</h6>
                        </div>
                        <div className="row g-3">
                          {groupedDeliveredOrders[distName].map((order) => (
                            <div key={order._id} className="col-md-6 col-lg-4">
                              <div className="card h-100 border border-light shadow-sm">
                                <div className="card-header bg-success text-white d-flex align-items-center">
                                  <span className="me-2">
                                    <i className="bi bi-check-circle text-success"></i>
                                  </span>
                                  <div>
                                    <h4 className="card-title h6 mb-1">
                                      Order #{order._id.slice(-6)}
                                    </h4>
                                    <p className="text-white-50 small mb-0">
                                      {new Date(order.orderDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="card-body">
                                  <h6 className="fw-bold mb-3">
                                    <i className="bi bi-box-seam me-2"></i>
                                    Order Items
                                  </h6>
                                  <div>
                                  {order.items && order.items.length > 0 ? (
                                    order.items.map((item, index) => (
                                      <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                        <span className="fw-medium text-truncate me-2">
                                          {item.productId?.name || 'Unknown Product'}
                                        </span>
                                        <span className="badge bg-secondary">
                                          {item.quantity} {item.unit}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-muted fst-italic">No items found</p>
                                  )}
                                </div>
                                
                                {/* Order Information */}
                                <div className="mb-3">
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-person me-2 text-muted"></i>
                                    <span className="fw-semibold small text-muted">Placed by:</span>
                                    <span className="ms-2 small">
                                      {order.userId?.name || order.userId?.username || "Unknown"}
                                    </span>
                                  </div>
                                  
                                  {/* Delivered By Information */}
                                  {order.updatedBy && (
                                    <div className="d-flex align-items-center mb-2">
                                      <i className="bi bi-person-check me-2 text-success"></i>
                                      <span className="fw-semibold small text-success">Delivered by:</span>
                                      <span className="ms-2 small text-success">
                                        {order.updatedBy.role === 'admin' ? 'Admin' : 'Staff'}: {order.updatedBy.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Damaged Products Information */}
                                {order.damagedProducts && order.damagedProducts.length > 0 ? (
                                  <div className="mt-3">
                                    <h6 className="fw-bold mb-2 text-danger">
                                      <i className="bi bi-exclamation-triangle me-2"></i>
                                      Damaged Products
                                    </h6>
                                    <div className="mb-2">
                                      <div className="d-flex align-items-center mb-1">
                                        <i className="bi bi-dash-circle me-2 text-danger"></i>
                                        <span className="fw-semibold small text-danger">Total Damaged:</span>
                                        <span className="ms-2 small text-danger fw-bold">
                                          {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      {order.damagedProducts.map((item, idx) => (
                                        <div key={idx} className="small text-danger mb-1">
                                          • {item.productName} - {item.damagedPackets || item.quantity || 0} packets
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    <div className="alert alert-success py-2">
                                      <i className="bi bi-check-circle me-2"></i>
                                      <strong>No Damaged Products</strong>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="card-footer bg-transparent d-flex gap-2 justify-content-center">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleViewOrder(order)}
                                  title="View Order Details"
                                >
                                  <i className="bi bi-eye me-1"></i>
                                  View
                                </button>
                                <button 
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => generateBill(order)}
                                  title="Generate Bill"
                                >
                                  📄 Bill
                                </button>
                                <button 
                                  className="btn btn-outline-dark btn-sm"
                                  onClick={() => printReceipt(order)}
                                  title="Print Receipt"
                                >
                                  🖨️ Print
                                </button>
                                <button 
                                  className="btn btn-outline-info btn-sm"
                                  onClick={() => copyOrderDetails(order)}
                                  title="Copy Order Details"
                                >
                                  <i className="bi bi-clipboard me-1"></i>
                                  Copy
                                </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Enhanced Table View (from admin panel)
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Distributor</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Placed By</th>
                      <th>Delivered By</th>
                      <th>Damaged Products</th>
                      <th>Total Damaged</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-6)}</td>
                        <td>{getDistributorName(order.distributorId)}</td>
                        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td>{order.items?.length || 0}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person me-2"></i>
                            {order.userId?.name || order.userId?.username || "Unknown"}
                          </div>
                        </td>
                        <td>
                          {order.status === 'delivered' && order.updatedBy ? (
                            <div className="d-flex align-items-center">
                              <i className="bi bi-person-check me-2 text-success"></i>
                              <span className="text-success small">
                                {order.updatedBy.role === 'admin' ? 'Admin' : 'Staff'}: {order.updatedBy.name}
                              </span>
                            </div>
                          ) : order.status === 'delivered' ? (
                            <span className="text-muted small">Unknown</span>
                          ) : (
                            <span className="text-muted small">Not delivered</span>
                          )}
                        </td>
                        <td>
                          {order.damagedProducts && order.damagedProducts.length > 0 ? (
                            <div className="damaged-products-summary">
                              {order.damagedProducts.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="mb-1">
                                  <i className="bi bi-exclamation-triangle me-1 text-danger"></i>
                                  {item.productName} - {item.damagedPackets || item.quantity || 0} pkts
                                </div>
                              ))}
                              {order.damagedProducts.length > 2 && (
                                <small className="text-danger">+{order.damagedProducts.length - 2} more</small>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted small">None</span>
                          )}
                        </td>
                        <td>
                          {order.damagedProducts && order.damagedProducts.length > 0 ? (
                            <span className="badge bg-danger fs-6">
                              {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                            </span>
                          ) : (
                            <span className="badge bg-secondary fs-6">0 packets</span>
                          )}
                        </td>
                        <td>
                          <span 
                            className="badge"
                            style={{
                              ...getStatusBadgeStyle(order.status),
                              color: 'white'
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-outline-info btn-sm"
                              onClick={() => handleViewOrder(order)}
                              title="View order details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {order.status === 'pending' && (
                              <>
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleEditOrder(order)}
                                  title="Edit order"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => handleMarkDelivered(order)}
                                  title="Mark as delivered"
                                >
                                  <i className="bi bi-check-circle"></i>
                                </button>
                              </>
                            )}
                            {order.status === 'delivered' && (
                              <>
                                <button 
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => generateBill(order)}
                                  title="Generate bill"
                                >
                                  <i className="bi bi-file-earmark-text"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => printReceipt(order)}
                                  title="Print receipt"
                                >
                                  <i className="bi bi-printer"></i>
                                </button>
                              </>
                            )}
                            <button 
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => copyOrderDetails(order)}
                              title="Copy details"
                            >
                              <i className="bi bi-clipboard"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="modal d-block" onClick={() => setShowViewModal(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
              <h3>
                <i className="bi bi-clipboard-data me-2"></i>
                Order Details
              </h3>
              <button className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span className={`status-${selectedOrder.status}`}>{selectedOrder.status}</span></p>
                <p><strong>Distributor:</strong> {getDistributorName(selectedOrder.distributorId)}</p>
                {selectedOrder.createdAt && (
                  <p><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                )}
                
                <h4>
                  <i className="bi bi-box-seam me-2"></i>
                  Order Items:
                </h4>
                <div className="order-items-detail">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                                             <div key={index} className="order-item-detail">
                         <span className="item-product">
                           {item.productId?.name || 'Unknown Product'}
                         </span>
                         <span className="item-quantity">{item.quantity}</span>
                         <span className="item-unit">{item.unit}</span>
                       </div>
                    ))
                  ) : (
                    <p>No items found</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="modal d-block" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
              <h3>
                <i className="bi bi-pencil-square me-2"></i>
                Edit Order
              </h3>
              <button className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="edit-order-form">
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-calendar3 me-2"></i>
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={editingOrder.orderDate ? new Date(editingOrder.orderDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingOrder({...editingOrder, orderDate: e.target.value})}
                    className="form-control"
                  />
                </div>
                
                <h4>
                  <i className="bi bi-box-seam me-2"></i>
                  Order Items:
                </h4>
                <div className="edit-order-items">
                  {editingOrder.items && editingOrder.items.length > 0 ? (
                    editingOrder.items.map((item, index) => (
                                             <div key={index} className="edit-order-item">
                         <div className="mb-3">
                           <label className="form-label fw-bold">Product</label>
                           <input
                             type="text"
                             value={item.productId?.name || 'Unknown Product'}
                             disabled
                             className="form-control"
                           />
                         </div>
                         <div className="mb-3">
                           <label className="form-label fw-bold">Quantity</label>
                           <input
                             type="number"
                             value={item.quantity}
                             onChange={(e) => {
                               const newItems = [...editingOrder.items];
                               newItems[index].quantity = e.target.value;
                               setEditingOrder({...editingOrder, items: newItems});
                             }}
                             className="form-control"
                           />
                         </div>
                         <div className="mb-3">
                           <label className="form-label fw-bold">Unit</label>
                           <select
                             value={item.unit}
                             onChange={(e) => {
                               const newItems = [...editingOrder.items];
                               newItems[index].unit = e.target.value;
                               setEditingOrder({...editingOrder, items: newItems});
                             }}
                             className="form-control"
                           >
                             <option value="tub">Tub</option>
                             <option value="bucket">Bucket</option>
                             <option value="kg">kg</option>
                           </select>
                         </div>
                       </div>
                    ))
                  ) : (
                    <p>No items to edit</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
                            <button 
                className="btn btn-success"
                onClick={handleUpdateOrder}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Order'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Damage Products Modal */}
      {showDamageModal && selectedOrderForDelivery && (
        <StaffDamageProductsModal
          show={showDamageModal}
          onClose={() => {
            setShowDamageModal(false);
            setSelectedOrderForDelivery(null);
          }}
          order={selectedOrderForDelivery}
          onConfirmDelivery={handleDeliveryConfirmed}
        />
      )}
    </div>
  );
};

export default StaffMyOrders;
