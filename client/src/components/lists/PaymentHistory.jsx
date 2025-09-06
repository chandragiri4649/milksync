import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";


const PaymentHistory = () => {
  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a complete URL (Cloudinary), use it as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a local path, prepend the base URL
    return `${process.env.REACT_APP_SERVER_URL || ''}${imageUrl}`;
  };

  const { token } = useAuth();
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
      const paymentsData = await apiService.get('/payments');
      if (!Array.isArray(paymentsData)) {
        console.error("API returned non-array data:", paymentsData);
        setPayments([]);
        return;
      }
      
      setPayments(paymentsData);
      setSelectedMonth(currentMonth);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setPayments([]);
      setMessage("Failed to fetch payments.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchDistributors();
    fetchPayments();
  }, [fetchDistributors, fetchPayments]);

  const getFilteredPayments = () => {
    let filtered = payments;
    
    if (selectedDistributor) {
      filtered = filtered.filter(payment => payment.distributorId?._id === selectedDistributor);
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
        payment.distributorId?.distributorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.distributorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.createdBy?.username?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const filteredPayments = getFilteredPayments();
    if (filteredPayments.length === 0) {
      setMessage("No payments to export");
      return;
    }

    const csvContent = [
      ["Payment ID", "Distributor", "Payment Date", "Amount", "Payment Method", "Recorded By", "Receipt URL"],
      ...filteredPayments.map(payment => [
        payment._id.slice(-6).toUpperCase(),
        payment.distributorId?.distributorName || payment.distributorId?.name || "N/A",
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

  const summaryStats = getFilteredPayments().reduce((acc, payment) => {
    acc.totalAmount += payment.amount || 0;
    acc.totalPayments += 1;
    acc.methodStats[payment.paymentMethod] = (acc.methodStats[payment.paymentMethod] || 0) + 1;
    return acc;
  }, { totalAmount: 0, totalPayments: 0, methodStats: {} });

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
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex align-items-center">
                         <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
               <i className="fas fa-credit-card fa-md text-white"></i>
             </div>
            <div>
              <h3 className="mb-0 fw-bold text-black">Payment History</h3>
              <p className="text-muted mb-0 small">View and manage all payment records</p>
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
        <div className="col-md-3 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-primary text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-credit-card me-2"></i>Total Payments</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-info">{summaryStats.totalPayments}</h3>
              <p className="mb-0 text-muted">All payments</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-success text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-rupee-sign me-2"></i>Total Amount</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-success">₹{summaryStats.totalAmount.toFixed(2)}</h3>
              <p className="mb-0 text-muted">Combined value</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-warning text-dark border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-mobile-alt me-2"></i>Digital Payments</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-warning">
                {(summaryStats.methodStats["PhonePe"] || 0) + (summaryStats.methodStats["Google Pay"] || 0)}
              </h3>
              <p className="mb-0 text-muted">PhonePe + GPay</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-danger text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-university me-2"></i>Bank Transfers</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-danger">
                {(summaryStats.methodStats["Bank Transfer"] || 0) + (summaryStats.methodStats["Net Banking"] || 0)}
              </h3>
              <p className="mb-0 text-muted">Bank + Net Banking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card border shadow-sm mb-4">
        <div className="card-header bg-secondary text-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="fas fa-search me-2"></i>Search & Filter Payments</h6>
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
            <div className="col-md-2">
              <label className="form-label fw-bold small">
                <i className="fas fa-search me-1"></i>Search
              </label>
              <input type="text" className="form-control form-control-sm" placeholder="Search payments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small">
                <i className="fas fa-truck me-1"></i>Distributor
              </label>
              <select className="form-select form-select-sm" value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)}>
                <option value="">All Distributors</option>
                {distributors.map(dist => (
                  <option key={dist._id} value={dist._id}>
                    {dist.distributorName || dist.name || dist.company}
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
                <i className="fas fa-calendar-year me-1"></i>Year
              </label>
              <select className="form-select form-select-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {getYearOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small">
                <i className="fas fa-credit-card me-1"></i>Method
              </label>
              <select className="form-select form-select-sm" value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)}>
                <option value="">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end gap-2">
                             <button className="btn btn-sm btn-outline-info flex-fill" onClick={() => { setSelectedDistributor(""); setSelectedMonth(""); setSelectedYear(new Date().getFullYear().toString()); setSelectedPaymentMethod(""); setSearchTerm(""); }}>
                 <i className="fas fa-refresh me-1"></i>Clear
               </button>
               <button className="btn btn-sm btn-success flex-fill" onClick={exportToCSV}>
                 <i className="fas fa-download me-1"></i>Export
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Display */}
      {getFilteredPayments().length === 0 ? (
        <div className="text-center py-5">
          <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
            <i className="fas fa-credit-card fa-2x text-muted"></i>
          </div>
          <h5 className="text-muted">No Payments Found</h5>
          <p className="text-muted">
            {payments.length === 0 ? "No payments have been recorded yet" : "No payments match your search criteria"}
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
                                                 <h6 className="mb-0"><i className="fas fa-credit-card me-2"></i>Payment #{payment._id.slice(-6).toUpperCase()}</h6>
                        <span className="badge bg-light text-dark px-2 py-1">{payment.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <div className="mb-3">
                                                 <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-building me-2 text-muted" style={{width: '16px'}}></i>
                           <span className="fw-semibold small text-muted">Distributor:</span>
                           <span className="ms-2 small">{payment.distributorId?.distributorName || payment.distributorId?.name || "N/A"}</span>
                         </div>
                                                 <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-calendar me-2 text-muted" style={{width: '16px'}}></i>
                           <span className="fw-semibold small text-muted">Payment Date:</span>
                           <span className="ms-2 small">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                         </div>
                                                 <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-user me-2 text-muted" style={{width: '16px'}}></i>
                           <span className="fw-semibold small text-muted">Recorded By:</span>
                           <span className="ms-2 small">{payment.createdBy?.username || "N/A"}</span>
                         </div>
                      </div>
                      
                      <div className="mt-auto">
                                                 <div className="d-flex justify-content-between align-items-center mb-3">
                           <span className="small text-muted">Amount</span>
                           <h4 className="fw-bold mb-0 text-success">₹{payment.amount.toFixed(2)}</h4>
                         </div>
                        <div className="d-flex gap-2">
                                                     {getImageUrl(payment.receiptImageUrl) && (
                             <a href={getImageUrl(payment.receiptImageUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm flex-fill" title="View receipt">
                               <i className="fas fa-receipt me-1"></i>Receipt
                             </a>
                           )}
                                                       <button className="btn btn-outline-info btn-sm flex-fill" title="View payment details" onClick={() => viewPaymentDetails(payment)}>
                              <i className="fas fa-eye me-1"></i>Details
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
              <div className="card-header bg-info text-white py-2">
                <h6 className="mb-0"><i className="fas fa-table me-2"></i>Payments Table View</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
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
                            <div className="d-flex align-items-center">
                              <i className="fas fa-credit-card me-2 text-muted"></i>
                              #{payment._id.slice(-6).toUpperCase()}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                                                             <i className="fas fa-building me-2 text-muted"></i>
                              {payment.distributorId?.distributorName || payment.distributorId?.name || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                                                             <i className="fas fa-calendar me-2 text-muted"></i>
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-success fs-6">₹{payment.amount.toFixed(2)}</span>
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
                                                             <button className="btn btn-outline-info btn-sm" title="View payment details" onClick={() => viewPaymentDetails(payment)}>
                                 <i className="fas fa-eye" style={{ color: "#000000" }}></i>
                               </button>
                               <button className="btn btn-outline-warning btn-sm" title="Edit payment">
                                 <i className="fas fa-edit" style={{ color: "#000000" }}></i>
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
                         <strong style={{ color: "#000000" }}>{selectedPayment.distributorId?.distributorName || selectedPayment.distributorId?.name || "N/A"}</strong>
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
     </div>
   );
 };

export default PaymentHistory;
