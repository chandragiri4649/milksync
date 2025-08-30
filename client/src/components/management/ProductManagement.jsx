import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import config from "../../config";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [company, setCompany] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("ml");
  const [costPerPacket, setCostPerPacket] = useState("");
  const [costPerTub, setCostPerTub] = useState("");
  const [packetsPerTub, setPacketsPerTub] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editProductId, setEditProductId] = useState(null);
  const [message, setMessage] = useState("");
  
  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showAddForm, setShowAddForm] = useState(false);

  const { token } = useAuth();
  const formRef = useRef();

  const units = ["ml", "kg", "gm"];

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder-product.jpg";
    // If it's already a complete URL (Cloudinary), use it as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a local path, prepend the base URL
    return `${config.IMAGE_BASE_URL}${imageUrl}`;
  };

  // fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch {
      setMessage("Failed to fetch products.");
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on search criteria
  const getFilteredProducts = () => {
    let filtered = products;
    
    // Filter by company
    if (selectedCompany) {
      filtered = filtered.filter(product => product.company === selectedCompany);
    }

    // Filter by unit
    if (selectedUnit) {
      filtered = filtered.filter(product => product.unit === selectedUnit);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.unit || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Export products to CSV
  const exportToCSV = () => {
    const filteredProducts = getFilteredProducts();
    if (filteredProducts.length === 0) {
      setMessage("No products to export");
      return;
    }

    const csvContent = [
      ["Company", "Product Name", "Quantity", "Unit", "Cost Per Tub", "Cost Per Packet", "Packets Per Tub", "Total Value"],
      ...filteredProducts.map(product => [
        product.company || "N/A",
        product.name || "N/A",
        product.quantity || "N/A",
        product.unit || "N/A",
        product.costPerTub || "N/A",
        product.costPerPacket || "N/A",
        product.packetsPerTub || "N/A",
        ((product.costPerTub || 0) * (product.quantity || 0)).toFixed(2)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Products list exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredProducts = getFilteredProducts();
    const totalProducts = filteredProducts.length;
    const totalCompanies = [...new Set(filteredProducts.map(p => p.company))].length;
    const totalValue = filteredProducts.reduce((sum, p) => 
      sum + ((p.costPerPacket || 0) * (p.packetsPerTub || 0)), 0
    );
    const totalPackets = filteredProducts.reduce((sum, p) => sum + (p.packetsPerTub || 0), 0);
    
    return { totalProducts, totalCompanies, totalValue, totalPackets };
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
    setMessage("");

    if (
      !company.trim() ||
      !productName.trim() ||
      !quantity.trim() ||
      !costPerTub ||
      !costPerPacket ||
      !packetsPerTub
    ) {
      setMessage("All required fields must be filled.");
      return;
    }
    if (!imageFile) {
      setMessage("Please upload a product image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("company", company);
      formData.append("name", productName);
      formData.append("quantity", quantity);
      formData.append("unit", unit);
      formData.append("costPerTub", costPerTub);
      formData.append("costPerPacket", costPerPacket);
      formData.append("packetsPerTub", packetsPerTub);
      formData.append("image", imageFile);

      const res = await fetch(`${config.API_BASE}/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setMessage("Product added successfully.");
        resetForm();
        setShowAddForm(false);
        fetchProducts();
      } else {
        let errorText = "Failed to add product.";
        try {
          const errData = await res.json();
          if (errData.message) errorText = errData.message;
        } catch {}
        setMessage(errorText);
      }
    } catch {
      setMessage("Server error when adding product.");
    }
  };

  // UPDATE existing product
  const updateProduct = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !company.trim() ||
      !productName.trim() ||
      (typeof quantity === "string" ? !quantity.trim() : !quantity) ||
      !costPerTub ||
      !costPerPacket ||
      !packetsPerTub
    ) {
      setMessage("All required fields must be filled.");
      return;
    }

    const formData = new FormData();
    formData.append("company", company);
    formData.append("name", productName);
    formData.append("quantity", quantity);
    formData.append("unit", unit);
    formData.append("costPerTub", costPerTub);
    formData.append("costPerPacket", costPerPacket);
    formData.append("packetsPerTub", packetsPerTub);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(`${config.API_BASE}/products/${editProductId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setMessage("Product updated successfully.");
        resetForm();
        fetchProducts();
      } else {
        const err = await res.json();
        setMessage(err.error || "Failed to update product.");
      }
    } catch {
      setMessage("Server error when updating product.");
    }
  };

  // delete product
  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure to delete this product?")) return;
    try {
      const res = await fetch(`${config.API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage("Product deleted successfully.");
        fetchProducts();
      } else {
        setMessage("Failed to delete product.");
      }
    } catch {
      setMessage("Server error when deleting product.");
    }
  };

  // ENABLE edit mode
  const editProduct = (p) => {
    setCompany(p.company);
    setProductName(p.name);
    setQuantity(p.quantity);
    setUnit(p.unit);
    setCostPerTub(p.costPerTub);
    setCostPerPacket(p.costPerPacket);
    setPacketsPerTub(p.packetsPerTub);
    setPreview(getImageUrl(p.imageUrl));
    setImageFile(null);
    setEditProductId(p._id);
    setShowAddForm(true);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const resetForm = () => {
    setCompany("");
    setProductName("");
    setQuantity("");
    setUnit("ml");
    setCostPerTub("");
    setCostPerPacket("");
    setPacketsPerTub("");
    setImageFile(null);
    setPreview("");
    setEditProductId(null);
  };

  // Get unique companies for filter
  const getUniqueCompanies = () => {
    return [...new Set(products.map(p => p.company))].sort();
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{width: '60px', height: '60px'}}
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
            <div className="card-body text-center">
              <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-boxes text-white"></i>
              </div>
              <h4 className="fw-bold text-warning mb-1">{summaryStats.totalProducts}</h4>
              <p className="text-muted mb-0">Total Products</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-info">
            <div className="card-body text-center">
              <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-building text-white"></i>
              </div>
              <h4 className="fw-bold text-info mb-1">{summaryStats.totalCompanies}</h4>
              <p className="text-muted mb-0">Total Companies</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-success">
            <div className="card-body text-center">
              <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-rupee-sign text-white"></i>
              </div>
              <h4 className="fw-bold text-success mb-1">₹{summaryStats.totalValue.toFixed(2)}</h4>
              <p className="text-muted mb-0">Total Value</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-primary">
            <div className="card-body text-center">
              <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-layer-group text-white"></i>
              </div>
              <h4 className="fw-bold text-primary mb-1">{summaryStats.totalPackets}</h4>
              <p className="text-muted mb-0">Total Packets</p>
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
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-3 col-md-6">
                  <select
                    className="form-select"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                  >
                    <option value="">All Companies</option>
                    {getUniqueCompanies().map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-3 col-md-6">
                  <select
                    className="form-select"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                  >
                    <option value="">All Units</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-2 col-md-6">
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

      {/* Add Product Button */}
      <div className="row mb-4">
        <div className="col-12">
          <button 
            className="btn btn-success"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <i className={`fas ${showAddForm ? 'fa-minus' : 'fa-plus'} me-2`}></i>
            {showAddForm ? 'Hide Add Form' : 'Add New Product'}
          </button>
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
                    <i className="fas fa-building me-1"></i>Company
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
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
                    <i className="fas fa-weight me-1"></i>Quantity
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="fas fa-ruler me-1"></i>Unit
                  </label>
                  <select
                    className="form-select"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
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
                        style={{maxHeight: '200px'}}
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
                             style={{width: '40px', height: '40px'}}> 
                          <i className="fas fa-box text-white"></i>
                        </div>
                        <span className="badge bg-white text-primary rounded-pill px-3 py-2">{product.unit}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <img 
                          src={getImageUrl(product.imageUrl)} 
                          alt={product.name}
                          className="img-fluid rounded"
                          style={{maxHeight: '150px', width: 'auto'}}
                        />
                      </div>
                      <h6 className="card-title fw-bold">{product.name}</h6>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-building text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Company:</span>
                          <span className="fw-medium">{product.company}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-weight text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Quantity:</span>
                          <span className="fw-medium">{product.quantity} {product.unit}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-rupee-sign text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Cost Per Tub:</span>
                          <span className="fw-medium">₹{product.costPerTub}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-rupee-sign text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Cost Per Packet:</span>
                          <span className="fw-medium">₹{product.costPerPacket}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-layer-group text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Packets Per Tub:</span>
                          <span className="fw-medium">{product.packetsPerTub}</span>
                        </div>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-warning btn-sm flex-fill" onClick={() => editProduct(product)} title="Edit product">
                          <i className="fas fa-edit me-1"></i>Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => deleteProduct(product._id)} title="Delete product">
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
                        <th>Company</th>
                        <th>Quantity</th>
                        <th>Unit</th>
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
                              style={{width: '50px', height: '50px', objectFit: 'cover'}}
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
                              <i className="fas fa-building me-2 text-muted"></i>
                              {product.company}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-weight me-2 text-muted"></i>
                              {product.quantity}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {product.unit.toUpperCase()}
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
                              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteProduct(product._id)} title="Delete product">
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

export default ProductManagement;
