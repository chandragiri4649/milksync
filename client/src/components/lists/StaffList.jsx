import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";

const StaffList = () => {
  const { token } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  const roles = ["admin", "staff"];

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/admin/staff');
      setStaff(data);
    } catch (err) {
      console.error("Could not fetch staff:", err);
      setMessage("Could not fetch staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filter staff based on search criteria
  const getFilteredStaff = () => {
    let filtered = staff;

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(member => member.role === selectedRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Export staff to CSV
  const exportToCSV = () => {
    const filteredStaff = getFilteredStaff();
    if (filteredStaff.length === 0) {
      setMessage("No staff to export");
      return;
    }

    const csvContent = [
      ["Name", "Username", "Role", "Email", "Phone"],
      ...filteredStaff.map(member => [
        member.name || "N/A",
        member.username || "N/A",
        member.role || "N/A",
        member.email || "N/A",
        member.phone || "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Staff list exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredStaff = getFilteredStaff();
    const totalStaff = filteredStaff.length;
    const adminCount = filteredStaff.filter(member => member.role === 'admin').length;
    const staffCount = filteredStaff.filter(member => member.role === 'staff').length;

    return { totalStaff, adminCount, staffCount };
  };

  const summaryStats = getSummaryStats();

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
          <p className="text-muted mt-3">Loading staff...</p>
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
              style={{ width: '60px', height: '60px' }}
            >
              <i className="fas fa-users fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                Staff List
              </h3>
              <p className="mb-0 text-muted">View and manage all staff members</p>
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
          <div className="card border shadow-sm h-100 border-top border-4 border-primary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-users text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Staff</h6>
                  <h4 className="mb-0 fw-bold text-primary">{summaryStats.totalStaff}</h4>
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
                  <i className="fas fa-user-shield text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Admins</h6>
                  <h4 className="mb-0 fw-bold text-danger">{summaryStats.adminCount}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-user-tie text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Staff</h6>
                  <h4 className="mb-0 fw-bold text-secondary">{summaryStats.staffCount}</h4>
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
                      placeholder="Search staff by name, username, role, email, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '200px' }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
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

      {/* Staff Display */}
      {getFilteredStaff().length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-users fa-3x text-muted mb-3"></i>
          <h6 className="text-muted">No Staff Found</h6>
          <p className="text-muted">
            {staff.length === 0 ? "No staff members are currently registered" : "No staff match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row g-4">
              {getFilteredStaff().map((member) => (
                <div key={member._id} className="col-lg-4 col-md-6">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-primary text-white">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px' }}>
                          <i className="fas fa-user text-white"></i>
                        </div>
                        <span className={`badge ${member.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h6 className="card-title fw-bold text-center mb-3">{member.name}</h6>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-briefcase text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Role</small>
                              <span className="fw-semibold">{member.role}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-at text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Username</small>
                              <span className="fw-semibold">{member.username}</span>
                            </div>
                          </div>
                        </div>
                        
                        {member.email && (
                          <div className="col-12">
                            <div className="d-flex align-items-center p-2 bg-light rounded">
                              <i className="fas fa-envelope text-primary me-3" style={{ width: '20px' }}></i>
                              <div>
                                <small className="text-muted d-block">Email</small>
                                <span className="fw-semibold">{member.email}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {member.phone && (
                          <div className="col-12">
                            <div className="d-flex align-items-center p-2 bg-light rounded">
                              <i className="fas fa-phone text-primary me-3" style={{ width: '20px' }}></i>
                              <div>
                                <small className="text-muted d-block">Phone</small>
                                <span className="fw-semibold">{member.phone}</span>
                              </div>
                            </div>
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
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStaff().map(member => (
                        <tr key={member._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-user me-2 text-muted"></i>
                              {member.name}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-at me-2 text-muted"></i>
                              {member.username}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${member.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                              <i className={`fas ${member.role === 'admin' ? 'fa-user-shield' : 'fa-user-tie'} me-1`}></i>
                              {member.role}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-envelope me-2 text-muted"></i>
                              {member.email || "N/A"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-phone me-2 text-muted"></i>
                              {member.phone || "N/A"}
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
    </div>
  );
};

export default StaffList;
