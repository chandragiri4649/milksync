import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";

const DistributorList = () => {
  const { token } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const statuses = ["active", "inactive", "pending"];

  const fetchDistributors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/admin/distributors');
      setDistributors(data);
    } catch (err) {
      console.error("Could not fetch distributors:", err);
      setMessage("Could not fetch distributors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  // Filter distributors based on search criteria
  const getFilteredDistributors = () => {
    let filtered = distributors;
    
    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(dist => dist.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(dist => 
        (dist.distributorName || dist.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dist.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dist.contact || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dist.status || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Export distributors to CSV
  const exportToCSV = () => {
    const filteredDistributors = getFilteredDistributors();
    if (filteredDistributors.length === 0) {
      setMessage("No distributors to export");
      return;
    }

    const csvContent = [
      ["Company Name", "Distributor Name", "Username", "Contact", "Status"],
      ...filteredDistributors.map(dist => [
        dist.name || "N/A",
        dist.distributorName || "N/A",
        dist.username || "N/A",
        dist.contact || "N/A",
        dist.status || "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `distributors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Distributors list exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredDistributors = getFilteredDistributors();
    const totalDistributors = filteredDistributors.length;
    const activeCount = filteredDistributors.filter(dist => dist.status === 'active').length;
    const inactiveCount = filteredDistributors.filter(dist => dist.status === 'inactive').length;
    
    return { totalDistributors, activeCount, inactiveCount };
  };

  const summaryStats = getSummaryStats();

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
          <p className="text-muted mt-3">Loading distributors...</p>
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
              <i className="fas fa-truck fa-md text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-black">
                Distributor List
              </h3>
              <p className="mb-0 small text-muted">View and manage all distributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {error && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          {error}
          <button type="button" className="btn btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-primary text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-truck me-2"></i>Total Distributors</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-primary">{summaryStats.totalDistributors}</h3>
              <p className="mb-0 text-muted">All distributors</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-success text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-check-circle me-2"></i>Active</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-success">{summaryStats.activeCount}</h3>
              <p className="mb-0 text-muted">Active distributors</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-danger text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-times-circle me-2"></i>Inactive</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-danger">{summaryStats.inactiveCount}</h3>
              <p className="mb-0 text-muted">Inactive distributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card border shadow-sm mb-4">
        <div className="card-header bg-secondary text-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="fas fa-search me-2"></i>Search & Filter Distributors</h6>
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
              <input type="text" className="form-control form-control-sm" placeholder="Search distributors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold small">
                <i className="fas fa-filter me-1"></i>Status
              </label>
              <select className="form-select form-select-sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end gap-2">
              <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => { setSelectedStatus(""); setSearchTerm(""); }}>
                <i className="fas fa-refresh me-1"></i>Clear
              </button>
              <button className="btn btn-sm btn-primary flex-fill" onClick={exportToCSV}>
                <i className="fas fa-download me-1"></i>Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Distributors Display */}
      {getFilteredDistributors().length === 0 ? (
        <div className="text-center py-5">
          <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
            <i className="fas fa-truck fa-2x text-muted"></i>
          </div>
          <h5 className="text-muted">No Distributors Found</h5>
          <p className="text-muted">
            {distributors.length === 0 ? "No distributors are currently registered" : "No distributors match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row">
              {getFilteredDistributors().map((dist) => (
                <div key={dist._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-primary text-white">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                          <i className="fas fa-truck fa-sm text-primary"></i>
                        </div>
                        <span className={`badge ${dist.status === 'active' ? 'bg-success' : dist.status === 'inactive' ? 'bg-danger' : 'bg-warning'} text-white px-2 py-1`}>
                          {dist.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column p-3">
                      <h6 className="card-title fw-bold mb-2 text-dark">
                        {dist.distributorName || dist.name || "Unnamed"}
                      </h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-building me-2 text-muted"></i>
                          <span className="fw-semibold small text-muted">Company:</span>
                          <span className="ms-2 small">{dist.name}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-at me-2 text-muted"></i>
                          <span className="fw-semibold small text-muted">Username:</span>
                          <span className="ms-2 small">{dist.username}</span>
                        </div>
                        {dist.contact && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-phone me-2 text-muted"></i>
                            <span className="fw-semibold small text-muted">Contact:</span>
                            <span className="ms-2 small">{dist.contact}</span>
                          </div>
                        )}
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
              <div className="card-header bg-secondary text-white py-2">
                <h6 className="mb-0"><i className="fas fa-table me-2"></i>Distributors Table View</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Company</th>
                        <th>Distributor Name</th>
                        <th>Username</th>
                        <th>Contact</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDistributors().map(dist => (
                        <tr key={dist._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-building me-2 text-muted"></i>
                              <span>{dist.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-truck me-2 text-muted"></i>
                              <span>{dist.distributorName || dist.name || "Unnamed"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-at me-2 text-muted"></i>
                              <span>{dist.username}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-phone me-2 text-muted"></i>
                              <span>{dist.contact || "N/A"}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${dist.status === 'active' ? 'bg-success' : dist.status === 'inactive' ? 'bg-danger' : 'bg-warning'} text-white`}>
                              <i className={`fas ${dist.status === 'active' ? 'fa-check-circle' : dist.status === 'inactive' ? 'fa-times-circle' : 'fa-clock'} me-1`}></i>
                              {dist.status || 'pending'}
                            </span>
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
    </div>
  );
};

export default DistributorList;
