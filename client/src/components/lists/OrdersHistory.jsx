// src/components/orders/OrdersHistory.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import config from "../../config";
import { useAuth } from "../../hooks/useAuth";
import OrderEditModal from "./OrderEditModal";
import DamageProductsModal from "./DamageProductsModal";


const OrdersHistory = ({ showAllOrders = false }) => {
  const { token } = useAuth();
  const location = useLocation();
  
  // Check if this is being accessed from staff routes
  const isStaffRoute = location.pathname.startsWith('/staff/');

  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [message, setMessage] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [loading, setLoading] = useState(true);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);

  // Get current month and year for default selection
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Fetch distributors for search functionality
  const fetchDistributors = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/distributor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch distributors");
      const data = await res.json();
      setDistributors(data);
    } catch (err) {
      console.error("Error fetching distributors:", err);
    }
  }, [token]);

  // Fetch orders - all orders for admin, user's orders for staff
  useEffect(() => {
    const endpoint = showAllOrders ? "/orders/all" : "/orders/my-orders";
    setLoading(true);
    
    fetch(`${config.API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch orders (${res.status}): ${errorText}`);
        }
        return res.json();
      })
      .then(data => {
        // Ensure data is always an array
        if (Array.isArray(data)) {
          setOrders(data);
          setSelectedMonth(currentMonth); // Set default month
        } else if (data && typeof data === 'object') {
          if (data.error) {
            setMessage(data.error);
            setOrders([]);
          } else {
            setOrders([]);
            setMessage("Unexpected response format from orders API");
          }
        } else {
          setOrders([]);
          setMessage("No orders data received");
        }
        setLoading(false);
      })
      .catch((err) => {
        setMessage(err.message || "Failed to load orders");
        setOrders([]);
        setLoading(false);
      });
  }, [token, showAllOrders, currentMonth]);

  // Load distributors on mount
  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  // Safety check - ensure orders is always an array
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Get all pending orders (unfiltered)
  const allPendingOrders = safeOrders.filter(order => order.status === 'pending');

  // Filter orders based on search criteria
  const getFilteredOrders = () => {
    let filtered = safeOrders;
    
    // Filter by distributor
    if (selectedDistributor) {
      filtered = filtered.filter(order => 
        order.distributorId?.name === selectedDistributor ||
        order.distributorId?.company === selectedDistributor ||
        order.distributorId?.distributorName === selectedDistributor
      );
    }

    // Filter by month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(order => {
        const orderYear = new Date(order.orderDate).getFullYear();
        return orderYear === parseInt(selectedYear);
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        (order.distributorId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.distributorId?.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.orderDate || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Filter only delivered orders by selected distributor, month, and year
  const getFilteredDeliveredOrders = () => {
    return filteredOrders.filter(order => order.status === 'delivered');
  };

  const filteredDeliveredOrders = getFilteredDeliveredOrders();

  // Group pending orders by distributor for card display (unfiltered)
  const groupedPendingOrders = allPendingOrders.reduce((acc, order) => {
    const distName = order.distributorId?.name || order.distributorId?.company || "Unknown Distributor";
    if (!acc[distName]) acc[distName] = [];
    acc[distName].push(order);
    return acc;
  }, {});

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

  // Generate year options (current year + 2 years back)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [
      { value: "", label: "All Years" },
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
      { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
      { value: currentYear.toString(), label: currentYear.toString() }
    ];
    return options;
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const ordersToExport = filteredOrders;
    if (ordersToExport.length === 0) {
      setMessage("No orders to export");
      return;
    }

    const csvContent = [
      ["Order Date", "Distributor", "Status", "Items Count", "Total Amount", "Placed By"],
      ...ordersToExport.map(order => [
        new Date(order.orderDate).toLocaleDateString(),
        order.distributorId?.name || order.distributorId?.company || "Unknown",
        order.status,
        order.items?.length || 0,
        order.items?.reduce((sum, item) => sum + (item.costPerPacket || 0), 0).toFixed(2),
        order.userId?.name || order.userId?.username || "Unknown"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Orders exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalOrders = filteredOrders.length;
    const pendingCount = filteredOrders.filter(order => order.status === 'pending').length;
    const deliveredCount = filteredOrders.filter(order => order.status === 'delivered').length;
    const totalAmount = filteredOrders.reduce((sum, order) => 
      sum + (order.items?.reduce((itemSum, item) => itemSum + (item.costPerPacket || 0), 0) || 0), 0
    );
    
    // Calculate damaged products statistics
    const ordersWithDamage = filteredOrders.filter(order => 
      order.damagedProducts && order.damagedProducts.length > 0
    ).length;
    
    const totalDamagedPackets = filteredOrders.reduce((sum, order) => {
      if (order.damagedProducts && order.damagedProducts.length > 0) {
        return sum + order.damagedProducts.reduce((itemSum, item) => 
          itemSum + (item.damagedPackets || item.quantity || 0), 0
        );
      }
      return sum;
    }, 0);
    
    return { 
      totalOrders, 
      pendingCount, 
      deliveredCount, 
      totalAmount, 
      ordersWithDamage, 
      totalDamagedPackets 
    };
  };

  const summaryStats = getSummaryStats();

  // Delete an order
  const deleteOrder = (id) => {
    if (!window.confirm("Delete this order?")) return;
    fetch(`${config.API_BASE}/orders/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) return setMessage(data.error);
        setOrders(prev => prev.filter(o => o._id !== id));
        setMessage("Order deleted successfully");
      })
      .catch(() => setMessage("Failed to delete order"));
  };

  // Mark order as delivered
  const markAsDelivered = (order) => {
    console.log('Marking order as delivered:', order);
    console.log('Order items:', order.items);
    console.log('First item product data:', order.items?.[0]?.productId);
    setSelectedOrderForDelivery(order);
    setShowDamageModal(true);
  };

  // Handle delivery confirmation from damage modal
  const handleDeliveryConfirmed = (result) => {
    // Update the order in the local state
    setOrders(prev => prev.map(o => o._id === selectedOrderForDelivery._id ? { ...o, status: "delivered", locked: true } : o));
    
    // Enhanced success message based on response
    let successMessage = "Order delivered successfully! ";
    if (result.billGenerated) {
      successMessage += "Bill generated automatically. ";
    }
    successMessage += `Wallet credited with ₹${result.creditedAmount}. New balance: ₹${result.walletBalance}.`;
    
    setMessage(successMessage);
    
    // Close the modal and reset state
    setShowDamageModal(false);
    setSelectedOrderForDelivery(null);
  };

  // View order details
  const viewOrderDetails = (order) => {
    const details = `
Order Details:
- Order ID: ${order._id}
- Date: ${new Date(order.orderDate).toLocaleDateString()}
- Distributor: ${order.distributorId?.name || order.distributorId?.company || 'Unknown'}
- Status: ${order.status}
- Items: ${order.items?.length || 0}
- Placed by: ${order.userId?.name || order.userId?.username || 'Unknown'}

Items:
${order.items?.map((item, idx) => `${idx + 1}. ${item.productId?.name || 'N/A'} - ${item.quantity} ${item.unit}`).join('\n') || 'No items'}
    `;
    alert(details);
  };

  // Generate bill for order
  const generateBill = (order) => {
    const billContent = `
BILL
====
Order ID: ${order._id}
Date: ${new Date(order.orderDate).toLocaleDateString()}
Distributor: ${order.distributorId?.name || order.distributorId?.company || 'Unknown'}

Items:
${order.items?.map((item, idx) => `${idx + 1}. ${item.productId?.name || 'N/A'} - ${item.quantity} ${item.unit}`).join('\n') || 'No items'}

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

  // Copy order details to clipboard
  const copyOrderDetails = async (order) => {
    const details = `Order ID: ${order._id}, Date: ${new Date(order.orderDate).toLocaleDateString()}, Distributor: ${order.distributorId?.name || order.distributorId?.company || 'Unknown'}, Status: ${order.status}, Items: ${order.items?.length || 0}`;
    
    try {
      await navigator.clipboard.writeText(details);
      setMessage("Order details copied to clipboard!");
    } catch (err) {
      setMessage("Failed to copy to clipboard");
    }
  };

  // Resend order notification (simulate)
  const resendNotification = (order) => {
    setMessage(`Notification resent for order ${order._id.slice(-6)}`);
  };

  // Bulk actions functionality
  const [selectedOrders, setSelectedOrders] = useState([]);

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order._id));
    }
  };

  const bulkMarkAsDelivered = async () => {
    if (selectedOrders.length === 0) {
      setMessage("Please select orders to mark as delivered");
      return;
    }

    if (!window.confirm(`Mark ${selectedOrders.length} orders as delivered?`)) return;

    try {
      const promises = selectedOrders.map(orderId => 
        fetch(`${config.API_BASE}/orders/${orderId}/deliver`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      await Promise.all(promises);
      setOrders(prev => prev.map(order => 
        selectedOrders.includes(order._id) 
          ? { ...order, status: "delivered", locked: true }
          : order
      ));
      setSelectedOrders([]);
      setMessage(`${selectedOrders.length} orders marked as delivered successfully!`);
    } catch (err) {
      setMessage("Failed to mark some orders as delivered");
    }
  };

  const bulkDeleteOrders = () => {
    if (selectedOrders.length === 0) {
      setMessage("Please select orders to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedOrders.length} orders? This action cannot be undone.`)) return;

    try {
      const promises = selectedOrders.map(orderId => 
        fetch(`${config.API_BASE}/orders/${orderId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      Promise.all(promises).then(() => {
        setOrders(prev => prev.filter(order => !selectedOrders.includes(order._id)));
        setSelectedOrders([]);
        setMessage(`${selectedOrders.length} orders deleted successfully!`);
      });
    } catch (err) {
      setMessage("Failed to delete some orders");
    }
  };



  if (loading) {
    const loadingContent = (
      <div className="container my-4">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
          <p className="mt-3 text-muted">Loading orders...</p>
        </div>
      </div>
    );

    // Return wrapped with StaffLayout if it's a staff route, otherwise return content directly
    if (isStaffRoute) {
      return <div className="container-fluid py-4">{loadingContent}</div>;
    }
    
    return loadingContent;
  }

  // Wrap with StaffLayout if this is a staff route
  const content = (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
              <i className="fas fa-history fa-md text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-black">
                {showAllOrders ? "All Orders History" : "My Orders History"}
              </h3>
              <p className="text-muted mb-0 small">
                {showAllOrders ? "View and manage all system orders" : "Track your order history and status"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          {message}
          <button type="button" className="btn btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-primary text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-shopping-cart me-2"></i>Total Orders</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-info">{summaryStats.totalOrders}</h3>
              <p className="mb-0 text-muted">All orders</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-success text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-clock me-2"></i>Pending</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-success">{summaryStats.pendingCount}</h3>
              <p className="mb-0 text-muted">Awaiting delivery</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-warning text-dark border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-check-circle me-2"></i>Delivered</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-warning">{summaryStats.deliveredCount}</h3>
              <p className="mb-0 text-muted">Completed orders</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-danger text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-rupee-sign me-2"></i>Total Value</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-danger">₹{summaryStats.totalAmount.toFixed(2)}</h3>
              <p className="mb-0 text-muted">Combined value</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-warning text-dark border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-exclamation-triangle me-2"></i>Orders with Damage</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-warning">{summaryStats.ordersWithDamage}</h3>
              <p className="mb-0 text-muted">Damaged products</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-danger text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-minus-circle me-2"></i>Total Damaged</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-danger">{summaryStats.totalDamagedPackets}</h3>
              <p className="mb-0 text-muted">Packets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card border shadow-sm mb-4">
        <div className="card-header bg-secondary text-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="fas fa-search me-2"></i>Search & Filter Orders</h6>
            <div className="d-flex gap-2">
              <button className={`btn btn-sm ${viewMode === 'cards' ? 'btn-light' : 'btn-outline-light'}`} onClick={() => setViewMode('cards')}>
                <i className="fas fa-th-large me-1"></i>Cards
              </button>
              <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-light' : 'btn-outline-light'}`} onClick={() => setViewMode('table')}>
                <i className="fas fa-table me-1"></i>Table
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-bold small">
                <i className="fas fa-search me-1"></i>Search
              </label>
              <input type="text" className="form-control form-control-sm" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold small">
                <i className="fas fa-truck me-1"></i>Distributor
              </label>
              <select className="form-select form-select-sm" value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)}>
                <option value="">All Distributors</option>
                {distributors.map(dist => (
                  <option key={dist._id} value={dist.name || dist.company}>
                    {dist.name || dist.company}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small">
                <i className="fas fa-calendar me-1"></i>Month
              </label>
              <select className="form-select form-select-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">All Months</option>
                {getMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small">
                <i className="fas fa-calendar-alt me-1"></i>Year
              </label>
              <select className="form-select form-select-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {getYearOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end gap-2">
              <button className="btn btn-sm btn-outline-info flex-fill" onClick={() => { setSelectedDistributor(""); setSelectedMonth(""); setSelectedYear(""); setSearchTerm(""); }}>
                <i className="fas fa-refresh me-1"></i>Clear
              </button>
              <button className="btn btn-sm btn-success flex-fill" onClick={exportToCSV}>
                <i className="fas fa-download me-1"></i>Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredOrders.length > 0 && (
        <div className="card border shadow-sm mb-4">
          <div className="card-header bg-success text-white py-2">
            <h6 className="mb-0">
              <i className="fas fa-tasks me-2"></i>
              Bulk Actions
            </h6>
          </div>
          <div className="card-body p-3">
            <div className="row align-items-center">
              <div className="col-md-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="selectAllOrders"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={selectAllOrders}
                  />
                  <label className="form-check-label" htmlFor="selectAllOrders">
                    Select All ({selectedOrders.length}/{filteredOrders.length})
                  </label>
                </div>
              </div>
              <div className="col-md-8">
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-success btn-sm" 
                    onClick={bulkMarkAsDelivered}
                    disabled={selectedOrders.length === 0}
                    title="Mark selected orders as delivered"
                  >
                    <i className="fas fa-check me-1"></i>
                    Mark Delivered ({selectedOrders.length})
                  </button>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={bulkDeleteOrders}
                    disabled={selectedOrders.length === 0}
                    title="Delete selected orders"
                  >
                    <i className="fas fa-trash me-1"></i>
                    Delete ({selectedOrders.length})
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setSelectedOrders([])}
                    disabled={selectedOrders.length === 0}
                    title="Clear selection"
                  >
                    <i className="fas fa-times me-1"></i>
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Display */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-5">
          <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
            <i className="fas fa-history fa-2x text-muted"></i>
          </div>
          <h5 className="text-muted">No Orders Found</h5>
          <p className="text-muted">
            {safeOrders.length === 0 ? "No orders are currently available" : "No orders match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <>
              {/* Pending Orders Section */}
              {Object.keys(groupedPendingOrders).length > 0 && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">
                    <i className="fas fa-clock me-2"></i>
                    Pending Orders
                  </h5>
                  {Object.keys(groupedPendingOrders).map((distName) => (
                    <div key={distName} className="mb-3">
                      <h6 className="text-muted mb-2">{distName}</h6>
                      <div className="row">
                        {groupedPendingOrders[distName].map((order) => (
                          <div key={order._id} className="col-lg-4 col-md-6 mb-3">
                            <div className="card border shadow-sm h-100">
                              <div className="card-header bg-success text-white">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center">
                                    <div className="form-check me-2">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedOrders.includes(order._id)}
                                        onChange={() => toggleOrderSelection(order._id)}
                                      />
                                    </div>
                                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px'}}>
                                      <i className="fas fa-clock fa-sm text-success"></i>
                                    </div>
                                  </div>
                                  <span className="badge bg-warning text-dark px-2 py-1">Pending</span>
                                </div>
                              </div>
                              <div className="card-body d-flex flex-column p-3">
                                <h6 className="card-title fw-bold mb-2 text-dark">
                                  Order #{order._id.slice(-6)}
                                </h6>
                                <div className="mb-3">
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-calendar me-2 text-muted"></i>
                                    <span className="fw-semibold small text-muted">Date:</span>
                                    <span className="ms-2 small">
                                      {new Date(order.orderDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-boxes me-2 text-muted"></i>
                                    <span className="fw-semibold small text-muted">Items:</span>
                                    <span className="ms-2 small">{order.items?.length || 0}</span>
                                  </div>
                                                                  {order.userId && (
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-user me-2 text-muted"></i>
                                    <span className="fw-semibold small text-muted">Placed by:</span>
                                    <span className="ms-2 small">
                                      {order.userId.name || order.userId.username || "Unknown"}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Delivered By Information - Only show for delivered orders */}
                                {order.status === 'delivered' && order.updatedBy && (
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-user-check me-2 text-success"></i>
                                    <span className="fw-semibold small text-success">Delivered by:</span>
                                    <span className="ms-2 small text-success">
                                      {order.updatedBy.role === 'admin' ? 'Admin' : 'Staff'}: {order.updatedBy.name}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Damaged Products Information */}
                                {order.damagedProducts && order.damagedProducts.length > 0 && (
                                  <>
                                    <div className="d-flex align-items-center mb-2">
                                      <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
                                      <span className="fw-semibold small text-danger">Total Damaged:</span>
                                      <span className="ms-2 small text-danger fw-bold">
                                        {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                                      </span>
                                    </div>
                                    <div className="mb-2">
                                      <span className="fw-semibold small text-danger">Damaged Products:</span>
                                      <div className="ms-3 mt-1">
                                        {order.damagedProducts.map((item, idx) => (
                                          <div key={idx} className="small text-danger">
                                            • {item.productName} - {item.damagedPackets || item.quantity || 0} packets
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                                </div>
                                
                                <div className="mt-auto">
                                  {/* First Line - Edit and Deliver */}
                                  <div className="d-flex gap-1 mb-2">
                                    <button className="btn btn-outline-primary btn-sm action-btn flex-fill" onClick={() => setEditingOrder(order)} title="Edit order">
                                      <i className="fas fa-edit me-1"></i>
                                      Edit Order
                                    </button>
                                    <button className="btn btn-outline-success btn-sm action-btn flex-fill" onClick={() => markAsDelivered(order)} title="Mark as delivered">
                                      <i className="fas fa-check me-1"></i>
                                      Deliver Order
                                    </button>
                                  </div>
                                  
                                  {/* Second Line - View, Print, Delete */}
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-outline-info btn-sm action-btn" onClick={() => viewOrderDetails(order)} title="View details">
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    <button className="btn btn-outline-warning btn-sm action-btn" onClick={() => generateBill(order)} title="Print/Generate bill">
                                      <i className="fas fa-print"></i>
                                    </button>
                                    <button className="btn btn-outline-danger btn-sm action-btn" onClick={() => deleteOrder(order._id)} title="Delete order">
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivered Orders Section */}
              {filteredDeliveredOrders.length > 0 && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">
                    <i className="fas fa-check-circle me-2"></i>
                    Delivered Orders
                  </h5>
                  <div className="row">
                    {filteredDeliveredOrders.map((order) => (
                                              <div key={order._id} className="col-lg-4 col-md-6 mb-3">
                          <div className="card border-0 shadow-lg h-100" style={{ border: "2px solid #FFE066" }}>
                            <div className="card-header text-white bg-primary" >
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                  <div className="form-check me-2">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={selectedOrders.includes(order._id)}
                                      onChange={() => toggleOrderSelection(order._id)}
                                    />
                                  </div>
                                  <div className="order-status-icon-delivered">
                                    <i className="fas fa-check fa-sm" style={{ color: "#000000" }}></i>
                                  </div>
                                </div>
                                <span className="badge  px-2 py-1 text-white">Delivered</span>
                              </div>
                            </div>
                            <div className="card-body d-flex flex-column p-3">
                              <h6 className="card-title fw-bold mb-2" style={{ color: "#000000" }}>
                                Order #{order._id.slice(-6)}
                              </h6>
                              <div className="mb-3">
                                <div className="d-flex align-items-center mb-2">
                                  <i className="fas fa-calendar me-2 order-info-icon" style={{ color: "#000000" }}></i>
                                  <span className="fw-semibold small" style={{ color: "#000000" }}>Date:</span>
                                  <span className="ms-2 small" style={{ color: "#000000" }}>
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="fas fa-boxes me-2 order-info-icon" style={{ color: "#000000" }}></i>
                                  <span className="fw-semibold small" style={{ color: "#000000" }}>Items:</span>
                                  <span className="ms-2 small" style={{ color: "#000000" }}>{order.items?.length || 0}</span>
                                </div>
                                {order.userId && (
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-user me-2 order-info-icon" style={{ color: "#000000" }}></i>
                                    <span className="fw-semibold small" style={{ color: "#000000" }}>Placed by:</span>
                                    <span className="ms-2 small" style={{ color: "#000000" }}>
                                      {order.userId.name || order.userId.username || "Unknown"}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Delivered By Information for Delivered Orders */}
                                {order.updatedBy && (
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-user-check me-2 text-success"></i>
                                    <span className="fw-semibold small text-success">Delivered by:</span>
                                    <span className="ms-2 small text-success">
                                      {order.updatedBy.role === 'admin' ? 'Admin' : 'Staff'}: {order.updatedBy.name}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Damaged Products Information for Delivered Orders */}
                                {order.damagedProducts && order.damagedProducts.length > 0 && (
                                  <>
                                    <div className="d-flex align-items-center mb-2">
                                      <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
                                      <span className="fw-semibold small text-danger">Total Damaged:</span>
                                      <span className="ms-2 small text-danger fw-bold">
                                        {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                                      </span>
                                    </div>
                                    <div className="mb-2">
                                      <span className="fw-semibold small text-danger">Damaged Products:</span>
                                      <div className="ms-3 mt-1">
                                        {order.damagedProducts.map((item, idx) => (
                                          <div key={idx} className="small text-danger">
                                            • {item.productName} - {item.damagedPackets || item.quantity || 0} packets
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div className="mt-auto">
                                <div className="d-flex gap-1 mb-2">
                                  {/* View Button - Eye Icon */}
                                  <button className="btn btn-outline-info btn-sm action-btn" onClick={() => viewOrderDetails(order)} title="View order details">
                                    <i className="fas fa-eye" style={{ color: "#000000" }}></i>
                                  </button>
                                  

                                  
                                  {/* Copy Button - Overlapping Documents Icon */}
                                  <button className="btn btn-outline-primary btn-sm action-btn" onClick={() => copyOrderDetails(order)} title="Copy order details">
                                    <i className="fas fa-copy" style={{ color: "#000000" }}></i>
                                  </button>
                                  
                                  {/* Print Button - Printer Icon */}
                                  <button className="btn btn-outline-warning btn-sm action-btn" onClick={() => generateBill(order)} title="Print/Generate bill">
                                    <i className="fas fa-print" style={{ color: "#000000" }}></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="card border-0 shadow-lg">
              <div className="card-header text-white py-2" style={{ background: "linear-gradient(135deg, #AEE9F7 0%, #8DD3C0 100%)" }}>
                <h6 className="mb-0" style={{ color: "#000000" }}><i className="fas fa-table me-2" style={{ color: "#000000" }}></i>Orders Table View</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ color: "#000000" }}>Order ID</th>
                        <th style={{ color: "#000000" }}>Date</th>
                        <th style={{ color: "#000000" }}>Distributor</th>
                        <th style={{ color: "#000000" }}>Status</th>
                        <th style={{ color: "#000000" }}>Items</th>
                        <th style={{ color: "#000000" }}>Placed By</th>
                        <th style={{ color: "#000000" }}>Delivered By</th>
                        <th style={{ color: "#000000" }}>Damaged Products</th>
                        <th style={{ color: "#000000" }}>Total Damaged</th>
                        <th style={{ color: "#000000" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order._id}>
                          <td>
                            <span className="badge bg-secondary text-white">
                              #{order._id.slice(-6)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-calendar me-2" style={{ color: "#000000" }}></i>
                              {new Date(order.orderDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-truck me-2" style={{ color: "#000000" }}></i>
                              {order.distributorId?.name || order.distributorId?.company || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${order.status === 'pending' ? 'bg-warning' : 'bg-success'}`} style={{ color: "#000000" }}>
                              <i className={`fas ${order.status === 'pending' ? 'fa-clock' : 'fa-check'} me-1`} style={{ color: "#000000" }}></i>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info" style={{ color: "#000000" }}>
                              {order.items?.length || 0}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-user me-2" style={{ color: "#000000" }}></i>
                              {order.userId?.name || order.userId?.username || "Unknown"}
                            </div>
                          </td>
                          <td>
                            {order.status === 'delivered' && order.updatedBy ? (
                              <div className="d-flex align-items-center">
                                <i className="fas fa-user-check me-2 text-success"></i>
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
                                    <i className="fas fa-exclamation-triangle me-1 text-danger"></i>
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
                              <div className="d-flex gap-1">
                                {/* View Button - Eye Icon */}
                                <button className="btn btn-outline-info btn-sm action-btn" onClick={() => viewOrderDetails(order)} title="View order details" style={{ color: "#000000" }}>
                                  <i className="fas fa-eye" style={{ color: "#000000" }}></i>
                                </button>
                                

                                
                                {/* Copy Button - Overlapping Documents Icon */}
                                <button className="btn btn-outline-primary btn-sm action-btn" onClick={() => copyOrderDetails(order)} title="Copy order details" style={{ color: "#000000" }}>
                                  <i className="fas fa-copy" style={{ color: "#000000" }}></i>
                                </button>
                                
                                {/* Print Button - Printer Icon */}
                                <button className="btn btn-outline-warning btn-sm action-btn" onClick={() => generateBill(order)} title="Print/Generate bill" style={{ color: "#000000" }}>
                                  <i className="fas fa-print" style={{ color: "#000000" }}></i>
                                </button>
                                
                                {/* Status-specific Action Buttons */}
                                {order.status === 'pending' && (
                                  <>
                                    <button className="btn btn-outline-success btn-sm action-btn" onClick={() => markAsDelivered(order)} title="Mark as delivered" style={{ color: "#000000" }}>
                                      <i className="fas fa-check" style={{ color: "#000000" }}></i>
                                    </button>
                                    <button className="btn btn-outline-danger btn-sm action-btn" onClick={() => deleteOrder(order._id)} title="Delete order" style={{ color: "#000000" }}>
                                      <i className="fas fa-trash" style={{ color: "#000000" }}></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Damage Products Modal */}
      {showDamageModal && selectedOrderForDelivery && (
        <DamageProductsModal
          show={showDamageModal}
          onClose={() => {
            setShowDamageModal(false);
            setSelectedOrderForDelivery(null);
          }}
          order={selectedOrderForDelivery}
          onConfirmDelivery={handleDeliveryConfirmed}
        />
      )}

      {/* Order Edit Modal */}
      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          token={token}
          onClose={() => setEditingOrder(null)}
          onSave={(updatedOrder) => {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            setEditingOrder(null);
            setMessage("Order updated successfully!");
          }}
        />
      )}
    </div>
  );

  // Return wrapped with StaffLayout if it's a staff route, otherwise return content directly
  if (isStaffRoute) {
    return <div className="container my-4">{content}</div>;
  }
  
  return content;
};

export default OrdersHistory;
