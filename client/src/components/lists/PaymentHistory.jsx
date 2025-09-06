import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";
import DeleteModal from "../DeleteModal";

const PaymentHistory = ({ showAllPayments = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if this is being accessed from staff routes
  const isStaffRoute = location.pathname.startsWith('/staff/');

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a complete URL (Cloudinary), use it as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a local path, prepend the base URL
    return `${process.env.REACT_APP_SERVER_URL || ''}${imageUrl}`;
  };

  const [distributors, setDistributors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPaymentForDelete, setSelectedPaymentForDelete] = useState(null);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const paymentMethods = ["PhonePe", "Google Pay", "Cash", "Net Banking", "Bank Transfer"];

  const fetchDistributors = useCallback(async () => {
    try {
      const data = await apiService.get('/distributor');
      if (!Array.isArray(data)) {
        console.error("API returned non-array data for distributors:", data);
        setDistributors([]);
        return;
      }
      setDistributors(data);
    } catch (err) {
      console.error("Error fetching distributors:", err);
      setDistributors([]);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = showAllPayments ? "/payments/all" : "/payments";
      const paymentsData = await apiService.get(endpoint);
      
      // Ensure data is always an array
      if (Array.isArray(paymentsData)) {
        setPayments(paymentsData);
        setSelectedMonth(currentMonth);
      } else if (paymentsData && typeof paymentsData === 'object') {
        if (paymentsData.error) {
          setMessage(paymentsData.error);
          setPayments([]);
        } else {
          setPayments([]);
          setMessage("Unexpected response format from payments API");
        }
      } else {
        setPayments([]);
        setMessage("No payments data received");
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setMessage(err.message || "Failed to fetch payments.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, showAllPayments]);

  useEffect(() => {
    fetchDistributors();
    fetchPayments();
  }, [fetchDistributors, fetchPayments]);

  // Safety check - ensure payments is always an array
  const safePayments = Array.isArray(payments) ? payments : [];

  // Bulk actions functionality
  const [selectedPayments, setSelectedPayments] = useState([]);

  const togglePaymentSelection = (paymentId) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const selectAllPayments = () => {
    const filteredPayments = getFilteredPayments();
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map(payment => payment._id));
    }
  };

  const bulkDeletePayments = async () => {
    if (selectedPayments.length === 0) {
      setMessage("Please select payments to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedPayments.length} payments? This action cannot be undone.`)) return;

    try {
      const promises = selectedPayments.map(paymentId => 
        apiService.delete(`/payments/${paymentId}`)
      );

      await Promise.all(promises);
      setPayments(prev => prev.filter(payment => !selectedPayments.includes(payment._id)));
      setSelectedPayments([]);
      setMessage(`${selectedPayments.length} payments deleted successfully!`);
    } catch (err) {
      setMessage("Failed to delete some payments");
    }
  };

  const getFilteredPayments = () => {
    let filtered = safePayments;
    
    if (selectedDistributor) {
      filtered = filtered.filter(payment => 
        payment.distributorId?._id === selectedDistributor ||
        payment.distributorId?.distributorName === selectedDistributor ||
        payment.distributorId?.companyName === selectedDistributor
      );
    }

    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    if (selectedYear) {
      filtered = filtered.filter(payment => {
        const paymentYear = new Date(payment.paymentDate).getFullYear();
        return paymentYear === parseInt(selectedYear);
      });
    }

    if (selectedPaymentMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === selectedPaymentMethod);
    }

    if (searchTerm) {
      filtered = filtered.filter(payment => 
        (payment.distributorId?.distributorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.distributorId?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment._id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.createdBy?.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.paymentMethod || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

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

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [
      { value: "", label: "All Years" },
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
      { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
      { value: currentYear.toString(), label: currentYear.toString() }
    ];
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedPayment(null);
    setShowDetailsModal(false);
  };

  const exportToCSV = () => {
    const paymentsToExport = getFilteredPayments();
    if (paymentsToExport.length === 0) {
      setMessage("No payments to export");
      return;
    }

    const csvContent = [
      ["Payment ID", "Distributor", "Payment Date", "Amount", "Payment Method", "Recorded By", "Receipt URL"],
      ...paymentsToExport.map(payment => [
        payment._id.slice(-6).toUpperCase(),
        payment.distributorId?.distributorName || payment.distributorId?.companyName || "N/A",
        new Date(payment.paymentDate).toLocaleDateString(),
        `₹${payment.amount.toFixed(2)}`,
        payment.paymentMethod || "N/A",
        payment.createdBy?.username || "N/A",
        getImageUrl(payment.receiptImageUrl) || "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Payments exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredPayments = getFilteredPayments();
    const totalPayments = filteredPayments.length;
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate payment method statistics
    const methodStats = filteredPayments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    
    const digitalPayments = (methodStats["PhonePe"] || 0) + (methodStats["Google Pay"] || 0);
    const bankTransfers = (methodStats["Bank Transfer"] || 0) + (methodStats["Net Banking"] || 0);
    const cashPayments = methodStats["Cash"] || 0;
    const receiptsWithImages = filteredPayments.filter(payment => getImageUrl(payment.receiptImageUrl)).length;
    
    return { 
      totalPayments, 
      totalAmount, 
      digitalPayments, 
      bankTransfers, 
      cashPayments, 
      receiptsWithImages 
    };
  };

  const summaryStats = getSummaryStats();

  // Delete a payment
  const deletePayment = async (id) => {
    if (!window.confirm("Delete this payment?")) return;
    try {
      await apiService.delete(`/payments/${id}`);
      setPayments(prev => prev.filter(p => p._id !== id));
      setMessage("Payment deleted successfully");
    } catch (error) {
      setMessage(error.message || "Failed to delete payment");
    }
  };

  // Show delete payment modal
  const showDeletePaymentModal = (payment) => {
    setSelectedPaymentForDelete(payment);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedPaymentForDelete) return;
    
    try {
      await apiService.delete(`/payments/${selectedPaymentForDelete._id}`);
      setPayments(prev => prev.filter(p => p._id !== selectedPaymentForDelete._id));
      setMessage("Payment deleted successfully");
      setShowDeleteModal(false);
      setSelectedPaymentForDelete(null);
    } catch (error) {
      setMessage(error.message || "Failed to delete payment");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
          <p className="mt-3 text-muted">Loading payments...</p>
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
              <i className="fas fa-credit-card fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                {showAllPayments ? "All Payments History" : "My Payments History"}
              </h3>
              <p className="mb-0 text-muted">
                {showAllPayments ? "View and manage all system payments" : "Track your payment history and status"}
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
                  <i className="fas fa-credit-card text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Payments</h6>
                  <h4 className="mb-0 fw-bold text-primary">{summaryStats.totalPayments}</h4>
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
                  <i className="fas fa-rupee-sign text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Amount</h6>
                  <h4 className="mb-0 fw-bold text-success">₹{summaryStats.totalAmount.toFixed(2)}</h4>
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
                  <i className="fas fa-mobile-alt text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Digital Payments</h6>
                  <h4 className="mb-0 fw-bold text-warning">{summaryStats.digitalPayments}</h4>
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
                  <i className="fas fa-university text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Bank Transfers</h6>
                  <h4 className="mb-0 fw-bold text-info">{summaryStats.bankTransfers}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-money-bill text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Cash Payments</h6>
                  <h4 className="mb-0 fw-bold text-secondary">{summaryStats.cashPayments}</h4>
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
                  <i className="fas fa-receipt text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">With Receipts</h6>
                  <h4 className="mb-0 fw-bold text-danger">{summaryStats.receiptsWithImages}</h4>
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
                      placeholder="Search payments, distributors..."
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
                  <select
                    className="form-select"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    style={{ width: '140px' }}
                  >
                    <option value="">All Methods</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
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
      {getFilteredPayments().length > 0 && (
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
                        id="selectAllPayments"
                        checked={selectedPayments.length === getFilteredPayments().length && getFilteredPayments().length > 0}
                        onChange={selectAllPayments}
                      />
                      <label className="form-check-label" htmlFor="selectAllPayments">
                        Select All ({selectedPayments.length}/{getFilteredPayments().length})
                      </label>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={bulkDeletePayments}
                      disabled={selectedPayments.length === 0}
                    >
                      <i className="fas fa-trash me-1"></i>
                      Delete ({selectedPayments.length})
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setSelectedPayments([])}
                      disabled={selectedPayments.length === 0}
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

      {/* Payments Display */}
      {getFilteredPayments().length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-credit-card fa-3x text-muted mb-3"></i>
          <h6 className="text-muted">No Payments Found</h6>
          <p className="text-muted">
            {safePayments.length === 0 ? "No payments are currently available" : "No payments match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row">
              {getFilteredPayments().map((payment) => (
                <div key={payment._id} className="col-lg-4 col-md-6 mb-4">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-primary text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="form-check me-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedPayments.includes(payment._id)}
                              onChange={() => togglePaymentSelection(payment._id)}
                            />
                          </div>
                          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}>
                            <i className="fas fa-credit-card fa-sm text-primary"></i>
                          </div>
                        </div>
                        <span className="badge bg-light text-dark px-2 py-1">{payment.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title fw-bold text-center mb-3">Payment #{payment._id.slice(-6)}</h6>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-building text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Distributor</small>
                              <span className="fw-semibold">{payment.distributorId?.distributorName || payment.distributorId?.companyName || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-calendar text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Payment Date</small>
                              <span className="fw-semibold">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-user text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Recorded By</small>
                              <span className="fw-semibold">{payment.createdBy?.username || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-credit-card text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Method</small>
                              <span className="fw-semibold">{payment.paymentMethod || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="small text-muted">Amount</span>
                          <h4 className="fw-bold mb-0 text-success">₹{payment.amount.toFixed(2)}</h4>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          {getImageUrl(payment.receiptImageUrl) && (
                            <a href={getImageUrl(payment.receiptImageUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm flex-fill" title="View receipt">
                              <i className="fas fa-receipt me-1"></i>Receipt
                            </a>
                          )}
                          <button className="btn btn-outline-info btn-sm flex-fill" title="View payment details" onClick={() => viewPaymentDetails(payment)}>
                            <i className="fas fa-eye me-1"></i>Details
                          </button>
                          <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => showDeletePaymentModal(payment)}>
                            <i className="fas fa-trash me-1"></i>Delete
                          </button>
                        </div>
                      </div>
                    </div>
                                         <div className="card-footer text-muted">
                       <small>Created: {new Date(payment.createdAt).toLocaleDateString()}</small>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="card border shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Payment ID</th>
                        <th>Distributor</th>
                        <th>Payment Date</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Recorded By</th>
                        <th>Receipt</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredPayments().map(payment => (
                        <tr key={payment._id}>
                          <td>
                            <span className="badge bg-secondary text-white">
                              #{payment._id.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-building me-2 text-muted"></i>
                              {payment.distributorId?.distributorName || payment.distributorId?.companyName || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-calendar me-2 text-muted"></i>
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-success text-white">
                              ₹{payment.amount.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info text-dark">
                              <i className="fas fa-credit-card me-1"></i>
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-user me-2 text-muted"></i>
                              {payment.createdBy?.username || "N/A"}
                            </div>
                          </td>
                          <td>
                            {getImageUrl(payment.receiptImageUrl) ? (
                              <a href={getImageUrl(payment.receiptImageUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm" title="View receipt">
                                <i className="fas fa-receipt"></i>
                              </a>
                            ) : (
                              <span className="text-muted">No receipt</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-outline-info btn-sm" onClick={() => viewPaymentDetails(payment)}>
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="btn btn-outline-warning btn-sm">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => showDeletePaymentModal(payment)}>
                                <i className="fas fa-trash"></i>
                              </button>
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

       {/* Payment Details Modal */}
       {showDetailsModal && selectedPayment && (
         <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
           <div className="modal-dialog modal-lg modal-dialog-centered">
             <div className="modal-content border-0 shadow-lg">
               <div className="modal-header text-white" style={{ background: "linear-gradient(135deg, #AEE9F7 0%, #8DD3C0 100%)" }}>
                 <h5 className="modal-title mb-0">
                   <i className="fas fa-credit-card me-2" style={{ color: "#000000" }}></i>
                   Payment Details - #{selectedPayment._id.slice(-6).toUpperCase()}
                 </h5>
                 <button type="button" className="btn-close btn-close-white" onClick={closeDetailsModal}></button>
               </div>
               <div className="modal-body p-4">
                 <div className="row mb-4">
                   <div className="col-md-6">
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-building me-3" style={{ color: "#000000", fontSize: '1.2rem' }}></i>
                       <div>
                         <small className="text-muted d-block">Distributor</small>
                         <strong style={{ color: "#000000" }}>{selectedPayment.distributorId?.distributorName || selectedPayment.distributorId?.companyName || "N/A"}</strong>
                       </div>
                     </div>
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-calendar me-3" style={{ color: "#000000", fontSize: '1.2rem' }}></i>
                       <div>
                         <small className="text-muted d-block">Payment Date</small>
                         <strong style={{ color: "#000000" }}>{new Date(selectedPayment.paymentDate).toLocaleDateString()}</strong>
                       </div>
                     </div>
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-user me-3" style={{ color: "#000000", fontSize: '1.2rem' }}></i>
                       <div>
                         <small className="text-muted d-block">Recorded By</small>
                         <strong style={{ color: "#000000" }}>{selectedPayment.createdBy?.username || "N/A"}</strong>
                       </div>
                     </div>
                   </div>
                   <div className="col-md-6">
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-credit-card me-3" style={{ color: "#000000", fontSize: '1.2rem' }}></i>
                       <div>
                         <small className="text-muted d-block">Payment Method</small>
                         <span className={`badge ${selectedPayment.paymentMethod === 'Cash' ? 'bg-success' : selectedPayment.paymentMethod === 'Bank Transfer' ? 'bg-info' : 'bg-warning'} fs-6`}>
                           <i className="fas fa-credit-card me-1" style={{ color: "#000000" }}></i>
                           {selectedPayment.paymentMethod}
                         </span>
                       </div>
                     </div>
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-clock me-3" style={{ color: "#000000", fontSize: '1.2rem' }}></i>
                       <div>
                         <small className="text-muted d-block">Created On</small>
                         <strong style={{ color: "#000000" }}>{new Date(selectedPayment.createdAt).toLocaleDateString()}</strong>
                       </div>
                     </div>
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-receipt me-3 text-muted" style={{fontSize: '1.2rem'}}></i>
                       <div>
                         <small className="text-muted d-block">Receipt Status</small>
                         <span className={`badge ${getImageUrl(selectedPayment.receiptImageUrl) ? 'bg-success' : 'bg-warning'} fs-6`}>
                           <i className={`fas ${getImageUrl(selectedPayment.receiptImageUrl) ? 'fa-check' : 'fa-exclamation-triangle'} me-1`}></i>
                           {getImageUrl(selectedPayment.receiptImageUrl) ? 'Available' : 'Not Available'}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="mb-4">
                   <h6 className="fw-bold mb-3 text-dark">
                     <i className="fas fa-rupee-sign me-2 text-muted"></i>
                     Payment Amount
                   </h6>
                   <div className="text-center p-4 bg-light rounded">
                     <h2 className="fw-bold mb-0 text-success">₹{selectedPayment.amount.toFixed(2)}</h2>
                     <small className="text-muted">Total Payment Amount</small>
                   </div>
                 </div>

                 {getImageUrl(selectedPayment.receiptImageUrl) && (
                   <div className="mb-4">
                     <h6 className="fw-bold mb-3 text-dark">
                       <i className="fas fa-image me-2 text-muted"></i>
                       Receipt Image
                     </h6>
                     <div className="text-center">
                       <img 
                         src={getImageUrl(selectedPayment.receiptImageUrl)} 
                         alt="Payment Receipt" 
                         className="img-fluid rounded shadow-sm" 
                         style={{ maxHeight: '300px', maxWidth: '100%' }}
                       />
                       <div className="mt-2">
                         <a 
                           href={getImageUrl(selectedPayment.receiptImageUrl)} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="btn btn-outline-primary btn-sm"
                         >
                           <i className="fas fa-external-link-alt me-1"></i>
                           View Full Size
                         </a>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="row">
                   <div className="col-md-6">
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-info-circle me-3 text-muted" style={{fontSize: '1.2rem'}}></i>
                       <div>
                         <small className="text-muted d-block">Payment ID</small>
                         <strong className="text-dark">{selectedPayment._id}</strong>
                       </div>
                     </div>
                   </div>
                   <div className="col-md-6">
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-calendar-alt me-3 text-muted" style={{fontSize: '1.2rem'}}></i>
                       <div>
                         <small className="text-muted d-block">Last Updated</small>
                         <strong className="text-dark">{new Date(selectedPayment.updatedAt || selectedPayment.createdAt).toLocaleDateString()}</strong>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               <div className="modal-footer border-0">
                 <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>
                   <i className="fas fa-times me-2"></i>Close
                 </button>
                 {getImageUrl(selectedPayment.receiptImageUrl) && (
                   <a 
                     href={getImageUrl(selectedPayment.receiptImageUrl)} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="btn btn-primary"
                   >
                     <i className="fas fa-download me-2"></i>Download Receipt
                   </a>
                 )}
                 <button type="button" className="btn btn-warning">
                   <i className="fas fa-edit me-2"></i>Edit Payment
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
           {/* Delete Payment Modal */}
      {showDeleteModal && selectedPaymentForDelete && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPaymentForDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Payment"
          message="Are you sure you want to delete this payment?"
          itemName={`Payment #${selectedPaymentForDelete._id.slice(-6)}`}
          itemDetails={`Payment for ${selectedPaymentForDelete.distributorId?.companyName || selectedPaymentForDelete.distributorId?.distributorName || 'Unknown Company'} - ₹${selectedPaymentForDelete.amount?.toFixed(2) || '0.00'} via ${selectedPaymentForDelete.paymentMethod}`}
          confirmText="Delete Payment"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default PaymentHistory;
