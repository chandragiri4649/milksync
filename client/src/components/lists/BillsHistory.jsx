import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";


const BillsHistory = () => {
  const { token } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState("");
  const [distributors, setDistributors] = useState([]);
  const [viewMode, setViewMode] = useState("cards");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${config.API_BASE}/bills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch bills");
      }
      
      const data = await res.json();
      setBills(data);
      setSelectedMonth(currentMonth);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setMessage("Failed to fetch bills.");
    } finally {
      setLoading(false);
    }
  }, [token, currentMonth]);

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

  useEffect(() => {
    fetchBills();
    fetchDistributors();
  }, [fetchDistributors, fetchBills]);

  const getFilteredBills = () => {
    let filtered = bills;
    
    if (selectedDistributor) {
      filtered = filtered.filter(bill => 
        bill.distributorId?.distributorName === selectedDistributor ||
        bill.distributorId?.name === selectedDistributor
      );
    }

    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= startDate && billDate <= endDate;
      });
    }

    if (selectedYear) {
      filtered = filtered.filter(bill => {
        const billYear = new Date(bill.billDate).getFullYear();
        return billYear === parseInt(selectedYear);
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill.distributorId?.distributorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.distributorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill._id.toLowerCase().includes(searchTerm.toLowerCase())
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

  const viewBill = (bill) => {
    setSelectedBill(bill);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedBill(null);
    setShowViewModal(false);
  };

  const exportToCSV = () => {
    const filteredBills = getFilteredBills();
    if (filteredBills.length === 0) {
      setMessage("No bills to export");
      return;
    }

    const csvContent = [
      ["Bill ID", "Distributor", "Bill Date", "Order ID", "Total Amount", "Status"],
      ...filteredBills.map(bill => [
        bill._id.slice(-6).toUpperCase(),
        bill.distributorId?.distributorName || bill.distributorId?.name || "N/A",
        new Date(bill.billDate).toLocaleDateString(),
        bill.orderId?._id?.slice(-6).toUpperCase() || "N/A",
                 `₹${bill.totalAmount?.toFixed(2) || '0.00'}`,
        bill.locked ? "Locked" : "Editable"
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

     const summaryStats = getFilteredBills().reduce((acc, bill) => {
     acc.totalAmount += bill.totalAmount || 0;
     acc.lockedBills += bill.locked ? 1 : 0;
     acc.editableBills += bill.locked ? 0 : 1;
     return acc;
   }, { totalAmount: 0, lockedBills: 0, editableBills: 0, totalBills: getFilteredBills().length });

     if (loading) {
     return (
       <div className="container-fluid py-4">
         <div className="text-center py-5">
           <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
           <p className="mt-3 text-muted">Loading bills...</p>
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
               <i className="fas fa-file-invoice fa-md text-white"></i>
             </div>
             <div>
               <h3 className="mb-0 fw-bold text-black">
                 Bills History
               </h3>
               <p className="text-muted mb-0 small">View and manage all generated bills</p>
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
               <h6 className="mb-0"><i className="fas fa-file-invoice me-2"></i>Total Bills</h6>
             </div>
             <div className="card-body text-center">
               <h3 className="fw-bold text-primary">{summaryStats.totalBills}</h3>
                 <p className="mb-0 text-muted">All bills</p>
             </div>
           </div>
         </div>
                 <div className="col-md-3 mb-3">
           <div className="card border shadow-sm h-100">
             <div className="card-header bg-success text-white border-0 py-2">
               <h6 className="mb-0"><i className="fas fa-lock me-2"></i>Locked Bills</h6>
             </div>
             <div className="card-body text-center">
               <h3 className="fw-bold text-success">{summaryStats.lockedBills}</h3>
                 <p className="mb-0 text-muted">Finalized</p>
             </div>
           </div>
         </div>
                 <div className="col-md-3 mb-3">
           <div className="card border shadow-sm h-100">
             <div className="card-header bg-warning text-dark border-0 py-2">
               <h6 className="mb-0"><i className="fas fa-edit me-2"></i>Editable Bills</h6>
             </div>
             <div className="card-body text-center">
               <h3 className="fw-bold text-warning">{summaryStats.editableBills}</h3>
                 <p className="mb-0 text-muted">Can be modified</p>
             </div>
           </div>
         </div>
                 <div className="col-md-3 mb-3">
           <div className="card border shadow-sm h-100">
             <div className="card-header bg-danger text-white border-0 py-2">
               <h6 className="mb-0"><i className="fas fa-rupee-sign me-2"></i>Total Amount</h6>
             </div>
             <div className="card-body text-center">
               <h3 className="fw-bold text-danger">₹{summaryStats.totalAmount.toFixed(2)}</h3>
                 <p className="mb-0 text-muted">Combined value</p>
             </div>
           </div>
         </div>
      </div>

      {/* Search and Filter Controls */}
             <div className="card border shadow-sm mb-4">
         <div className="card-header bg-secondary text-white py-2">
           <div className="d-flex justify-content-between align-items-center">
             <h6 className="mb-0"><i className="fas fa-search me-2"></i>Search & Filter Bills</h6>
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
            <div className="col-md-4">
              <label className="form-label fw-bold small">
                <i className="fas fa-search me-1"></i>Search
              </label>
              <input type="text" className="form-control form-control-sm" placeholder="Search bills, distributors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold small">
                <i className="fas fa-truck me-1"></i>Company
              </label>
              <select className="form-select form-select-sm" value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)}>
                <option value="">All Companies</option>
                {distributors.map(dist => (
                  <option key={dist._id} value={dist.distributorName || dist.name || dist.company}>
                    {dist.distributorName || dist.name || dist.company}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
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
            <div className="col-md-2 d-flex align-items-end gap-2">
              <button className="btn btn-sm btn-outline-info flex-fill" onClick={() => { setSelectedDistributor(""); setSelectedMonth(""); setSelectedYear(new Date().getFullYear().toString()); setSearchTerm(""); }}>
                <i className="fas fa-refresh me-1"></i>Clear
              </button>
              <button className="btn btn-sm btn-success flex-fill" onClick={exportToCSV}>
                <i className="fas fa-download me-1"></i>Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Display */}
      {getFilteredBills().length === 0 ? (
                 <div className="text-center py-5">
           <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
             <i className="fas fa-file-invoice fa-2x text-muted"></i>
           </div>
           <h5 className="text-muted">No Bills Found</h5>
           <p className="text-muted">
             {bills.length === 0 ? "No bills have been generated yet" : "No bills match your search criteria"}
           </p>
         </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row">
              {getFilteredBills().map((bill) => (
                                 <div key={bill._id} className="col-lg-4 col-md-6 mb-4">
                   <div className="card border shadow-sm h-100">
                     <div className="card-header bg-primary text-white">
                       <div className="d-flex justify-content-between align-items-center">
                         <h6 className="mb-0"><i className="fas fa-file-invoice me-2"></i>Bill #{bill._id.slice(-6).toUpperCase()}</h6>
                         <span className={`fs-7 fw-bold px-2 py-1 rounded ${bill.locked ? 'bg-success' : 'bg-warning'}`}>
                           {bill.locked ? 'Locked' : 'Editable'}
                         </span>
                       </div>
                     </div>
                    <div className="card-body d-flex flex-column">
                                             <div className="mb-3">
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-building me-2 text-muted"></i>
                           <span className="fw-semibold small text-muted">Distributor:</span>
                           <span className="ms-2 small">{bill.distributorId?.distributorName || bill.distributorId?.name || "N/A"}</span>
                         </div>
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-calendar me-2 text-muted"></i>
                           <span className="fw-semibold small text-muted">Bill Date:</span>
                           <span className="ms-2 small">{new Date(bill.billDate).toLocaleDateString()}</span>
                         </div>
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-shopping-cart me-2 text-muted"></i>
                           <span className="fw-semibold small text-muted">Order ID:</span>
                           <span className="ms-2 small">{bill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}</span>
                         </div>
                       </div>
                      
                                             <div className="mb-3">
                         <h6 className="fw-bold mb-2 text-dark">
                           <i className="fas fa-list me-2 text-muted"></i>Bill Items ({bill.items.length})
                         </h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-borderless mb-0">
                            <thead className="table-light">
                              <tr>
                                <th className="small">Product</th>
                                                                 <th className="small">Qty</th>
                                 <th className="small">Price</th>
                                 <th className="small">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bill.items.map((item, idx) => (
                                <tr key={idx} className="border-bottom">
                                                                     <td className="small">{item.productName}</td>
                                   <td className="small">{item.quantity}</td>
                                   <td className="small">₹{item.price?.toFixed(2) || '0.00'}</td>
                                   <td className="small fw-bold">₹{item.total?.toFixed(2) || '0.00'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Damaged Products Information */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-exclamation-triangle me-2 text-muted"></i>
                          <span className="fw-semibold small text-muted">Damaged Products:</span>
                        </div>
                        {(bill.damagedProducts && bill.damagedProducts.length > 0) || 
                         (bill.orderId?.damagedProducts && bill.orderId.damagedProducts.length > 0) ? (
                          <div>
                            <div className="d-flex align-items-center mb-2">
                              <span className="fw-semibold small text-danger">Total Damaged:</span>
                              <span className="ms-2 small text-danger fw-bold">
                                {(bill.damagedProducts || bill.orderId?.damagedProducts || []).reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                              </span>
                            </div>
                            <div className="mb-2">
                              <div className="ms-3 mt-1">
                                {(bill.damagedProducts || bill.orderId?.damagedProducts || []).slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="small text-danger">
                                    • {item.productName} - {item.damagedPackets || item.quantity || 0} packets
                                  </div>
                                ))}
                                {(bill.damagedProducts || bill.orderId?.damagedProducts || []).length > 2 && (
                                  <div className="small text-danger">
                                    • +{(bill.damagedProducts || bill.orderId?.damagedProducts || []).length - 2} more products
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="ms-3">
                            <span className="small text-success">
                              <i className="fas fa-check-circle me-1"></i>No damaged products
                            </span>
                          </div>
                        )}
                      </div>
                      
                                             <div className="mt-auto">
                         <div className="d-flex justify-content-between align-items-center mb-2">
                           <span className="small text-muted">Generated: {new Date(bill.createdAt).toLocaleDateString()}</span>
                                                        <h5 className="fw-bold mb-0 text-success">₹{bill.totalAmount?.toFixed(2) || '0.00'}</h5>
                         </div>
                                                 <div className="d-flex gap-2">
                           <button className="btn btn-outline-primary btn-sm flex-fill" title="View bill details" onClick={() => viewBill(bill)}>
                             <i className="fas fa-eye me-1"></i>View
                           </button>
                           {!bill.locked && (
                             <button className="btn btn-outline-warning btn-sm flex-fill" title="Edit bill">
                               <i className="fas fa-edit me-1 action-button-icon"></i>Edit
                             </button>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
                     {viewMode === 'table' && (
             <div className="card border-0 shadow-lg">
               <div className="card-header text-white py-2 search-filter-header">
                 <h6 className="mb-0"><i className="fas fa-table me-2 view-mode-icon"></i>Bills Table View</h6>
               </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                                         <thead className="table-light">
                       <tr>
                         <th className="table-header">Bill ID</th>
                         <th className="table-header">Distributor</th>
                         <th className="table-header">Bill Date</th>
                         <th className="table-header">Order ID</th>
                         <th className="table-header">Items</th>
                         <th className="table-header">Damaged Products</th>
                         <th className="table-header">Total Amount</th>
                         <th className="table-header">Status</th>
                         <th className="table-header">Actions</th>
                       </tr>
                     </thead>
                    <tbody>
                      {getFilteredBills().map(bill => (
                        <tr key={bill._id}>
                                                     <td>
                             <div className="d-flex align-items-center">
                               <i className="fas fa-file-invoice me-2 table-icon"></i>
                               #{bill._id.slice(-6).toUpperCase()}
                             </div>
                           </td>
                           <td>
                             <div className="d-flex align-items-center">
                               <i className="fas fa-building me-2 table-icon"></i>
                               {bill.distributorId?.distributorName || bill.distributorId?.name || "Unknown"}
                             </div>
                           </td>
                           <td>
                             <div className="d-flex align-items-center">
                               <i className="fas fa-calendar me-2 table-icon"></i>
                               {new Date(bill.billDate).toLocaleDateString()}
                             </div>
                           </td>
                           <td>
                             <div className="d-flex align-items-center">
                               <i className="fas fa-shopping-cart me-2 table-icon"></i>
                               {bill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}
                             </div>
                           </td>
                                                     <td>
                             <div className="product-summary">
                               {bill.items.slice(0, 2).map((item, idx) => (
                                 <div key={idx} className="mb-1">
                                                                    <i className="fas fa-circle me-1 product-summary-icon"></i>
                                 {item.productName} - {item.quantity} {item.unit || 'tubs'}
                                 </div>
                               ))}
                               {bill.items.length > 2 && (
                                 <small className="more-items-text">+{bill.items.length - 2} more items</small>
                               )}
                             </div>
                           </td>
                           <td>
                             {(bill.damagedProducts && bill.damagedProducts.length > 0) || 
                              (bill.orderId?.damagedProducts && bill.orderId.damagedProducts.length > 0) ? (
                               <div>
                                 <span className="badge bg-danger fs-6 mb-1">
                                   {(bill.damagedProducts || bill.orderId?.damagedProducts || []).reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                                 </span>
                                 <div className="small text-danger">
                                   {(bill.damagedProducts || bill.orderId?.damagedProducts || []).slice(0, 2).map((item, idx) => (
                                     <div key={idx}>
                                       • {item.productName} - {item.damagedPackets || item.quantity || 0} packets
                                     </div>
                                   ))}
                                   {(bill.damagedProducts || bill.orderId?.damagedProducts || []).length > 2 && (
                                     <small className="text-danger">+{(bill.damagedProducts || bill.orderId?.damagedProducts || []).length - 2} more</small>
                                   )}
                                 </div>
                               </div>
                             ) : (
                               <span className="badge bg-success fs-6">
                                 <i className="fas fa-check-circle me-1"></i>No damage
                               </span>
                             )}
                           </td>
                          <td>
                            <span className="badge bg-success fs-6">₹{bill.totalAmount?.toFixed(2) || '0.00'}</span>
                          </td>
                                                     <td>
                             <span className={`badge ${bill.locked ? 'bg-success' : 'bg-warning text-dark'}`}>
                               <i className={`fas ${bill.locked ? 'fa-lock' : 'fa-edit'} me-1 status-badge-icon`}></i>
                               {bill.locked ? 'Locked' : 'Editable'}
                             </span>
                           </td>
                           <td>
                             <div className="d-flex gap-1">
                               <button className="btn btn-outline-primary btn-sm" title="View bill details" onClick={() => viewBill(bill)}>
                                 <i className="fas fa-eye action-button-icon"></i>
                               </button>
                               {!bill.locked && (
                                 <button className="btn btn-outline-warning btn-sm" title="Edit bill">
                                   <i className="fas fa-edit action-button-icon"></i>
                                 </button>
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

      {/* View Bill Modal */}
             {showViewModal && selectedBill && (
         <div className="modal fade show d-block view-modal">
           <div className="modal-dialog modal-lg modal-dialog-centered">
             <div className="modal-content border-0 shadow-lg">
               <div className="modal-header text-white view-modal-header">
                 <h5 className="modal-title mb-0 view-modal-title">
                   <i className="fas fa-file-invoice me-2 view-modal-icon"></i>
                   Bill Details - #{selectedBill._id.slice(-6).toUpperCase()}
                 </h5>
                 <button type="button" className="btn-close btn-close-white" onClick={closeViewModal}></button>
               </div>
                               <div className="modal-body p-4">
                   <div className="row mb-4">
                     <div className="col-md-6">
                       <div className="d-flex align-items-center mb-3">
                         <i className="fas fa-building me-3 text-muted"></i>
                         <div>
                           <small className="text-muted d-block">Distributor</small>
                           <strong className="text-dark">{selectedBill.distributorId?.distributorName || selectedBill.distributorId?.name || "N/A"}</strong>
                         </div>
                       </div>
                       <div className="d-flex align-items-center mb-3">
                         <i className="fas fa-calendar me-3 text-muted"></i>
                         <div>
                           <small className="text-muted d-block">Bill Date</small>
                           <strong className="text-dark">{new Date(selectedBill.billDate).toLocaleDateString()}</strong>
                         </div>
                       </div>
                     </div>
                                       <div className="col-md-6">
                       <div className="d-flex align-items-center mb-3">
                         <i className="fas fa-shopping-cart me-3 text-muted"></i>
                         <div>
                           <small className="text-muted d-block">Order ID</small>
                           <strong className="text-dark">{selectedBill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}</strong>
                         </div>
                       </div>
                       <div className="d-flex align-items-center mb-3">
                         <i className="fas fa-clock me-3 text-muted"></i>
                         <div>
                           <small className="text-muted d-block">Generated On</small>
                           <strong className="text-dark">{new Date(selectedBill.createdAt).toLocaleDateString()}</strong>
                         </div>
                       </div>
                     </div>
                   </div>

                                 <div className="mb-4">
                   <h6 className="fw-bold mb-3 text-dark">
                     <i className="fas fa-list me-2 text-muted"></i>
                     Bill Items ({selectedBill.items.length})
                   </h6>
                   <div className="table-responsive">
                     <table className="table table-bordered">
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
                                                        <td>{item.productName}</td>
                           <td>{item.quantity} {item.unit || 'tubs'}</td>
                           <td>₹{item.price?.toFixed(2) || '0.00'}</td>
                           <td className="fw-bold">₹{item.total?.toFixed(2) || '0.00'}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>

                 {/* Damaged Products Information */}
                 {((selectedBill.damagedProducts && selectedBill.damagedProducts.length > 0) || 
                   (selectedBill.orderId?.damagedProducts && selectedBill.orderId.damagedProducts.length > 0)) && (
                   <div className="mb-4">
                     <h6 className="fw-bold mb-3 text-danger">
                       <i className="fas fa-exclamation-triangle me-2"></i>
                       Damaged Products ({(selectedBill.damagedProducts || selectedBill.orderId?.damagedProducts || []).length})
                     </h6>
                     <div className="table-responsive">
                       <table className="table table-bordered table-danger">
                         <thead className="table-danger">
                           <tr>
                             <th>Product</th>
                             <th>Damaged Packets</th>
                             <th>Notes</th>
                           </tr>
                         </thead>
                         <tbody>
                           {(selectedBill.damagedProducts || selectedBill.orderId?.damagedProducts || []).map((item, idx) => (
                             <tr key={idx}>
                               <td>{item.productName}</td>
                               <td className="fw-bold">{item.damagedPackets || item.quantity || 0} packets</td>
                               <td>{item.notes || 'No notes'}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                     <div className="mt-2">
                       <span className="badge bg-danger fs-6">
                         Total Damaged: {(selectedBill.damagedProducts || selectedBill.orderId?.damagedProducts || []).reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                       </span>
                     </div>
                   </div>
                 )}

                                 <div className="row">
                   <div className="col-md-6">
                                            <div className="d-flex align-items-center mb-3">
                         <i className="fas fa-info-circle me-3 text-muted"></i>
                         <div>
                           <small className="text-muted d-block">Status</small>
                           <span className={`badge ${selectedBill.locked ? 'bg-success' : 'bg-warning text-dark'} fs-6`}>
                             <i className={`fas ${selectedBill.locked ? 'fa-lock' : 'fa-edit'} me-1`}></i>
                             {selectedBill.locked ? 'Locked' : 'Editable'}
                           </span>
                         </div>
                       </div>
                     </div>
                   <div className="col-md-6">
                     <div className="d-flex align-items-center mb-3">
                       <i className="fas fa-rupee-sign me-3 text-muted"></i>
                       <div>
                         <small className="text-muted d-block">Total Amount</small>
                                                    <strong className="fs-4 text-success">₹{selectedBill.totalAmount?.toFixed(2) || '0.00'}</strong>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               <div className="modal-footer">
                 <button type="button" className="btn btn-secondary" onClick={closeViewModal}>
                   <i className="fas fa-times me-2"></i>Close
                 </button>
                 {!selectedBill.locked && (
                   <button type="button" className="btn btn-warning">
                     <i className="fas fa-edit me-2"></i>Edit Bill
                   </button>
                 )}
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default BillsHistory;
