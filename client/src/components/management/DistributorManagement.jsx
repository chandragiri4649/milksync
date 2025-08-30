import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";

const DistributorManagement = () => {
  const [distributors, setDistributors] = useState([]);

  // New state for distributor's personal name
  const [distributorName, setDistributorName] = useState("");

  // Existing form states
  const [companyName, setCompanyName] = useState("");
  const [contact, setContact] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Edit form states
  const [editDistributorName, setEditDistributorName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const [message, setMessage] = useState("");
  const { token } = useAuth();

  const statuses = ["active", "inactive", "pending"];

  // Fetch distributors list
  const fetchDistributors = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/admin/distributors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch distributors");
      const data = await res.json();
      setDistributors(data);
    } catch {
      setMessage("Failed to fetch distributors.");
    }
  }, [token]);

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

  // Add distributor
  const addDistributor = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!distributorName.trim() || !companyName.trim() || !username.trim() || !password) {
      setMessage("Distributor name, company name, username, and password are required.");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE}/admin/distributors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          distributorName,
          name: companyName,
          contact,
          username,
          password,
        }),
      });

      if (res.ok) {
        setMessage("Distributor added successfully.");
        // Clear form
        setDistributorName("");
        setCompanyName("");
        setContact("");
        setUsername("");
        setPassword("");
        setShowAddForm(false);
        if (showEditForm) {
          resetEditForm();
        }
        fetchDistributors();
      } else {
        let errorText = "Failed to add distributor.";
        try {
          const errData = await res.json();
          if (errData.message) errorText = errData.message;
        } catch { }
        setMessage(errorText);
      }
    } catch {
      setMessage("Server error when adding distributor.");
    }
  };

  // Delete distributor
  const deleteDistributor = async (id) => {
    if (!window.confirm("Are you sure to delete this distributor?")) return;
    try {
      const res = await fetch(`${config.API_BASE}/admin/distributors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage("Distributor deleted successfully.");
        fetchDistributors();
      } else {
        setMessage("Failed to delete distributor.");
      }
    } catch {
      setMessage("Server error when deleting distributor.");
    }
  };

  // Edit distributor
  const editDistributor = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!editingDistributor) return;

    // Basic form validation
    if (!editDistributorName.trim() || !editCompanyName.trim() || !editUsername.trim()) {
      setMessage("Distributor name, company name, and username are required.");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE}/admin/distributors/${editingDistributor._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          distributorName: editDistributorName,
          name: editCompanyName,
          contact: editContact,
          username: editUsername,
          password: editPassword.trim() || undefined, // Only send password if provided
          status: editStatus,
        }),
      });

      if (res.ok) {
        setMessage("Distributor updated successfully.");
        // Reset form and refresh data
        setEditingDistributor(null);
        setShowEditForm(false);
        resetEditForm();
        fetchDistributors();
      } else {
        let errorText = "Failed to update distributor.";
        try {
          const errData = await res.json();
          if (errData.message) errorText = errData.message;
        } catch { }
        setMessage(errorText);
      }
    } catch (err) {
      setMessage("Server error when updating distributor.");
      console.error("Update distributor error:", err);
    }
  };

  // Start editing a distributor
  const startEdit = (distributor) => {
    setEditingDistributor(distributor);
    setEditDistributorName(distributor.distributorName || distributor.name || "");
    setEditCompanyName(distributor.name || "");
    setEditContact(distributor.contact || "");
    setEditUsername(distributor.username || "");
    setEditStatus(distributor.status || "pending");
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // Reset edit form
  const resetEditForm = () => {
    setEditDistributorName("");
    setEditCompanyName("");
    setEditContact("");
    setEditUsername("");
    setEditPassword("");
    setEditStatus("");
    setEditingDistributor(null);
    setShowEditForm(false);
  };

  // Quick status toggle function
  const toggleStatus = async (distributorId, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'active' : 
                     currentStatus === 'active' ? 'inactive' : 'pending';
    
    try {
      const res = await fetch(`${config.API_BASE}/admin/distributors/${distributorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setMessage(`Status changed from ${currentStatus} to ${newStatus}`);
        fetchDistributors();
      } else {
        setMessage("Failed to update status");
      }
    } catch (err) {
      setMessage("Server error when updating status");
      console.error("Toggle status error:", err);
    }
  };

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
                Distributor Management
              </h3>
              <p className="mb-0 text-muted">Add, edit, and manage distributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-info">
            <div className="card-body text-center">
              <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-truck text-white"></i>
              </div>
              <h4 className="fw-bold text-info mb-1">{summaryStats.totalDistributors}</h4>
              <p className="text-muted mb-0">Total Distributors</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-success">
            <div className="card-body text-center">
              <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-check-circle text-white"></i>
              </div>
              <h4 className="fw-bold text-success mb-1">{summaryStats.activeCount}</h4>
              <p className="text-muted mb-0">Active</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-danger">
            <div className="card-body text-center">
              <div className="bg-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-times-circle text-white"></i>
              </div>
              <h4 className="fw-bold text-danger mb-1">{summaryStats.inactiveCount}</h4>
              <p className="text-muted mb-0">Inactive</p>
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
                <div className="col-lg-4 col-md-6">
                  <div className="position-relative">
                    <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search distributors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-3 col-md-6">
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-3 col-md-6">
                  <button className="btn btn-outline-primary w-100" onClick={exportToCSV}>
                    <i className="fas fa-download me-2"></i>
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Feedback Message */}
      {message && (
        <div className="alert alert-info alert-dismissible fade show">
          <i className="fas fa-info-circle me-2"></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {/* Add Distributor Button */}
      <div className="row mb-4">
        <div className="col-12">
          <button 
            className="btn btn-success"
            onClick={() => {
              if (showEditForm) {
                resetEditForm();
              }
              setShowAddForm(!showAddForm);
            }}
          >
            <i className={`fas ${showAddForm ? 'fa-minus' : 'fa-plus'} me-2`}></i>
            {showAddForm ? 'Hide Add Form' : 'Add New Distributor'}
          </button>
        </div>
      </div>

      {/* Add Distributor Form */}
      {showAddForm && (
        <div className="card border shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0"><i className="fas fa-truck me-2"></i>Add New Distributor</h6>
          </div>
          <div className="card-body">
            <form onSubmit={addDistributor}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-user me-1"></i>Distributor Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={distributorName}
                    onChange={(e) => setDistributorName(e.target.value)}
                    placeholder="Enter distributor's full name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-building me-1"></i>Company Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-phone me-1"></i>Contact
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Enter contact number"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-at me-1"></i>Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-lock me-1"></i>Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="col-12">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    <i className="fas fa-save me-2"></i>Add Distributor
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Distributor Form */}
      {showEditForm && (
        <div className="card border shadow-sm mb-4">
          <div className="card-header bg-warning text-dark">
            <h6 className="mb-0">
              <i className="fas fa-edit me-2"></i>
              Edit Distributor: {editingDistributor?.distributorName || editingDistributor?.name || "Unnamed"}
            </h6>
          </div>
          <div className="card-body">
            <form onSubmit={editDistributor}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-user me-1"></i>Distributor Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editDistributorName}
                    onChange={(e) => setEditDistributorName(e.target.value)}
                    placeholder="Enter distributor's full name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-building me-1"></i>Company Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-phone me-1"></i>Contact
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    placeholder="Enter contact number"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-at me-1"></i>Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-lock me-1"></i>New Password (Optional)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                  <div className="form-text">
                    <i className="fas fa-info-circle me-1"></i>
                    Leave this field empty to keep the current password unchanged
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-toggle-on me-1"></i>Status
                  </label>
                  <select
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-12">
                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-warning"
                    >
                      <i className="fas fa-save me-2"></i>Update Distributor
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={resetEditForm}
                    >
                      <i className="fas fa-times me-2"></i>Cancel
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <div className="card-header bg-primary text-dark">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className=" rounded-circle d-flex align-items-center justify-content-center" 
                             style={{width: '40px', height: '40px'}}>
                          <i className="fas fa-truck text-white"></i>
                        </div>
                        <span className={`badge ${dist.status === 'active' ? 'bg-success' : dist.status === 'inactive' ? 'bg-danger' : 'bg-warning'}`}>
                          {dist.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h6 className="card-title fw-bold">{dist.distributorName || dist.name || "Unnamed"}</h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-building text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Company:</span>
                          <span className="fw-medium">{dist.name}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-at text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Username:</span>
                          <span className="fw-medium">{dist.username}</span>
                        </div>
                        {dist.contact && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-phone text-muted me-2" style={{width: '16px'}}></i>
                            <span className="text-muted me-2">Contact:</span>
                            <span className="fw-medium">{dist.contact}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-warning btn-sm flex-fill" title="Edit distributor" onClick={() => startEdit(dist)}>
                          <i className="fas fa-edit me-1"></i>Edit
                        </button>
                        <button 
                          className="btn btn-outline-info btn-sm flex-fill" 
                          onClick={() => toggleStatus(dist._id, dist.status)}
                          title={`Change status from ${dist.status}`}
                        >
                          <i className="fas fa-sync-alt me-1"></i>
                          Toggle Status
                        </button>
                        <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => deleteDistributor(dist._id)} title="Delete distributor">
                          <i className="fas fa-trash me-1"></i>Delete
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
                        <th>Quick Actions</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDistributors().map(dist => (
                        <tr key={dist._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-building me-2 text-muted"></i>
                              {dist.name}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-truck me-2 text-muted"></i>
                              {dist.distributorName || dist.name || "Unnamed"}
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
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-info" 
                              onClick={() => toggleStatus(dist._id, dist.status)}
                              title={`Change status from ${dist.status}`}
                            >
                              <i className="fas fa-sync-alt"></i>
                            </button>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-warning" title="Edit distributor" onClick={() => startEdit(dist)}>
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteDistributor(dist._id)} title="Delete distributor">
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
    </div>
  );
};

export default DistributorManagement;
