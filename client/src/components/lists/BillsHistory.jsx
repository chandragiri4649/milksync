import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";
import DeleteModal from "../DeleteModal";

const BillsHistory = ({ showAllBills = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if this is being accessed from staff routes
  const isStaffRoute = location.pathname.startsWith('/staff/');

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBillForDelete, setSelectedBillForDelete] = useState(null);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = showAllBills ? "/bills/all" : "/bills";
      const data = await apiService.get(endpoint);
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setBills(data);
        setSelectedMonth(currentMonth);
      } else if (data && typeof data === 'object') {
        if (data.error) {
          setMessage(data.error);
          setBills([]);
        } else {
          setBills([]);
          setMessage("Unexpected response format from bills API");
        }
      } else {
        setBills([]);
        setMessage("No bills data received");
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
      setMessage(err.message || "Failed to fetch bills.");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, showAllBills]);

  const fetchDistributors = useCallback(async () => {
    try {
      const data = await apiService.get('/distributor');
      setDistributors(data);
    } catch (err) {
      console.error("Error fetching distributors:", err);
    }
  }, []);

  useEffect(() => {
    fetchBills();
    fetchDistributors();
  }, [fetchDistributors, fetchBills]);

  // Safety check - ensure bills is always an array
  const safeBills = Array.isArray(bills) ? bills : [];

  // Bulk actions functionality
  const [selectedBills, setSelectedBills] = useState([]);

  const toggleBillSelection = (billId) => {
    setSelectedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const selectAllBills = () => {
    const filteredBills = getFilteredBills();
    if (selectedBills.length === filteredBills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(filteredBills.map(bill => bill._id));
    }
  };

  const bulkDeleteBills = async () => {
    if (selectedBills.length === 0) {
      setMessage("Please select bills to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedBills.length} bills? This action cannot be undone.`)) return;

    try {
      const promises = selectedBills.map(billId => 
        apiService.delete(`/bills/${billId}`)
      );

      await Promise.all(promises);
      setBills(prev => prev.filter(bill => !selectedBills.includes(bill._id)));
      setSelectedBills([]);
      setMessage(`${selectedBills.length} bills deleted successfully!`);
    } catch (err) {
      setMessage("Failed to delete some bills");
    }
  };

  const getFilteredBills = () => {
    let filtered = safeBills;
    
    if (selectedDistributor) {
      filtered = filtered.filter(bill => 
        bill.distributorId?.distributorName === selectedDistributor ||
        bill.distributorId?.name === selectedDistributor ||
        bill.distributorId?.companyName === selectedDistributor
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
        (bill.distributorId?.distributorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.distributorId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.distributorId?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill._id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.orderId?._id || "").toLowerCase().includes(searchTerm.toLowerCase())
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
    const billsToExport = getFilteredBills();
    if (billsToExport.length === 0) {
      setMessage("No bills to export");
      return;
    }

    const csvContent = [
      ["Bill ID", "Distributor", "Bill Date", "Order ID", "Total Amount", "Status"],
      ...billsToExport.map(bill => [
        bill._id.slice(-6).toUpperCase(),
        bill.distributorId?.distributorName || bill.distributorId?.name || bill.distributorId?.companyName || "N/A",
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

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredBills = getFilteredBills();
    const totalBills = filteredBills.length;
    const lockedBills = filteredBills.filter(bill => bill.locked).length;
    const editableBills = filteredBills.filter(bill => !bill.locked).length;
    const totalAmount = filteredBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    
    // Calculate damaged products statistics
    const billsWithDamage = filteredBills.filter(bill => 
      (bill.damagedProducts && bill.damagedProducts.length > 0) ||
      (bill.orderId?.damagedProducts && bill.orderId.damagedProducts.length > 0)
    ).length;
    
    const totalDamagedPackets = filteredBills.reduce((sum, bill) => {
      const damagedProducts = bill.damagedProducts || bill.orderId?.damagedProducts || [];
      if (damagedProducts.length > 0) {
        return sum + damagedProducts.reduce((itemSum, item) => 
          itemSum + (item.damagedPackets || item.quantity || 0), 0
        );
      }
      return sum;
    }, 0);
    
    return { 
      totalBills, 
      lockedBills, 
      editableBills, 
      totalAmount, 
      billsWithDamage, 
      totalDamagedPackets 
    };
  };

  const summaryStats = getSummaryStats();

  // Delete a bill
  const deleteBill = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      await apiService.delete(`/bills/${id}`);
      setBills(prev => prev.filter(b => b._id !== id));
      setMessage("Bill deleted successfully");
    } catch (error) {
      setMessage(error.message || "Failed to delete bill");
    }
  };

  // Show delete bill modal
  const showDeleteBillModal = (bill) => {
    setSelectedBillForDelete(bill);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedBillForDelete) return;
    
    try {
      await apiService.delete(`/bills/${selectedBillForDelete._id}`);
      setBills(prev => prev.filter(b => b._id !== selectedBillForDelete._id));
      setMessage("Bill deleted successfully");
      setShowDeleteModal(false);
      setSelectedBillForDelete(null);
    } catch (error) {
      setMessage(error.message || "Failed to delete bill");
    }
  };

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
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{width: '60px', height: '60px'}}
            >
              <i className="fas fa-file-invoice fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                {showAllBills ? "All Bills History" : "My Bills History"}
              </h3>
              <p className="mb-0 text-muted">
                {showAllBills ? "View and manage all system bills" : "Track your bill history and status"}
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
                  <i className="fas fa-file-invoice text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Bills</h6>
                  <h4 className="mb-0 fw-bold text-primary">{summaryStats.totalBills}</h4>
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
                  <i className="fas fa-lock text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Locked</h6>
                  <h4 className="mb-0 fw-bold text-success">{summaryStats.lockedBills}</h4>
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
                  <i className="fas fa-edit text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Editable</h6>
                  <h4 className="mb-0 fw-bold text-warning">{summaryStats.editableBills}</h4>
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
                  <h6 className="card-title text-muted mb-1">Bills with Damage</h6>
                  <h4 className="mb-0 fw-bold text-warning">{summaryStats.billsWithDamage}</h4>
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
                      placeholder="Search bills, distributors..."
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
      {getFilteredBills().length > 0 && (
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
                        id="selectAllBills"
                        checked={selectedBills.length === getFilteredBills().length && getFilteredBills().length > 0}
                        onChange={selectAllBills}
                      />
                      <label className="form-check-label" htmlFor="selectAllBills">
                        Select All ({selectedBills.length}/{getFilteredBills().length})
                      </label>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={bulkDeleteBills}
                      disabled={selectedBills.length === 0}
                    >
                      <i className="fas fa-trash me-1"></i>
                      Delete ({selectedBills.length})
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setSelectedBills([])}
                      disabled={selectedBills.length === 0}
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

      {/* Bills Display */}
      {getFilteredBills().length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-file-invoice fa-3x text-muted mb-3"></i>
          <h6 className="text-muted">No Bills Found</h6>
          <p className="text-muted">
            {safeBills.length === 0 ? "No bills are currently available" : "No bills match your search criteria"}
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
                         <div className="d-flex align-items-center">
                           <div className="form-check me-2">
                             <input
                               className="form-check-input"
                               type="checkbox"
                               checked={selectedBills.includes(bill._id)}
                               onChange={() => toggleBillSelection(bill._id)}
                             />
                           </div>
                           <div className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                             style={{ width: '40px', height: '40px' }}>
                             <i className="fas fa-file-invoice fa-sm text-primary"></i>
                           </div>
                         </div>
                         <span className={`fs-7 fw-bold px-2 py-1 rounded ${bill.locked ? 'bg-success' : 'bg-warning'}`}>
                           {bill.locked ? 'Locked' : 'Editable'}
                         </span>
                       </div>
                     </div>
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title fw-bold text-center mb-3">Bill #{bill._id.slice(-6)}</h6>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-building text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Distributor</small>
                              <span className="fw-semibold">{bill.distributorId?.distributorName || bill.distributorId?.name || bill.distributorId?.companyName || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-calendar text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Bill Date</small>
                              <span className="fw-semibold">{new Date(bill.billDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-shopping-cart text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Order ID</small>
                              <span className="fw-semibold">{bill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-boxes text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Items</small>
                              <span className="fw-semibold">{bill.items?.length || 0}</span>
                            </div>
                          </div>
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
                        <div className="d-flex gap-2 flex-wrap">
                          <button className="btn btn-outline-info btn-sm flex-fill" onClick={() => viewBill(bill)}>
                            <i className="fas fa-eye me-1"></i>
                            View
                          </button>
                          {!bill.locked && (
                            <button className="btn btn-outline-warning btn-sm flex-fill">
                              <i className="fas fa-edit me-1"></i>
                              Edit
                            </button>
                          )}
                          <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => showDeleteBillModal(bill)}>
                            <i className="fas fa-trash me-1"></i>
                            Delete
                          </button>
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
            <div className="card border shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Bill ID</th>
                        <th>Distributor</th>
                        <th>Bill Date</th>
                        <th>Order ID</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredBills().map(bill => (
                        <tr key={bill._id}>
                          <td>
                            <span className="badge bg-secondary text-white">
                              #{bill._id.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-building me-2 text-muted"></i>
                              {bill.distributorId?.distributorName || bill.distributorId?.name || bill.distributorId?.companyName || "Unknown"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-calendar me-2 text-muted"></i>
                              {new Date(bill.billDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-shopping-cart me-2 text-muted"></i>
                              {bill.orderId?._id?.slice(-6).toUpperCase() || "N/A"}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info text-white">
                              {bill.items?.length || 0}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-success text-white">
                              ₹{bill.totalAmount?.toFixed(2) || '0.00'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${bill.locked ? 'bg-success' : 'bg-warning text-dark'}`}>
                              <i className={`fas ${bill.locked ? 'fa-lock' : 'fa-edit'} me-1`}></i>
                              {bill.locked ? 'Locked' : 'Editable'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-outline-info btn-sm" onClick={() => viewBill(bill)}>
                                <i className="fas fa-eye"></i>
                              </button>
                              {!bill.locked && (
                                <button className="btn btn-outline-warning btn-sm">
                                  <i className="fas fa-edit"></i>
                                </button>
                              )}
                              <button className="btn btn-outline-danger btn-sm" onClick={() => showDeleteBillModal(bill)}>
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
                           <td>{item.quantity} {item.unit || 'tub'}</td>
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
      {/* Delete Bill Modal */}
      {showDeleteModal && selectedBillForDelete && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBillForDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Bill"
          message="Are you sure you want to delete this bill?"
          itemName={`Bill #${selectedBillForDelete._id.slice(-6)}`}
          itemDetails={`Bill for ${selectedBillForDelete.distributorId?.companyName || selectedBillForDelete.distributorId?.distributorName || selectedBillForDelete.distributorId?.name || 'Unknown Company'} - ₹${selectedBillForDelete.totalAmount?.toFixed(2) || '0.00'}`}
          confirmText="Delete Bill"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default BillsHistory;
