import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";

const PaymentManagement = () => {
  const { token } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PhonePe");
  const [receiptFile, setReceiptFile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  // Fetch all distributors
  const fetchDistributors = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/distributor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch distributors");
      const data = await res.json();
      setDistributors(data);
    } catch (err) {
      setError(err.message || "Error fetching distributors");
    }
  }, [token]);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${config.API_BASE}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payment history");
      const data = await res.json();
      setPaymentHistory(data);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDistributors();
    fetchPaymentHistory();
  }, [fetchDistributors, fetchPaymentHistory]);

  // Update wallet balance display when distributor changes
  useEffect(() => {
    if (selectedDistributor) {
      const dist = distributors.find((d) => d._id === selectedDistributor);
      setWalletBalance(dist ? dist.walletBalance : null);
    } else {
      setWalletBalance(null);
    }
  }, [selectedDistributor, distributors]);

  // Filter payment history based on search criteria
  const getFilteredPaymentHistory = () => {
    let filtered = paymentHistory;

    if (searchTerm) {
      filtered = filtered.filter(payment => {
        const distributorName = payment.distributorId?.distributorName || payment.distributorId?.name || '';
        const method = payment.paymentMethod || '';
        
        return distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               method.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedMonth) {
      filtered = filtered.filter(payment => {
        const paymentMonth = new Date(payment.paymentDate).getMonth() + 1;
        return paymentMonth === parseInt(selectedMonth);
      });
    }

    if (selectedPaymentMethodFilter) {
      filtered = filtered.filter(payment => 
        payment.paymentMethod === selectedPaymentMethodFilter
      );
    }

    return filtered;
  };

  // Get digital payments count
  const getDigitalPaymentsCount = () => {
    return getFilteredPaymentHistory().filter(payment => 
      ['PhonePe', 'Google Pay', 'Net Banking', 'Bank Transfer'].includes(payment.paymentMethod)
    ).length;
  };

  // Get payments grouped by method
  const getPaymentsByMethod = () => {
    const filteredPayments = getFilteredPaymentHistory();
    const methodCounts = {};
    
    filteredPayments.forEach(payment => {
      const method = payment.paymentMethod || 'Unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
    
    return methodCounts;
  };

  // Export payment data to CSV
  const exportToCSV = () => {
    const filteredPayments = getFilteredPaymentHistory();
    if (filteredPayments.length === 0) {
      setMessage("No payments to export");
      return;
    }

    const csvContent = [
      ["Date", "Distributor", "Payment Method", "Amount", "Status"],
      ...filteredPayments.map(payment => [
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.distributorId?.distributorName || payment.distributorId?.name || "Unknown",
        payment.paymentMethod || "N/A",
        `₹${payment.amount.toFixed(2)}`,
        "Completed"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Payment data exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredPayments = getFilteredPaymentHistory();
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalTransactions = filteredPayments.length;
    const digitalPayments = getDigitalPaymentsCount();
    const activeDistributors = distributors.length;
    
    return { totalAmount, totalTransactions, digitalPayments, activeDistributors };
  };

  const summaryStats = getSummaryStats();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedDistributor || !amount || !paymentMethod || !receiptFile) {
      setError("All fields are required.");
      return;
    }
    if (amount <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }
    if (walletBalance !== null && Number(amount) > walletBalance) {
      setError("Payment amount exceeds wallet balance.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("distributorId", selectedDistributor);
      formData.append("amount", amount);
      formData.append("paymentMethod", paymentMethod);
      formData.append("receiptImage", receiptFile);

      const res = await fetch(`${config.API_BASE}/payments/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to record payment");
      }

      const data = await res.json();
      setMessage(`✅ ${data.message || "Payment successfully recorded"}`);

      setAmount("");
      setReceiptFile(null);
      setPaymentMethod("PhonePe");
      setSelectedDistributor("");
      fetchDistributors(); // Refresh wallet balances
      fetchPaymentHistory(); // Refresh payment history
    } catch (err) {
      setError(`❌ ${err.message || "Error submitting payment"}`);
    } finally {
      setLoading(false);
    }
  };

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

  // Payment method options for filter
  const paymentMethodOptions = [
    { value: "", label: "All Methods" },
    { value: "PhonePe", label: "PhonePe" },
    { value: "Google Pay", label: "Google Pay" },
    { value: "Cash", label: "Cash" },
    { value: "Net Banking", label: "Net Banking" },
    { value: "Bank Transfer", label: "Bank Transfer" }
  ];

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                background: "linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)",
                width: '60px',
                height: '60px'
              }}
            >
              <i className="fas fa-credit-card fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                Payment Management
              </h3>
              <p className="text-muted mb-0 small">Record and manage distributor payments</p>
            </div>
          </div>
        </div>
      </div>

        {/* Summary Dashboard */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-success">
              <div className="card-body text-center">
                <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-money-bill-wave text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-success mb-1">₹{summaryStats.totalAmount.toFixed(2)}</h4>
                  <p className="mb-0 text-muted">Total Payments</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-info">
              <div className="card-body text-center">
                <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-receipt text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-info mb-1">{summaryStats.totalTransactions}</h4>
                  <p className="mb-0 text-muted">Total Transactions</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-primary">
              <div className="card-body text-center">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-mobile-alt text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-primary mb-1">{summaryStats.digitalPayments}</h4>
                  <p className="mb-0 text-muted">Digital Payments</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border shadow-sm h-100 border-top border-4 border-warning">
              <div className="card-body text-center">
                <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '50px', height: '50px'}}>
                  <i className="fas fa-users text-white"></i>
                </div>
                <div>
                  <h4 className="fw-bold text-warning mb-1">{summaryStats.activeDistributors}</h4>
                  <p className="mb-0 text-muted">Active Distributors</p>
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
                <div className="row g-3">
                  <div className="col-lg-3 col-md-6">
                    <div className="position-relative">
                      <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                      <input
                        type="text"
                        className="form-control ps-5"
                        placeholder="Search payments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-6">
                    <select
                      className="form-select"
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
                      className="form-select"
                      value={selectedPaymentMethodFilter}
                      onChange={(e) => setSelectedPaymentMethodFilter(e.target.value)}
                    >
                      {paymentMethodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <button className="btn btn-outline-primary w-100" onClick={exportToCSV}>
                      <i className="fas fa-download me-2"></i>
                      Export CSV
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}
        {message && (
          <div className="alert alert-success alert-dismissible fade show">
            <i className="fas fa-check-circle me-2"></i>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-flex justify-content-center">
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

        {/* Payment Form */}
        <div className="card border shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0">
              <i className="fas fa-plus-circle me-2"></i>
              Record New Payment
            </h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Distributor Selection */}
                <div className="col-md-6">
                  <label htmlFor="distributorSelect" className="form-label">
                    <i className="fas fa-user me-1"></i>Select Distributor
                  </label>
                  <select
                    id="distributorSelect"
                    className="form-select"
                    value={selectedDistributor}
                    onChange={(e) => setSelectedDistributor(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Distributor --</option>
                    {distributors.map((dist) => (
                      <option key={dist._id} value={dist._id}>
                        {dist.distributorName || dist.name} (Wallet: ₹
                        {dist.walletBalance ? dist.walletBalance.toFixed(2) : "0.00"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method Selection */}
                <div className="col-md-6">
                  <label htmlFor="paymentMethodSelect" className="form-label">
                    <i className="fas fa-credit-card me-1"></i>Payment Method
                  </label>
                  <select
                    id="paymentMethodSelect"
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option>PhonePe</option>
                    <option>Google Pay</option>
                    <option>Cash</option>
                    <option>Net Banking</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Amount */}
                <div className="col-md-6">
                  <label htmlFor="paymentAmount" className="form-label">
                    <i className="fas fa-rupee-sign me-1"></i>Amount (₹)
                  </label>
                  <input
                    id="paymentAmount"
                    type="number"
                    className="form-control"
                    value={amount}
                    min="0"
                    step="0.01"
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  {walletBalance !== null && (
                    <small className="form-text text-muted">
                      <i className="fas fa-wallet me-1"></i>
                      Wallet Balance: ₹{walletBalance.toFixed(2)}
                    </small>
                  )}
                </div>

                {/* Receipt Upload */}
                <div className="col-md-6">
                  <label htmlFor="receiptImage" className="form-label">
                    <i className="fas fa-upload me-1"></i>Upload Receipt
                  </label>
                  <input
                    id="receiptImage"
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => setReceiptFile(e.target.files[0])}
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="col-12">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm w-100" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Submit Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">
                <i className="fas fa-history me-2"></i>
                Payment History ({getFilteredPaymentHistory().length})
              </h5>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowHistory(!showHistory)}
              >
                <i className={`fas fa-${showHistory ? 'eye-slash' : 'eye'} me-1`}></i>
                {showHistory ? 'Hide' : 'Show'} History
              </button>
            </div>
          </div>
        </div>

        {/* Payment History Display */}
        {showHistory && (
          loadingHistory ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading payment history...</p>
            </div>
          ) : getFilteredPaymentHistory().length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
              <h6 className="text-muted">No payment records found</h6>
              <p className="text-muted">No payments match the selected criteria.</p>
            </div>
          ) : viewMode === 'table' ? (
            // Table View
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-primary">
                  <tr>
                    <th>Date</th>
                    <th>Distributor</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredPaymentHistory().map((payment) => (
                    <tr key={payment._id}>
                      <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="fw-bold">{payment.distributorId?.distributorName || payment.distributorId?.name}</td>
                      <td>
                        <span className="badge bg-info">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="fw-bold text-success">₹{payment.amount.toFixed(2)}</td>
                      <td>
                        <span className="badge bg-success">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Cards View
            <div className="row">
              {getFilteredPaymentHistory().map((payment) => (
                <div key={payment._id} className="col-lg-4 col-md-6 mb-3">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-success text-white">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="
                        d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                          <i className="fas fa-credit-card text-white"></i>
                        </div>
                        <span className="badge bg-white text-success">Completed</span>
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h6 className="fw-bold">Payment Details</h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-calendar text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Date:</span>
                          <span className="fw-medium">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-user text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Distributor:</span>
                          <span className="fw-medium">{payment.distributorId?.distributorName || payment.distributorId?.name}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-credit-card text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Method:</span>
                          <span className="fw-medium">{payment.paymentMethod}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-rupee-sign text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Amount:</span>
                          <span className="fw-medium text-success">₹{payment.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Payment Method Statistics */}
        {showHistory && Object.keys(getPaymentsByMethod()).length > 0 && (
          <div className="card border shadow-sm mt-4">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Payment Method Statistics
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.entries(getPaymentsByMethod()).map(([method, count]) => (
                  <div key={method} className="col-md-3 mb-2">
                    <div className="text-center">
                      <h6 className="mb-1 fw-bold">{method}</h6>
                      <span className="badge bg-primary fs-6">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default PaymentManagement;
