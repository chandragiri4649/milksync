import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useParams, useLocation } from "react-router-dom";
import config from "../../config";

const PlaceOrders = ({ role = "admin" }) => {
  // This component only displays pending orders
  // Delivered orders are automatically hidden from the display
  const { token } = useAuth();

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder-product.jpg";
    // If it's already a complete URL (Cloudinary), use it as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a local path, prepend the base URL
    return `${config.IMAGE_BASE_URL}${imageUrl}`;
  };
  const location = useLocation();
  
  // Check if this is being accessed from staff routes
  const isStaffRoute = location.pathname.startsWith('/staff/');

  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orderDate, setOrderDate] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [message, setMessage] = useState("");
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDistributorFilter, setSelectedDistributorFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  // Safety check - ensure myOrders is always an array
  const safeMyOrders = Array.isArray(myOrders) ? myOrders : [];

  // Fetch distributors (Admin or Staff)
  const fetchDistributors = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/distributor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDistributors(data);
    } catch (err) {
      setMessage("Failed to load distributors");
    }
  }, [token]);

  // Fetch my orders - Changed from /my-orders to / to show ALL orders (not just ones placed by current admin)
  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch orders (${res.status}): ${errorText}`);
      }
      
      const data = await res.json();
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setMyOrders(data);
      } else if (data && typeof data === 'object') {
        // If it's an object with an error message, show it
        if (data.error) {
          setMessage(data.error);
          setMyOrders([]);
        } else {
          // If it's an object but not an array, try to extract orders
          setMyOrders([]);
          setMessage("Unexpected response format from orders API");
        }
      } else {
        // If it's null, undefined, or any other type
        setMyOrders([]);
        setMessage("No orders data received");
      }
    } catch (err) {
      setMessage(err.message || "Failed to load orders");
      setMyOrders([]); // Ensure it's always an array
    }
  }, [token]);

  useEffect(() => {
    fetchDistributors();
    fetchMyOrders();
  }, [fetchDistributors, fetchMyOrders]);

  // Fetch products after BOTH distributor and date are selected
  useEffect(() => {
    if (selectedDistributor && orderDate) {
      setIsFetchingProducts(true);
      setMessage("");
      fetch(
        `${config.API_BASE}/products/company/${encodeURIComponent(selectedDistributor.name)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch products (${res.status})`);
          }
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data) || data.length === 0) {
            setProducts([]);
            setMessage(`No products found for company: ${selectedDistributor.name}`);
            return;
          }
          const items = data.map(p => ({
            ...p,
            quantity: "",
            unit: "tub",
            added: false
          }));
          console.log('Products loaded and processed:', items);
          setProducts(items);
        })
        .catch((err) => {
          console.error('Failed to load products:', err);
          setMessage(err?.message || "Failed to load products for this distributor");
        })
        .finally(() => setIsFetchingProducts(false));
    }
  }, [selectedDistributor, orderDate, token]);

  // Filter orders based on search criteria
  const getFilteredOrders = () => {
    let filtered = safeMyOrders;
    
    // Only show pending orders - hide delivered orders
    filtered = filtered.filter(order => order.status === 'pending');
    
    // Filter by status (only if user specifically wants to see other statuses)
    if (selectedStatus && selectedStatus !== 'pending') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filter by distributor
    if (selectedDistributorFilter) {
      filtered = filtered.filter(order => {
        const distributorName = order.distributorId?.name || order.distributorId?.distributorName || '';
        return distributorName.toLowerCase().includes(selectedDistributorFilter.toLowerCase());
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const distributorName = order.distributorId?.name || order.distributorId?.distributorName || '';
        const orderDate = order.orderDate || '';
        const itemsText = order.items?.map(item => item.productId?.name || '').join(' ') || '';
        
        return distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               orderDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
               itemsText.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered;
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const filteredOrders = getFilteredOrders();
    if (filteredOrders.length === 0) {
      setMessage("No orders to export");
      return;
    }

    const csvContent = [
      ["Order Date", "Distributor", "Status", "Total Items", "Items Details"],
      ...filteredOrders.map(order => [
        new Date(order.orderDate).toLocaleDateString(),
        order.distributorId?.name || order.distributorId?.distributorName || "Unknown",
        order.status || "N/A",
        order.items?.length || 0,
        order.items?.map(item => `${item.productId?.name || 'N/A'} (${item.quantity} ${item.unit})`).join('; ') || "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Orders exported successfully!");
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredOrders = getFilteredOrders();
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
    const totalItems = filteredOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
    
    return { totalOrders, pendingOrders, totalItems };
  };

  const summaryStats = getSummaryStats();

  const handleDistributorSelect = (distributor) => {
    setSelectedDistributor(distributor);
    setProducts([]);
    setOrderItems([]);
    
    // Set date to tomorrow automatically
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Use local date formatting to avoid timezone issues
    const tomorrowStr = tomorrow.getFullYear() + '-' + 
                       String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(tomorrow.getDate()).padStart(2, '0');
    setOrderDate(tomorrowStr);
    
    // Show order form immediately
    setShowOrderForm(true);
  };

  const setProductQuantity = (id, qty) => {
    setProducts(prev =>
      prev.map(p => (p._id === id ? { ...p, quantity: qty } : p))
    );
  };

  const setProductUnit = (id, unit) => {
    setProducts(prev =>
      prev.map(p => (p._id === id ? { ...p, unit } : p))
    );
  };

  const addToOrder = (product) => {
    if (!product.quantity || product.quantity <= 0) {
      alert("Enter a valid quantity");
      return;
    }
    
    const orderItem = {
      productId: product._id,
      quantity: Number(product.quantity),
      unit: product.unit
    };
    
    console.log('Adding product to order:', {
      product,
      orderItem,
      currentOrderItems: orderItems
    });
    
    setOrderItems(prev => [
      ...prev,
      orderItem
    ]);
    setProducts(prev =>
      prev.map(p => (p._id === product._id ? { ...p, added: true } : p))
    );
  };

  const submitOrder = () => {
    if (!selectedDistributor || !orderDate || orderItems.length === 0) {
      setMessage("Please select distributor, date and products");
      return;
    }
    
    // Validate order items
    const invalidItems = orderItems.filter(item => 
      !item.productId || !item.quantity || item.quantity <= 0 || !item.unit
    );
    
    if (invalidItems.length > 0) {
      setMessage("Invalid order items detected. Please check quantity and unit for all products.");
      console.error('Invalid items:', invalidItems);
      return;
    }
    
    // Debug logging
    console.log('Submitting order with data:', {
      distributorId: selectedDistributor._id,
      orderDate,
      orderDateType: typeof orderDate,
      orderDateParsed: new Date(orderDate),
      items: orderItems,
      selectedDistributor: selectedDistributor,
      orderItemsLength: orderItems.length
    });
    
    // Additional validation logging
    console.log('Order items validation:', orderItems.map(item => ({
      productId: item.productId,
      productIdType: typeof item.productId,
      productIdValid: item.productId && item.productId.length > 0,
      quantity: item.quantity,
      quantityType: typeof item.quantity,
      quantityValid: Number.isFinite(item.quantity) && item.quantity > 0,
      unit: item.unit,
      unitType: typeof item.unit,
      unitValid: !!item.unit && item.unit.length > 0
    })));
    
    fetch(`${config.API_BASE}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        distributorId: selectedDistributor._id,
        orderDate,
        items: orderItems
      })
    })
      .then(async (res) => {
        let data = {};
        try { data = await res.json(); } catch {}
        console.log('Response status:', res.status);
        console.log('Response data:', data);
        
        if (!res.ok) {
          const msg = data.error || data.message || `Failed to place order (${res.status})`;
          const details = data.details ? `: ${data.details}` : "";
          throw new Error(msg + details);
        }
        return data;
      })
      .then(() => {
        setMessage("Order placed successfully!");
        setOrderItems([]);
        setSelectedDistributor(null);
        setProducts([]);
        setOrderDate("");
        setShowOrderForm(false);
        return fetchMyOrders();
      })
      .catch((err) => {
        console.error('Order submission error:', err);
        setMessage(err.message);
      });
  };

  const resetOrderForm = () => {
    setSelectedDistributor(null);
    setProducts([]);
    setOrderItems([]);
    setOrderDate("");
    setShowOrderForm(false);
    setMessage("");
  };

  // Restrict date picker to from tomorrow onwards
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Use local date formatting to avoid timezone issues
  const minDate = tomorrow.getFullYear() + '-' + 
                  String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(tomorrow.getDate()).padStart(2, '0');

  const statuses = ["pending", "cancelled"];

  // Wrap with StaffLayout if this is a staff route
  const content = (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{width: '60px', height: '60px'}}
            >
              <i className="fas fa-shopping-cart fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">Place Orders</h3>
              <p className="text-muted mb-0">Select distributor and place your orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-success">
            <div className="card-body text-center">
              <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-shopping-cart text-white"></i>
              </div>
              <h4 className="fw-bold text-success mb-1">{summaryStats.totalOrders}</h4>
              <p className="text-muted mb-0">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-warning">
            <div className="card-body text-center">
              <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-clock text-white"></i>
              </div>
              <h4 className="fw-bold text-warning mb-1">{summaryStats.pendingOrders}</h4>
              <p className="text-muted mb-0">Pending Orders</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border shadow-sm h-100 border-top border-4 border-info">
            <div className="card-body text-center">
              <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '50px', height: '50px'}}>
                <i className="fas fa-boxes text-white"></i>
              </div>
              <h4 className="fw-bold text-info mb-1">{summaryStats.totalItems}</h4>
              <p className="text-muted mb-0">Total Items</p>
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
                      placeholder="Search orders..."
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
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-3 col-md-6">
                  <select
                    className="form-select"
                    value={selectedDistributorFilter}
                    onChange={(e) => setSelectedDistributorFilter(e.target.value)}
                  >
                    <option value="">All Distributors</option>
                    {distributors.map(dist => (
                      <option key={dist._id} value={dist.name || dist.distributorName}>
                        {dist.name || dist.distributorName}
                      </option>
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

      {/* Distributor selection cards */}
      <div className="row mb-4">
        <div className="col-12">
          <h5 className="text-dark fw-bold">
            <i className="fas fa-truck me-2"></i>
            Select Distributor
          </h5>
        </div>
      </div>
      <div className="row">
        {distributors.map(dist => (
          <div key={dist._id} className="col-lg-3 col-md-4 col-sm-6 mb-3">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-primary text-dark">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center justify-content-center" 
                       style={{width: '40px', height: '40px'}}>
                    <i className="fas fa-truck text-white"></i>
                  </div>
                  <span className="badge bg-success">Available</span>
                </div>
              </div>
              <div className="card-body">
                <h6 className="card-title fw-bold">{dist.distributorName || dist.username || "Distributor"}</h6>
                <p className="text-muted mb-3">{dist.name}</p>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => handleDistributorSelect(dist)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Place Order
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Form - shown when distributor is selected */}
      {showOrderForm && selectedDistributor && (
        <div className="card border shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="fas fa-edit me-2"></i>
                Place Order for {selectedDistributor.company || selectedDistributor.distributorName || selectedDistributor.name}
              </h6>
              <button className="btn btn-light btn-sm" onClick={resetOrderForm}>
                <i className="fas fa-times me-1"></i>
                Cancel
              </button>
            </div>
          </div>

          <div className="card-body">
            {/* Date picker and products list together */}
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-calendar me-1"></i>Order Date
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>
              <div className="col-md-8">
                {/* Product list */}
                {isFetchingProducts && (
                  <div className="text-center py-4">
                    <i className="fas fa-spinner fa-spin fa-lg text-muted mb-2"></i>
                    <p className="text-muted">Loading products...</p>
                  </div>
                )}

                {products.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-3">
                      <h6 className="mb-0">
                        <i className="fas fa-boxes me-2"></i>
                        Available Products ({products.length})
                      </h6>
                    </div>
                    <div className="row g-3">
                      {products.map(p => (
                        <div key={p._id} className="col-md-6">
                          <div className="card border h-100">
                            <div className="card-body">
                              <div className="text-center mb-3">
                                <img 
                                  src={getImageUrl(p.imageUrl)} 
                                  alt={p.name} 
                                  className="img-fluid rounded"
                                  style={{maxHeight: '100px', width: 'auto'}}
                                />
                              </div>
                              <h6 className="card-title fw-bold">{p.name}</h6>
                              <div className="mb-3">
                                <div className="mb-2">
                                  <label className="form-label small">Order Quantity</label>
                                  <input
                                    type="number"
                                    placeholder="Enter qty"
                                    value={p.quantity}
                                    onChange={(e) => setProductQuantity(p._id, e.target.value)}
                                    className="form-control"
                                    required
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label small">Order Unit</label>
                                  <select
                                    value={p.unit}
                                    onChange={(e) => setProductUnit(p._id, e.target.value)}
                                    className="form-select"
                                    required
                                  >
                                    <option value="tub">Tub</option>
                                    <option value="bucket">Bucket</option>
                                    <option value="kg">kg</option>
                                  </select>
                                </div>
                              </div>
                              <button
                                className={`btn w-100 ${p.added ? 'btn-success' : 'btn-primary'}`}
                                onClick={() => !p.added && addToOrder(p)}
                                disabled={p.added}
                              >
                                <i className={`fas ${p.added ? 'fa-check' : 'fa-plus'} me-1`}></i>
                                {p.added ? 'Added to Order' : 'Add to Order'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Place Order button */}
                {orderItems.length > 0 && (
                  <div className="text-center">
                    <button className="btn btn-success btn-lg" onClick={submitOrder}>
                      <i className="fas fa-check me-2"></i>
                      Place Order ({orderItems.length} items)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Orders Section */}
      <div className="row mb-3">
        <div className="col-12">
          <h5 className="text-dark fw-bold">
            <i className="fas fa-list me-2"></i>
            My Pending Orders
          </h5>
        </div>
      </div>

      {(() => {
        const filteredOrders = getFilteredOrders();
        
        if (filteredOrders.length === 0) {
          return (
            <div className="text-center py-5">
              <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
              <h6 className="text-muted">No pending orders found</h6>
              <p className="text-muted">All orders have been delivered or start by placing a new order above</p>
            </div>
          );
        }

        if (viewMode === 'table') {
          return (
            <div className="card border shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Order Date</th>
                        <th>Distributor</th>
                        <th>Status</th>
                        <th>Total Items</th>
                        <th>Items Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order._id}>
                          <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                          <td>{order.distributorId?.name || order.distributorId?.distributorName || 'Unknown'}</td>
                          <td>
                            <span className="badge bg-warning">
                              Pending
                            </span>
                          </td>
                          <td>{order.items?.length || 0}</td>
                          <td>
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="mb-1">
                                {item.productId?.name || 'N/A'} ({item.quantity} {item.unit})
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }

        // Cards view - grouped by distributor
        const ordersByDistributor = {};
        
        // Group orders by distributor
        filteredOrders.forEach(order => {
          const distributorName = order.distributorId?.name || order.distributorId?.distributorName || 'Unknown';
          if (!ordersByDistributor[distributorName]) {
            ordersByDistributor[distributorName] = [];
          }
          ordersByDistributor[distributorName].push(order);
        });

        return Object.keys(ordersByDistributor).map(distributorName => (
          <div key={distributorName} className="mb-4">
            <div className="mb-3">
              <h6 className="text-dark fw-bold">
                <i className="fas fa-truck me-2"></i>
                {distributorName}
              </h6>
            </div>
            <div className="row g-3">
              {ordersByDistributor[distributorName].map(order => (
                <div key={order._id} className="col-lg-4 col-md-6">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-success text-white">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center justify-content-center" 
                             style={{width: '40px', height: '40px'}}>
                          <i className="fas fa-clock text-white"></i>
                        </div>
                        <span className="badge bg-warning">
                          Pending
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-calendar text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Order Date:</span>
                          <span className="fw-medium">{new Date(order.orderDate).toLocaleDateString()}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-shopping-cart text-muted me-2" style={{width: '16px'}}></i>
                          <span className="text-muted me-2">Total Items:</span>
                          <span className="fw-medium">{order.items?.length || 0}</span>
                        </div>
                      </div>

                      <h6 className="fw-bold mb-2">Order Items:</h6>
                      <div className="mb-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="d-flex justify-content-between align-items-center mb-1 p-2 bg-light rounded">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-box text-muted me-2"></i>
                              <span className="fw-medium">{item.productId?.name || 'N/A'}</span>
                            </div>
                            <span className="badge bg-info">{item.quantity} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ));
      })()}
    </div>
  );

  // Return wrapped with StaffLayout if it's a staff route, otherwise return content directly
  if (isStaffRoute) {
    return <div className="container my-4">{content}</div>;
  }
  
  return content;
};

export default PlaceOrders;
