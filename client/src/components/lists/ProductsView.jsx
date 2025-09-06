import React, { useEffect, useState, useCallback } from "react";
import apiService from "../../utils/apiService";
import { useAuth } from "../../hooks/useAuth";

const ProductsView = () => {
    const { token } = useAuth();
    const [productsByCompany, setProductsByCompany] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const [viewMode, setViewMode] = useState("cards");

    const units = ["ml", "kg", "gm"];

    // Helper function to get product field with fallback
    const getProductField = (product, fieldName) => {
        // Map common field variations
        const fieldMappings = {
            name: ['name', 'productName', 'title'],
            quantity: ['quantity', 'productQuantity', 'qty'],
            unit: ['unit', 'productUnit', 'measurementUnit'],
            costPerPacket: ['costPerPacket', 'cost', 'price', 'productPrice'],
            packetsPerTub: ['packetsPerTub', 'packets', 'itemsPerTub', 'itemsPerPack']
        };
        
        const possibleFields = fieldMappings[fieldName] || [fieldName];
        
        for (const field of possibleFields) {
            if (product[field] !== undefined && product[field] !== null) {
                return product[field];
            }
        }
        
        return null;
    };

    // Helper function to get the correct image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') return "/placeholder-product.jpg";
        // If it's already a complete URL (Cloudinary), use it as is
        if (imageUrl.startsWith('http')) return imageUrl;
        // If it's a local path, prepend the base URL
        return `${process.env.REACT_APP_IMAGE_BASE_URL || ''}${imageUrl}`;
    };

    // Helper function to extract company name from product
    const getCompanyName = (product) => {
        // Check if product has direct company field
        if (product.company) {
            return { name: product.company, source: 'product.company' };
        }
        
        // Check distributorId object for company information
        if (product.distributorId) {
            // Look for companyName first (this should be the actual company)
            if (product.distributorId.companyName) {
                return { name: product.distributorId.companyName, source: 'distributorId.companyName' };
            }
            
            // Look for company field in distributorId
            if (product.distributorId.company) {
                return { name: product.distributorId.company, source: 'distributorId.company' };
            }
            
            // Look for businessName field in distributorId
            if (product.distributorId.businessName) {
                return { name: product.distributorId.businessName, source: 'distributorId.businessName' };
            }
            
            // Fallback to distributorName (this is what we're currently getting)
            if (product.distributorId.distributorName) {
                return { name: product.distributorId.distributorName, source: 'distributorId.distributorName' };
            }
            
            // Last fallback to name
            if (product.distributorId.name) {
                return { name: product.distributorId.name, source: 'distributorId.name' };
            }
        }
        
        return null;
    };

    // Group products by company name (moved from separate file)
    const groupByCompany = (products) => {
        if (!Array.isArray(products)) {
            return {};
        }
        
        const result = products.reduce((acc, product) => {
            // Check if product has required fields
            if (!product || typeof product !== 'object') {
                return acc;
            }
            
            // Get company name using helper function
            const companyInfo = getCompanyName(product);
            
            if (!companyInfo) {
                return acc;
            }
            
            if (!acc[companyInfo.name]) {
                acc[companyInfo.name] = [];
            }
            acc[companyInfo.name].push(product);
            return acc;
        }, {});
        
        return result;
    };

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiService.get('/products');
            
            // Validate data structure
            if (!Array.isArray(data)) {
                setMessage("Invalid data format received from server.");
                return;
            }
            
            // Group by company
            const grouped = groupByCompany(data);
            setProductsByCompany(grouped);
        } catch (err) {
            setMessage("Failed to fetch products.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Filter products based on search criteria
    const getFilteredProducts = () => {
        let filtered = { ...productsByCompany };
        
        // Filter by company
        if (selectedCompany) {
            filtered = { [selectedCompany]: filtered[selectedCompany] || [] };
        }

        // Filter by search term
        if (searchTerm) {
            Object.keys(filtered).forEach(company => {
                filtered[company] = filtered[company].filter(product => 
                    (getProductField(product, 'name') || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (getProductField(product, 'unit') || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    company.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        // Filter by unit
        if (selectedUnit) {
            Object.keys(filtered).forEach(company => {
                filtered[company] = filtered[company].filter(product => (getProductField(product, 'unit') || '') === selectedUnit);
            });
        }

        // Remove empty companies
        Object.keys(filtered).forEach(company => {
            if (filtered[company].length === 0) {
                delete filtered[company];
            }
        });
        
        return filtered;
    };

    // Export products to CSV
    const exportToCSV = () => {
        const filteredProducts = getFilteredProducts();
        const allProducts = [];
        
        Object.keys(filteredProducts).forEach(company => {
            filteredProducts[company].forEach(product => {
                allProducts.push({
                    company,
                    name: getProductField(product, 'name') || 'N/A',
                    quantity: getProductField(product, 'quantity') || 0,
                    unit: getProductField(product, 'unit') || 'N/A',
                    costPerPacket: getProductField(product, 'costPerPacket') || 0,
                    packetsPerTub: getProductField(product, 'packetsPerTub') || 0
                });
            });
        });

        if (allProducts.length === 0) {
            setMessage("No products to export");
            return;
        }

        const csvContent = [
            ["Company", "Product Name", "Quantity", "Unit", "Cost Per Packet", "Packets Per Tub"],
            ...allProducts.map(product => [
                product.company,
                product.name,
                product.quantity,
                product.unit,
                product.costPerPacket,
                product.packetsPerTub
            ])
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setMessage("Products exported successfully!");
    };

    // Calculate summary statistics
    const getSummaryStats = () => {
        const filteredProducts = getFilteredProducts();
        const totalCompanies = Object.keys(filteredProducts).length;
        const totalProducts = Object.values(filteredProducts).reduce((sum, products) => sum + products.length, 0);
        const totalValue = Object.values(filteredProducts).reduce((sum, products) => 
            sum + products.reduce((productSum, product) => 
                productSum + ((getProductField(product, 'costPerPacket') || 0) * (getProductField(product, 'packetsPerTub') || 0)), 0
            ), 0
        );
        
        return { totalCompanies, totalProducts, totalValue };
    };

    const summaryStats = getSummaryStats();
    const companies = Object.keys(productsByCompany);

    if (loading) {
        return (
            <div className="container-fluid py-4">
                <div className="text-center py-5">
                    <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
                    <p className="text-muted mt-3">Loading products...</p>
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
                            <i className="fas fa-box fa-lg text-white"></i>
                        </div>
                        <div>
                            <h3 className="mb-0 fw-bold text-dark">
                                Products View
                            </h3>
                            <p className="mb-0 text-muted">View and manage all products by company</p>
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
                                    <i className="fas fa-building text-white"></i>
                                </div>
                                <div>
                                    <h6 className="card-title text-muted mb-1">Total Companies</h6>
                                    <h4 className="mb-0 fw-bold text-primary">{summaryStats.totalCompanies}</h4>
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
                                    <i className="fas fa-box text-white"></i>
                                </div>
                                <div>
                                    <h6 className="card-title text-muted mb-1">Total Products</h6>
                                    <h4 className="mb-0 fw-bold text-success">{summaryStats.totalProducts}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 col-md-6 mb-3">
                    <div className="card border shadow-sm h-100 border-top border-4 border-info">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '50px', height: '50px' }}>
                                    <i className="fas fa-rupee-sign text-white"></i>
                                </div>
                                <div>
                                    <h6 className="card-title text-muted mb-1">Total Value</h6>
                                    <h4 className="mb-0 fw-bold text-info">₹{summaryStats.totalValue.toFixed(2)}</h4>
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
                                            placeholder="Search products, companies..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ width: '250px' }}
                                        />
                                    </div>
                                    <select
                                        className="form-select"
                                        value={selectedCompany}
                                        onChange={(e) => setSelectedCompany(e.target.value)}
                                        style={{ width: '180px' }}
                                    >
                                        <option value="">All Companies</option>
                                        {companies.map(company => (
                                            <option key={company} value={company}>{company}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="form-select"
                                        value={selectedUnit}
                                        onChange={(e) => setSelectedUnit(e.target.value)}
                                        style={{ width: '120px' }}
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

            {/* Products Display */}
            {Object.keys(getFilteredProducts()).length === 0 ? (
                <div className="text-center py-5">
                    <i className="fas fa-box fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Products Found</h6>
                    <p className="text-muted">
                        {Object.keys(productsByCompany).length === 0 ? "No products are currently available" : "No products match your search criteria"}
                    </p>
                </div>
            ) : (
                <>
                    {/* Cards View */}
                    {viewMode === 'cards' && (
                        Object.keys(getFilteredProducts()).map((companyName) => (
                            <div key={companyName} className="mb-4">
                                <div className="row mb-3">
                                    <div className="col-12">
                                        <h5 className="fw-bold text-dark">
                                            <i className="fas fa-building me-2 text-muted"></i>
                                            {companyName}
                                        </h5>
                                    </div>
                                </div>
                                <div className="row g-4">
                                    {getFilteredProducts()[companyName].map((product) => (
                                        <div key={product._id} className="col-lg-3 col-md-4 col-sm-6">
                                            <div className="card border shadow-sm h-100">
                                                <div className="card-header bg-primary text-white">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{ width: '40px', height: '40px' }}>
                                                            <i className="fas fa-box fa-sm text-primary"></i>
                                                        </div>
                                                        <span className="badge bg-light text-dark px-2 py-1">{getProductField(product, 'unit') || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <img
                                                    src={getImageUrl(product.imageUrl)}
                                                    className="card-img-top"
                                                    alt={getProductField(product, 'name')}
                                                    style={{ height: 80, objectFit: "contain", backgroundColor: "#f8f9fa" }}
                                                />
                                                <div className="card-body">
                                                    <h6 className="card-title fw-bold text-center mb-3">{getProductField(product, 'name') || 'Unnamed Product'}</h6>
                                                    
                                                    <div className="row g-2 mb-3">
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center p-2 bg-light rounded">
                                                                <i className="fas fa-balance-scale text-primary me-3" style={{ width: '20px' }}></i>
                                                                <div>
                                                                    <small className="text-muted d-block">Quantity</small>
                                                                    <span className="fw-semibold">{getProductField(product, 'quantity') || 0} {getProductField(product, 'unit') || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center p-2 bg-light rounded">
                                                                <i className="fas fa-rupee-sign text-primary me-3" style={{ width: '20px' }}></i>
                                                                <div>
                                                                    <small className="text-muted d-block">Cost/Packet</small>
                                                                    <span className="fw-semibold">₹{getProductField(product, 'costPerPacket') || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center p-2 bg-light rounded">
                                                                <i className="fas fa-boxes text-primary me-3" style={{ width: '20px' }}></i>
                                                                <div>
                                                                    <small className="text-muted d-block">Packets/Tub</small>
                                                                    <span className="fw-semibold">{getProductField(product, 'packetsPerTub') || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
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
                                                <th>Product Name</th>
                                                <th>Quantity</th>
                                                <th>Unit</th>
                                                <th>Cost/Packet</th>
                                                <th>Packets/Tub</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(getFilteredProducts()).map(companyName => 
                                                getFilteredProducts()[companyName].map(product => (
                                                    <tr key={product._id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-building me-2 text-muted"></i>
                                                                {companyName}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-box me-2 text-muted"></i>
                                                                {getProductField(product, 'name') || 'Unnamed Product'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-info text-white">
                                                                {getProductField(product, 'quantity') || 0}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary text-white">
                                                                {getProductField(product, 'unit') || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td>₹{getProductField(product, 'costPerPacket') || 0}</td>
                                                        <td>{getProductField(product, 'packetsPerTub') || 0}</td>
                                                    </tr>
                                                ))
                                            )}
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

export default ProductsView;
