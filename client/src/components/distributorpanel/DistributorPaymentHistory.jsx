import React, { useState, useEffect, useCallback } from "react";
import apiService from "../../utils/apiService";

export default function DistributorPaymentHistory() {
  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a complete URL (Cloudinary), use it as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a local path, prepend the base URL
    return `${process.env.REACT_APP_SERVER_URL || ''}${imageUrl}`;
  };

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const paymentMethods = ["PhonePe", "Google Pay", "Cash", "Net Banking", "Bank Transfer"];

  // Get distributor token from localStorage
  const getDistributorToken = () => {
    return localStorage.getItem("distributorToken");
  };

  // Fetch payments for the logged-in distributor
  const fetchDistributorPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch payments for this distributor
      const data = await apiService.get('/payments/distributor');
      
      if (Array.isArray(data)) {
        setPayments(data);
        setSelectedMonth(currentMonth);
      } else if (data && typeof data === 'object') {
        if (data.error) {
          setMessage(data.error);
          setPayments([]);
        } else {
          setPayments([]);
          setMessage("No payments data received");
        }
      } else {
        setPayments([]);
        setMessage("No payments data received");
      }
    } catch (error) {
      console.error("Error fetching distributor payments:", error);
      setMessage("Failed to load payments. Please try again.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchDistributorPayments();
  }, [fetchDistributorPayments]);

  // Filter payments based on search criteria and filters
  const getFilteredPayments = () => {
    let filtered = payments;
    
    // Filter by month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(payment => {
        const paymentYear = new Date(payment.paymentDate).getFullYear();
        return paymentYear === parseInt(selectedYear);
      });
    }

    // Filter by payment method
    if (selectedPaymentMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === selectedPaymentMethod);
    }

    // Filter by search term (search in payment ID, distributor name, etc.)
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.distributorId?.distributorName && payment.distributorId.distributorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.distributorId?.name && payment.distributorId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.createdBy?.username && payment.createdBy.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  // Get month options for filter
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

  // Get year options for filter
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [
      { value: "", label: "All Years" },
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
      { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
      { value: currentYear.toString(), label: currentYear.toString() }
    ];
  };

  // View payment details
  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setSelectedPayment(null);
    setShowDetailsModal(false);
  };

  // Export payments to CSV
  const exportToCSV = () => {
    const filteredPayments = getFilteredPayments();
    if (filteredPayments.length === 0) {
      setMessage("No payments to export");
      return;
    }

    const csvContent = [
      ["Payment ID", "Payment Date", "Amount", "Payment Method", "Recorded By", "Receipt URL"],
      ...filteredPayments.map(payment => [
        payment._id.slice(-6).toUpperCase(),
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
    a.download = `my-payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Payments exported successfully!");
  };

  // Calculate summary statistics
  const summaryStats = filteredPayments.reduce((acc, payment) => {
    acc.totalAmount += payment.amount || 0;
    acc.totalPayments += 1;
    acc.methodStats[payment.paymentMethod] = (acc.methodStats[payment.paymentMethod] || 0) + 1;
    return acc;
  }, { totalAmount: 0, totalPayments: 0, methodStats: {} });

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted fs-5">Loading your payment history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="text-center mb-4 p-4 bg-info bg-gradient rounded-4 text-white shadow">
        <h2 className="mb-2 fw-semibold" style={{ fontSize: '2.2rem' }}>My Payment History</h2>
        <p className="mb-0 fs-5 opacity-75">View all payments made by admin/staff for your orders</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
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
      <div className="mb-4">
        {/* First Row: Total Payments and Total Amount */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <div className="card bg-primary bg-opacity-10 border-primary border-start border-4 h-100">
              <div className="card-body text-center">
                <div className="fw-semibold text-muted small">Total Payments</div>
                <div className="fs-4 fw-bold text-dark">{summaryStats.totalPayments}</div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="card bg-success bg-opacity-10 border-success border-start border-4 h-100">
              <div className="card-body text-center">
                <div className="fw-semibold text-muted small">Total Amount</div>
                <div className="fs-4 fw-bold text-dark">₹{summaryStats.totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second Row: Digital Payments and Bank Transfers */}
        <div className="row g-3">
          <div className="col-6">
            <div className="card bg-info bg-opacity-10 border-info border-start border-4 h-100">
              <div className="card-body text-center">
                <div className="fw-semibold text-muted small">Digital Payments</div>
                <div className="fs-4 fw-bold text-dark">
                  {(summaryStats.methodStats["PhonePe"] || 0) + (summaryStats.methodStats["Google Pay"] || 0)}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="card bg-warning bg-opacity-10 border-warning border-start border-4 h-100">
              <div className="card-body text-center">
                <div className="fw-semibold text-muted small">Bank Transfers</div>
                <div className="fs-4 fw-bold text-dark">
                  {(summaryStats.methodStats["Bank Transfer"] || 0) + (summaryStats.methodStats["Net Banking"] || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="mb-3">
            <div className="position-relative">
              <input
                type="text"
                placeholder="Search payments by ID, distributor, or admin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control ps-5"
              />
              <span className="position-absolute top-50 start-0 translate-middle-y ms-3">🔍</span>
            </div>
          </div>
          
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-select"
              >
                <option value="">All Months</option>
                {getMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-semibold">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-select"
              >
                {getYearOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-semibold">Payment Method:</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="form-select"
              >
                <option value="">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3 d-flex align-items-end gap-2">
              <button 
                className="btn btn-outline-secondary flex-fill"
                onClick={() => { 
                  setSelectedMonth(""); 
                  setSelectedYear(new Date().getFullYear().toString()); 
                  setSelectedPaymentMethod("");
                  setSearchTerm(""); 
                }}
              >
                Clear Filters
              </button>
              
              <button 
                className="btn btn-success flex-fill"
                onClick={exportToCSV}
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="d-flex gap-2">
            <button 
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('cards')}
            >
              📋 Cards
            </button>
            <button 
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('table')}
            >
              📊 Table
            </button>
          </div>
        </div>
      </div>

      {/* Payments Display */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-5">
          <div className="text-muted fs-5">
            {payments.length === 0 ? "No payments have been recorded yet" : "No payments match your search criteria"}
          </div>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row g-4">
              {filteredPayments.map((payment) => (
                <div key={payment._id} className="col-lg-6">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <span className="me-2">💳</span>
                        <span className="fw-bold">Payment #{payment._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="badge bg-info">
                        <span className="me-1">
                          {payment.paymentMethod === 'Cash' ? '💵' : 
                           payment.paymentMethod === 'Bank Transfer' ? '🏦' : 
                           payment.paymentMethod === 'PhonePe' ? '📱' : 
                           payment.paymentMethod === 'Google Pay' ? '📱' : '💳'}
                        </span>
                        {payment.paymentMethod}
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="row g-2 mb-3">
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Payment Date:</span>
                            <span className="fw-semibold text-dark">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Recorded By:</span>
                            <span className="fw-semibold text-dark">
                              {payment.createdBy?.username || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Receipt:</span>
                            <span className="fw-semibold text-dark">
                              {getImageUrl(payment.receiptImageUrl) ? "Available" : "Not Available"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-footer bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="small text-muted">
                          Created: {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div className="fw-bold text-dark fs-5">₹{payment.amount.toFixed(2)}</div>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-primary btn-sm flex-fill"
                          onClick={() => viewPaymentDetails(payment)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Payment ID</th>
                    <th>Payment Date</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Recorded By</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(payment => (
                    <tr key={payment._id}>
                      <td>
                        <span className="fw-bold text-primary">
                          #{payment._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="text-dark">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="fw-bold text-dark">₹{payment.amount.toFixed(2)}</td>
                      <td>
                        <span className="badge bg-info">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="text-dark">{payment.createdBy?.username || "N/A"}</td>
                      <td>
                        {getImageUrl(payment.receiptImageUrl) ? (
                          <a 
                            href={getImageUrl(payment.receiptImageUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline-primary btn-sm"
                          >
                            📄 View
                          </a>
                        ) : (
                          <span className="text-muted small">No receipt</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => viewPaymentDetails(payment)}
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  💳 Payment Details - #{selectedPayment._id.slice(-6).toUpperCase()}
                </h5>
                <button type="button" className="btn-close" onClick={closeDetailsModal}></button>
              </div>
              
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Payment Date:</span>
                      <span className="fw-bold text-dark">
                        {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Payment Method:</span>
                      <span className="badge bg-info">
                        {selectedPayment.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Recorded By:</span>
                      <span className="fw-bold text-dark">
                        {selectedPayment.createdBy?.username || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Created On:</span>
                      <span className="fw-bold text-dark">
                        {new Date(selectedPayment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Receipt Status:</span>
                      <span className={`badge ${getImageUrl(selectedPayment.receiptImageUrl) ? 'bg-success' : 'bg-warning'}`}>
                        {getImageUrl(selectedPayment.receiptImageUrl) ? '📄 Available' : '❌ Not Available'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Total Amount:</span>
                      <span className="fw-bold text-dark fs-5">₹{selectedPayment.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {getImageUrl(selectedPayment.receiptImageUrl) && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">📄 Payment Receipt</h6>
                    <div className="text-center">
                      <img 
                        src={getImageUrl(selectedPayment.receiptImageUrl)} 
                        alt="Payment Receipt" 
                        className="img-fluid rounded border shadow-sm"
                        style={{ maxHeight: '300px' }}
                      />
                      <div className="mt-3">
                        <a 
                          href={getImageUrl(selectedPayment.receiptImageUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-outline-primary btn-sm me-2"
                        >
                          🔍 View Full Size
                        </a>
                        <a 
                          href={getImageUrl(selectedPayment.receiptImageUrl)} 
                          download 
                          className="btn btn-outline-success btn-sm"
                        >
                          📥 Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h6 className="fw-bold mb-3">ℹ️ Additional Information</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Payment ID:</span>
                        <span className="fw-bold text-dark">{selectedPayment._id}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Last Updated:</span>
                        <span className="fw-bold text-dark">
                          {new Date(selectedPayment.updatedAt || selectedPayment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom spacer to prevent content from being hidden behind bottom navigation */}
      <div className="pb-5 mb-5" aria-hidden="true"></div>
    </div>
  );
}
