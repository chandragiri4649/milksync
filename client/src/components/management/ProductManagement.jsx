import React, { useEffect, useState, useCallback, useRef } from "react";
import apiService from "../../utils/apiService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteModal from "../DeleteModal";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [productName, setProductName] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productUnit, setProductUnit] = useState("ml");
  const [costPerPacket, setCostPerPacket] = useState("");
  const [costPerTub, setCostPerTub] = useState("");
  const [packetsPerTub, setPacketsPerTub] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editProductId, setEditProductId] = useState(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistributorFilter, setSelectedDistributorFilter] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showAddForm, setShowAddForm] = useState(false);

  const formRef = useRef();

  const units = ["ml", "kg", "gm"];

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder-product.jpg";
    // If it's already a complete URL (Cloudinary), use it as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a local path, prepend the base URL
    return `${process.env.REACT_APP_IMAGE_BASE_URL || ''}${imageUrl}`;
  };

  // fetch distributors
  const fetchDistributors = useCallback(async () => {
    try {
      const data = await apiService.get('/distributor');
      setDistributors(data);
    } catch {
      toast.error("Failed to fetch distributors.");
    }
  }, []);

  // fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(data);
    } catch {
      toast.error("Failed to fetch products.");
    }
  }, []);

  useEffect(() => {
    fetchDistributors();
    fetchProducts();
  }, [fetchDistributors, fetchProducts]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDeleteModal) {
        setShowDeleteModal(false);
        setProductToDelete(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDeleteModal]);

  // Filter products based on search criteria
  const getFilteredProducts = () => {
    let filtered = products;

    // Filter by distributor
    if (selectedDistributorFilter) {
      filtered = filtered.filter(product => {
        const productDistributorId = typeof product.distributorId === 'object' ? product.distributorId._id : product.distributorId;
        return productDistributorId === selectedDistributorFilter;
      });
    }

    // Filter by unit
    if (selectedUnit) {
      filtered = filtered.filter(product => product.productUnit === selectedUnit);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => {
        const productDistributorId = typeof product.distributorId === 'object' ? product.distributorId._id : product.distributorId;
        const distributor = distributors.find(d => d._id === productDistributorId);
        const distributorName = distributor ? distributor.companyName : '';
        
        return (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.productUnit || "").toLowerCase().includes(searchTerm.toLowerCase())
      });
    }

    return filtered;
  };

  // Export products to CSV
  const exportToCSV = () => {
    const filteredProducts = getFilteredProducts();
    if (filteredProducts.length === 0) {
      toast.warning("No products to export");
      return;
    }

    const csvContent = [
      ["Distributor", "Product Name", "Product Quantity", "Product Unit", "Cost Per Tub", "Cost Per Packet", "Packets Per Tub", "Total Value"],
      ...filteredProducts.map(product => {
        const productDistributorId = typeof product.distributorId === 'object' ? product.distributorId._id : product.distributorId;
        const distributor = distributors.find(d => d._id === productDistributorId);
        const distributorName = distributor ? distributor.companyName : 'Unknown';
        
        return [
          distributorName,
          product.name || "N/A",
          product.productQuantity || "N/A",
          product.productUnit || "N/A",
          product.costPerTub || "N/A",
          product.costPerPacket || "N/A",
          product.packetsPerTub || "N/A",
          ((product.costPerTub || 0) * (product.productQuantity || 0)).toFixed(2)
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Products list exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredProducts = getFilteredProducts();
    const totalProducts = filteredProducts.length;
    const totalDistributors = [...new Set(filteredProducts.map(p => {
      const productDistributorId = typeof p.distributorId === 'object' ? p.distributorId._id : p.distributorId;
      return productDistributorId;
    }))].length;
    const totalValue = filteredProducts.reduce((sum, p) =>
      sum + ((p.costPerPacket || 0) * (p.packetsPerTub || 0)), 0
    );
    const totalPackets = filteredProducts.reduce((sum, p) => sum + (p.packetsPerTub || 0), 0);

    return { totalProducts, totalDistributors, totalValue, totalPackets };
  };

  const summaryStats = getSummaryStats();

  // image onChange
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // add product
  const addProduct = async (e) => {
    e.preventDefault();

    if (
      !selectedDistributorId ||
      !productName.trim() ||
      !productQuantity.trim() ||
      !costPerTub ||
      !costPerPacket ||
      !packetsPerTub
    ) {
      toast.error("All required fields must be filled.");
      return;
    }
    if (!imageFile) {
      toast.error("Please upload a product image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("distributorId", selectedDistributorId);
      formData.append("name", productName);
      formData.append("productQuantity", productQuantity);
      formData.append("productUnit", productUnit);
      formData.append("costPerTub", costPerTub);
      formData.append("costPerPacket", costPerPacket);
      formData.append("packetsPerTub", packetsPerTub);
      formData.append("image", imageFile);

      const response = await apiService.post('/products', formData);

      toast.success("Product added successfully!");
      resetForm();
      setShowAddForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Failed to add product.");
      console.error("Add product error:", err);
    }
  };

  // UPDATE existing product
  const updateProduct = async (e) => {
    e.preventDefault();

    if (
      !selectedDistributorId ||
      !productName.trim() ||
      (typeof productQuantity === "string" ? !productQuantity.trim() : !productQuantity) ||
      !costPerTub ||
      !costPerPacket ||
      !packetsPerTub
    ) {
      toast.error("All required fields must be filled.");
      return;
    }

    const formData = new FormData();
    formData.append("distributorId", selectedDistributorId);
    formData.append("name", productName);
    formData.append("productQuantity", productQuantity);
    formData.append("productUnit", productUnit);
    formData.append("costPerTub", costPerTub);
    formData.append("costPerPacket", costPerPacket);
    formData.append("packetsPerTub", packetsPerTub);
    if (imageFile) formData.append("image", imageFile);

    try {
      const response = await apiService.put(`/products/${editProductId}`, formData);

      toast.success("Product updated successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Failed to update product.");
      console.error("Update product error:", err);
    }
  };

  // delete product
  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure to delete this product?")) return;
    try {
      await apiService.delete(`/products/${id}`);

      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Failed to delete product.");
      console.error("Delete product error:", err);
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!productToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.delete(`/products/${productToDelete._id}`);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Failed to delete product.");
      console.error("Delete product error:", err);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  // ENABLE edit mode
  const editProduct = (p) => {
    const productDistributorId = typeof p.distributorId === 'object' ? p.distributorId._id : p.distributorId;
    setSelectedDistributorId(productDistributorId);
    setProductName(p.name);
    setProductQuantity(p.productQuantity);
    setProductUnit(p.productUnit);
    setCostPerTub(p.costPerTub);
    setCostPerPacket(p.costPerPacket);
    setPacketsPerTub(p.packetsPerTub);
    setPreview(getImageUrl(p.imageUrl));
    setImageFile(null);
    setEditProductId(p._id);
    setShowAddForm(true);
    // Scroll to the form after a short delay to ensure it's rendered
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const resetForm = () => {
    setSelectedDistributorId("");
    setProductName("");
    setProductQuantity("");
    setProductUnit("ml");
    setCostPerTub("");
    setCostPerPacket("");
    setPacketsPerTub("");
    setImageFile(null);
    setPreview("");
    setEditProductId(null);
  };

  // Get unique distributors for filter
  const getUniqueDistributors = () => {
    return distributors.map(dist => ({
      _id: dist._id,
      name: dist.companyName
    }));
  };

  // Get distributor name by ID
  const getDistributorName = (distributorId) => {
    // Handle case where distributorId might be a populated object
    let actualDistributorId = distributorId;
    if (distributorId && typeof distributorId === 'object' && distributorId._id) {
      actualDistributorId = distributorId._id;
    }
    
    const distributor = distributors.find(d => d._id === actualDistributorId);
    
    // If distributorId is a populated object, return the company name directly
    if (distributorId && typeof distributorId === 'object' && distributorId.companyName) {
      return distributorId.companyName;
    }
    
    return distributor ? distributor.companyName : 'Unknown';
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div
              className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{ width: '60px', height: '60px' }}
            >
              <i className="fas fa-box fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">
                Product Management
              </h3>
              <p className="text-muted mb-0">Add, edit, and manage products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-warning">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-boxes text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Products</h6>
                  <h4 className="mb-0 fw-bold text-warning">{summaryStats.totalProducts}</h4>
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
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-success">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-rupee-sign text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Value</h6>
                  <h4 className="mb-0 fw-bold text-success">₹{summaryStats.totalValue.toFixed(2)}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-primary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px' }}>
                  <i className="fas fa-layer-group text-white"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Packets</h6>
                  <h4 className="mb-0 fw-bold text-primary">{summaryStats.totalPackets}</h4>
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
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '200px' }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={selectedDistributorFilter}
                    onChange={(e) => setSelectedDistributorFilter(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="">All Distributors</option>
                    {getUniqueDistributors().map(distributor => (
                      <option key={distributor._id} value={distributor._id}>{distributor.name}</option>
                    ))}
                  </select>
                  <select
                    className="form-select"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="">All Units</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit.toUpperCase()}</option>
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

      {/* Enhanced Add Product Button Section */}
      <div className="row mb-4">
        <div className="col-12 text-center">
          <button
            className="btn btn-primary btn-lg px-5 py-3 fw-bold fs-5 shadow"
            style={{
              borderRadius: '50px',
              minWidth: '250px'
            }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <i className={`fas ${showAddForm ? 'fa-minus' : 'fa-plus'} me-3 fs-4`}></i>
            {showAddForm ? 'Hide Add Form' : 'Add New Product'}
          </button>
          
          {!showAddForm && (
            <p className="mt-3 mb-0 text-muted fs-6">
              <i className="fas fa-info-circle me-2"></i>
              Click to add a new product to your inventory
            </p>
          )}
        </div>
      </div>

      {/* Add/Edit Product Form */}
      {showAddForm && (
        <div className="card border shadow-sm mb-4" ref={formRef}>
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0">
              <i className={`fas ${editProductId ? 'fa-edit' : 'fa-plus'} me-2`}></i>
              {editProductId ? 'Edit Product' : 'Add New Product'}
            </h6>
          </div>
          <div className="card-body">
            <form onSubmit={editProductId ? updateProduct : addProduct}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-truck me-1"></i>Distributor
                  </label>
                  <select
                    className="form-select"
                    value={selectedDistributorId}
                    onChange={(e) => setSelectedDistributorId(e.target.value)}
                    required
                  >
                    <option value="">Select a distributor</option>
                    {distributors.map(distributor => (
                      <option key={distributor._id} value={distributor._id}>
                        {distributor.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-box me-1"></i>Product Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="fas fa-weight me-1"></i>Product Quantity
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(e.target.value)}
                    placeholder="Enter product quantity"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="fas fa-ruler me-1"></i>Product Unit
                  </label>
                  <select
                    className="form-select"
                    value={productUnit}
                    onChange={(e) => setProductUnit(e.target.value)}
                    required
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="fas fa-rupee-sign me-1"></i>Cost Per Packet
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={costPerPacket}
                    onChange={(e) => setCostPerPacket(e.target.value)}
                    placeholder="Enter cost"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="fas fa-tag me-1"></i>Cost Per Tub (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={costPerTub}
                    onChange={(e) => setCostPerTub(e.target.value)}
                    placeholder="Enter cost per tub"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="fas fa-layer-group me-1"></i>Packets Per Tub
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={packetsPerTub}
                    onChange={(e) => setPacketsPerTub(e.target.value)}
                    placeholder="Enter packets count"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-image me-1"></i>Product Image
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!editProductId}
                  />
                </div>
                {preview && (
                  <div className="col-12">
                    <label className="form-label">
                      <i className="fas fa-eye me-1"></i>Image Preview
                    </label>
                    <div className="text-center">
                      <img
                        src={preview}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  </div>
                )}
                <div className="col-12">
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <i className={`fas ${editProductId ? 'fa-save' : 'fa-plus'} me-2`}></i>
                      {editProductId ? 'Update Product' : 'Add Product'}
                    </button>
                    {editProductId && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetForm}
                      >
                        <i className="fas fa-times me-2"></i>Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Display */}
      {getFilteredProducts().length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-box fa-3x text-muted mb-3"></i>
          <h6 className="text-muted">No Products Found</h6>
          <p className="text-muted">
            {products.length === 0 ? "No products are currently registered" : "No products match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="row g-4">
              {getFilteredProducts().map((product) => (
                <div key={product._id} className="col-lg-4 col-md-6">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-primary text-white" >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px' }}>
                          <i className="fas fa-box text-white"></i>
                        </div>
                        <span className="badge bg-white text-primary rounded-pill px-3 py-2">{product.productUnit}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <img
                          src={getImageUrl(product.imageUrl)}
                          alt={product.name}
                          className="img-fluid rounded"
                          style={{ maxHeight: '150px', width: 'auto' }}
                        />
                      </div>
                      <h6 className="card-title fw-bold text-center mb-3">{product.name}</h6>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-truck text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Company Name</small>
                              <span className="fw-semibold">{getDistributorName(product.distributorId)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-weight text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Product Quantity</small>
                              <span className="fw-semibold">{product.productQuantity} {product.productUnit}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-rupee-sign text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Cost Per Tub</small>
                              <span className="fw-semibold">₹{product.costPerTub}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-rupee-sign text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Cost Per Packet</small>
                              <span className="fw-semibold">₹{product.costPerPacket}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="d-flex align-items-center p-2 bg-light rounded">
                            <i className="fas fa-layer-group text-primary me-3" style={{ width: '20px' }}></i>
                            <div>
                              <small className="text-muted d-block">Packets Per Tub</small>
                              <span className="fw-semibold">{product.packetsPerTub}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-warning btn-sm flex-fill" onClick={() => editProduct(product)} title="Edit product">
                          <i className="fas fa-edit me-1"></i>Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => showDeleteConfirmation(product)} title="Delete product">
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
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Distributor</th>
                        <th>Product Quantity</th>
                        <th>Product Unit</th>
                        <th>Cost Per Tub</th>
                        <th>Cost Per Packet</th>
                        <th>Packets Per Tub</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredProducts().map(product => (
                        <tr key={product._id}>
                          <td>
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="rounded"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-box me-2 text-muted"></i>
                              {product.name}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-truck me-2 text-muted"></i>
                              {getDistributorName(product.distributorId)}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-weight me-2 text-muted"></i>
                              {product.productQuantity}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {product.productUnit.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-tag me-2 text-muted"></i>
                              ₹{product.costPerTub}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-rupee-sign me-2 text-muted"></i>
                              ₹{product.costPerPacket}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-layer-group me-2 text-muted"></i>
                              {product.packetsPerTub}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-warning" onClick={() => editProduct(product)} title="Edit product">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => showDeleteConfirmation(product)} title="Delete product">
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

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirm Delete Product"
        message="Are you sure you want to delete this product?"
        itemName={productToDelete?.name}
        itemImage={productToDelete ? getImageUrl(productToDelete.imageUrl) : null}
        itemDetails={
          productToDelete ? (
            <>
              <p className="text-muted mb-1">
                <i className="fas fa-truck me-1"></i>
                {getDistributorName(productToDelete.distributorId)}
              </p>
              <p className="text-muted mb-1">
                <i className="fas fa-weight me-1"></i>
                {productToDelete.productQuantity} {productToDelete.productUnit}
              </p>
              <p className="text-muted mb-0">
                <i className="fas fa-rupee-sign me-1"></i>
                ₹{productToDelete.costPerTub} per tub
              </p>
            </>
          ) : null
        }
        loading={deleteLoading}
        confirmText="Delete Product"
      />

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
        theme="dark"
      />
    </div>
  );
};

export default ProductManagement;
