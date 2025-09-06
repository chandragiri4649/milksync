import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";
import { NavLink } from "react-router-dom";
import StaffNavbar from "./StaffNavbar";
import DeleteModal from "../DeleteModal";
import StaffEditOrderModal from "./StaffEditOrderModal";
import StaffViewOrderModal from "./StaffViewOrderModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StaffPlaceOrder = () => {
    const { token, user } = useAuth();

    // Add blinking animation styles
    const blinkingStyles = `
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
        }
        .blink-arrow {
            animation: blink 1.5s infinite;
        }
    `;

    // Inject styles
    React.useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = blinkingStyles;
        document.head.appendChild(styleSheet);
        
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    // Helper function to get the correct image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/placeholder-product.jpg";
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${process.env.REACT_APP_IMAGE_BASE_URL || ''}${imageUrl}`;
    };

    // Color palette for distributor cards
    const distributorColors = [
        'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',  // Purple
        'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',  // Green
        'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',  // Orange
        'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',  // Blue
        'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',  // Pink
        'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)',  // Light Green
        'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',  // Light Orange
        'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',  // Teal
    ];

    // Function to get color for distributor
    const getDistributorColor = (index) => {
        return distributorColors[index % distributorColors.length];
    };

    const [distributors, setDistributors] = useState([]);
    const [selectedDistributor, setSelectedDistributor] = useState(null);
    const [products, setProducts] = useState([]);
    const [orderDate, setOrderDate] = useState("");
    const [orderItems, setOrderItems] = useState([]);
    const [isFetchingProducts, setIsFetchingProducts] = useState(false);
    const [myOrders, setMyOrders] = useState([]);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("pending");
    const [selectedDistributorFilter, setSelectedDistributorFilter] = useState("");
    const [viewMode, setViewMode] = useState("cards");
    const [selectedOrders, setSelectedOrders] = useState([]);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);

    // Fetch distributors
    const fetchDistributors = useCallback(async () => {
        try {
            const data = await apiService.get('/distributor');
            setDistributors(data);
        } catch (err) {
            toast.error("Failed to load distributors");
        }
    }, []);

    // Fetch my orders
    const fetchMyOrders = useCallback(async () => {
        try {
            const data = await apiService.get('/orders');
            if (Array.isArray(data)) {
                setMyOrders(data);
            } else {
                setMyOrders([]);
                toast.warning("No orders data received");
            }
        } catch (err) {
            toast.error(err.message || "Failed to load orders");
            setMyOrders([]);
        }
    }, []);

    const safeMyOrders = Array.isArray(myOrders) ? myOrders : [];
    const availableStatuses = [...new Set(safeMyOrders.map(order => order.status))].filter(Boolean);

    // Filter orders based on search criteria
    const getFilteredOrders = () => {
        let filtered = safeMyOrders;

        if (selectedStatus) {
            filtered = filtered.filter(order => order.status === selectedStatus);
        }

        if (selectedDistributorFilter) {
            filtered = filtered.filter(order => {
                const distributorName = order.distributorId?.name || order.distributorId?.distributorName || '';
                return distributorName.toLowerCase().includes(selectedDistributorFilter.toLowerCase());
            });
        }

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

    // Group orders by distributor
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

    // Bulk operations
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
            toast.warning("Please select orders to mark as delivered");
            return;
        }

        if (!window.confirm(`Mark ${selectedOrders.length} orders as delivered?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const promises = selectedOrders.map(orderId =>
                apiService.post(`/orders/${orderId}/deliver`)
            );

            await Promise.all(promises);
            toast.success(`${selectedOrders.length} orders marked as delivered successfully!`);
            setSelectedOrders([]);
            fetchMyOrders();
        } catch (err) {
            toast.error('Failed to mark some orders as delivered');
        } finally {
            setIsLoading(false);
        }
    };

    const bulkDeleteOrders = async () => {
        if (selectedOrders.length === 0) {
            toast.warning("Please select orders to delete");
            return;
        }

        if (!window.confirm(`Delete ${selectedOrders.length} orders?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const promises = selectedOrders.map(orderId =>
                apiService.delete(`/orders/${orderId}`)
            );

            await Promise.all(promises);
            toast.success(`${selectedOrders.length} orders deleted successfully!`);
            setSelectedOrders([]);
            fetchMyOrders();
        } catch (err) {
            toast.error('Failed to delete some orders');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDistributors();
        fetchMyOrders();
    }, [fetchDistributors, fetchMyOrders]);

    // Fetch products after distributor and date are selected
    useEffect(() => {
        if (selectedDistributor && orderDate) {
            setIsFetchingProducts(true);

            apiService.get(`/products/distributor/${selectedDistributor._id}`)
                .then(data => {
                    if (!Array.isArray(data) || data.length === 0) {
                        toast.warning("No products available for this distributor on the selected date");
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
                    toast.error(err.message || "Failed to load products");
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

    // Order management functions
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
        // Enhanced validation
        if (!product.quantity || product.quantity <= 0) {
            toast.warning("Please enter a valid quantity");
            return;
        }

        // Check for duplicate products
        const existingItem = orderItems.find(item => item.productId === product._id);
        if (existingItem) {
            toast.warning("This product is already in your order. Remove it first to add again.");
            return;
        }

        const quantity = Number(product.quantity);
        
        // Additional quantity validation
        if (quantity > 10000) {
            toast.warning("Maximum quantity allowed is 10,000");
            return;
        }

        const newItem = {
            productId: product._id,
            quantity: quantity,
            unit: product.unit || 'tub'
        };

        setOrderItems(prev => [...prev, newItem]);
        setProducts(prev => prev.map(p =>
            p._id === product._id ? { ...p, added: true } : p
        ));
        
        const productDisplay = product.productQuantity && product.productUnit 
            ? `${product.name} ${product.productQuantity}${product.productUnit}`
            : product.name;
        toast.success(`Added ${quantity} ${newItem.unit} of ${productDisplay}`);
    };

    const submitOrder = async () => {
        // Enhanced validation
        if (!selectedDistributor) {
            toast.warning("Please select a distributor");
            return;
        }
        
        if (!orderDate) {
            toast.warning("Please select an order date");
            return;
        }
        
        if (orderItems.length === 0) {
            toast.warning("Please add at least one item to your order");
            return;
        }

        // Check if order date is in the past
        const today = new Date();
        const selectedDate = new Date(orderDate);
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            toast.warning("Order date cannot be in the past");
            return;
        }

        setIsLoading(true);
        try {
            const orderData = {
                distributorId: selectedDistributor._id,
                orderDate,
                items: orderItems.map(item => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    unit: item.unit || 'tub'
                }))
            };

            await apiService.post('/orders', orderData);

            toast.success(`Order placed successfully! ${orderItems.length} items ordered from ${selectedDistributor.distributorName || selectedDistributor.name}`);
            
            // Reset form
            setOrderItems([]);
            setSelectedDistributor(null);
            setProducts([]);
            setOrderDate("");
            setShowOrderForm(false);
            
            // Refresh orders list
            await fetchMyOrders();
        } catch (err) {
            console.error('Order submission error:', err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to place order";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromOrder = (productId) => {
        setOrderItems(prev => prev.filter(item => item.productId !== productId));
        setProducts(prev => prev.map(p =>
            p._id === productId ? { ...p, added: false, quantity: '' } : p
        ));
        toast.info("Item removed from order");
    };

    const resetOrderForm = () => {
        setSelectedDistributor(null);
        setProducts([]);
        setOrderItems([]);
        setOrderDate("");
        setShowOrderForm(false);
    };

    const handleEditOrder = async (order) => {
        setEditingOrder(order);
        setShowEditModal(true);
    };

    const handleUpdateOrder = async (updatedOrder) => {
        toast.success('Order updated successfully!');
        setShowEditModal(false);
        setEditingOrder(null);
        fetchMyOrders();
    };

    const handleDeleteOrder = async (order) => {
        setOrderToDelete(order);
        setShowDeleteModal(true);
    };

    const confirmDeleteOrder = async () => {
        if (!orderToDelete) return;

        setIsLoading(true);
        try {
            await apiService.delete(`/orders/${orderToDelete._id}`);
            toast.success('Order deleted successfully!');
            fetchMyOrders();
            setShowDeleteModal(false);
            setOrderToDelete(null);
        } catch (err) {
            toast.error(err.message || 'Failed to delete order');
        } finally {
            setIsLoading(false);
        }
    };

    const cancelDeleteOrder = () => {
        setShowDeleteModal(false);
        setOrderToDelete(null);
    };


    // Get filtered and grouped orders
    const filteredOrders = getFilteredOrders();
    const groupedOrders = getGroupedOrders(filteredOrders);

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
            <StaffNavbar />

            <div className="container-fluid px-3 px-md-5" style={{ maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8f9fa', paddingTop: '100px', paddingBottom: '80px' }}>

                {/* Welcome Header */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm text-white bg-primary">
                            <div className="card-body p-3 p-md-4">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <h1 className="display-6 fw-bold mb-1">
                                            Place Orders 
                                        </h1>
                                        <p className="lead mb-0 opacity-75">
                                            Select distributors and create orders with our streamlined interface
                                        </p>
                                    </div>
                                    <div className="col-md-4 text-center">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Distributor Selection - Enhanced Design */}
                <div className="row mb-5" id="distributor-section">
                    <div className="col-12">
                        <div className="card border-0 bg-light shadow-sm">
                            <div className="card-header bg-secondary border-0 py-3">
                                <div className="d-flex align-items-center">
                                    <div className="bg-light bg-opacity-10 rounded-circle p-2 me-3">
                                        <i className="bi bi-truck text-white"></i>
                                    </div>
                                    <h4 className="mb-0 fw-bold text-white">Select Distributor</h4>
                                    <span className="badge bg-success rounded-pill ms-auto">
                                        {distributors.length} available
                                    </span>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                {distributors.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-4">
                                            <i className="bi bi-exclamation-circle text-muted" style={{ fontSize: '3rem' }}></i>
                                        </div>
                                        <h5 className="text-muted mb-2">No Distributors Found</h5>
                                        <p className="text-muted">Please check your connection or contact support.</p>
                                    </div>
                                ) : (
                                    <div className="row g-4">
                                        {distributors.map((dist, index) => (
                                            <div key={dist._id} className="col-lg-3 col-md-4 col-sm-6">
                                                <div 
                                                    className="card border-0 shadow-sm h-100" 
                                                    style={{ 
                                                        transition: 'all 0.3s ease-in-out',
                                                        background: getDistributorColor(index),
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                                        e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)';
                                                        e.currentTarget.style.borderRadius = '12px';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                                        e.currentTarget.style.borderRadius = '8px';
                                                    }}>
                                                    <div className="card-body p-4 text-center">
                                                        <div className="bg-white bg-opacity-20 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                                                            <i className="bi bi-building text-dark" style={{ fontSize: '2.5rem' }}></i>
                                                        </div>
                                                        <h5 className="fw-bold mb-2 text-dark">
                                                            {dist.distributorName || dist.username || "Distributor"}
                                                        </h5>
                                                        <p className="text-dark text-opacity-75 mb-3">{dist.companyName}</p>
                                                        <button
                                                            className="btn btn-success w-100"
                                                            style={{
                                                                transition: 'all 0.3s ease-in-out',
                                                                transform: 'translateY(0)',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                                                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                            }}
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
                    </div>
                </div>

                {/* Order Form - Combined Header and Form */}
                {showOrderForm && selectedDistributor && (
                    <div className="row mb-5">
                        <div className="col-12">
                            <div className="card border-0 bg-light shadow-sm">
                                <div className="card-header bg-primary text-white border-0 py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-primary bg-opacity-20 rounded-circle p-2 me-3">
                                                <i className="bi bi-clipboard-plus text-white"></i>
                                            </div>
                                            <h4 className="mb-0 fw-bold">
                                                Place Order for {selectedDistributor.companyName || selectedDistributor.distributorName || selectedDistributor.name}
                                            </h4>
                                            <span className="badge bg-white text-primary rounded-pill ms-3">
                                                {orderItems.length} items selected
                                            </span>
                                        </div>
                                        <button className="btn btn-outline-light btn-sm" onClick={resetOrderForm}>
                                            <i className="bi bi-x-lg me-2"></i>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body p-4">
                                    {/* Order Placement Guidelines - Side by Side */}
                                    <div className="alert alert-warning border-0 mb-4">
                                        <div className="d-flex justify-content-center align-items-start mb-2">
                                            <i className="bi bi-exclamation-triangle-fill text-warning me-2 mt-1"></i>
                                            <strong>Order Placement Guidelines:</strong>
                                        </div>
                                        <div className="row g-3 justify-content-center">
                                            <div className="col-lg-4 col-md-6">
                                                <div className="d-flex align-items-start">
                                                    <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                                                    <div>
                                                        <strong>Product Verification</strong>
                                                        <p className="mb-0 small text-muted">Carefully verify all product selections and quantities</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-4 col-md-6">
                                                <div className="d-flex align-items-start">
                                                    <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                                                    <div>
                                                        <strong>Unit Selection</strong>
                                                        <p className="mb-0 small text-muted">Ensure correct units (tubs, buckets, kg, etc.) are selected</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-4 col-md-12">
                                                <div className="d-flex align-items-start">
                                                    <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                                                    <div>
                                                        <strong>Final Review</strong>
                                                        <p className="mb-0 small text-muted">Review the complete order before submission</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Date Section - Full Width */}
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div className="card border-0 shadow-sm">
                                                <div className="card-body">
                                                    <h5 className="card-title fw-bold mb-3">
                                                        <i className="bi bi-calendar3 me-2"></i>
                                                        Select Order Date
                                                        {!orderDate && (
                                                            <span className="ms-2 d-inline-flex align-items-center">
                                                                <i className="bi bi-arrow-right text-danger blink-arrow me-2" style={{ fontSize: '1.6rem' }}></i>
                                                                <span className="text-primary fw-normal" style={{ fontSize: '0.9rem' }}>Please select the date first</span>
                                                            </span>
                                                        )}
                                                    </h5>
                                                    <div className="row">
                                                        <div className="col-md-4 col-sm-6">
                                                            <input
                                                                type="date"
                                                                value={orderDate}
                                                                onChange={(e) => setOrderDate(e.target.value)}
                                                                min={minDate}
                                                                className="form-control"
                                                                style={{ maxWidth: '200px' }}
                                                            />
                                                        </div>
                                                        {orderDate && (
                                                            <div className="col-md-8 col-sm-6">
                                                                <div className="alert alert-info border-0 mb-0">
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="bi bi-calendar-check text-info me-2"></i>
                                                                        <div>
                                                                            <strong>Selected Date:</strong>
                                                                            <span className="text-muted ms-2">
                                                                                {new Date(orderDate).toLocaleDateString('en-US', {
                                                                                    weekday: 'long',
                                                                                    year: 'numeric',
                                                                                    month: 'long',
                                                                                    day: 'numeric'
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Side-by-Side Layout: Products & Order Review */}
                                    {orderDate && (
                                        <div className="row g-4">
                                            {/* Left Side - Available Products */}
                                            <div className="col-lg-8 col-md-12 order-2 order-lg-1">
                                                <div className="card border-0 shadow-sm h-100">
                                                    <div className="card-header bg-primary text-white">
                                                        <h5 className="mb-0 fw-bold">
                                                            <i className="bi bi-box-seam me-2"></i>
                                                            Available Products ({products.length})
                                                        </h5>
                                                    </div>
                                                    <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                                        {isFetchingProducts ? (
                                                            <div className="text-center py-4">
                                                                <div className="spinner-border text-primary" role="status">
                                                                    <span className="visually-hidden">Loading products...</span>
                                                                </div>
                                                                <p className="mt-2 text-muted">Loading products...</p>
                                                            </div>
                                                        ) : products.length === 0 ? (
                                                            <div className="text-center py-5">
                                                                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-4">
                                                                    <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                                                                </div>
                                                                <h5 className="text-muted mb-2">No Products Available</h5>
                                                                <p className="text-muted">No products found for this distributor on the selected date.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="row g-3">
                                                                {products.map(p => (
                                                                    <div key={p._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                                                                        <div className="card h-100 border-0 shadow-sm">
                                                                            <div className="card-body p-3">
                                                                                <div className="text-center mb-2">
                                                                                    {(() => {
                                                                                        const imageUrl = p.image || p.imageUrl || p.photo || p.picture;

                                                                                        if (imageUrl) {
                                                                                            const src = getImageUrl(imageUrl);

                                                                                            return (
                                                                                                <img
                                                                                                    src={src}
                                                                                                    alt={p.name}
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
                                                                                    <div style={{ display: (p.image || p.imageUrl || p.photo || p.picture) ? 'none' : 'flex', width: '60px', height: '60px', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '0.375rem' }}>
                                                                                        <i className="bi bi-box-seam text-muted" style={{ fontSize: '1.5rem' }}></i>
                                                                                    </div>
                                                                                </div>
                                                                                <h6 className="card-title text-center mb-2 small">
                                                                                    {p.name}
                                                                                    {p.productQuantity && p.productUnit && (
                                                                                        <span className="text-muted ms-1">
                                                                                            {p.productQuantity}{p.productUnit}
                                                                                        </span>
                                                                                    )}
                                                                                    {p.quantity && (
                                                                                        <span className="badge bg-info ms-2 small">
                                                                                            {p.quantity} {p.unit}
                                                                                        </span>
                                                                                    )}
                                                                                </h6>
                                                                                <div className="mb-2">
                                                                                    <label className="form-label small fw-bold text-muted">Quantity</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        placeholder="Enter qty"
                                                                                        value={p.quantity}
                                                                                        onChange={(e) => setProductQuantity(p._id, e.target.value)}
                                                                                        className="form-control form-control-sm"
                                                                                    />
                                                                                </div>
                                                                                <div className="mb-3">
                                                                                    <label className="form-label small fw-bold text-muted">Unit</label>
                                                                                    <select
                                                                                        value={p.unit}
                                                                                        onChange={(e) => setProductUnit(p._id, e.target.value)}
                                                                                        className="form-select form-select-sm"
                                                                                    >
                                                                                        <option value="tub">Tub</option>
                                                                                        <option value="bucket">Bucket</option>
                                                                                        <option value="kg">Kilogram (kg)</option>
                                                                                        <option value="liter">Liter (L)</option>
                                                                                        <option value="box">Box</option>
                                                                                        <option value="packet">Packet</option>
                                                                                        <option value="gm">Grams (gm)</option>
                                                                                    </select>
                                                                                </div>
                                                                                <button
                                                                                    className={`btn btn-sm w-100 ${p.added ? 'btn-success' : 'btn-primary'}`}
                                                                                    onClick={() => !p.added && addToOrder(p)}
                                                                                    disabled={p.added}
                                                                                >
                                                                                    {p.added ? (
                                                                                        <>
                                                                                            <i className="bi bi-check-lg me-1"></i>
                                                                                            Added
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <i className="bi bi-plus-lg me-1"></i>
                                                                                            Add
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
                                            </div>

                                            {/* Right Side - Order Review */}
                                            <div className="col-lg-4 col-md-12 order-1 order-lg-2">
                                                <div className="card border-0 shadow-sm h-100 position-lg-sticky" style={{ top: '20px' }}>
                                                    <div className="card-header bg-success text-white">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h5 className="mb-0 fw-bold">
                                                                <i className="bi bi-clipboard-check me-2"></i>
                                                                Order Review ({orderItems.length})
                                                            </h5>
                                                            {/* Mobile toggle for order review - only show on small screens */}
                                                            <div className="d-lg-none">
                                                                <button 
                                                                    className="btn btn-outline-light btn-sm"
                                                                    type="button"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target="#orderReviewCollapse"
                                                                    aria-expanded="true"
                                                                    aria-controls="orderReviewCollapse"
                                                                >
                                                                    <i className="bi bi-chevron-down"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="collapse show" id="orderReviewCollapse">
                                                        <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                                            {orderItems.length === 0 ? (
                                                                <div className="text-center py-4">
                                                                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                                                                        <i className="bi bi-cart text-muted" style={{ fontSize: '2rem' }}></i>
                                                                    </div>
                                                                    <h6 className="text-muted mb-2">No Items Selected</h6>
                                                                    <p className="text-muted small">Add products from the left panel to review your order</p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {/* Order Summary */}
                                                                    <div className="mb-3">
                                                                        <h6 className="fw-bold text-primary mb-2">
                                                                            <i className="bi bi-building me-1"></i>
                                                                            Order Summary
                                                                        </h6>
                                                                        <div className="small text-muted">
                                                                            <div><strong>Distributor:</strong> {selectedDistributor.companyName || selectedDistributor.distributorName}</div>
                                                                            <div><strong>Date:</strong> {new Date(orderDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                                                            <div><strong>Items:</strong> {orderItems.length}</div>
                                                                        </div>
                                                                    </div>

                                                                    <hr />

                                                                    {/* Selected Items */}
                                                                    <h6 className="fw-bold text-success mb-2">
                                                                        <i className="bi bi-check-circle me-1"></i>
                                                                        Selected Items
                                                                    </h6>
                                                                    <div className="list-group list-group-flush">
                                                                        {orderItems.map((item, index) => {
                                                                            const product = products.find(p => p._id === item.productId);
                                                                            return (
                                                                                <div key={index} className="list-group-item px-0 py-2 border-0">
                                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                                        <div className="flex-grow-1">
                                                                                            <h6 className="mb-1 small fw-bold">
                                                                                                {product?.name || 'Unknown Product'}
                                                                                                {product?.productQuantity && product?.productUnit && (
                                                                                                    <span className="text-muted ms-1 fw-normal">
                                                                                                        {product.productQuantity}{product.productUnit}
                                                                                                    </span>
                                                                                                )}
                                                                                                <span className="badge bg-primary ms-2 small">
                                                                                                    {item.quantity} {item.unit}
                                                                                                </span>
                                                                                            </h6>
                                                                                        </div>
                                                                        <button
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            onClick={() => removeFromOrder(item.productId)}
                                                                            title="Remove item from order"
                                                                        >
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Order Actions */}
                                                        {orderItems.length > 0 && (
                                                            <div className="card-footer bg-light">
                                                                {/* Verification Checklist - Side by Side */}
                                                                <div className="alert alert-warning border-0 mb-3">
                                                                    <div className="d-flex align-items-center mb-2">
                                                                        <i className="bi bi-shield-check text-warning me-2"></i>
                                                                        <strong className="small">Final Check:</strong>
                                                                    </div>
                                                                    <div className="row g-2">
                                                                        <div className="col-6">
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="bi bi-check-circle-fill text-success me-1" style={{ fontSize: '0.75rem' }}></i>
                                                                                <span className="small">Product names</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="bi bi-check-circle-fill text-success me-1" style={{ fontSize: '0.75rem' }}></i>
                                                                                <span className="small">Quantities</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="bi bi-check-circle-fill text-success me-1" style={{ fontSize: '0.75rem' }}></i>
                                                                                <span className="small">Units (tubs, kg)</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="bi bi-check-circle-fill text-success me-1" style={{ fontSize: '0.75rem' }}></i>
                                                                                <span className="small">Delivery date</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <button 
                                                                    className="btn btn-success w-100" 
                                                                    onClick={submitOrder} 
                                                                    disabled={isLoading}
                                                                >
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
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {/* My Orders Section - Enhanced Design */}
                <div className="row" id="my-orders-section">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0 py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                                            <i className="bi bi-clipboard-check text-info"></i>
                                        </div>
                                        <h4 className="mb-0 fw-bold">pending Orders</h4>
                                        <span className="badge bg-info rounded-pill ms-3">
                                            {filteredOrders.length} orders
                                        </span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <div className="btn-group bg-light btn-group-sm" role="group">
                                            <button
                                                className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setViewMode('cards')}
                                            >
                                                <i className="bi bi-grid-3x3-gap me-1"></i> Cards
                                            </button>
                                            <button
                                                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setViewMode('table')}
                                            >
                                                <i className="bi bi-table me-1"></i> Table
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                {filteredOrders.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-4">
                                            <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                                        </div>
                                        <h5 className="text-muted mb-2">No Orders Found</h5>
                                        <p className="text-muted">
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
                                                                            {item.productId?.name || 'N/A'}
                                                                            {item.productId?.productQuantity && item.productId?.productUnit && (
                                                                                <span className="text-muted ms-1">
                                                                                    {item.productId.productQuantity}{item.productId.productUnit}
                                                                                </span>
                                                                            )}
                                                                            <span className="badge bg-primary ms-1 small">
                                                                                {item.quantity} {item.unit}
                                                                            </span>
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
                                                                            <i className="bi bi-eye me-1"></i>
                                                                            View
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-outline-secondary btn-sm"
                                                                            onClick={() => handleEditOrder(order)}
                                                                            title="Edit Order"
                                                                        >
                                                                            <i className="bi bi-pencil me-1"></i>
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            onClick={() => handleDeleteOrder(order)}
                                                                            title="Delete Order"
                                                                        >
                                                                            <i className="bi bi-trash me-1"></i>
                                                                            Delete
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
                                                        <div className="bg-primary text-white p-3 rounded-top">
                                                            <h6 className="mb-0">
                                                                <i className="bi bi-truck me-2"></i>
                                                                {distributorName}
                                                            </h6>
                                                        </div>
                                                        <div className="row g-3 p-3 border border-top-0 rounded-bottom ">
                                                            {groupedOrders[distributorName].map(order => (
                                                                <div key={order._id} className="col-md-6 col-lg-4">
                                                                    <div className="card h-100  border-0 shadow-sm">
                                                                        <div className="card-header bg-success d-flex justify-content-between align-items-center">
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
                                                                            <span className="badge bg-warning text-dark">
                                                                                {order.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className="card-body">
                                                                            <div className="mb-3">
                                                                                <small className="text-muted d-block">
                                                                                    <i className="bi bi-calendar3 me-1"></i>
                                                                                    Order Date
                                                                                </small>
                                                                                <strong>{new Date(order.orderDate).toLocaleDateString()}</strong>
                                                                            </div>
                                                                            <div>
                                                                                <small className="text-muted d-block">
                                                                                    <i className="bi bi-box-seam me-1"></i>
                                                                                    Order Items
                                                                                </small>
                                                                                <div className="mt-2">
                                                                                    {order.items && order.items.length > 0 ? (
                                                                                        order.items.map((item, index) => (
                                                                                            <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                                                                <div className="flex-grow-1 me-3">
                                                                                                    <span className="fw-medium d-block">
                                                                                                        {item.productId?.name || 'Unknown Product'}
                                                                                                    </span>
                                                                                                    {item.productId?.productQuantity && item.productId?.productUnit && (
                                                                                                        <span className="text-muted small">
                                                                                                            {item.productId.productQuantity}{item.productId.productUnit}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="text-end">
                                                                                                    <span className="badge bg-primary fs-6 px-2 py-1">
                                                                                                        {item.quantity} {item.unit}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))
                                                                                    ) : (
                                                                                        <p className="text-muted small">No items found</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="card-footer bg-light">
                                                                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                                                <button
                                                                                    className="btn btn-outline-primary btn-sm"
                                                                                    onClick={() => handleViewOrder(order)}
                                                                                    title="View Order Details"
                                                                                >
                                                                                    <i className="bi bi-eye me-1"></i>
                                                                                    View
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-outline-secondary btn-sm"
                                                                                    onClick={() => handleEditOrder(order)}
                                                                                    title="Edit Order"
                                                                                >
                                                                                    <i className="bi bi-pencil me-1"></i>
                                                                                    Edit
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-outline-danger btn-sm"
                                                                                    onClick={() => handleDeleteOrder(order)}
                                                                                    title="Delete Order"
                                                                                >
                                                                                    <i className="bi bi-trash me-1"></i>
                                                                                    Delete
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
                </div>
            </div>

            {/* Delete Order Modal */}
            <DeleteModal
                show={showDeleteModal}
                onClose={cancelDeleteOrder}
                onConfirm={confirmDeleteOrder}
                title="Delete Order"
                message="Are you sure you want to delete this order?"
                itemName={orderToDelete ? `Order #${orderToDelete._id.slice(-6)}` : ""}
                itemDetails={orderToDelete ? `Date: ${new Date(orderToDelete.orderDate).toLocaleDateString()}\nDistributor: ${orderToDelete.distributorId?.name || orderToDelete.distributorId?.distributorName || 'Unknown'}\nItems: ${orderToDelete.items?.length || 0} items` : ""}
                loading={isLoading}
                confirmText="Delete Order"
                cancelText="Cancel"
            />

            {/* Edit Order Modal */}
            {showEditModal && editingOrder && (
                <StaffEditOrderModal
                    order={editingOrder}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingOrder(null);
                    }}
                    onSave={handleUpdateOrder}
                />
            )}

            {/* View Order Modal */}
            {showViewModal && selectedOrder && (
                <StaffViewOrderModal
                    order={selectedOrder}
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedOrder(null);
                    }}
                />
            )}

            {/* Toast Container */}
            <ToastContainer
                position="top-right"
                autoClose={5000}
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

export default StaffPlaceOrder;