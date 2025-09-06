// src/components/orders/OrdersHistory.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import apiService from "../../utils/apiService";
import { useAuth } from "../../hooks/useAuth";
import OrderEditModal from "./OrderEditModal";
import DamageProductsModal from "./DamageProductsModal";
import ShowOrderModal from "./ShowOrderModal";
import DeleteModal from "../DeleteModal";

const OrdersHistory = ({ showAllOrders = false }) => {
  const location = useLocation();
  const { user } = useAuth(); // Add this line to get auth context
  
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
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState(null);

  // Get current month and year for default selection
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Fetch distributors for search functionality

  // Fetch distributors for search functionality
  const fetchDistributors = useCallback(async () => {
    try {
      const data = await apiService.get('/distributor');
      setDistributors(data);
    } catch (err) {
      console.error("Error fetching distributors:", err);
    }
  }, []);

  // Fetch orders - all orders for admin, user's orders for staff
  useEffect(() => {
    const endpoint = showAllOrders ? "/orders/all" : "/orders";
    setLoading(true);
    
    apiService.get(endpoint)
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
  }, [showAllOrders, currentMonth]);

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
        order.distributorId?.distributorName === selectedDistributor ||
        order.distributorId?.companyName === selectedDistributor
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
        (order.distributorId?.distributorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.distributorId?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    const distName = order.distributorId?.companyName || order.distributorId?.distributorName || "Unknown Distributor";
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
        order.distributorId?.distributorName || order.distributorId?.companyName || "Unknown",
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
  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await apiService.delete(`/orders/${id}`);
      setOrders(prev => prev.filter(o => o._id !== id));
      setMessage("Order deleted successfully");
    } catch (error) {
      setMessage(error.message || "Failed to delete order");
    }
  };

  // Mark order as delivered
  const markAsDelivered = (order) => {
    setSelectedOrderForDelivery(order);
    setShowDamageModal(true);
  };

  // Show order details
  const showOrderDetails = (order) => {
    setSelectedOrderForView(order);
    setShowOrderModal(true);
  };

  // Show delete order modal
  const showDeleteOrderModal = (order) => {
    setSelectedOrderForDelete(order);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedOrderForDelete) return;
    
    try {
      await apiService.delete(`/orders/${selectedOrderForDelete._id}`);
      setOrders(prev => prev.filter(o => o._id !== selectedOrderForDelete._id));
      setMessage("Order deleted successfully");
      setShowDeleteModal(false);
      setSelectedOrderForDelete(null);
    } catch (error) {
      setMessage(error.message || "Failed to delete order");
    }
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
- Distributor: ${order.distributorId?.distributorName || order.distributorId?.companyName || 'Unknown'}
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
Distributor: ${order.distributorId?.distributorName || order.distributorId?.companyName || 'Unknown'}

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
    const details = `Order ID: ${order._id}, Date: ${new Date(order.orderDate).toLocaleDateString()}, Distributor: ${order.distributorId?.distributorName || order.distributorId?.companyName || 'Unknown'}, Status: ${order.status}, Items: ${order.items?.length || 0}`;
    
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
        apiService.post(`/orders/${orderId}/deliver`)
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

  const bulkDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      setMessage("Please select orders to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedOrders.length} orders? This action cannot be undone.`)) return;

    try {
      const promises = selectedOrders.map(orderId => 
        apiService.delete(`/orders/${orderId}`)
      );

      await Promise.all(promises);
      setOrders(prev => prev.filter(order => !selectedOrders.includes(order._id)));
      setSelectedOrders([]);
      setMessage(`${selectedOrders.length} orders deleted successfully!`);
    } catch (err) {
      setMessage("Failed to delete some orders");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
          <p className="text-muted mt-3">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{width: '60px', height: '60px'}}
            >
              <i className="fas fa-history fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                {showAllOrders ? "All Orders History" : "My Orders History"}
              </h3>
              <p className="mb-0 text-muted">
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

      {/* Summary Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-primary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-shopping-cart text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Orders</h6>
                  <h4 className="mb-0 fw-bold text-primary">{summaryStats.totalOrders}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-warning">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-clock text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Pending</h6>
                  <h4 className="mb-0 fw-bold text-warning">{summaryStats.pendingCount}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-success">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-check-circle text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Delivered</h6>
                  <h4 className="mb-0 fw-bold text-success">{summaryStats.deliveredCount}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-info">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-rupee-sign text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Value</h6>
                  <h4 className="mb-0 fw-bold text-info">₹{summaryStats.totalAmount.toFixed(2)}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-warning">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-exclamation-triangle text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Orders with Damage</h6>
                  <h4 className="mb-0 fw-bold text-warning">{summaryStats.ordersWithDamage}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-danger">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-minus-circle text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Damaged</h6>
                  <h4 className="mb-0 fw-bold text-danger">{summaryStats.totalDamagedPackets}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="position-relative">
                    <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search orders, distributors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '250px' }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={selectedDistributor}
                    onChange={(e) => setSelectedDistributor(e.target.value)}
                    style={{ width: '180px' }}
                  >
                    <option value="">All Distributors</option>
                    {distributors.map(dist => (
                      <option key={dist._id} value={dist.companyName || dist.distributorName}>
                        {dist.companyName || dist.distributorName}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="">All Months</option>
                    {getMonthOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{ width: '120px' }}
                  >
                    {getYearOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button className="btn btn-outline-primary" onClick={exportToCSV}>
                    <i className="fas fa-download me-2"></i>
                    Export
                  </button>
                </div>
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('cards')}
                  >
                    <i className="fas fa-th-large me-2"></i>
                    Cards
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <i className="fas fa-table me-2"></i>
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredOrders.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
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
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={bulkMarkAsDelivered}
                      disabled={selectedOrders.length === 0}
                    >
                      <i className="fas fa-check me-1"></i>
                      Mark Delivered ({selectedOrders.length})
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={bulkDeleteOrders}
                      disabled={selectedOrders.length === 0}
                    >
                      <i className="fas fa-trash me-1"></i>
                      Delete ({selectedOrders.length})
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setSelectedOrders([])}
                      disabled={selectedOrders.length === 0}
                    >
                      <i className="fas fa-times me-1"></i>
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Display */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-history fa-3x text-muted mb-3"></i>
          <h6 className="text-muted">No Orders Found</h6>
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
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="fas fa-clock me-2 text-muted"></i>
                    Pending Orders
                  </h5>
                  {Object.keys(groupedPendingOrders).map((distName) => (
                    <div key={distName} className="mb-4">
                      <div className="row mb-3">
                        <div className="col-12">
                          <h5 className="fw-bold text-dark">
                            <i className="fas fa-building me-2 text-muted"></i>
                            {distName}
                          </h5>
                        </div>
                      </div>
                      <div className="row g-4">
                        {groupedPendingOrders[distName].map((order) => (
                          <div key={order._id} className="col-lg-4 col-md-6 col-sm-6">
                            <div className="card border shadow-sm h-100">
                              <div className="card-header bg-success text-dark">
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
                                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                                      style={{ width: '40px', height: '40px' }}>
                                      <i className="fas fa-clock fa-sm text-success"></i>
                                    </div>
                                  </div>
                                  <span className="badge bg-light text-dark px-2 py-1">Pending</span>
                                </div>
                              </div>
                              <div className="card-body">
                                <h6 className="card-title fw-bold text-center mb-3">Order #{order._id.slice(-6)}</h6>
                                
                                <div className="row g-2 mb-3">
                                  <div className="col-12">
                                    <div className="d-flex align-items-center p-2 bg-light rounded">
                                      <i className="fas fa-calendar text-primary me-3" style={{ width: '20px' }}></i>
                                      <div>
                                        <small className="text-muted d-block">Date</small>
                                        <span className="fw-semibold">{new Date(order.orderDate).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="col-12">
                                    <div className="d-flex align-items-center p-2 bg-light rounded">
                                      <i className="fas fa-boxes text-primary me-3" style={{ width: '20px' }}></i>
                                      <div>
                                        <small className="text-muted d-block">Items</small>
                                        <span className="fw-semibold">{order.items?.length || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {order.userId && (
                                    <div className="col-12">
                                      <div className="d-flex align-items-center p-2 bg-light rounded">
                                        <i className="fas fa-user text-primary me-3" style={{ width: '20px' }}></i>
                                        <div>
                                          <small className="text-muted d-block">Placed by</small>
                                          <span className="fw-semibold">
                                            {order.userId.name || order.userId.username || "Unknown"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="d-flex gap-2 flex-wrap">
                                  <button className="btn btn-outline-info btn-sm flex-fill" onClick={() => showOrderDetails(order)}>
                                    <i className="fas fa-eye me-1"></i>
                                    View
                                  </button>
                                  <button className="btn btn-outline-primary btn-sm flex-fill" onClick={() => setEditingOrder(order)}>
                                    <i className="fas fa-edit me-1"></i>
                                    Edit
                                  </button>
                                  <button className="btn btn-outline-success btn-sm flex-fill" onClick={() => markAsDelivered(order)}>
                                    <i className="fas fa-check me-1"></i>
                                    Deliver
                                  </button>
                                  <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => showDeleteOrderModal(order)}>
                                    <i className="fas fa-trash me-1"></i>
                                    Delete
                                  </button>
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
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="fas fa-check-circle me-2 text-muted"></i>
                    Delivered Orders
                  </h5>
                  <div className="row g-4">
                    {filteredDeliveredOrders.map((order) => (
                      <div key={order._id} className="col-lg-4 col-md-6 col-sm-6">
                        <div className="card border shadow-sm h-100">
                          <div className="card-header bg-primary text-white">
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
                                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: '40px', height: '40px' }}>
                                  <i className="fas fa-check fa-sm text-primary"></i>
                                </div>
                              </div>
                              <span className="badge bg-light text-dark px-2 py-1">Delivered</span>
                            </div>
                          </div>
                          <div className="card-body">
                            <h6 className="card-title fw-bold text-center mb-3">Order #{order._id.slice(-6)}</h6>
                            
                            <div className="row g-2 mb-3">
                              <div className="col-12">
                                <div className="d-flex align-items-center p-2 bg-light rounded">
                                  <i className="fas fa-calendar text-success me-3" style={{ width: '20px' }}></i>
                                  <div>
                                    <small className="text-muted d-block">Date</small>
                                    <span className="fw-semibold">{new Date(order.orderDate).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="col-12">
                                <div className="d-flex align-items-center p-2 bg-light rounded">
                                  <i className="fas fa-boxes text-success me-3" style={{ width: '20px' }}></i>
                                  <div>
                                    <small className="text-muted d-block">Items</small>
                                    <span className="fw-semibold">{order.items?.length || 0}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {order.userId && (
                                <div className="col-12">
                                  <div className="d-flex align-items-center p-2 bg-light rounded">
                                    <i className="fas fa-user text-success me-3" style={{ width: '20px' }}></i>
                                    <div>
                                      <small className="text-muted d-block">Placed by</small>
                                      <span className="fw-semibold">
                                        {order.userId.name || order.userId.username || "Unknown"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                                                         <div className="d-flex gap-2">
                               <button className="btn btn-outline-info btn-sm" onClick={() => showOrderDetails(order)}>
                                 <i className="fas fa-eye"></i>
                               </button>
                               <button className="btn btn-outline-warning btn-sm" onClick={() => generateBill(order)}>
                                 <i className="fas fa-print"></i>
                               </button>
                               <button className="btn btn-outline-primary btn-sm" onClick={() => copyOrderDetails(order)}>
                                 <i className="fas fa-copy"></i>
                               </button>
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
            <div className="card border shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Distributor</th>
                        <th>Status</th>
                        <th>Items</th>
                        <th>Placed By</th>
                        <th>Actions</th>
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
                              <i className="fas fa-calendar me-2 text-muted"></i>
                              {new Date(order.orderDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-truck me-2 text-muted"></i>
                              {order.distributorId?.distributorName || order.distributorId?.companyName || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${order.status === 'pending' ? 'bg-warning' : 'bg-success'}`}>
                              <i className={`fas ${order.status === 'pending' ? 'fa-clock' : 'fa-check'} me-1`}></i>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info text-white">
                              {order.items?.length || 0}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-user me-2 text-muted"></i>
                              {order.userId?.name || order.userId?.username || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-outline-info btn-sm" onClick={() => showOrderDetails(order)}>
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="btn btn-outline-warning btn-sm" onClick={() => generateBill(order)}>
                                <i className="fas fa-print"></i>
                              </button>
                              {order.status === 'pending' && (
                                <>
                                  <button className="btn btn-outline-primary btn-sm" onClick={() => setEditingOrder(order)}>
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button className="btn btn-outline-success btn-sm" onClick={() => markAsDelivered(order)}>
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button className="btn btn-outline-danger btn-sm" onClick={() => showDeleteOrderModal(order)}>
                                    <i className="fas fa-trash"></i>
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
          onClose={() => setEditingOrder(null)}
          onSave={(updatedOrder) => {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            setEditingOrder(null);
            setMessage("Order updated successfully!");
          }}
        />
      )}

      {/* Show Order Modal */}
      {showOrderModal && selectedOrderForView && (
        <ShowOrderModal
          show={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrderForView(null);
          }}
          order={selectedOrderForView}
        />
      )}

      {/* Delete Order Modal */}
      {showDeleteModal && selectedOrderForDelete && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedOrderForDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Order"
          message="Are you sure you want to delete this order?"
          itemName={`Order #${selectedOrderForDelete._id.slice(-6)}`}
          itemDetails={`Order for ${selectedOrderForDelete.distributorId?.companyName || selectedOrderForDelete.distributorId?.distributorName || 'Unknown Company'} - ${selectedOrderForDelete.items?.length || 0} items`}
          confirmText="Delete Order"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default OrdersHistory;
