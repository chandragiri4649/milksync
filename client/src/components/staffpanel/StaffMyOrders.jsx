import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../utils/apiService";
import StaffNavbar from "./StaffNavbar";
import StaffDamageProductsModal from "./StaffDamageProductsModal";
import StaffEditOrderModal from "./StaffEditOrderModal";
import StaffViewOrderModal from "./StaffViewOrderModal";
import OrderSummaryCards from "./components/OrderSummaryCards";
import OrderFilters from "./components/OrderFilters";
import OrderCardsView from "./components/OrderCardsView";
import OrderTableView from "./components/OrderTableView";
import { useOrderManagement } from "./hooks/useOrderManagement";
import { useOrderFilters } from "./hooks/useOrderFilters";
import { useOrderActions } from "./hooks/useOrderActions";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StaffMyOrders = () => {
  const { token, user } = useAuth();
  
  // Core state
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);
  
  // View mode
  const [viewMode, setViewMode] = useState("cards");

  // Custom hooks
  const { 
    filteredOrders, 
    pendingOrders, 
    deliveredOrders,
    groupedPendingOrders,
    groupedDeliveredOrders,
    searchTerm,
    setSearchTerm,
    selectedDistributor,
    setSelectedDistributor,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear
  } = useOrderFilters(orders);

  const {
    handleViewOrder,
    handleEditOrder,
    handleUpdateOrder,
    handleMarkDelivered,
    handleDeliveryConfirmed,
    isLoading
  } = useOrderActions({
    setSelectedOrder,
    setShowViewModal,
    setEditingOrder,
    setShowEditModal,
    setSelectedOrderForDelivery,
    setShowDamageModal,
    fetchOrders: () => fetchOrders(),
    editingOrder
  });

  const {
    generateBill,
    printReceipt
  } = useOrderManagement();

  // Debug logging
  console.log('🔍 StaffMyOrders - Component rendered');
  console.log('🔍 StaffMyOrders - Token:', token ? 'Present' : 'Missing');
  console.log('🔍 StaffMyOrders - Orders:', orders.length);
  console.log('🔍 StaffMyOrders - Distributors:', distributors.length);

  // Fetch distributors
  const fetchDistributors = useCallback(async () => {
    try {
      const data = await apiService.get('/distributor');
      setDistributors(data);
    } catch (err) {
      console.error('❌ Error fetching distributors:', err);
      toast.error("Failed to load distributors");
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/orders');
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
        toast.warning("No orders data received");
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      toast.error(err.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchDistributors();
    fetchOrders();
  }, [fetchDistributors, fetchOrders]);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <StaffNavbar />

      <div className="container-fluid px-3 px-md-5" style={{ maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8f9fa', paddingTop: '100px', paddingBottom: '120px' }}>
        
        {/* Welcome Header */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm text-white bg-primary">
              <div className="card-body p-3 p-md-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h1 className="display-6 fw-bold mb-1">
                      My Orders 
                    </h1>
                    <p className="lead mb-0 opacity-75">
                      View and manage your order history with comprehensive tracking and management tools
                    </p>
                  </div>
                  <div className="col-md-4 text-center">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <OrderSummaryCards orders={orders} />

        {/* Search and Filters */}
        <OrderFilters 
          distributors={distributors}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedDistributor={selectedDistributor}
          setSelectedDistributor={setSelectedDistributor}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />


        {/* Orders Display */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                    <i className="bi bi-clipboard-check text-info"></i>
                  </div>
                  <h4 className="mb-0 fw-bold">Orders</h4>
                  <span className="badge bg-info rounded-pill ms-3">
                    {filteredOrders.length} orders
                  </span>
                </div>
              </div>
              <div className="card-body p-4">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary">
                      <i className="bi bi-arrow-clockwise spin"></i>
                    </div>
                    <p className="mt-3 text-muted">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-4">
                      <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="h5 text-muted mb-2">No Orders Found</h4>
                    <p className="text-secondary">
                      {orders.length === 0 
                        ? "You haven't placed any orders yet. Start by placing your first order!"
                        : "No orders match your current filters. Try adjusting your search criteria."
                      }
                    </p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <OrderCardsView 
                    groupedPendingOrders={groupedPendingOrders}
                    groupedDeliveredOrders={groupedDeliveredOrders}
                    onViewOrder={handleViewOrder}
                    onEditOrder={handleEditOrder}
                    onMarkDelivered={handleMarkDelivered}
                    onPrintReceipt={printReceipt}
                  />
                ) : (
                  <OrderTableView 
                    groupedPendingOrders={groupedPendingOrders}
                    groupedDeliveredOrders={groupedDeliveredOrders}
                    onViewOrder={handleViewOrder}
                    onEditOrder={handleEditOrder}
                    onMarkDelivered={handleMarkDelivered}
                    onPrintReceipt={printReceipt}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showViewModal && selectedOrder && (
        <StaffViewOrderModal
          order={selectedOrder}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {showEditModal && editingOrder && (
        <StaffEditOrderModal
          order={editingOrder}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateOrder}
        />
      )}

      {showDamageModal && selectedOrderForDelivery && (
        <StaffDamageProductsModal
          show={showDamageModal}
          onClose={() => {
            setShowDamageModal(false);
            setSelectedOrderForDelivery(null);
          }}
          order={selectedOrderForDelivery}
          onConfirmDelivery={handleDeliveryConfirmed}
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

export default StaffMyOrders;
