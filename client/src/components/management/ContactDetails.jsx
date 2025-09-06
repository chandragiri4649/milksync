import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../utils/apiService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContactDetails = () => {
  const [formData, setFormData] = useState({
    adminName: '',
    adminContact: '',
    adminEmail: '',
    adminAddress: '',
    staffName: '',
    staffContact: ''
  });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('table');

  // Fetch contacts on component mount
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/admin/contact-details');
      setContacts(data);
    } catch (err) {
      toast.error('Failed to fetch contact details: ' + err.message);
      console.error('Fetch contacts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (editingId) {
        await apiService.put(`/admin/contact-details/${editingId}`, formData);
        toast.success('Contact details updated successfully!');
      } else {
        await apiService.post('/admin/contact-details', formData);
        toast.success('Contact details saved successfully!');
      }

      setFormData({
        adminName: '',
        adminContact: '',
        adminEmail: '',
        adminAddress: '',
        staffName: '',
        staffContact: ''
      });
      setEditingId(null);
      fetchContacts();
    } catch (err) {
      toast.error('Failed to save contact details: ' + err.message);
      console.error('Save contact details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact) => {
    setFormData({
      adminName: contact.adminName || '',
      adminContact: contact.adminContact || '',
      adminEmail: contact.adminEmail || '',
      adminAddress: contact.adminAddress || '',
      staffName: contact.staffName || '',
      staffContact: contact.staffContact || ''
    });
    setEditingId(contact._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact detail?')) {
      try {
        setLoading(true);
        
        await apiService.delete(`/admin/contact-details/${id}`);
        toast.success('Contact details deleted successfully!');
        fetchContacts();
      } catch (err) {
        toast.error('Failed to delete contact details: ' + err.message);
        console.error('Delete contact details error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      adminName: '',
      adminContact: '',
      adminEmail: '',
      adminAddress: '',
      staffName: '',
      staffContact: ''
    });
    setEditingId(null);
  };

  // Filter contacts based on search term and filter type
  const getFilteredContacts = () => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (contact.adminName && contact.adminName.toLowerCase().includes(searchLower)) ||
          (contact.adminEmail && contact.adminEmail.toLowerCase().includes(searchLower)) ||
          (contact.adminContact && contact.adminContact.toLowerCase().includes(searchLower)) ||
          (contact.staffName && contact.staffName.toLowerCase().includes(searchLower)) ||
          (contact.staffContact && contact.staffContact.toLowerCase().includes(searchLower))
        );
      });
    }

    if (filterType) {
      switch (filterType) {
        case 'admin':
          filtered = filtered.filter(contact => contact.adminName);
          break;
        case 'staff':
          filtered = filtered.filter(contact => contact.staffName);
          break;
        case 'email':
          filtered = filtered.filter(contact => contact.adminEmail);
          break;
        default:
          break;
      }
    }

    return filtered;
  };

  // Export contacts to CSV
  const exportToCSV = () => {
    const filteredContacts = getFilteredContacts();
    if (filteredContacts.length === 0) {
      toast.warning('No contacts to export');
      return;
    }

    const headers = ['Serial No', 'Admin Name', 'Admin Contact', 'Admin Email', 'Admin Address', 'Staff Name', 'Staff Contact'];
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map((contact, index) => [
        index + 1,
        contact.adminName || '',
        contact.adminContact || '',
        contact.adminEmail || '',
        contact.adminAddress || '',
        contact.staffName || '',
        contact.staffContact || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact_details_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Contacts exported successfully!');
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                width: '60px',
                height: '60px'
              }}
            >
              <i className="bi bi-person-lines-fill fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                Contact Details Management
              </h3>
              <p className="text-muted mb-0 small">Manage admin and staff contact information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-primary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-person-lines-fill text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Contacts</h6>
                  <h4 className="mb-0 fw-bold text-primary">{getFilteredContacts().length}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-success">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-person-badge text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Admin Contacts</h6>
                  <h4 className="mb-0 fw-bold text-success">{getFilteredContacts().filter(c => c.adminName).length}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-info">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-people text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Staff Contacts</h6>
                  <h4 className="mb-0 fw-bold text-info">{getFilteredContacts().filter(c => c.staffName).length}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-warning">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-envelope text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Email Contacts</h6>
                  <h4 className="mb-0 fw-bold text-warning">{getFilteredContacts().filter(c => c.adminEmail).length}</h4>
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
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search contacts..."
                      value={searchTerm || ''}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '200px' }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={filterType || ''}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="">All Types</option>
                    <option value="admin">Admin Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="email">With Email</option>
                  </select>
                  <button className="btn btn-outline-secondary" onClick={() => {
                    setSearchTerm("");
                    setFilterType("");
                  }}>
                    <i className="bi bi-refresh me-2"></i>
                    Clear
                  </button>
                </div>
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('cards')}
                  >
                    <i className="bi bi-grid me-2"></i>
                    Cards
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <i className="bi bi-table me-2"></i>
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="card border shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0 fw-semibold">
            <i className="bi bi-plus-circle me-2"></i>
            {editingId ? 'Edit Contact Details' : 'Add New Contact Details'}
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Admin Details Section */}
              <div className="col-md-6">
                <h6 className="text-primary fw-semibold mb-3">
                  <i className="bi bi-person-badge me-2"></i>
                  Admin Details
                </h6>
                
                <div className="mb-3">
                  <label htmlFor="adminName" className="form-label fw-medium">Admin Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="adminName"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter admin name"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="adminContact" className="form-label fw-medium">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="adminContact"
                    name="adminContact"
                    value={formData.adminContact}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="adminEmail" className="form-label fw-medium">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="adminEmail"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="adminAddress" className="form-label fw-medium">Address</label>
                  <textarea
                    className="form-control"
                    id="adminAddress"
                    name="adminAddress"
                    value={formData.adminAddress}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter address"
                  ></textarea>
                </div>
              </div>

              {/* Staff Details Section */}
              <div className="col-md-6">
                <h6 className="text-primary fw-semibold mb-3">
                  <i className="bi bi-people me-2"></i>
                  Staff Details
                </h6>
                
                <div className="mb-3">
                  <label htmlFor="staffName" className="form-label fw-medium">Staff Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="staffName"
                    name="staffName"
                    value={formData.staffName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter staff name"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="staffContact" className="form-label fw-medium">Staff Contact Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="staffContact"
                    name="staffContact"
                    value={formData.staffContact}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter staff contact number"
                  />
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="d-flex gap-2 mt-3">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {editingId ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingId ? 'Update Contact Details' : 'Save Contact Details'}
                  </>
                )}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="card border shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0 fw-semibold">
            <i className="bi bi-list-ul me-2"></i>
            Contact Details List
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading contact details...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered mb-0">
                <thead className="table-primary">
                  <tr>
                    <th className="text-center" style={{width: '80px'}}>Serial No</th>
                    <th>Admin Name</th>
                    <th>Admin Contact</th>
                    <th>Admin Email</th>
                    <th>Admin Address</th>
                    <th>Staff Name</th>
                    <th>Staff Contact</th>
                    <th className="text-center" style={{width: '150px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredContacts().length > 0 ? (
                    getFilteredContacts().map((contact, index) => (
                      <tr key={contact._id}>
                        <td className="text-center fw-medium">{index + 1}</td>
                        <td className="fw-medium">{contact.adminName || '-'}</td>
                        <td>{contact.adminContact || '-'}</td>
                        <td>{contact.adminEmail || '-'}</td>
                        <td>{contact.adminAddress || '-'}</td>
                        <td className="fw-medium">{contact.staffName || '-'}</td>
                        <td>{contact.staffContact || '-'}</td>
                        <td className="text-center">
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEdit(contact)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(contact._id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        <i className="bi bi-inbox display-6 d-block mb-2"></i>
                        No contact details available
                      </td>
                    </tr>
                  )}
                </tbody>
                {getFilteredContacts().length > 0 && (
                  <tfoot className="table-primary">
                    <tr>
                      <td colSpan="7" className="text-end fw-medium">
                        Total Records:
                      </td>
                      <td className="text-center fw-medium">
                        {getFilteredContacts().length}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default ContactDetails;
