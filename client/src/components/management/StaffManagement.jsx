import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";

const StaffManagement = () => {
  // State to store the list of staff fetched from the server
  const [staffList, setStaffList] = useState([]);

  // Form input states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Feedback message state
  const [message, setMessage] = useState("");

  // Get logged-in admin token from auth context
  const { token } = useAuth();

  const roles = ["admin", "staff"];

  // Fetch staff list on component mount
  const fetchStaff = useCallback(async () => {
    try {
      const data = await apiService.get('/admin/staff');
      setStaffList(data);
    } catch (err) {
      setMessage("Failed to fetch staff.");
      console.error("Fetch staff error:", err);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filter staff based on search criteria
  const getFilteredStaff = () => {
    let filtered = staffList;

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(member => member.role === selectedRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.toLowerCase().includes(searchTerm.toLowerCase())
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
    const activeCount = filteredStaff.filter(member => member.status !== 'inactive').length;

    return { totalStaff, adminCount, staffCount, activeCount };
  };

  const summaryStats = getSummaryStats();

  // Reset form fields
  const resetForm = () => {
    setName("");
    setRole("");
    setUsername("");
    setPassword("");
    setEmail("");
    setPhone("");
    setEditingStaff(null);
    setShowEditForm(false);
    setShowAddForm(false);
  };

  // Handle adding a new staff member
  const addStaff = async (e) => {
    e.preventDefault();
    setMessage("");

    // Basic form validation
    if (!name.trim() || !role.trim() || !username.trim() || !password) {
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE}/admin/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, role, username, password, email, phone }),
      });

      if (res.ok) {
        setMessage("Staff added successfully.");
        resetForm();
        fetchStaff();
      } else {
        let errorMsg = "Failed to add staff.";
        try {
          const errorData = await res.json();
          if (errorData.message) errorMsg = errorData.message;
        } catch { }
        setMessage(errorMsg);
      }
    } catch (err) {
      setMessage("Server error when adding staff.");
      console.error("Add staff error:", err);
    }
  };

  // Handle editing a staff member
  const editStaff = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!editingStaff) return;

    // Basic form validation
    if (!name.trim() || !role.trim() || !username.trim()) {
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch(`${config.API_BASE}/admin/staff/${editingStaff._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, role, username, email, phone, password }),
      });

      if (res.ok) {
        setMessage("Staff updated successfully.");
        resetForm();
        fetchStaff();
      } else {
        let errorMsg = "Failed to update staff.";
        try {
          const errorData = await res.json();
          if (errorData.message) errorMsg = errorData.message;
        } catch { }
        setMessage(errorMsg);
      }
    } catch (err) {
      setMessage("Server error when updating staff.");
      console.error("Update staff error:", err);
    }
  };

  // Start editing a staff member
  const startEdit = (staff) => {
    setEditingStaff(staff);
    setName(staff.name || "");
    setRole(staff.role || "");
    setUsername(staff.username || "");
    setPassword(""); // Don't pre-fill password for security
    setEmail(staff.email || "");
    setPhone(staff.phone || "");
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // Handle deleting a staff member
  const deleteStaff = async (id) => {
    if (!window.confirm("Are you sure to delete this staff member?")) return;

    try {
      const res = await fetch(`${config.API_BASE}/admin/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage("Staff deleted successfully.");
        fetchStaff();
      } else {
        setMessage("Failed to delete staff.");
      }
    } catch (err) {
      setMessage("Server error when deleting staff.");
      console.error("Delete staff error:", err);
    }
  };

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
                Staff Management
              </h3>
              <p className="mb-0 text-muted">Add, edit, and manage staff members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card border shadow-sm h-100 border-top border-4 border-primary">
            <div className="card-body text-center">
              <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '50px', height: '50px' }}>
                <i className="fas fa-users text-white"></i>
              </div>
              <h4 className="fw-bold text-primary mb-1">{summaryStats.totalStaff}</h4>
              <p className="text-muted mb-0">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card border shadow-sm h-100 border-top border-4 border-danger">
            <div className="card-body text-center">
              <div className="bg-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '50px', height: '50px' }}>
                <i className="fas fa-user-shield text-white"></i>
              </div>
              <h4 className="fw-bold text-danger mb-1">{summaryStats.adminCount}</h4>
              <p className="text-muted mb-0">Admins</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card border shadow-sm h-100 border-top border-4 border-secondary">
            <div className="card-body text-center">
              <div className="bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '50px', height: '50px' }}>
                <i className="fas fa-user-tie text-white"></i>
              </div>
              <h4 className="fw-bold text-secondary mb-1">{summaryStats.staffCount}</h4>
              <p className="text-muted mb-0">Staff</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
                                <div className="card border shadow-sm h-100 border-top border-4 border-info">
            <div className="card-body text-center">
              <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '50px', height: '50px' }}>
                <i className="fas fa-user-check text-white"></i>
              </div>
              <h4 className="fw-bold text-info mb-1">{summaryStats.activeCount}</h4>
              <p className="text-muted mb-0">Active</p>
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
                      placeholder="Search staff by name, username, role, email, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-3 col-md-6">
                  <select
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
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

      {/* Add Staff Button */}
      <div className="row mb-4">
        <div className="col-12">
          <button
            className="btn btn-success"
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
          >
            <i className={`fas ${showAddForm ? 'fa-minus' : 'fa-plus'} me-2`}></i>
            {showAddForm ? 'Hide Add Form' : 'Add New Staff'}
          </button>
        </div>
      </div>

             {/* Add Staff Form */}
       {showAddForm && (
         <div className="card border shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0"><i className="fas fa-user-plus me-2"></i>Add New Staff Member</h6>
          </div>
          <div className="card-body">
            <form onSubmit={addStaff}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-user me-1"></i>Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-user-tag me-1"></i>Role *
                  </label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-at me-1"></i>Username *
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
                    <i className="fas fa-lock me-1"></i>Password *
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
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-envelope me-1"></i>Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-phone me-1"></i>Phone
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <i className="fas fa-save me-2"></i>Add Staff Member
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

                    {/* Edit Staff Form */}
        {showEditForm && (
          <div className="card border shadow-sm mb-4">
          <div className="card-header bg-warning text-dark">
            <h6 className="mb-0"><i className="fas fa-user-edit me-2"></i>Edit Staff Member: {editingStaff?.name}</h6>
          </div>
          <div className="card-body">
            <form onSubmit={editStaff}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-user me-1"></i>Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-user-tag me-1"></i>Role *
                  </label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-at me-1"></i>Username *
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
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-envelope me-1"></i>Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-phone me-1"></i>Phone
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="col-12">
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-warning"
                    >
                      <i className="fas fa-save me-2"></i>Update Staff Member
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
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

      {/* Staff Display */}
      {getFilteredStaff().length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-users fa-3x text-muted mb-3"></i>
          <h6 className="text-muted">No Staff Found</h6>
          <p className="text-muted">
            {staffList.length === 0 ? "No staff members are currently registered" : "No staff match your search criteria"}
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
                      <h6 className="card-title fw-bold">{member.name}</h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-briefcase text-muted me-2" style={{ width: '16px' }}></i>
                          <span className="text-muted me-2">Role:</span>
                          <span className="fw-medium">{member.role}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-at text-muted me-2" style={{ width: '16px' }}></i>
                          <span className="text-muted me-2">Username:</span>
                          <span className="fw-medium">{member.username}</span>
                        </div>
                        {member.email && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-envelope text-muted me-2" style={{ width: '16px' }}></i>
                            <span className="text-muted me-2">Email:</span>
                            <span className="fw-medium">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-phone text-muted me-2" style={{ width: '16px' }}></i>
                            <span className="text-muted me-2">Phone:</span>
                            <span className="fw-medium">{member.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-warning btn-sm flex-fill" onClick={() => startEdit(member)} title="Edit staff">
                          <i className="fas fa-edit me-1"></i>Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => deleteStaff(member._id)} title="Delete staff">
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
                        <th>Name</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
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
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-outline-warning btn-sm" onClick={() => startEdit(member)} title="Edit staff">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => deleteStaff(member._id)} title="Delete staff">
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

export default StaffManagement;