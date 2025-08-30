import React, { useEffect, useState, useCallback } from "react";
import config from "../../config";
import { useAuth } from "../../hooks/useAuth";
import { groupByCompany } from "../../utils/groupByCompany";


const ProductsView = () => {
    const { token } = useAuth();

    // Helper function to get the correct image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/placeholder-product.jpg";
        // If it's already a complete URL (Cloudinary), use it as is
        if (imageUrl.startsWith('http')) return imageUrl;
        // If it's a local path, prepend the base URL
        return `${config.IMAGE_BASE_URL}${imageUrl}`;
    };
    const [productsByCompany, setProductsByCompany] = useState({});
    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const [viewMode, setViewMode] = useState("cards");

    const units = ["ml", "kg", "gm"];

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch(`${config.API_BASE}/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch products");

            const data = await res.json();

            // Group by company
            const grouped = groupByCompany(data);
            setProductsByCompany(grouped);
        } catch (err) {
            console.error(err);
            setMessage("Failed to fetch products.");
        }
    }, [token]);

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
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    company.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        // Filter by unit
        if (selectedUnit) {
            Object.keys(filtered).forEach(company => {
                filtered[company] = filtered[company].filter(product => product.unit === selectedUnit);
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
                    name: product.name,
                    quantity: product.quantity,
                    unit: product.unit,
                    costPerPacket: product.costPerPacket,
                    packetsPerTub: product.packetsPerTub
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
                productSum + (product.costPerPacket * product.packetsPerTub), 0
            ), 0
        );
        
        return { totalCompanies, totalProducts, totalValue };
    };

    const summaryStats = getSummaryStats();
    const companies = Object.keys(productsByCompany);

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex align-items-center">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                            <i className="fas fa-box fa-md text-white"></i>
                        </div>
                        <div>
                            <h3 className="mb-0 fw-bold text-black">
                                Products View
                            </h3>
                            <p className="text-muted mb-0 small">View and manage all products by company</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Message */}
            {message && (
                <div className="alert alert-info alert-dismissible fade show" role="alert">
                    <i className="fas fa-info-circle me-2"></i>
                    {message}
                    <button type="button" className="btn btn-close" onClick={() => setMessage("")}></button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <div className="card border shadow-sm h-100">
                        <div className="card-header bg-primary text-dark border-0 py-2">
                            <h6 className="mb-0"><i className="fas fa-building me-2"></i>Total Companies</h6>
                        </div>
                        <div className="card-body text-center">
                            <h3 className="fw-bold text-warning">{summaryStats.totalCompanies}</h3>
                            <p className="mb-0 text-muted">Active companies</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card border shadow-sm h-100">
                        <div className="card-header bg-success text-white border-0 py-2">
                            <h6 className="mb-0"><i className="fas fa-box me-2"></i>Total Products</h6>
                        </div>
                        <div className="card-body text-center">
                            <h3 className="fw-bold text-success">{summaryStats.totalProducts}</h3>
                            <p className="mb-0 text-muted">All products</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card border shadow-sm h-100">
                        <div className="card-header bg-info text-white border-0 py-2">
                            <h6 className="mb-0"><i className="fas fa-rupee-sign me-2"></i>Total Value</h6>
                        </div>
                        <div className="card-body text-center">
                            <h3 className="fw-bold text-info">₹{summaryStats.totalValue.toFixed(2)}</h3>
                            <p className="mb-0 text-muted">Combined value</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="card border shadow-sm mb-4">
                <div className="card-header bg-secondary text-dark py-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0"><i className="fas fa-search me-2"></i>Search & Filter Products</h6>
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
                            <input type="text" className="form-control form-control-sm" placeholder="Search products, companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small">
                                <i className="fas fa-building me-1"></i>Company
                            </label>
                            <select className="form-select form-select-sm" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                                <option value="">All Companies</option>
                                {companies.map(company => (
                                    <option key={company} value={company}>{company}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small">
                                <i className="fas fa-balance-scale me-1"></i>Unit
                            </label>
                            <select className="form-select form-select-sm" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                                <option value="">All Units</option>
                                {units.map(unit => (
                                    <option key={unit} value={unit}>{unit.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2 d-flex align-items-end gap-2">
                            <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => { setSelectedCompany(""); setSelectedUnit(""); setSearchTerm(""); }}>
                                <i className="fas fa-refresh me-1"></i>Clear
                            </button>
                            <button className="btn btn-sm btn-primary flex-fill" onClick={exportToCSV}>
                                <i className="fas fa-download me-1"></i>Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Display */}
            {Object.keys(getFilteredProducts()).length === 0 ? (
                <div className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <i className="fas fa-box fa-2x text-muted"></i>
                    </div>
                    <h5 className="text-muted">No Products Found</h5>
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
                                <div className="row">
                                    {getFilteredProducts()[companyName].map((product) => (
                                        <div key={product._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                                            <div className="card border shadow-sm h-100">
                                                <div className="card-header bg-primary text-white">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                                                            <i className="fas fa-box fa-sm text-primary"></i>
                                                        </div>
                                                        <span className="badge bg-light text-dark px-2 py-1">{product.unit}</span>
                                                    </div>
                                                </div>
                                                <img
                                                    src={getImageUrl(product.imageUrl)}
                                                    className="card-img-top"
                                                    alt={product.name}
                                                    style={{ height: 80, objectFit: "contain", backgroundColor: "#f8f9fa" }}
                                                />
                                                <div className="card-body d-flex flex-column p-3">
                                                    <h6 className="card-title fw-bold mb-2 text-dark">
                                                        {product.name}
                                                    </h6>
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="fas fa-balance-scale me-2 text-muted" style={{width: '16px'}}></i>
                                                            <span className="fw-semibold small text-muted">Quantity:</span>
                                                            <span className="ms-2 small">{product.quantity} {product.unit}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="fas fa-rupee-sign me-2 text-muted" style={{width: '16px'}}></i>
                                                            <span className="fw-semibold small text-muted">Cost/Packet:</span>
                                                            <span className="ms-2 small">₹{product.costPerPacket}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="fas fa-boxes me-2 text-muted" style={{width: '16px'}}></i>
                                                            <span className="fw-semibold small text-muted">Packets/Tub:</span>
                                                            <span className="ms-2 small">{product.packetsPerTub}</span>
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
                            <div className="card-header bg-info text-white py-2">
                                <h6 className="mb-0"><i className="fas fa-table me-2"></i>Products Table View</h6>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Company</th>
                                                <th>Product Name</th>
                                                <th>Quantity</th>
                                                <th>Unit</th>
                                                <th>Cost/Packet</th>
                                                <th>Packets/Tub</th>
                                                <th>Actions</th>
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
                                                                {product.name}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-info text-white">
                                                                {product.quantity}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary text-white">
                                                                {product.unit}
                                                            </span>
                                                        </td>
                                                        <td>₹{product.costPerPacket}</td>
                                                        <td>{product.packetsPerTub}</td>
                                                        <td>
                                                            <span className="text-muted">-</span>
                                                        </td>
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
