import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";
import "../../css/BillsGenerateManagement.css";

const BillsGenerateManagement = () => {
  const { token } = useAuth();
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);

  // Ensure data is always valid
  const safeBills = Array.isArray(bills) ? bills.filter(bill => {
    if (!bill || typeof bill !== 'object') return false;
    if (!bill._id || typeof bill._id !== 'string') return false;
    return true;
  }) : [];
  
  const safeOrders = Array.isArray(orders) ? orders.filter(order => {
    if (!order || typeof order !== 'object') return false;
    if (!order._id || typeof order._id !== 'string') return false;
    return true;
  }) : [];
  
  const safeDistributors = Array.isArray(distributors) ? distributors.filter(dist => {
    if (!dist || typeof dist !== 'object') return false;
    if (!dist._id || typeof dist._id !== 'string') return false;
    return true;
  }) : [];

  // Safe render wrapper to catch any rendering errors
  const SafeRender = ({ children, fallback = null }) => {
    try {
      if (React.isValidElement(children)) {
        return children;
      }
      console.error('Invalid React element:', children);
      return fallback;
    } catch (error) {
      console.error('Rendering error caught:', error);
      return fallback;
    }
  };

  // Safe data renderer that validates data before rendering
  const SafeDataRender = ({ data, renderItem, fallback = null }) => {
    if (!Array.isArray(data) || data.length === 0) {
      return fallback || <div>No data available</div>;
    }
    
    return data.map((item, index) => {
      try {
        if (!item || typeof item !== 'object' || !item._id) {
          console.warn('Invalid item at index:', index, item);
          return null;
        }
        return renderItem(item, index);
      } catch (error) {
        console.error('Error rendering item at index:', index, error, item);
        return null;
      }
    }).filter(Boolean);
  };
  const [message, setMessage] = useState("");
  const [loadingBills, setLoadingBills] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [generatingOrderId, setGeneratingOrderId] = useState(null);

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [selectedBillType, setSelectedBillType] = useState("saved");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  // Fetch distributors list
  const fetchDistributors = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/distributor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch distributors");
      const data = await res.json();
      setDistributors(data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch distributors.");
    }
  }, [token]);

  // Fetch bills list
  const fetchBills = useCallback(async () => {
    setLoadingBills(true);
    try {
      const res = await fetch(`${config.API_BASE}/orders/bills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch bills");
      const billsData = await res.json();
      setBills(billsData);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch bills.");
    } finally {
      setLoadingBills(false);
    }
  }, [token]);

  // Fetch orders list
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${config.API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const ordersData = await res.json();
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch orders.");
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);

  // Load data on mount
  useEffect(() => {
    fetchDistributors();
    fetchBills();
    fetchOrders();
  }, [fetchDistributors, fetchBills, fetchOrders]);

  // Debug: Log data structure when it changes
  useEffect(() => {
    if (bills.length > 0) {
      console.log('Bills data structure:', bills[0]);
    }
    if (orders.length > 0) {
      console.log('Orders data structure:', orders[0]);
    }
  }, [bills, orders]);



  // Generate or update bill
  const generateBill = async (orderId) => {
    if (!window.confirm("Generate/Update bill for this order?")) return;
    setGeneratingOrderId(orderId);
    try {
      const res = await fetch(`${config.API_BASE}/bills/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate/update bill.");
      }

      await res.json();
      alert("✅ Bill generated/updated successfully!");
      fetchBills(); // refresh bills after update
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setGeneratingOrderId(null);
    }
  };

  // Filter bills based on search criteria
  const getFilteredBills = () => {
    let filtered = safeBills;

    if (selectedDistributor) {
      filtered = filtered.filter(bill => 
        bill.distributorId?.distributorName === selectedDistributor ||
        bill.distributorId?.name === selectedDistributor
      );
    }

    if (selectedMonth) {
      filtered = filtered.filter(bill => {
        try {
          const billMonth = new Date(bill.billDate).getMonth() + 1;
          return billMonth === parseInt(selectedMonth);
        } catch (error) {
          return false;
        }
      });
    }

    if (selectedYear) {
      filtered = filtered.filter(bill => {
        try {
          const billYear = new Date(bill.billDate).getFullYear();
          return billYear === parseInt(selectedYear);
        } catch (error) {
          return false;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bill => {
        try {
          const distributorName = bill.distributorId?.distributorName || bill.distributorId?.name || '';
          const billDate = bill.billDate ? new Date(bill.billDate).toLocaleDateString() : '';
          const orderId = bill.orderId || '';
          
          return distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 billDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 orderId.toLowerCase().includes(searchTerm.toLowerCase());
        } catch (error) {
          return false;
        }
      });
    }

    return filtered;
  };

  // Filter orders based on search criteria
  const getFilteredOrders = () => {
    let filtered = safeOrders;

    if (selectedDistributor) {
      filtered = filtered.filter(order => 
        order.distributorId?.distributorName === selectedDistributor ||
        order.distributorId?.name === selectedDistributor
      );
    }

    if (selectedMonth) {
      filtered = filtered.filter(order => {
        try {
          const orderMonth = new Date(order.orderDate).getMonth() + 1;
          return orderMonth === parseInt(selectedMonth);
        } catch (error) {
          return false;
        }
      });
    }

    if (selectedYear) {
      filtered = filtered.filter(order => {
        try {
          const orderYear = new Date(order.orderDate).getFullYear();
          return orderYear === parseInt(selectedYear);
        } catch (error) {
          return false;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => {
        try {
          const distributorName = order.distributorId?.distributorName || order.distributorId?.name || '';
          const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '';
          const orderId = order._id || '';
          
          return distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 orderDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 orderId.toLowerCase().includes(searchTerm.toLowerCase());
        } catch (error) {
          return false;
        }
      });
    }

    return filtered;
  };

  // Get unlocked orders (for bill generation)
  const getUnlockedOrders = () => {
    const filteredOrders = getFilteredOrders();
    if (!Array.isArray(filteredOrders)) return [];
    
    return filteredOrders.filter(order => {
      // Ensure order is a valid object with required properties
      if (!order || typeof order !== 'object' || !order._id) return false;
      return !order.locked && order.status !== "delivered";
    });
  };

  // Get locked orders
  const getLockedOrders = () => {
    const filteredOrders = getFilteredOrders();
    if (!Array.isArray(filteredOrders)) return [];
    
    return filteredOrders.filter(order => {
      // Ensure order is a valid object with required properties
      if (!order || typeof order !== 'object' || !order._id) return false;
      return order.locked || order.status === "delivered";
    });
  };

  // Get saved bills
  const getSavedBills = () => {
    const filteredBills = getFilteredBills();
    if (!Array.isArray(filteredBills)) return [];
    
    return filteredBills.filter(bill => {
      // Ensure bill is a valid object with required properties
      if (!bill || typeof bill !== 'object' || !bill._id) return false;
      return true;
    });
  };

  // Export bills to CSV
  const exportToCSV = () => {
    const filteredBills = getFilteredBills();
    if (filteredBills.length === 0) {
      setMessage("No bills to export");
      return;
    }

    const csvContent = [
      ["Distributor", "Bill Date", "Items", "Total Amount", "Order ID"],
      ...filteredBills.map(bill => [
        bill.distributorId?.distributorName || bill.distributorId?.name || "Unknown",
        new Date(bill.billDate).toLocaleDateString(),
        bill.items?.length || 0,
        `₹${bill.totalBillAmount?.toFixed(2) || 0}`,
        bill.orderId || "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bills_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Bills exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredBills = getFilteredBills() || [];
    const filteredOrders = getFilteredOrders() || [];
    const totalBills = filteredBills.length;
    const totalOrders = filteredOrders.length;
    const unlockedOrders = getUnlockedOrders() ? getUnlockedOrders().length : 0;
    const lockedOrders = getLockedOrders() ? getLockedOrders().length : 0;
    const totalAmount = filteredBills.reduce((sum, bill) => sum + (bill.totalBillAmount || 0), 0);
    
    return { totalBills, totalOrders, unlockedOrders, lockedOrders, totalAmount };
  };

  const summaryStats = getSummaryStats();

  // Generate month options
  const monthOptions = [
    { value: "", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  // Generate year options (current year + 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "", label: "All Years" },
    { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
    { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
    { value: currentYear.toString(), label: currentYear.toString() }
  ];

  const billTypes = ["saved", "locked"];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__bills-generate-management">
        <div className="container my-4">
          {/* Page Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex align-items-center">
                <div 
                  className="admin-dashboard__header-icon-container text-white rounded-3 d-flex align-items-center justify-content-center me-3 px-3 py-2"
                  style={{
                    background: "linear-gradient(135deg, #B5EAD7 0%, #8DD3C0 100%)"
                  }}
                >
                  <i className="fas fa-file-invoice fa-lg"></i>
                </div>
                <div>
                  <h3 className="mb-0 fw-bold admin-dashboard__header-title" style={{ color: "#B5EAD7" }}>Bills Management</h3>
                  <p className="text-muted mb-0 small">Generate and manage bills for orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Dashboard */}
          <div className="row mb-4">
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="admin-dashboard__summary-card admin-dashboard__summary-card--total-bills">
                <div className="admin-dashboard__summary-icon">
                  <i className="fas fa-file-invoice"></i>
                </div>
                <div className="admin-dashboard__summary-content">
                  <h4 className="admin-dashboard__summary-number">{summaryStats.totalBills}</h4>
                  <p className="admin-dashboard__summary-label">Total Bills</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="admin-dashboard__summary-card admin-dashboard__summary-card--total-orders">
                <div className="admin-dashboard__summary-icon">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <div className="admin-dashboard__summary-content">
                  <h4 className="admin-dashboard__summary-number">{summaryStats.totalOrders}</h4>
                  <p className="admin-dashboard__summary-label">Total Orders</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="admin-dashboard__summary-card admin-dashboard__summary-card--unlocked-orders">
                <div className="admin-dashboard__summary-icon">
                  <i className="fas fa-unlock"></i>
                </div>
                <div className="admin-dashboard__summary-content">
                  <h4 className="admin-dashboard__summary-number">{summaryStats.unlockedOrders}</h4>
                  <p className="admin-dashboard__summary-label">Unlocked Orders</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="admin-dashboard__summary-card admin-dashboard__summary-card--total-amount">
                <div className="admin-dashboard__summary-icon">
                  <i className="fas fa-rupee-sign"></i>
                </div>
                <div className="admin-dashboard__summary-content">
                  <h4 className="admin-dashboard__summary-number">₹{summaryStats.totalAmount.toFixed(2)}</h4>
                  <p className="admin-dashboard__summary-label">Total Amount</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="admin-dashboard__search-filter-section">
                <div className="row g-3">
                  <div className="col-lg-3 col-md-6">
                    <div className="admin-dashboard__search-box">
                      <i className="fas fa-search admin-dashboard__search-icon"></i>
                      <input
                        type="text"
                        className="form-control admin-dashboard__search-input"
                        placeholder="Search bills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-6">
                    <select
                      className="form-select admin-dashboard__filter-select"
                      value={selectedDistributor}
                      onChange={(e) => setSelectedDistributor(e.target.value)}
                    >
                      <option value="">All Distributors</option>
                      {safeDistributors.map(dist => (
                        <option key={dist._id} value={dist.distributorName || dist.name}>
                          {dist.distributorName || dist.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-lg-2 col-md-6">
                    <select
                      className="form-select admin-dashboard__filter-select"
                      value={selectedBillType}
                      onChange={(e) => setSelectedBillType(e.target.value)}
                    >
                      {billTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)} Bills
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-lg-2 col-md-6">
                    <select
                      className="form-select admin-dashboard__filter-select"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {monthOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-lg-2 col-md-6">
                    <select
                      className="form-select admin-dashboard__filter-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {yearOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-lg-1 col-md-6">
                    <button className="btn admin-dashboard__btn-export w-100" onClick={exportToCSV}>
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="admin-dashboard__view-mode-toggle">
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

          {/* Feedback Message */}
          {message && (
            <div className="alert alert-info alert-dismissible fade show">
              <i className="fas fa-info-circle me-2"></i>
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
            </div>
          )}

          {/* Unlocked Orders - Generate Bills */}
          <div className="row mb-4">
            <div className="col-12">
              <h5 className="admin-dashboard__section-title">
                <i className="fas fa-unlock me-2"></i>
                Unlocked Orders - Generate Bills ({getUnlockedOrders().length})
              </h5>
            </div>
          </div>

          {loadingOrders ? (
            <div className="admin-dashboard__loading-spinner">
              <i className="fas fa-spinner fa-spin fa-lg"></i>
              <p>Loading orders...</p>
            </div>
          ) : getUnlockedOrders().length === 0 ? (
            <div className="admin-dashboard__empty-state">
              <i className="fas fa-info-circle fa-3x"></i>
              <h6>No unlocked orders found</h6>
              <p>No unlocked orders found to generate bills.</p>
            </div>
          ) : (
            <div className="row">
              <SafeDataRender
                data={getUnlockedOrders()}
                fallback={<div className="col-12 text-center text-muted"><p>No unlocked orders found</p></div>}
                renderItem={(order) => (
                  <div key={order._id} className="col-lg-4 col-md-6 mb-3">
                    <div className="admin-dashboard__order-card">
                      <div className="admin-dashboard__card-header">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="admin-dashboard__order-icon">
                            <i className="fas fa-unlock"></i>
                          </div>
                          <span className="admin-dashboard__status-badge admin-dashboard__status-badge--unlocked">Unlocked</span>
                        </div>
                      </div>
                      <div className="admin-dashboard__card-body">
                        <h6 className="admin-dashboard__order-id">Order ID: {order._id ? order._id.slice(-8) : 'N/A'}</h6>
                        <div className="admin-dashboard__order-info">
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-truck"></i>
                            <span>Distributor:</span>
                            <span className="admin-dashboard__value">{order.distributorId?.distributorName || order.distributorId?.name || 'Unknown'}</span>
                          </div>
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-calendar"></i>
                            <span>Date:</span>
                            <span className="admin-dashboard__value">{new Date(order.orderDate).toLocaleDateString()}</span>
                          </div>
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-boxes"></i>
                            <span>Items:</span>
                            <span className="admin-dashboard__value">{order.items?.length || 0}</span>
                          </div>
                        </div>
                        <button
                          className="btn admin-dashboard__btn-generate-bill w-100"
                          disabled={generatingOrderId === order._id}
                          onClick={() => generateBill(order._id)}
                        >
                          {generatingOrderId === order._id ? (
                            <>
                              <i className="fas fa-spinner fa-spin me-2"></i>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-file-invoice me-2"></i>
                              Generate Bill
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {/* Bills Display Section */}
          <div className="row mb-3">
            <div className="col-12">
              <h5 className="admin-dashboard__section-title">
                <i className="fas fa-table me-2"></i>
                {selectedBillType === "saved" ? "Saved Bills" : "Locked Bills"} ({selectedBillType === "saved" ? getSavedBills().length : getLockedOrders().length})
              </h5>
            </div>
          </div>

          {loadingBills ? (
            <div className="admin-dashboard__loading-spinner">
              <i className="fas fa-spinner fa-spin fa-lg"></i>
              <p>Loading bills...</p>
            </div>
          ) : selectedBillType === "saved" ? (
            // Saved Bills
            getSavedBills().length === 0 ? (
              <div className="admin-dashboard__empty-state">
                <i className="fas fa-file-invoice fa-3x"></i>
                <h6>No saved bills found</h6>
                <p>No saved bills found for the selected criteria.</p>
              </div>
            ) : viewMode === 'table' ? (
              // Table View
              <div className="table-responsive">
                <table className="table table-hover admin-dashboard__bills-table">
                  <thead>
                    <tr>
                      <th>Distributor</th>
                      <th>Bill Date</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Order ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSavedBills().filter(bill => bill && bill._id).map(bill => (
                      <SafeRender key={bill._id} fallback={<tr><td colSpan="5">Error rendering bill</td></tr>}>
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-building text-primary me-2"></i>
                              {bill.distributorId?.distributorName || bill.distributorId?.name || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-calendar text-info me-2"></i>
                              {new Date(bill.billDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-boxes text-warning me-2"></i>
                              {bill.items?.length || 0}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-success fs-6">₹{bill.totalBillAmount?.toFixed(2) || '0.00'}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-shopping-cart text-info me-2"></i>
                              {bill.orderId || "N/A"}
                            </div>
                          </td>
                        </tr>
                      </SafeRender>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Cards View
              <div className="admin-dashboard__bills-grid">
                {getSavedBills().filter(bill => bill && bill._id).map(bill => (
                  <SafeRender key={bill._id} fallback={<div>Error rendering bill</div>}>
                    <div className="admin-dashboard__bill-card">
                      <div className="admin-dashboard__card-header">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="admin-dashboard__bill-icon">
                            <i className="fas fa-file-invoice"></i>
                          </div>
                          <span className="admin-dashboard__status-badge admin-dashboard__status-badge--saved">Saved</span>
                        </div>
                      </div>
                      <div className="admin-dashboard__card-body">
                        <h6 className="admin-dashboard__bill-title">Bill Details</h6>
                        <div className="admin-dashboard__bill-info">
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-truck"></i>
                            <span>Distributor:</span>
                            <span className="admin-dashboard__value">{bill.distributorId?.distributorName || bill.distributorId?.name || 'Unknown'}</span>
                          </div>
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-calendar"></i>
                            <span>Bill Date:</span>
                            <span className="admin-dashboard__value">{new Date(bill.billDate).toLocaleDateString()}</span>
                          </div>
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-boxes"></i>
                            <span>Items:</span>
                            <span className="admin-dashboard__value">{bill.items?.length || 0}</span>
                          </div>
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-rupee-sign"></i>
                            <span>Total Amount:</span>
                            <span className="admin-dashboard__value">₹{bill.totalBillAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SafeRender>
                ))}
              </div>
            )
          ) : (
            // Locked Bills
            getLockedOrders().length === 0 ? (
              <div className="admin-dashboard__empty-state">
                <i className="fas fa-lock fa-3x"></i>
                <h6>No locked bills found</h6>
                <p>No locked bills found for the selected criteria.</p>
              </div>
            ) : viewMode === 'table' ? (
              // Table View
              <div className="table-responsive">
                <table className="table table-hover admin-dashboard__bills-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Distributor</th>
                      <th>Order Date</th>
                      <th>Status</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getLockedOrders().filter(order => order && order._id).map(order => (
                      <SafeRender key={order._id} fallback={<tr><td colSpan="5">Error rendering order</td></tr>}>
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-shopping-cart text-warning me-2"></i>
                              {order._id ? order._id.slice(-8) : 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-building text-primary me-2"></i>
                              {order.distributorId?.distributorName || order.distributorId?.name || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-calendar text-info me-2"></i>
                              {new Date(order.orderDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${order.locked ? 'bg-success' : 'bg-info'} text-white`}>
                              <i className={`fas ${order.locked ? 'fa-lock' : 'fa-check'} me-1`}></i>
                              {order.locked ? 'Locked' : 'Delivered'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-boxes text-warning me-2"></i>
                              {order.items?.length || 0}
                            </div>
                          </td>
                        </tr>
                      </SafeRender>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Cards View
              <div className="admin-dashboard__bills-grid">
                {getLockedOrders().filter(order => order && order._id).map(order => (
                  <SafeRender key={order._id} fallback={<div>Error rendering order</div>}>
                    <div className="admin-dashboard__bill-card">
                      <div className="admin-dashboard__card-header">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="admin-dashboard__bill-icon">
                            <i className="fas fa-lock"></i>
                          </div>
                          <span className={`admin-dashboard__status-badge ${order.locked ? 'admin-dashboard__status-badge--locked' : 'admin-dashboard__status-badge--delivered'}`}>
                            {order.locked ? 'Locked' : 'Delivered'}
                          </span>
                        </div>
                      </div>
                      <div className="admin-dashboard__card-body">
                        <h6 className="admin-dashboard__bill-title">Order ID: {order._id ? order._id.slice(-8) : 'N/A'}</h6>
                        <div className="admin-dashboard__bill-info">
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-truck"></i>
                            <span>Distributor:</span>
                            <span className="admin-dashboard__value">{order.distributorId?.distributorName || order.distributorId?.name || 'Unknown'}</span>
                          </div>
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-calendar"></i>
                            <span>Order Date:</span>
                            <span className="admin-dashboard__value">{new Date(order.orderDate).toLocaleDateString()}</span>
                          </div>
                          <div className="admin-dashboard__info-item">
                            <i className="fas fa-boxes"></i>
                            <span>Items:</span>
                            <span className="admin-dashboard__value">{order.items?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SafeRender>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BillsGenerateManagement;


