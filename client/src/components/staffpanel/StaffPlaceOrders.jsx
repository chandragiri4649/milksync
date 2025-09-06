import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";
import { NavLink } from "react-router-dom";
import StaffNavbar from "./StaffNavbar";

const StaffPlaceOrders = () => {

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder-product.jpg";
    // If it's already a complete URL (Cloudinary), use it as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a local path, prepend the base URL
    return `${process.env.REACT_APP_IMAGE_BASE_URL || ''}${imageUrl}`;
  };
  
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orderDate, setOrderDate] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [message, setMessage] = useState("");
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  
  // New state for order management
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editModeProducts, setEditModeProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced state for modern features (from admin panel)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedDistributorFilter, setSelectedDistributorFilter] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedOrders, setSelectedOrders] = useState([]);

     // Debug logging
   console.log('🔍 StaffPlaceOrders - Component rendered');
   console.log('🔍 StaffPlaceOrders - Distributors:', distributors.length);
   console.log('🔍 StaffPlaceOrders - Products:', products.length);
   console.log('🔍 StaffPlaceOrders - Selected Distributor:', selectedDistributor);
   console.log('🔍 StaffPlaceOrders - IMAGE_BASE_URL:', process.env.REACT_APP_IMAGE_BASE_URL);

  // Fetch distributors
  const fetchDistributors = useCallback(async () => {
    console.log('🚚 Fetching distributors...');
    try {
      const data = await apiService.get('/distributor');
      console.log('📦 Distributors data:', data);
      setDistributors(data);
    } catch (err) {
      console.error('❌ Error fetching distributors:', err);
      setMessage("Failed to load distributors");
    }
  }, []);

  // Fetch my orders - Changed from /my-orders to / to show ALL orders (not just ones placed by current staff)
  const fetchMyOrders = useCallback(async () => {
    console.log('📋 Fetching all orders...');
    try {
      const data = await apiService.get('/orders');
      console.log('📦 All orders data:', data);
      if (Array.isArray(data)) {
        setMyOrders(data);
      } else {
        setMyOrders([]);
        setMessage("No orders data received");
      }
    } catch (err) {
      console.error('❌ Error fetching all orders:', err);
      setMessage(err.message || "Failed to load orders");
      setMyOrders([]);
    }
  }, []);

  // Safety check - ensure myOrders is always an array
  const safeMyOrders = Array.isArray(myOrders) ? myOrders : [];

  // Get unique statuses for filter dropdown
  const availableStatuses = [...new Set(safeMyOrders.map(order => order.status))].filter(Boolean);
  
  // Debug logging for order counts
  console.log('📊 Order Stats:', {
    totalOrders: safeMyOrders.length,
    statuses: availableStatuses,
    statusCounts: availableStatuses.reduce((acc, status) => {
      acc[status] = safeMyOrders.filter(order => order.status === status).length;
      return acc;
    }, {})
  });

  // Filter orders based on search criteria
  const getFilteredOrders = () => {
    let filtered = safeMyOrders;
    
    // Filter by status if selected (show all by default)
    if (selectedStatus) {
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
        const orderId = order._id?.toString() || '';
        const distributorName = order.distributorId?.name || order.distributorId?.distributorName || '';
        const itemsText = order.items?.map(item => 
          `${item.productId?.name || 'Unknown'} ${item.quantity} ${item.unit}`
        ).join(' ') || '';
        
        const searchText = `${orderId} ${distributorName} ${itemsText}`.toLowerCase();
        return searchText.includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  };

  // Group orders by distributor (from admin panel)
  const getGroupedOrders = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const distributorName = order.distributorId?.name || order.distributorId?.distributorName || 'Unknown';
      if (!grouped[distributorName]) {
        grouped[distributorName] = [];
      }
      grouped[distributorName].push(order);
    });
    return grouped;
  };

  // Bulk operations (from admin panel)
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    const currentFilteredOrders = getFilteredOrders();
    if (selectedOrders.length === currentFilteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentFilteredOrders.map(order => order._id));
    }
  };

  const bulkMarkAsDelivered = async () => {
    if (selectedOrders.length === 0) {
      setMessage("Please select orders to mark as delivered");
      return;
    }

    if (!window.confirm(`Mark ${selectedOrders.length} orders as delivered? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const promises = selectedOrders.map(orderId => 
        apiService.post(`/orders/${orderId}/deliver`)
      );

      await Promise.all(promises);
      setMessage(`${selectedOrders.length} orders marked as delivered successfully!`);
      setSelectedOrders([]);
      fetchMyOrders(); // Refresh orders
    } catch (err) {
      console.error('❌ Error in bulk mark as delivered:', err);
      setMessage('Failed to mark some orders as delivered');
    } finally {
      setIsLoading(false);
    }
  };

  const bulkDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      setMessage("Please select orders to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedOrders.length} orders? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const promises = selectedOrders.map(orderId => 
        apiService.delete(`/orders/${orderId}`)
      );

      await Promise.all(promises);
      setMessage(`${selectedOrders.length} orders deleted successfully!`);
      setSelectedOrders([]);
      fetchMyOrders(); // Refresh orders
    } catch (err) {
      console.error('❌ Error in bulk delete:', err);
      setMessage('Failed to delete some orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate bill for order (from admin panel)
  const generateBill = (order) => {
    const billContent = `
BILL
====
Order ID: ${order._id}
Date: ${new Date(order.orderDate).toLocaleDateString()}
Distributor: ${order.distributorId?.name || order.distributorId?.distributorName || 'Unknown'}

Items:
${order.items?.map((item, idx) => `${idx + 1}. ${item.productId?.name || 'N/A'} ${item.quantity} ${item.unit}`).join('\n') || 'No items'}

Total Items: ${order.items?.length || 0}
Status: ${order.status}
    `;
    
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill_order_${order._id.slice(-6)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMessage("Bill generated and downloaded successfully!");
  };

  // Copy order details to clipboard (from admin panel)
  const copyOrderDetails = async (order) => {
    const details = `Order ID: ${order._id}, Date: ${new Date(order.orderDate).toLocaleDateString()}, Distributor: ${order.distributorId?.name || order.distributorId?.distributorName || 'Unknown'}, Status: ${order.status}, Items: ${order.items?.length || 0}`;
    
    try {
      await navigator.clipboard.writeText(details);
      setMessage("Order details copied to clipboard!");
    } catch (err) {
      setMessage("Failed to copy to clipboard");
    }
  };

  // Resend order notification (from admin panel)
  const resendNotification = (order) => {
    setMessage(`Notification resent for order ${order._id.slice(-6)}`);
  };

  useEffect(() => {
    console.log('🔄 useEffect - Initial load');
    fetchDistributors();
    fetchMyOrders();
  }, [fetchDistributors, fetchMyOrders]);

  // Fetch products after BOTH distributor and date are selected
  useEffect(() => {
    if (selectedDistributor && orderDate) {
      console.log('🔍 Fetching products for:', selectedDistributor.name, 'on date:', orderDate);
      setIsFetchingProducts(true);
      setMessage("");
      
      // Fetch products for the selected distributor
      apiService.get(`/products/company/${encodeURIComponent(selectedDistributor.name)}`)
        .then(data => {
          console.log('📦 Products data received:', data);
          console.log('🔍 Sample product structure:', data[0]);
          console.log('🖼️ Product image field:', data[0]?.image);
          console.log('🖼️ Product imageUrl field:', data[0]?.imageUrl);
          
          if (!Array.isArray(data) || data.length === 0) {
            setMessage("No products available for this distributor on the selected date");
            setProducts([]);
          } else {
            setProducts(data.map(p => ({
              ...p,
              quantity: "",
              unit: "tub",
              added: false
            })));
          }
        })
        .catch(err => {
          console.error('❌ Error fetching products:', err);
          setMessage(err.message || "Failed to load products");
          setProducts([]);
        })
        .finally(() => {
          setIsFetchingProducts(false);
        });
    }
  }, [selectedDistributor, orderDate]);

  // Restrict date picker to from tomorrow onwards
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.getFullYear() + '-' + 
                  String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(tomorrow.getDate()).padStart(2, '0');

  // New order management functions
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleDistributorSelect = (distributor) => {
    setSelectedDistributor(distributor);
    setShowOrderForm(true);
    setOrderItems([]);
    setProducts([]);
    setOrderDate("");
  };

  const setProductQuantity = (productId, quantity) => {
    setProducts(prev => prev.map(p => 
      p._id === productId ? { ...p, quantity } : p
    ));
  };

  const setProductUnit = (productId, unit) => {
    setProducts(prev => prev.map(p => 
      p._id === productId ? { ...p, unit } : p
    ));
  };

  const addToOrder = (product) => {
    if (!product.quantity || product.quantity <= 0) {
      setMessage("Please enter a valid quantity");
      return;
    }

    const newItem = {
      productId: product._id,
      quantity: Number(product.quantity),
      unit: product.unit
    };

    setOrderItems(prev => [...prev, newItem]);
    setProducts(prev => prev.map(p => 
      p._id === product._id ? { ...p, added: true } : p
    ));
    setMessage(`Added ${product.quantity} ${product.unit} of ${product.name}`);
  };

  const submitOrder = async () => {
    if (!selectedDistributor || !orderDate || orderItems.length === 0) {
      setMessage("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await apiService.post('/orders', {
        distributorId: selectedDistributor._id,
        orderDate,
        items: orderItems
      });

      console.log('✅ Order submitted successfully!');
      setMessage("Order placed successfully!");
      setOrderItems([]);
      setSelectedDistributor(null);
      setProducts([]);
      setOrderDate("");
      setShowOrderForm(false);
      await fetchMyOrders();
    } catch (err) {
      console.error('❌ Order submission failed:', err);
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetOrderForm = () => {
    setSelectedDistributor(null);
    setProducts([]);
    setOrderItems([]);
    setOrderDate("");
    setShowOrderForm(false);
    setMessage("");
  };

  const handleEditOrder = async (order) => {
    try {
      setIsLoading(true);
      console.log('🔧 Edit Order - Starting with order:', order);
      
      // Fetch available products for the distributor
      const distributorName = order.distributorId?.name || order.distributorId?.distributorName || order.distributorName;
      console.log('🔧 Edit Order - Distributor name:', distributorName);
      
      if (!distributorName) {
        throw new Error('Distributor name not found in order data');
      }
      
      const availableProducts = await apiService.get(`/products/company/${encodeURIComponent(distributorName)}`);

      console.log('🔧 Edit Order - Available products:', availableProducts);
        console.log('🔧 Edit Order - Order items:', order.items);
        
        // Create a comprehensive product list
        const editProducts = availableProducts.map(product => {
          // Check if this product is already in the order
          const existingItem = order.items?.find(item => 
            (item.productId?._id || item.productId) === product._id
          );
          
          if (existingItem) {
            // Product already in order - use existing values
            return {
              ...product,
              quantity: existingItem.quantity || 0,
              unit: existingItem.unit || 'tub',
              isInOrder: true,
              originalIndex: order.items.indexOf(existingItem)
            };
          } else {
            // Product not in order - set defaults
            return {
              ...product,
              quantity: 0,
              unit: 'tub',
              isInOrder: false,
              originalIndex: -1
            };
          }
        });
        
        console.log('🔧 Edit Order - Final edit products:', editProducts);
        setEditModeProducts(editProducts);
        setEditingOrder({ ...order });
        setShowEditModal(true);
      // No need to check response.ok since apiService handles errors
    } catch (err) {
      console.error('❌ Error preparing edit order:', err);
      setMessage('Failed to load products for editing. Opening basic edit mode...');
      
      // Fallback: Open edit modal with existing order items only
      setEditModeProducts([]);
      setEditingOrder({ ...order });
      setShowEditModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    setIsLoading(true);
    try {
      await apiService.delete(`/orders/${orderId}`);

      setMessage('Order deleted successfully!');
      fetchMyOrders(); // Refresh orders
    } catch (err) {
      console.error('❌ Error deleting order:', err);
      setMessage(err.message || 'Failed to delete order');
    } finally {
      setIsLoading(false);
    }
  };

     const handleCopyDetails = (order) => {
     const orderText = `Order #${typeof order._id === 'string' ? order._id.slice(-6) : 'Unknown'}
 Date: ${new Date(order.orderDate).toLocaleDateString()}
 Status: ${order.status}
 Items: ${order.items.map(item => `${item.productId?.name || 'Unknown Product'} ${item.quantity} ${item.unit}`).join(', ')}`;
    
    navigator.clipboard.writeText(orderText).then(() => {
      setMessage('Order details copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    }).catch(() => {
      setMessage('Failed to copy to clipboard');
      setTimeout(() => setMessage(''), 3000);
    });
  };

  const handleSendNotification = async (order) => {
    setMessage('Notification feature coming soon!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleMarkDelivered = async (orderId) => {
    if (!window.confirm('Mark this order as delivered? This will automatically generate a bill (if needed), credit the distributor\'s wallet, and lock the order.')) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.post(`/orders/${orderId}/deliver`);
      
      // Enhanced success message
      let successMessage = 'Order delivered successfully! ';
      if (data.billGenerated) {
        successMessage += 'Bill generated automatically. ';
      }
      successMessage += `Wallet credited with ₹${data.creditedAmount}.`;
      
      setMessage(successMessage);
      fetchMyOrders(); // Refresh orders
    } catch (err) {
      console.error('❌ Error marking order as delivered:', err);
      setMessage(err.message || 'Failed to mark order as delivered');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    setIsLoading(true);
    try {
      // Filter products that have quantity > 0 to create the updated items array
      const updatedItems = editModeProducts
        .filter(product => product.quantity > 0)
        .map(product => ({
          productId: product._id,
          quantity: parseInt(product.quantity),
          unit: product.unit
        }));

      if (updatedItems.length === 0) {
        setMessage('Please add at least one product to the order');
        setIsLoading(false);
        return;
      }

      await apiService.put(`/orders/${editingOrder._id}`, {
        items: updatedItems,
        orderDate: editingOrder.orderDate
      });

      setMessage('Order updated successfully!');
      setShowEditModal(false);
      setEditingOrder(null);
      setEditModeProducts([]);
      fetchMyOrders(); // Refresh orders
    } catch (err) {
      console.error('❌ Error updating order:', err);
      setMessage(err.message || 'Failed to update order');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for edit mode products
  const updateEditProductQuantity = (productId, quantity) => {
    setEditModeProducts(prevProducts => 
      prevProducts.map(product => 
        product._id === productId 
          ? { ...product, quantity: quantity }
          : product
      )
    );
  };

  const updateEditProductUnit = (productId, unit) => {
    setEditModeProducts(prevProducts => 
      prevProducts.map(product => 
        product._id === productId 
          ? { ...product, unit: unit }
          : product
      )
    );
  };

  const removeEditProduct = (productId) => {
    setEditModeProducts(prevProducts => 
      prevProducts.map(product => 
        product._id === productId 
          ? { ...product, quantity: 0 }
          : product
      )
    );
  };

  // Get filtered and grouped orders
  const filteredOrders = getFilteredOrders();
  const groupedOrders = getGroupedOrders(filteredOrders);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <StaffNavbar />

      <div className="container-fluid px-2 px-md-3 px-lg-5" style={{ maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8f9fa', paddingTop: '100px', paddingBottom: '120px' }}>
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="display-4 fw-bold text-primary mb-2">
              Place Orders
            </h1>
            <p className="lead text-muted">
              Select distributor and place your orders
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Distributor Selection */}
        <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="card-header bg-primary text-white">
            <h3 className="card-title h5 mb-0">
              <i className="bi bi-truck me-2"></i>
              Select Distributor
            </h3>
          </div>
          <div className="card-body">
            {distributors.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-exclamation-circle text-muted" style={{ fontSize: '4rem' }}></i>
                </div>
                <h4 className="h5 text-muted mb-2">No Distributors Found</h4>
                <p className="text-secondary">Please check your connection or contact support.</p>
              </div>
            ) : (
              <div className="row g-3">
                {distributors.map(dist => (
                  <div key={dist._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: 'white' }}>
                      <div className="card-body text-center">
                        <div className="mb-3">
                          <i className="bi bi-building text-primary" style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h4 className="card-title h6 fw-bold">
                          {dist.distributorName || dist.username || "Distributor"}
                        </h4>
                        <p className="card-text text-muted small">{dist.name}</p>
                        <button
                          className="btn btn-primary btn-sm w-100"
                          onClick={() => handleDistributorSelect(dist)}
                        >
                          <i className="bi bi-clipboard-plus me-2"></i>
                          Place Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Form */}
        {showOrderForm && selectedDistributor && (
          <div className="card border-0 shadow mb-4" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
              <h3 className="card-title h5 mb-0">
                <i className="bi bi-clipboard-plus me-2"></i>
                Place Order for {selectedDistributor.name}
              </h3>
              <button className="btn btn-outline-light btn-sm" onClick={resetOrderForm}>
                <i className="bi bi-x-lg"></i>
                Cancel
              </button>
            </div>
            <div className="card-body">
              <div className="row g-4">
                {/* Order Date Section */}
                <div className="col-12 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: 'white' }}>
                    <div className="card-body">
                      <h5 className="card-title fw-bold mb-3">
                        <i className="bi bi-calendar3 me-2"></i>
                        Order Date
                      </h5>
                      <input
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        min={minDate}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                {/* Available Products Section */}
                <div className="col-12 col-lg-8">
                  {orderDate && (
                    <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="card-body">
                        <h5 className="card-title fw-bold mb-3">
                          <i className="bi bi-box-seam me-2"></i>
                          Available Products ({products.length})
                        </h5>
                        {isFetchingProducts ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading products...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading products...</p>
                          </div>
                        ) : products.length === 0 ? (
                          <div className="text-center py-5">
                            <div className="mb-3">
                              <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                            </div>
                            <h4 className="h6 text-muted mb-2">No Products Available</h4>
                            <p className="text-secondary small">No products found for this distributor on the selected date.</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {products.map(p => (
                              <div key={p._id} className="col-12 col-sm-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: 'white' }}>
                            <div className="card-body">
                              <div className="text-center mb-3">
                               {(() => {
                                                                   // Try different possible image field names
                                  const imageUrl = p.image || p.imageUrl || p.photo || p.picture;
                                  
                                  if (imageUrl) {
                                    const src = getImageUrl(imageUrl);
                                   
                                                                       return (
                                      <>
                                        <div className="staff-image-loading">
                                          <i className="bi bi-arrow-clockwise spin"></i> Loading...
                                        </div>
                                        <img 
                                          src={src}
                                          alt={p.name} 
                                          className="img-fluid rounded"
                                          style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            objectFit: 'cover'
                                          }}
                                          onError={(e) => {
                                            // If image fails to load, show icon
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'inline';
                                          }}
                                          onLoad={(e) => {
                                            // Hide loading indicator
                                            const loadingDiv = e.target.previousSibling;
                                            if (loadingDiv && loadingDiv.className.includes('staff-image-loading')) {
                                              loadingDiv.style.display = 'none';
                                            }
                                          }}
                                        />
                                      </>
                                    );
                                 }
                                 return null;
                               })()}
                                <div style={{ display: (p.image || p.imageUrl || p.photo || p.picture) ? 'none' : 'flex', width: '80px', height: '80px', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '0.375rem' }}>
                                  <i className="bi bi-box-seam text-muted" style={{ fontSize: '2rem' }}></i>
                                </div>
                              </div>
                              <h5 className="card-title h6 text-center mb-3">{p.name}</h5>
                              <div className="mb-3">
                                <label className="form-label small fw-bold text-muted">Order Quantity</label>
                                <input
                                  type="number"
                                  placeholder="Enter qty"
                                  value={p.quantity}
                                  onChange={(e) => setProductQuantity(p._id, e.target.value)}
                                  className="form-control"
                                />
                              </div>
                              <div className="mb-3">
                                <label className="form-label small fw-bold text-muted">Order Unit</label>
                                <select
                                  value={p.unit}
                                  onChange={(e) => setProductUnit(p._id, e.target.value)}
                                  className="form-select"
                                >
                                  <option value="tub">Tub</option>
                                  <option value="bucket">Bucket</option>
                                  <option value="kg">kg</option>
                                </select>
                              </div>
                              <button
                                className={`btn w-100 ${p.added ? 'btn-success' : 'btn-primary'}`}
                                onClick={() => !p.added && addToOrder(p)}
                                disabled={p.added}
                              >
                                {p.added ? (
                                  <>
                                    <i className="bi bi-check-lg me-2"></i>
                                    Added to Order
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-plus-lg me-2"></i>
                                    Add to Order
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Order Button */}
              {orderItems.length > 0 && (
                <div className="text-center mt-4">
                  <button className="btn btn-success btn-lg" onClick={submitOrder} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-rocket-takeoff me-2"></i>
                        Place Order ({orderItems.length} items)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Orders Section */}
        <div className="card border-0 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="card-header bg-primary text-dark">
            <div className="d-flex flex-column justify-content-between align-items-start">
              <h3 className="card-title h5 mb-3">
                <i className="bi bi-clipboard-check me-2"></i>
                My Orders
              </h3>
              
              {/* Enhanced Controls - Mobile Optimized */}
              <div className="d-flex flex-column gap-3 w-100">
                {/* View Mode Toggle */}
                <div className="btn-group btn-group-sm w-100" role="group">
                  <button 
                    className={`btn flex-fill ${viewMode === 'cards' ? 'btn-light' : 'btn-outline-light'}`}
                    onClick={() => setViewMode('cards')}
                  >
                    <i className="bi bi-grid-3x3-gap me-1"></i> Cards
                  </button>
                  <button 
                    className={`btn flex-fill ${viewMode === 'table' ? 'btn-light' : 'btn-outline-light'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <i className="bi bi-table me-1"></i> Table
                  </button>
                </div>

                {/* Search and Filters - Stacked on Mobile */}
                <div className="d-flex flex-column gap-2">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control form-control-sm"
                  />
                  <div className="row g-2">
                    <div className="col-6">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="form-select form-select-sm"
                      >
                        <option value="">All Status ({safeMyOrders.length})</option>
                        {availableStatuses.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)} ({safeMyOrders.filter(o => o.status === status).length})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <select
                        value={selectedDistributorFilter}
                        onChange={(e) => setSelectedDistributorFilter(e.target.value)}
                        className="form-select form-select-sm"
                      >
                        <option value="">All Distributors</option>
                        {distributors.map(dist => (
                          <option key={dist._id} value={dist.name || dist.distributorName}>
                            {dist.name || dist.distributorName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* Order Summary */}
            {safeMyOrders.length > 0 && (
              <div className="alert alert-light border-0 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Showing {filteredOrders.length} of {safeMyOrders.length} orders</strong>
                    {(searchTerm || selectedStatus || selectedDistributorFilter) && (
                      <button 
                        className="btn btn-link btn-sm p-0 ms-2"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedStatus("pending");
                          setSelectedDistributorFilter("");
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <small className="text-muted">
                    Last updated: {new Date().toLocaleTimeString()}
                  </small>
                </div>
              </div>
            )}

            {/* Bulk Operations */}
            {filteredOrders.length > 0 && (
              <div className="border rounded p-3 mb-3 bg-light">
                <div className="d-flex flex-column gap-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={selectAllOrders}
                      className="form-check-input"
                      id="selectAll"
                    />
                    <label className="form-check-label fw-bold" htmlFor="selectAll">
                      Select All ({selectedOrders.length}/{filteredOrders.length})
                    </label>
                  </div>
                  
                  {selectedOrders.length > 0 && (
                    <div className="d-flex flex-column flex-sm-row gap-2">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={bulkMarkAsDelivered}
                        disabled={isLoading}
                        title="Mark selected orders as delivered"
                      >
                        <i className="bi bi-check-lg"></i> Mark Delivered ({selectedOrders.length})
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={bulkDeleteOrders}
                        disabled={isLoading}
                        title="Delete selected orders"
                      >
                        <i className="bi bi-trash"></i> Delete ({selectedOrders.length})
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedOrders([])}
                        title="Clear selection"
                      >
                        <i className="bi bi-x-lg"></i> Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                </div>
                <h4 className="h5 text-muted mb-2">No Orders Found</h4>
                <p className="text-secondary">
                  {searchTerm || selectedStatus || selectedDistributorFilter 
                    ? "No orders match your current filters. Try adjusting your search criteria."
                    : "You haven't placed any orders yet. Start by placing a new order above."
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Table View */}
                {viewMode === 'table' && (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th width="50">
                            <input
                              type="checkbox"
                              checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                              onChange={selectAllOrders}
                              className="form-check-input"
                            />
                          </th>
                          <th>Order Date</th>
                          <th>Distributor</th>
                          <th>Status</th>
                          <th>Total Items</th>
                          <th>Items Details</th>
                          <th width="200">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <tr key={order._id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order._id)}
                                onChange={() => toggleOrderSelection(order._id)}
                                className="form-check-input"
                              />
                            </td>
                            <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                            <td>{order.distributorId?.name || order.distributorId?.distributorName || 'Unknown'}</td>
                            <td>
                              <span className="badge bg-warning text-dark">
                                {order.status}
                              </span>
                            </td>
                            <td><strong>{order.items?.length || 0}</strong></td>
                            <td>
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="small text-muted">
                                  {item.productId?.name || 'N/A'} <strong>{item.quantity}</strong> {item.unit}
                                </div>
                              ))}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm" role="group">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleViewOrder(order)}
                                  title="View Order Details"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleEditOrder(order)}
                                  title="Edit Order"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-info btn-sm"
                                  onClick={() => copyOrderDetails(order)}
                                  title="Copy Order Details"
                                >
                                  <i className="bi bi-clipboard"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => resendNotification(order)}
                                  title="Resend Notification"
                                >
                                  <i className="bi bi-bell"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => handleMarkDelivered(order._id)}
                                  title="Mark as Delivered"
                                >
                                  <i className="bi bi-check-circle"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteOrder(order._id)}
                                  title="Delete Order"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Cards View - Grouped by Distributor */}
                {viewMode === 'cards' && (
                  <>
                    {Object.keys(groupedOrders).map(distributorName => (
                      <div key={distributorName} className="mb-4">
                        <div className="bg-primary text-dark p-2 rounded-top">
                          <h6 className="mb-0">
                            <i className="bi bi-truck me-2"></i>
                            {distributorName}
                          </h6>
                        </div>
                        <div className="row g-3 p-3 border border-top-0 rounded-bottom">
                          {groupedOrders[distributorName].map(order => (
                            <div key={order._id} className="col-md-6 col-lg-4">
                              <div className="card h-100 border border-light shadow-sm">
                                <div className="card-header bg-warning d-flex justify-content-between align-items-center">
                                  <div className="form-check">
                                    <input
                                      type="checkbox"
                                      checked={selectedOrders.includes(order._id)}
                                      onChange={() => toggleOrderSelection(order._id)}
                                      className="form-check-input"
                                      id={`order-${order._id}`}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor={`order-${order._id}`}>
                                      Order #{order._id.slice(-6)}
                                    </label>
                                  </div>
                                  <div className="text-muted">
                                    <i className="bi bi-clock"></i>
                                  </div>
                                </div>
                                <div className="card-body">
                                  <div className="mb-3">
                                    <small className="text-muted d-block">
                                      <i className="bi bi-calendar3 me-1"></i>
                                      Order Date
                                    </small>
                                    <strong>{new Date(order.orderDate).toLocaleDateString()}</strong>
                                  </div>
                                  <div className="mb-3">
                                    <small className="text-muted d-block">Status</small>
                                    <span className="badge bg-warning text-dark">{order.status}</span>
                                  </div>
                                  <div>
                                    <small className="text-muted d-block">
                                      <i className="bi bi-box-seam me-1"></i>
                                      Order Items
                                    </small>
                                    <div className="mt-2">
                                      {order.items && order.items.length > 0 ? (
                                        order.items.map((item, index) => (
                                          <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                            <span className="text-truncate me-2">
                                              {item.productId?.name || 'Unknown Product'}
                                            </span>
                                            <span className="badge bg-secondary">
                                              {item.quantity} {item.unit}
                                            </span>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-muted small">No items found</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="card-footer bg-transparent">
                                  <div className="d-flex flex-wrap gap-1">
                                    <button 
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleViewOrder(order)}
                                      title="View Order Details"
                                    >
                                      <i className="bi bi-eye"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() => handleEditOrder(order)}
                                      title="Edit Order"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-info btn-sm"
                                      onClick={() => copyOrderDetails(order)}
                                      title="Copy Order Details"
                                    >
                                      <i className="bi bi-clipboard"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-warning btn-sm"
                                      onClick={() => resendNotification(order)}
                                      title="Resend Notification"
                                    >
                                      <i className="bi bi-bell"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-success btn-sm"
                                      onClick={() => handleMarkDelivered(order._id)}
                                      title="Mark as Delivered"
                                    >
                                      <i className="bi bi-check-circle"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => handleDeleteOrder(order._id)}
                                      title="Delete Order"
                                    >
                                      🗑️
                                    </button>
                                    <button 
                                      className="btn btn-outline-dark btn-sm"
                                      onClick={() => generateBill(order)}
                                      title="Generate Bill"
                                    >
                                      📄
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowViewModal(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-clipboard-data me-2"></i>
                  Order Details
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong className="text-muted">Order ID:</strong>
                    <p className="mb-2">{selectedOrder._id}</p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-muted">Date:</strong>
                    <p className="mb-2">{new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-muted">Status:</strong>
                    <p className="mb-2">
                      <span className="badge bg-warning text-dark">{selectedOrder.status}</span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-muted">Created:</strong>
                    <p className="mb-2">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <hr />
                <h6 className="fw-bold">
                  <i className="bi bi-box-seam me-2"></i>
                  Order Items:
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.productId?.name || 'Unknown Product'}</td>
                            <td><strong>{item.quantity}</strong></td>
                            <td>{item.unit}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">No items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Order
                </h5>
                <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-calendar3 me-2"></i>
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={editingOrder.orderDate ? new Date(editingOrder.orderDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingOrder({...editingOrder, orderDate: e.target.value})}
                    className="form-control"
                  />
                </div>
                
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-box-seam me-2"></i>
                  Available Products:
                </h6>
                
                {/* Debug info and Summary of current order */}
                <div className="alert alert-secondary mb-3 small">
                  <strong>Debug:</strong> {editModeProducts.length} products loaded
                  {editModeProducts.filter(p => p.quantity > 0).length > 0 && (
                    <span> | <strong>{editModeProducts.filter(p => p.quantity > 0).length} product(s) selected</strong></span>
                  )}
                </div>
                
                <div className="row g-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {editModeProducts.length > 0 ? (
                    editModeProducts.map((product) => (
                      <div key={product._id} className="col-12 col-sm-6 col-lg-4">
                        <div className={`card h-100 ${product.quantity > 0 ? 'border-primary' : 'border-light'} shadow-sm`}>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="text-center mb-3 flex-shrink-0 me-3">
                                {(() => {
                                  const imageUrl = product.image || product.imageUrl || product.photo || product.picture;
                                  
                                  if (imageUrl) {
                                    const src = getImageUrl(imageUrl);
                                   
                                    return (
                                      <img 
                                        src={src}
                                        alt={product.name} 
                                        className="img-fluid rounded"
                                        style={{ 
                                          width: '60px', 
                                          height: '60px', 
                                          objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    );
                                  }
                                  return null;
                                })()}
                                <div style={{ display: (product.image || product.imageUrl || product.photo || product.picture) ? 'none' : 'flex', width: '60px', height: '60px', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '0.375rem' }}>
                                  <i className="bi bi-box-seam text-muted" style={{ fontSize: '1.5rem' }}></i>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="card-title mb-2">{product.name}</h6>
                                {product.isInOrder && (
                                  <span className="badge bg-success mb-2">
                                    <i className="bi bi-check-circle me-1"></i>
                                    In Order
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label small fw-bold text-muted">Order Quantity</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Enter qty"
                                value={product.quantity}
                                onChange={(e) => updateEditProductQuantity(product._id, e.target.value)}
                                className="form-control"
                              />
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label small fw-bold text-muted">Order Unit</label>
                              <select
                                value={product.unit}
                                onChange={(e) => updateEditProductUnit(product._id, e.target.value)}
                                className="form-select"
                              >
                                <option value="tub">Tub</option>
                                <option value="bucket">Bucket</option>
                                <option value="kg">kg</option>
                              </select>
                            </div>
                            
                            <div className="d-flex gap-2">
                              {product.quantity > 0 ? (
                                <button
                                  className="btn btn-danger btn-sm flex-grow-1"
                                  onClick={() => removeEditProduct(product._id)}
                                >
                                  <i className="bi bi-trash me-2"></i>
                                  Remove
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm flex-grow-1"
                                  onClick={() => updateEditProductQuantity(product._id, 1)}
                                >
                                  <i className="bi bi-plus-lg me-2"></i>
                                  Add to Order
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-box-seam" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-2">Loading available products...</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleUpdateOrder}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPlaceOrders;
