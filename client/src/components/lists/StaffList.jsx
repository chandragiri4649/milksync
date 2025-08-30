import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";

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
      const res = await fetch(`${config.API_BASE}/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch staff");
      }

      const data = await res.json();
      setStaff(data);
    } catch (err) {
      console.error("Could not fetch staff:", err);
      setMessage("Could not fetch staff.");
    } finally {
      setLoading(false);
    }
  }, [token]);

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
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
              <i className="fas fa-users fa-md text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-black">
                Staff List
              </h3>
              <p className="mb-0 small text-muted">View and manage all staff members</p>
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
              <h6 className="mb-0"><i className="fas fa-users me-2"></i>Total Staff</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-primary">{summaryStats.totalStaff}</h3>
              <p className="mb-0 text-muted">All members</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-danger text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-user-shield me-2"></i>Admins</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-danger">{summaryStats.adminCount}</h3>
              <p className="mb-0 text-muted">Administrators</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-success text-white border-0 py-2">
              <h6 className="mb-0"><i className="fas fa-user-tie me-2"></i>Staff</h6>
            </div>
            <div className="card-body text-center">
              <h3 className="fw-bold text-success">{summaryStats.staffCount}</h3>
              <p className="mb-0 text-muted">Regular staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card border shadow-sm mb-4">
        <div className="card-header bg-secondary text-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="fas fa-search me-2"></i>Search & Filter Staff</h6>
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
              <input type="text" className="form-control form-control-sm" placeholder="Search staff by name, username, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold small">
                <i className="fas fa-user-tag me-1"></i>Role
              </label>
              <select className="form-select form-select-sm" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end gap-2">
              <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => { setSelectedRole(""); setSearchTerm(""); }}>
                <i className="fas fa-refresh me-1"></i><span>Clear</span>
              </button>
              <button className="btn btn-sm btn-primary flex-fill" onClick={exportToCSV}>
                <i className="fas fa-download me-1"></i><span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Display */}
      {getFilteredStaff().length === 0 ? (
        <div className="text-center py-5">
          <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
            <i className="fas fa-users fa-2x text-muted"></i>
          </div>
          <h5 className="text-muted">No Staff Found</h5>
          <p className="text-muted">
            {staff.length === 0 ? "No staff members are currently registered" : "No staff match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row">
              {getFilteredStaff().map((member) => (
                <div key={member._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-primary text-white">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                          <i className="fas fa-user fa-sm text-primary"></i>
                        </div>
                        <span className="badge bg-light text-dark px-2 py-1">{member.role}</span>
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column p-3">
                      <h6 className="card-title fw-bold mb-2 text-dark">
                        {member.name}
                      </h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-briefcase me-2 text-muted"></i>
                          <span className="fw-semibold small text-muted">Role:</span>
                          <span className="ms-2 small">{member.role}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-at me-2 text-muted"></i>
                          <span className="fw-semibold small text-muted">Username:</span>
                          <span className="ms-2 small">{member.username}</span>
                        </div>
                        {member.email && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-envelope me-2 text-muted"></i>
                            <span className="fw-semibold small text-muted">Email:</span>
                            <span className="ms-2 small">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-phone me-2 text-muted"></i>
                            <span className="fw-semibold small text-muted">Phone:</span>
                            <span className="ms-2 small">{member.phone}</span>
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
                <h6 className="mb-0"><i className="fas fa-table me-2"></i>Staff Table View</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
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
                            <span className={`badge ${member.role === 'admin' ? 'bg-danger' : 'bg-success'}`}>
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
