import React, { useEffect, useState, useCallback } from "react";
import apiService from "../../utils/apiService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BillsGenerateManagement = () => {
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);

  // Ensure data is always valid
  const safeOrders = Array.isArray(orders) ? orders.filter(order => {
    if (!order || typeof order !== 'object') return false;
    if (!order._id || typeof order._id !== 'string') return false;
    return true;
  }) : [];
  
  const safeDistributors = Array.isArray(distributors) ? distributors.filter(dist => {
    if (!dist || typeof dist !== 'object') return false;
    if (!dist._id || typeof dist._id !== 'string') return false;
    return true;
  }) : [];

  // Safe render wrapper to catch any rendering errors
  const SafeRender = ({ children, fallback = null }) => {
    try {
      if (React.isValidElement(children)) {
        return children;
      }
      console.error('Invalid React element:', children);
      return fallback;
    } catch (error) {
      console.error('Rendering error caught:', error);
      return fallback;
    }
  };

  // Safe data renderer that validates data before rendering
  const SafeDataRender = ({ data, renderItem, fallback = null }) => {
    if (!Array.isArray(data) || data.length === 0) {
      return fallback || <div>No data available</div>;
    }
    
    return data.map((item, index) => {
      try {
        if (!item || typeof item !== 'object' || !item._id) {
          console.warn('Invalid item at index:', index, item);
          return null;
        }
        return renderItem(item, index);
      } catch (error) {
        console.error('Error rendering item at index:', index, error, item);
        return null;
      }
    }).filter(Boolean);
  };

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [generatingOrderId, setGeneratingOrderId] = useState(null);

  // Enhanced state for modern features
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [viewMode, setViewMode] = useState("cards");

  // Fetch distributors list
  const fetchDistributors = useCallback(async () => {
    try {
      console.log('Fetching distributors...');
      const data = await apiService.get('/distributor');
      console.log('Distributors fetched:', data);
      setDistributors(data);
    } catch (err) {
      console.error('Error fetching distributors:', err);
      toast.error("Failed to fetch distributors.");
    }
  }, []);

  // Fetch orders list
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      console.log('Fetching orders...');
      const ordersData = await apiService.get('/orders');
      console.log('Orders fetched:', ordersData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error("Failed to fetch orders.");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchDistributors();
    fetchOrders();
  }, [fetchDistributors, fetchOrders]);

  // Debug: Log data structure when it changes
  useEffect(() => {
    console.log('Orders data:', orders);
    console.log('Distributors data:', distributors);
    if (orders.length > 0) {
      console.log('Orders data structure:', orders[0]);
    }
    if (distributors.length > 0) {
      console.log('Distributors data structure:', distributors[0]);
    }
  }, [orders, distributors]);

  // Generate or update bill
  const generateBill = async (orderId) => {
    if (!window.confirm("Generate/Update bill for this order?")) return;
    setGeneratingOrderId(orderId);
    try {
      await apiService.post('/bills/create', { orderId });
      toast.success("Bill generated/updated successfully!");
      fetchOrders(); // refresh orders after bill generation
    } catch (err) {
      toast.error(err.message || "Failed to generate/update bill.");
    } finally {
      setGeneratingOrderId(null);
    }
  };

  // Filter orders based on search criteria
  const getFilteredOrders = () => {
    let filtered = safeOrders;

    if (selectedDistributor) {
      filtered = filtered.filter(order => 
        order.distributorId?.distributorName === selectedDistributor ||
        order.distributorId?.companyName === selectedDistributor
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.distributorId?.distributorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.distributorId?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Get unlocked orders (orders that can have bills generated)
  const getUnlockedOrders = () => {
    return getFilteredOrders().filter(order => !order.locked && order.status === 'pending');
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredOrders = getFilteredOrders() || [];
    const totalOrders = filteredOrders.length;
    const pendingOrders = getUnlockedOrders() ? getUnlockedOrders().length : 0;
    
    return { totalOrders, pendingOrders };
  };

  const summaryStats = getSummaryStats();

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <div 
              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                background: "linear-gradient(135deg, #B5EAD7 0%, #8DD3C0 100%)",
                width: '60px',
                height: '60px'
              }}
            >
              <i className="fas fa-file-invoice fa-lg text-white"></i>
            </div>
            <div>
              <h3 className="mb-0 fw-bold text-dark">Bills Management</h3>
              <p className="text-muted mb-0 small">Generate and manage bills for orders</p>
            </div>
          </div>
        </div>
      </div>

                          {/* Summary Dashboard */}
         <div className="row mb-4">
           <div className="col-lg-6 col-md-6 mb-3">
             <div className="card border shadow-sm h-100 border-top border-4 border-success">
               <div className="card-body">
                 <div className="d-flex align-items-center">
                   <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                     <i className="fas fa-shopping-cart text-white"></i>
                   </div>
                   <div>
                     <h6 className="card-title text-muted mb-1">Total Orders</h6>
                     <h4 className="mb-0 fw-bold text-success">{summaryStats.totalOrders}</h4>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           <div className="col-lg-6 col-md-6 mb-3">
             <div className="card border shadow-sm h-100 border-top border-4 border-warning">
               <div className="card-body">
                 <div className="d-flex align-items-center">
                   <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                     <i className="fas fa-clock text-white"></i>
                   </div>
                   <div>
                     <h6 className="card-title text-muted mb-1">Pending Orders</h6>
                     <h4 className="mb-0 fw-bold text-warning">{summaryStats.pendingOrders}</h4>
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
                         placeholder="Search by distributor or order ID..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         style={{ width: '200px' }}
                       />
                     </div>
                     <select
                       className="form-select"
                       value={selectedDistributor}
                       onChange={(e) => setSelectedDistributor(e.target.value)}
                       style={{ width: '150px' }}
                     >
                       <option value="">All Distributors</option>
                       {safeDistributors.map(dist => (
                         <option key={dist._id} value={dist.distributorName || dist.companyName}>
                           {dist.distributorName || dist.companyName}
                         </option>
                       ))}
                     </select>
                     <button className="btn btn-outline-secondary" onClick={() => {
                       setSearchTerm("");
                       setSelectedDistributor("");
                     }}>
                       <i className="fas fa-refresh me-2"></i>
                       Clear
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

                 {/* Pending Orders - Generate Bills */}
         <div className="row mb-4">
           <div className="col-12">
             <h5 className="fw-bold text-dark">
               <i className="fas fa-clock me-2"></i>
               Pending Orders - Generate Bills ({getUnlockedOrders().length})
             </h5>
           </div>
         </div>

         {loadingOrders ? (
           <div className="text-center py-5">
             <i className="fas fa-spinner fa-spin fa-lg text-primary"></i>
             <p className="mt-3 text-muted">Loading orders...</p>
           </div>
         ) : safeOrders.length === 0 ? (
           <div className="text-center py-5">
             <i className="fas fa-exclamation-triangle fa-3x text-primary mb-3"></i>
             <h6 className="text-primary">No orders data available</h6>
             <p className="text-muted">Please check if the server is running and try refreshing the page.</p>
             <button className="btn btn-primary" onClick={() => {
               fetchOrders();
               fetchDistributors();
             }}>
               <i className="fas fa-refresh me-2"></i>
               Refresh Data
             </button>
           </div>
         ) : getUnlockedOrders().length === 0 ? (
           <div className="text-center py-5">
             <i className="fas fa-info-circle fa-3x text-muted mb-3"></i>
             <h6 className="text-muted">No pending orders found</h6>
             <p className="text-muted">No pending orders found to generate bills.</p>
           </div>
         ) : (
          <div className="row">
            <SafeDataRender
              data={getUnlockedOrders()}
              fallback={<div className="col-12 text-center text-muted"><p>No pending orders found</p></div>}
              renderItem={(order) => (
                <div key={order._id} className="col-lg-4 col-md-6 mb-3">
                  <div className="card border shadow-sm h-100">
                    <div className="card-header bg-primary text-dark">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                          <i className="fas fa-clock text-white"></i>
                        </div>
                        <span className="badge bg-warning text-dark">Pending</span>
                      </div>
                    </div>
                                         <div className="card-body d-flex flex-column">
                       <h6 className="fw-bold">Order ID: {order._id ? order._id.slice(-8) : 'N/A'}</h6>
                       <div className="mb-3">
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-truck text-muted me-2" style={{width: '16px'}}></i>
                           <span className="text-muted me-2">Distributor:</span>
                           <span className="fw-medium">{order.distributorId?.distributorName || 'Unknown'}</span>
                         </div>
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-building text-muted me-2" style={{width: '16px'}}></i>
                           <span className="text-muted me-2">Company:</span>
                           <span className="fw-medium">{order.distributorId?.companyName || 'Unknown'}</span>
                         </div>
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-calendar text-muted me-2" style={{width: '16px'}}></i>
                           <span className="text-muted me-2">Order Date:</span>
                           <span className="fw-medium">{new Date(order.orderDate).toLocaleDateString()}</span>
                         </div>
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-shipping-fast text-muted me-2" style={{width: '16px'}}></i>
                           <span className="text-muted me-2">Delivery Date:</span>
                           <span className="fw-medium">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}</span>
                         </div>
                         <div className="d-flex align-items-center mb-2">
                           <i className="fas fa-boxes text-muted me-2" style={{width: '16px'}}></i>
                           <span className="text-muted me-2">Items:</span>
                           <span className="fw-medium">{order.items?.length || 0}</span>
                         </div>
                       </div>
                      <button
                        className="btn btn-primary w-100 mt-auto"
                        disabled={generatingOrderId === order._id}
                        onClick={() => generateBill(order._id)}
                      >
                        {generatingOrderId === order._id ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-2"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-file-invoice me-2"></i>
                            Generate Bill
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
                 )}
         
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

export default BillsGenerateManagement;
