import React, { useState, useEffect } from 'react';
import config from '../../config';
import { useAuth } from '../../hooks/useAuth';

const StaffDamageProductsModal = ({ 
  show, 
  onClose, 
  order, 
  onConfirmDelivery 
}) => {
  const { token, user } = useAuth();
  const [damagedProducts, setDamagedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize damaged products when order changes
  useEffect(() => {
    if (order && order.items) {
      const initialDamagedProducts = order.items.map(item => {
        // Calculate cost per tub if not available
        let costPerTub = item.productId.costPerTub;
        if (!costPerTub && item.productId.costPerPacket && item.productId.packetsPerTub) {
          costPerTub = item.productId.costPerPacket * item.productId.packetsPerTub;
        }
        
        return {
          productId: item.productId._id || item.productId,
          productName: item.productId.name || 'Unknown Product',
          orderedQuantity: item.quantity, // This is in tubs
          damagedQuantity: 0, // This will be in packets
          unit: item.unit,
          price: costPerTub || 0, // Price per tub (calculated if needed)
          costPerPacket: item.productId.costPerPacket || 0, // Cost per packet
          packetsPerTub: item.productId.packetsPerTub || 1 // Packets per tub
        };
      });
      setDamagedProducts(initialDamagedProducts);
      
      // Debug logging to see what data we're getting
      console.log('Staff Modal - Order data received:', order);
      console.log('Staff Modal - Initial damaged products:', initialDamagedProducts);
    }
  }, [order]);

  // Calculate totals
  const calculateTotals = () => {
    let totalBill = 0;
    let totalDamagedCost = 0;

    // Debug logging
    console.log('Staff Modal - Calculating totals for products:', damagedProducts);

    damagedProducts.forEach(product => {
      // Total bill: ordered tubs * price per tub
      const productTotal = product.orderedQuantity * product.price;
      totalBill += productTotal;
      
      // Damaged cost: damaged packets * cost per packet
      // We need to calculate cost per packet from the product data
      const costPerPacket = product.costPerPacket || (product.price / (product.packetsPerTub || 1));
      const damagedCost = product.damagedQuantity * costPerPacket;
      totalDamagedCost += damagedCost;
      
      // Debug logging for each product
      console.log(`Staff Modal - Product: ${product.productName}`, {
        orderedQuantity: product.orderedQuantity,
        price: product.price,
        productTotal,
        damagedQuantity: product.damagedQuantity,
        costPerPacket,
        damagedCost,
        totalBill,
        totalDamagedCost
      });
    });

    const finalBill = totalBill - totalDamagedCost;
    
    console.log('Staff Modal - Final calculation:', { totalBill, totalDamagedCost, finalBill });

    return {
      totalBill: totalBill.toFixed(2),
      totalDamagedCost: totalDamagedCost.toFixed(2),
      finalBill: finalBill.toFixed(2)
    };
  };

  // Handle damaged quantity change
  const handleDamagedQuantityChange = (index, value) => {
    const newDamagedProducts = [...damagedProducts];
    let numValue = parseInt(value) || 0;
    
    // Ensure damaged quantity doesn't exceed total packets available
    // orderedQuantity is in tubs, so convert to packets for validation
    const totalPacketsAvailable = newDamagedProducts[index].orderedQuantity * (newDamagedProducts[index].packetsPerTub || 1);
    
    if (numValue > totalPacketsAvailable) {
      numValue = totalPacketsAvailable;
    }
    
    newDamagedProducts[index].damagedQuantity = Math.max(0, numValue);
    setDamagedProducts(newDamagedProducts);
  };

  // Handle confirm delivery
  const handleConfirmDelivery = async () => {
    // Prevent multiple submissions
    if (loading) {
      console.log('🚫 Staff delivery already in progress, ignoring duplicate request');
      return;
    }

    // Check if user data is available
    if (!user) {
      setError('User information not available. Please refresh the page and try again.');
      return;
    }

    // Debug logging for user object
    console.log('Staff Modal - User object:', user);
    console.log('Staff Modal - User ID:', user?._id || user?.id);
    console.log('Staff Modal - User name:', user?.username || user?.name);

    // Check if there are any damaged products
    const hasDamagedProducts = damagedProducts.some(product => product.damagedQuantity > 0);
    
    if (hasDamagedProducts) {
      // Show confirmation dialog for damaged products
      const confirmMessage = `You have marked ${damagedProducts.filter(p => p.damagedQuantity > 0).length} products as damaged with a total cost of ₹${totals.totalDamagedCost}.\n\nThis will reduce the final bill from ₹${totals.totalBill} to ₹${totals.finalBill}.\n\nAre you sure you want to proceed?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // Check if there are any damaged products
      const hasDamagedProducts = damagedProducts.some(product => product.damagedQuantity > 0);
      
      if (hasDamagedProducts) {
        // Call the modified mark-delivered API with damaged products data and staff info
        const response = await fetch(`${config.API_BASE}/orders/${order._id}/deliver`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            damagedProducts: damagedProducts.filter(product => product.damagedQuantity > 0),
            updatedBy: {
              role: "staff",
              id: user?._id || user?.id || 'unknown',
              name: user?.username || user?.name || 'Staff Member'
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to mark order as delivered');
        }

        const result = await response.json();
        
        // Call the parent callback with success
        onConfirmDelivery(result);
      } else {
        // No damaged products, proceed with normal delivery
        const response = await fetch(`${config.API_BASE}/orders/${order._id}/deliver`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            updatedBy: {
              role: "staff",
              id: user?._id || user?.id || 'unknown',
              name: user?.username || user?.name || 'Staff Member'
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to mark order as delivered');
        }

        const result = await response.json();
        
        // Call the parent callback with success
        onConfirmDelivery(result);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while confirming delivery');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setDamagedProducts([]);
    setError('');
    onClose();
  };

  if (!show || !order) return null;

  // Debug logging to see what we're getting
  console.log('Staff Modal - Modal is showing with order:', order);
  console.log('Staff Modal - Order items:', order.items);
  if (order.items && order.items.length > 0) {
    console.log('Staff Modal - First item:', order.items[0]);
    console.log('Staff Modal - First item productId:', order.items[0].productId);
    console.log('Staff Modal - First item productId fields:', {
      name: order.items[0].productId?.name,
      costPerTub: order.items[0].productId?.costPerTub,
      costPerPacket: order.items[0].productId?.costPerPacket,
      packetsPerTub: order.items[0].productId?.packetsPerTub
    });
  }

  const totals = calculateTotals();

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title">
              <i className="fas fa-user-tie me-2"></i>
              Staff - Mark Order as Delivered
            </h5>
            <button 
              type="button" 
              className="btn-close" 
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
                <p className="mb-1"><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                <p className="mb-1"><strong>Distributor:</strong> {order.distributorId?.name || order.distributorId?.company || 'Unknown'}</p>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold text-dark">Customer Info</h6>
                <p className="mb-1"><strong>Name:</strong> {order.customerName || 'N/A'}</p>
                <p className="mb-1"><strong>Phone:</strong> {order.customerPhone || 'N/A'}</p>
              </div>
            </div>

            {/* Products Table */}
            <div className="table-responsive mb-3">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Product Name</th>
                    <th>Ordered Qty (Tubs)</th>
                    <th>Damaged Qty (Packets)</th>
                    <th>Unit</th>
                    <th>Price per Tub</th>
                    <th>Total</th>
                    <th>Damaged Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {damagedProducts.map((product, index) => (
                    <tr key={index} className={product.damagedQuantity > 0 ? 'table-warning' : ''}>
                      <td className="fw-bold">{product.productName}</td>
                      <td className="text-center">{product.orderedQuantity}</td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm text-center ${product.damagedQuantity > 0 ? 'border-warning' : ''}`}
                          min="0"
                          max={product.orderedQuantity * (product.packetsPerTub || 1)}
                          value={product.damagedQuantity}
                          onChange={(e) => handleDamagedQuantityChange(index, e.target.value)}
                          disabled={loading}
                          placeholder="0"
                        />
                        <small className="text-muted d-block mt-1">
                          Max: {product.orderedQuantity * (product.packetsPerTub || 1)} packets
                        </small>
                      </td>
                      <td className="text-center">{product.unit}</td>
                      <td className="text-end">₹{product.price}</td>
                      <td className="text-end fw-bold">
                        ₹{(product.orderedQuantity * product.price).toFixed(2)}
                      </td>
                      <td className={`text-end fw-bold ${product.damagedQuantity > 0 ? 'text-danger' : 'text-muted'}`}>
                        {product.damagedQuantity > 0 ? `-₹${(product.damagedQuantity * (product.costPerPacket || (product.price / (product.packetsPerTub || 1)))).toFixed(2)}` : '₹0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="row">
              <div className="col-md-8">
                <div className="alert alert-info">
                  <h6 className="fw-bold mb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    Instructions
                  </h6>
                  <ul className="mb-0 small">
                    <li><strong>Important:</strong> Enter damaged quantities in PACKETS, not tubs</li>
                    <li>1 Tub = {damagedProducts[0]?.packetsPerTub || 'N/A'} packets</li>
                    <li>Damaged packet costs will be subtracted from the final bill</li>
                    <li>Leave as 0 if no products are damaged</li>
                    <li>Click "Confirm Delivery" to complete the process</li>
                  </ul>
                </div>
                
                {/* Damaged Products Summary */}
                {totals.totalDamagedCost > 0 && (
                  <div className="alert alert-warning">
                    <h6 className="fw-bold mb-2">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Damaged Products Summary
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Total Damaged Items:</strong> {damagedProducts.filter(p => p.damagedQuantity > 0).length}</p>
                        <p className="mb-1"><strong>Total Damaged Cost:</strong> ₹{totals.totalDamagedCost}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Original Bill:</strong> ₹{totals.totalBill}</p>
                        <p className="mb-1"><strong>Final Bill:</strong> ₹{totals.finalBill}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-light">
                  <div className="card-body p-3">
                    <h6 className="fw-bold text-dark mb-3">Bill Summary</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Bill:</span>
                      <span className="fw-bold">₹{totals.totalBill}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Damaged Cost:</span>
                      <span className="fw-bold text-danger">-₹{totals.totalDamagedCost}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">Final Bill:</span>
                      <span className="fw-bold text-success">₹{totals.finalBill}</span>
                    </div>
                    
                    {/* Savings indicator */}
                    {totals.totalDamagedCost > 0 && (
                      <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                        <small className="text-success">
                          <i className="fas fa-save me-1"></i>
                          Savings: ₹{totals.totalDamagedCost}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
              className="btn btn-warning" 
              onClick={handleConfirmDelivery}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  Confirm Delivery (Staff)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDamageProductsModal;
