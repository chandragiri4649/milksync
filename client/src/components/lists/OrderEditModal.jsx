// src/components/orders/OrderEditModal.jsx
import React, { useEffect, useState, useCallback } from "react";
import apiService from "../../utils/apiService";
import { useAuth } from "../../hooks/useAuth";

const OrderEditModal = ({ order, onClose, onSave }) => {
  const { user } = useAuth();
  const [editDate, setEditDate] = useState(order.orderDate.split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate ? order.deliveryDate.split("T")[0] : '');
  const [items, setItems] = useState([...order.items]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detect company name properly and fetch available products
  useEffect(() => {
    if (order.distributorId?._id) {
      setLoading(true);
      apiService.get(`/products/distributor/${order.distributorId._id}`)
        .then(data => {
          setAvailableProducts(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching products:', err);
          setError('Failed to load available products');
          setLoading(false);
        });
    }
  }, [order]);

  // Handle quantity increment
  const handleIncrement = (index) => {
    const currentItems = [...items];
    const currentQty = currentItems[index].quantity || 1;
    currentItems[index].quantity = currentQty + 1;
    setItems(currentItems);
  };

  // Handle quantity decrement
  const handleDecrement = (index) => {
    const currentItems = [...items];
    const currentQty = currentItems[index].quantity || 1;
    const newQty = Math.max(1, currentQty - 1);
    currentItems[index].quantity = newQty;
    setItems(currentItems);
  };

  // Handle direct input change
  const handleQuantityInput = (index, value) => {
    const numValue = parseInt(value) || 1;
    if (numValue < 1) return;
    
    setItems(prev => {
      const newItems = [...prev];
      newItems[index].quantity = numValue;
      return newItems;
    });
  };

  // Change unit
  const changeUnit = (index, unit) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index].unit = unit;
      return newItems;
    });
  };

  // Remove item
  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Add product to order
  const addProductToOrder = (product) => {
    setItems(prev => [
      ...prev,
      { 
        productId: product, 
        quantity: 1, 
        unit: product.productUnit || "tub" 
      }
    ]);
  };

  // Save changes
  const saveChanges = async () => {
    if (order.locked || order.status === "delivered") return;
    
    setLoading(true);
    setError('');
    
    const payloadItems = items.map(i => ({
      productId: i.productId._id || i.productId,
      quantity: i.quantity,
      unit: i.unit
    }));

    try {
      const updated = await apiService.put(`/orders/${order._id}`, {
        orderDate: editDate,
        deliveryDate: deliveryDate,
        items: payloadItems,
        updatedBy: {
          role: user?.role || "admin",
          id: user?._id || user?.id,
          name: user?.username || user?.name || 'Admin'
        }
      });
      
      if (!updated.error) {
        onSave(updated);
      } else {
        setError(updated.error || 'Failed to update order');
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      setError(error.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // Filter remaining products
  const remainingProducts = availableProducts.filter(
    prod => !items.some(
      item => (item.productId?._id || item.productId) === prod._id
    )
  );

  // Calculate total items and value
  const calculateTotals = () => {
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = items.reduce((sum, item) => {
      const product = item.productId;
      const costPerTub = product.costPerTub || (product.costPerPacket * product.packetsPerTub) || 0;
      return sum + ((item.quantity || 0) * costPerTub);
    }, 0);
    
    return { totalItems, totalValue: totalValue.toFixed(2) };
  };

  const totals = calculateTotals();

  // Helper function to format product name with unit
  const formatProductName = (product) => {
    const name = product.name || "Unknown Product";
    const unit = product.productUnit || "units";
    const quantity = product.productQuantity || 0;
    
    if (unit && quantity > 0) {
      return `${name} ${quantity}${unit}`;
    }
    return name;
  };

  // Handle modal close
  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
         <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
       <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
                         <h5 className="modal-title">
               <i className="fas fa-edit me-2"></i>
               Edit Order for {order.distributorId?.companyName || order.distributorId?.distributorName || 'Unknown Company'}
             </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Order Details */}
            <div className="row mb-3">
              <div className="col-md-6">
                <h6 className="fw-bold text-dark">Order Details</h6>
                <p className="mb-1"><strong>Order ID:</strong> #{order._id.slice(-6)}</p>
                <p className="mb-1"><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                <p className="mb-1"><strong>Delivery Date:</strong> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}</p>
                <p className="mb-1"><strong>Distributor:</strong> {order.distributorId?.distributorName || order.distributorId?.companyName || 'Unknown'}</p>
                                 <p className="mb-1"><strong>Status:</strong> 
                   <span className={`badge ${order.status === 'pending' ? 'bg-warning' : 'bg-success'} ms-2`}>
                     {order.status}
                   </span>
                 </p>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold text-dark">Order Summary</h6>
                <p className="mb-1"><strong>Total Items:</strong> {totals.totalItems}</p>
                <p className="mb-1"><strong>Total Value:</strong> ₹{totals.totalValue}</p>
                <p className="mb-1"><strong>Placed By:</strong> {order.userId?.name || order.userId?.username || 'Unknown'}</p>
                {order.deliveryDate && (
                  <p className="mb-1"><strong>Days Until Delivery:</strong> {Math.ceil((new Date(order.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
                )}
              </div>
            </div>

                         {/* Order Date and Delivery Date */}
             <div className="row mb-3">
               <div className="col-md-6">
                 <label className="form-label fw-bold">Order Date</label>
                 <input
                   type="date"
                   className="form-control"
                   value={editDate}
                   min={new Date().toISOString().split("T")[0]}
                   onChange={(e) => setEditDate(e.target.value)}
                   disabled={order.locked || order.status === "delivered"}
                 />
               </div>
               <div className="col-md-6">
                 <label className="form-label fw-bold">Delivery Date</label>
                 <input
                   type="date"
                   className="form-control"
                   value={deliveryDate}
                   min={new Date().toISOString().split("T")[0]}
                   onChange={(e) => setDeliveryDate(e.target.value)}
                   disabled={order.locked || order.status === "delivered"}
                 />
               </div>
             </div>

            {/* Current Items */}
            <div className="mb-3">
              <h6 className="fw-bold text-dark mb-3">
                <i className="fas fa-shopping-cart me-2"></i>
                Current Items
              </h6>
              
              {items.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  No items in this order. Add products below.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                                         <thead className="table-light">
                       <tr>
                         <th>Product Name</th>
                         <th>Ordered Qty</th>
                         <th>Unit</th>
                         <th>Price per Tub</th>
                         <th>Total</th>
                         <th>Actions</th>
                       </tr>
                     </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const product = item.productId;
                        const costPerTub = product.costPerTub || (product.costPerPacket * product.packetsPerTub) || 0;
                        const itemTotal = (item.quantity || 0) * costPerTub;
                        
                                                 return (
                           <tr key={idx}>
                             <td className="fw-bold">
                               {formatProductName(product)}
                             </td>
                             <td>
                               <div className="d-flex align-items-center">
                                 <button 
                                   className="btn btn-sm btn-outline-secondary" 
                                   onClick={() => handleDecrement(idx)}
                                   disabled={order.locked || order.status === "delivered"}
                                 >
                                   <i className="fas fa-minus"></i>
                                 </button>
                                 <input
                                   type="number"
                                   value={item.quantity || 1}
                                   min="1"
                                   max={product.productQuantity || 999}
                                   className="form-control form-control-sm mx-2 text-center"
                                   style={{ width: "80px" }}
                                   onChange={(e) => handleQuantityInput(idx, e.target.value)}
                                   disabled={order.locked || order.status === "delivered"}
                                 />
                                 <button 
                                   className="btn btn-sm btn-outline-secondary" 
                                   onClick={() => handleIncrement(idx)}
                                   disabled={order.locked || order.status === "delivered"}
                                 >
                                   <i className="fas fa-plus"></i>
                                 </button>
                               </div>
                             </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={item.unit}
                                onChange={(e) => changeUnit(idx, e.target.value)}
                                disabled={order.locked || order.status === "delivered"}
                              >
                                <option value="tub">Tub</option>
                                <option value="bucket">Bucket</option>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="liter">Liter (L)</option>
                                <option value="box">Box</option>
                                <option value="packet">Packet</option>
                                <option value="gm">Grams (gm)</option>
                              </select>
                            </td>
                            <td className="text-end">₹{costPerTub.toFixed(2)}</td>
                            <td className="text-end fw-bold">₹{itemTotal.toFixed(2)}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => removeItem(idx)}
                                disabled={order.locked || order.status === "delivered"}
                                title="Remove item"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Products */}
            <div className="mb-3">
              <h6 className="fw-bold text-dark mb-3">
                <i className="fas fa-plus-circle me-2"></i>
                Add Products
              </h6>
              
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading available products...</p>
                </div>
              ) : remainingProducts.length > 0 ? (
                <div className="row g-2">
                  {remainingProducts.map(prod => (
                    <div key={prod._id} className="col-md-6 col-lg-4">
                      <div className="card border h-100">
                        <div className="card-body p-3">
                                                     <div className="d-flex justify-content-between align-items-start mb-2">
                             <h6 className="card-title mb-0 fw-bold">{formatProductName(prod)}</h6>
                             <button
                               className="btn btn-sm btn-primary"
                               onClick={() => addProductToOrder(prod)}
                               disabled={order.locked || order.status === "delivered"}
                             >
                               <i className="fas fa-plus me-1"></i>
                               Add
                             </button>
                           </div>
                           <div className="small text-muted">
                             <p className="mb-1"><strong>Unit:</strong> {prod.productUnit || 'tub'}</p>
                             <p className="mb-1"><strong>Available:</strong> {prod.productQuantity || 0} {prod.productUnit || 'units'}</p>
                             <p className="mb-1"><strong>Price:</strong> ₹{prod.costPerTub || (prod.costPerPacket * prod.packetsPerTub) || 0}</p>
                             <p className="mb-0"><strong>Packets per Tub:</strong> {prod.packetsPerTub || 1}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  No more products available to add
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setError('')}
                ></button>
              </div>
            )}

            {/* Locked Order Warning */}
            {(order.locked || order.status === "delivered") && (
              <div className="alert alert-warning">
                <i className="fas fa-lock me-2"></i>
                <strong>Order Locked:</strong> This order cannot be modified because it is {order.status === "delivered" ? "already delivered" : "locked"}.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              <i className="fas fa-times me-2"></i>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={saveChanges} 
              disabled={order.locked || order.status === "delivered" || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
