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
        (dist.distributorName || dist.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        dist.companyName || "N/A",
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
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{width: '60px', height: '60px'}}
            >
              <i className="fas fa-truck fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                Distributor List
              </h3>
              <p className="mb-0 text-muted">View and manage all distributors</p>
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

      {/* Summary Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-info">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-truck text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Distributors</h6>
                  <h4 className="mb-0 fw-bold text-info">{summaryStats.totalDistributors}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-success">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-check-circle text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Active</h6>
                  <h4 className="mb-0 fw-bold text-success">{summaryStats.activeCount}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-danger">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-times-circle text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Inactive</h6>
                  <h4 className="mb-0 fw-bold text-danger">{summaryStats.inactiveCount}</h4>
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
                      placeholder="Search distributors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '200px' }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
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

      {/* Distributors Display */}
      {getFilteredDistributors().length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-truck fa-3x text-muted mb-3"></i>
          <h6 className="text-muted">No Distributors Found</h6>
          <p className="text-muted">
            {distributors.length === 0 ? "No distributors are currently registered" : "No distributors match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row g-4">
              {getFilteredDistributors().map((dist) => (
                <div key={dist._id} className="col-lg-4 col-md-6">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-primary text-white">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px' }}>
                          <i className="fas fa-truck text-white"></i>
                        </div>
                        <span className={`badge ${dist.status === 'active' ? 'bg-success' : dist.status === 'inactive' ? 'bg-danger' : 'bg-warning'}`}>
                          {dist.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h6 className="card-title fw-bold text-center mb-3">{dist.distributorName || dist.companyName || "Unnamed"}</h6>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-building text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Company</small>
                              <span className="fw-semibold">{dist.companyName}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-at text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Username</small>
                              <span className="fw-semibold">{dist.username}</span>
                            </div>
                          </div>
                        </div>
                        
                        {dist.contact && (
                          <div className="col-12">
                            <div className="d-flex align-items-center p-2 bg-light rounded">
                              <i className="fas fa-phone text-primary me-3" style={{ width: '20px' }}></i>
                              <div>
                                <small className="text-muted d-block">Contact</small>
                                <span className="fw-semibold">{dist.contact}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-toggle-on text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Status</small>
                              <span className={`fw-semibold badge ${dist.status === 'active' ? 'bg-success' : dist.status === 'inactive' ? 'bg-danger' : 'bg-warning'}`}>
                                {dist.status || 'pending'}
                              </span>
                            </div>
                          </div>
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
                              {dist.companyName}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-truck me-2 text-muted"></i>
                              {dist.distributorName || dist.companyName || "Unnamed"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-at me-2 text-muted"></i>
                              {dist.username}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-phone me-2 text-muted"></i>
                              {dist.contact || "N/A"}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${dist.status === 'active' ? 'bg-success' : dist.status === 'inactive' ? 'bg-danger' : 'bg-warning'}`}>
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
