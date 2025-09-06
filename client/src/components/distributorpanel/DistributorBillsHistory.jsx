import React, { useState, useEffect, useCallback } from "react";
import apiService from "../../utils/apiService";

export default function DistributorBillsHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Get distributor token from localStorage
  const getDistributorToken = () => {
    return localStorage.getItem("distributorToken");
  };

  // Fetch bills for the logged-in distributor
  const fetchDistributorBills = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 DistributorBillsHistory - Starting to fetch bills...");
      
      // Fetch all bills and filter for this distributor
      const data = await apiService.get('/bills/distributor');
      console.log("📋 DistributorBillsHistory - Received data:", data);
      
      // Filter bills for this distributor only
      if (Array.isArray(data)) {
        console.log("✅ DistributorBillsHistory - Bills array received, length:", data.length);
        // Since this is distributor view, we need to filter by the logged-in distributor
        // The API should return only bills for the authenticated distributor
        setBills(data);
        setSelectedMonth(currentMonth);
      } else if (data && typeof data === 'object') {
        console.log("⚠️ DistributorBillsHistory - Object received:", data);
        if (data.error) {
          console.log("❌ DistributorBillsHistory - Error in data:", data.error);
          setMessage(data.error);
          setBills([]);
        } else {
          setBills([]);
          setMessage("No bills data received");
        }
      } else {
        console.log("❌ DistributorBillsHistory - Unexpected data type:", typeof data, data);
        setBills([]);
        setMessage("No bills data received");
      }
    } catch (error) {
      console.error("❌ DistributorBillsHistory - Error fetching distributor bills:", error);
      setMessage("Failed to load bills. Please try again.");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchDistributorBills();
  }, [fetchDistributorBills]);

  // Filter bills based on search criteria and date filters
  const getFilteredBills = () => {
    let filtered = bills;
    
    // Filter to show only locked bills
    filtered = filtered.filter(bill => bill.locked === true);
    
    // Filter by month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= startDate && billDate <= endDate;
      });
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(bill => {
        const billYear = new Date(bill.billDate).getFullYear();
        return billYear === parseInt(selectedYear);
      });
    }

    // Filter by search term (search in bill ID, order ID, product names)
    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.orderId?._id && bill.orderId._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        bill.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    return filtered;
  };

  const filteredBills = getFilteredBills();

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

  // View bill details
  const viewBill = (bill) => {
    setSelectedBill(bill);
    setShowViewModal(true);
  };

  // Close view modal
  const closeViewModal = () => {
    setSelectedBill(null);
    setShowViewModal(false);
  };

  // Export bills to CSV
  const exportToCSV = () => {
    const filteredBills = getFilteredBills();
    if (filteredBills.length === 0) {
      setMessage("No bills to export");
      return;
    }

    const csvContent = [
      ["Bill ID", "Bill Date", "Order ID", "Total Amount", "Status", "Items Count"],
      ...filteredBills.map(bill => [
        bill._id.slice(-6).toUpperCase(),
        new Date(bill.billDate).toLocaleDateString(),
        bill.orderId?._id?.slice(-6).toUpperCase() || "N/A",
                 `₹${bill.totalAmount?.toFixed(2) || '0.00'}`,
        bill.locked ? "Locked" : "Editable",
        bill.items.length
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-bills_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Bills exported successfully!");
  };

  // Calculate summary statistics
     const summaryStats = filteredBills.reduce((acc, bill) => {
     acc.totalAmount += bill.totalAmount || 0;
     acc.lockedBills += bill.locked ? 1 : 0;
     acc.editableBills += bill.locked ? 0 : 1;
     return acc;
   }, { totalAmount: 0, lockedBills: 0, editableBills: 0, totalBills: filteredBills.length });

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted fs-5">Loading your bills...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-2" style={{ maxWidth: '1200px', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="text-center mb-3 p-3 bg-primary bg-gradient rounded-4 text-white shadow">
        <h2 className="mb-1 fw-semibold" style={{ fontSize: '1.5rem' }}>My Bills</h2>
        <p className="mb-0 small opacity-75">View and manage all bills generated for your orders</p>
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
      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="card bg-info bg-opacity-10 border-info border-start border-3 h-100">
            <div className="card-body text-center py-2">
              <div className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Total Bills</div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>{summaryStats.totalBills}</div>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card bg-primary bg-opacity-10 border-primary border-start border-3 h-100">
            <div className="card-body text-center py-2">
              <div className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>Total Amount</div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>₹{summaryStats.totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card mb-3" style={{ overflow: 'hidden' }}>
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            {/* Search Input */}
            <div className="col-md-3 col-6">
              <div className="position-relative">
                <input
                  type="text"
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control form-control-sm ps-4"
                />
                <span className="position-absolute top-50 start-0 translate-middle-y ms-2" style={{ fontSize: '0.8rem' }}>🔍</span>
              </div>
            </div>
            
            {/* Month Select */}
            <div className="col-md-2 col-6">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-select form-select-sm"
              >
                <option value="">All Months</option>
                {getMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {/* Year Select */}
            <div className="col-md-2 col-6">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-select form-select-sm"
              >
                {getYearOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {/* Action Buttons */}
            <div className="col-md-3 col-6 d-flex gap-1">
              <button 
                className="btn btn-outline-secondary btn-sm flex-fill"
                onClick={() => { 
                  setSelectedMonth(""); 
                  setSelectedYear(new Date().getFullYear().toString()); 
                  setSearchTerm(""); 
                }}
              >
                Clear
              </button>
              
              <button 
                className="btn btn-success btn-sm flex-fill"
                onClick={exportToCSV}
              >
                Export
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="col-md-2 col-6 d-flex gap-1">
              <button 
                className={`btn btn-sm flex-fill ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </button>
              <button 
                className={`btn btn-sm flex-fill ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Display */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-5">
          <div className="text-muted fs-5">
            {bills.length === 0 ? "No bills have been generated yet" : "No bills match your search criteria"}
          </div>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row g-4">
              {filteredBills.map((bill) => (
                <div key={bill._id} className="col-lg-6">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <span className="me-2">🧾</span>
                        <span className="fw-bold">Bill #{bill._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className={`badge ${bill.locked ? 'bg-warning' : 'bg-success'}`}>
                        <span className="me-1">
                          {bill.locked ? '🔒' : '✏️'}
                        </span>
                        {bill.locked ? 'Locked' : 'Editable'}
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="row g-2 mb-3">
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Bill Date:</span>
                            <span className="fw-semibold text-dark">
                              {new Date(bill.billDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Order ID:</span>
                            <span className="fw-semibold text-dark">
                              {bill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Items:</span>
                            <span className="fw-semibold text-dark">{bill.items.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="fw-semibold text-muted small mb-2">Bill Items ({bill.items?.length || 0}):</div>
                        <div className="row g-2">
                          {bill.items?.map((item, idx) => (
                            <div key={idx} className="col-12">
                              <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded border">
                                <div className="d-flex align-items-center">
                                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                       style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                      {item.productName || 'N/A'} {item.quantity} {item.unit || 'units'} = ₹{((item.pricePerUnit || 0) * (item.quantity || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                      ₹{item.pricePerUnit || 0} per {item.unit || 'unit'}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div className="fw-bold text-success" style={{ fontSize: '0.9rem' }}>
                                    ₹{((item.pricePerUnit || 0) * (item.quantity || 0)).toFixed(2)}
                                  </div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Total Cost
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Damaged Products Information */}
                      {bill.damagedProducts && bill.damagedProducts.length > 0 ? (
                        <div className="mb-3">
                          <div className="fw-semibold text-danger small mb-2">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Damaged Products
                          </div>
                          <div className="mb-2">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted small">Total Damaged:</span>
                              <span className="fw-bold text-danger">
                                {bill.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                              </span>
                            </div>
                          </div>
                          <div className="small">
                            {bill.damagedProducts.map((item, idx) => (
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
                    
                    <div className="card-footer bg-light d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">
                          Generated: {new Date(bill.createdAt).toLocaleDateString()}
                        </div>
                        <div className="fw-bold text-dark">₹{bill.totalAmount?.toFixed(2) || '0.00'}</div>
                      </div>
                      
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => viewBill(bill)}
                      >
                        View Details
                      </button>
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
                    <th>Bill ID</th>
                    <th>Bill Date</th>
                    <th>Order ID</th>
                    <th>Items</th>
                    <th>Damaged Products</th>
                    <th>Total Damaged</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map(bill => (
                    <tr key={bill._id}>
                      <td>
                        <span className="fw-bold text-primary">
                          #{bill._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="text-dark">{new Date(bill.billDate).toLocaleDateString()}</td>
                      <td className="text-dark">
                        {bill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}
                      </td>
                      <td>
                        <div>
                          {bill.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="small text-dark">
                              <strong>{item.productName}</strong> - {item.quantity} {item.unit || 'tub'}
                            </div>
                          ))}
                          {bill.items.length > 2 && (
                            <div className="small text-muted">+{bill.items.length - 2} more</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {bill.damagedProducts && bill.damagedProducts.length > 0 ? (
                          <div className="damaged-products-summary">
                            {bill.damagedProducts.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="mb-1">
                                <i className="bi bi-exclamation-triangle me-1 text-danger"></i>
                                {item.productName} - {item.damagedPackets || item.quantity || 0} pkts
                              </div>
                            ))}
                            {bill.damagedProducts.length > 2 && (
                              <small className="text-danger">+{bill.damagedProducts.length - 2} more</small>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </td>
                      <td>
                        {bill.damagedProducts && bill.damagedProducts.length > 0 ? (
                          <span className="badge bg-danger fs-6">
                            {bill.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                          </span>
                        ) : (
                          <span className="badge bg-secondary fs-6">0 packets</span>
                        )}
                      </td>
                      <td className="fw-bold text-dark">₹{bill.totalAmount?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className={`badge ${bill.locked ? 'bg-warning' : 'bg-success'}`}>
                          {bill.locked ? '🔒 Locked' : '✏️ Editable'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => viewBill(bill)}
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

      {/* View Bill Modal */}
      {showViewModal && selectedBill && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  🧾 Bill Details - #{selectedBill._id.slice(-6).toUpperCase()}
                </h5>
                <button type="button" className="btn-close" onClick={closeViewModal}></button>
              </div>
              
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Bill Date:</span>
                      <span className="fw-bold text-dark">
                        {new Date(selectedBill.billDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Order ID:</span>
                      <span className="fw-bold text-dark">
                        {selectedBill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Generated On:</span>
                      <span className="fw-bold text-dark">
                        {new Date(selectedBill.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Status:</span>
                      <span className={`badge ${selectedBill.locked ? 'bg-warning' : 'bg-success'}`}>
                        {selectedBill.locked ? '🔒 Locked' : '✏️ Editable'}
                      </span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Total Amount:</span>
                      <span className="fw-bold text-dark fs-5">₹{selectedBill.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="fw-bold mb-3">📋 Bill Items ({selectedBill.items.length})</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead className="table-light">
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold text-dark">{item.productName}</td>
                            <td className="text-dark">{item.quantity} {item.unit || 'tub'}</td>
                            <td className="text-dark">₹{item.price?.toFixed(2) || '0.00'}</td>
                            <td className="fw-bold text-dark">₹{item.total?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeViewModal}>
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
