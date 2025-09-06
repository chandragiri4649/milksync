import React from "react";

const StaffViewOrderModal = ({ order, onClose }) => {
  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder-product.jpg";
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${process.env.REACT_APP_IMAGE_BASE_URL || ''}${imageUrl}`;
  };

  // Calculate total items and value
  const calculateTotals = () => {
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const totalValue = order.items?.reduce((sum, item) => {
      const product = item.productId;
      const costPerTub = product?.costPerTub || (product?.costPerPacket * product?.packetsPerTub) || 0;
      return sum + ((item.quantity || 0) * costPerTub);
    }, 0) || 0;
    
    return { totalItems, totalValue: totalValue.toFixed(2) };
  };

  const totals = calculateTotals();

  // Helper function to format product name with unit
  const formatProductName = (product) => {
    const name = product?.name || "Unknown Product";
    const unit = product?.productUnit || "units";
    const quantity = product?.productQuantity || 0;
    
    if (unit && quantity > 0) {
      return `${name} ${quantity}${unit}`;
    }
    return name;
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white border-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-eye me-2"></i>
              View Order Details
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body p-4">
            {/* Order Details */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Order Information
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="mb-2"><strong>Order ID:</strong> #{order._id.slice(-6)}</p>
                    <p className="mb-2"><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                    <p className="mb-2"><strong>Delivery Date:</strong> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}</p>
                    <p className="mb-2"><strong>Distributor:</strong> {order.distributorId?.distributorName || order.distributorId?.companyName || 'Unknown'}</p>
                    <p className="mb-2"><strong>Status:</strong> 
                      <span className={`badge ${order.status === 'pending' ? 'bg-warning' : order.status === 'delivered' ? 'bg-success' : 'bg-secondary'} ms-2`}>
                        {order.status}
                      </span>
                    </p>
                    <p className="mb-0"><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-calculator me-2"></i>
                      Order Summary
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="mb-2"><strong>Total Items:</strong> {totals.totalItems}</p>
                    <p className="mb-2"><strong>Total Value:</strong> ₹{totals.totalValue}</p>
                    <p className="mb-2"><strong>Placed By:</strong> {order.userId?.name || order.userId?.username || 'Unknown'}</p>
                    {order.deliveryDate && (
                      <p className="mb-0"><strong>Days Until Delivery:</strong> {Math.ceil((new Date(order.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-box-seam me-2"></i>
                    Order Items ({order.items?.length || 0})
                  </h6>
                </div>
                <div className="card-body">
                  {!order.items || order.items.length === 0 ? (
                    <div className="alert alert-info border-0">
                      <i className="bi bi-info-circle me-2"></i>
                      No items found in this order.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Price per Unit</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => {
                            const product = item.productId;
                            const costPerTub = product?.costPerTub || (product?.costPerPacket * product?.packetsPerTub) || 0;
                            const itemTotal = (item.quantity || 0) * costPerTub;
                            
                            return (
                              <tr key={idx}>
                                <td className="fw-bold">
                                  <div className="d-flex align-items-center">
                                    {(() => {
                                      const imageUrl = product?.image || product?.imageUrl || product?.photo || product?.picture;
                                      if (imageUrl) {
                                        const src = getImageUrl(imageUrl);
                                        return (
                                          <img 
                                            src={src}
                                            alt={product?.name} 
                                            className="rounded me-2"
                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'flex';
                                            }}
                                          />
                                        );
                                      }
                                      return null;
                                    })()}
                                    <div style={{ display: (product?.image || product?.imageUrl || product?.photo || product?.picture) ? 'none' : 'flex', width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '0.375rem', marginRight: '0.5rem' }}>
                                      <i className="bi bi-box-seam text-muted" style={{ fontSize: '1rem' }}></i>
                                    </div>
                                    <div>
                                      <div>{formatProductName(product)}</div>
                                      {product?.productQuantity && (
                                        <small className="text-muted">
                                          Available: {product.productQuantity} {product.productUnit || 'units'}
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-primary fs-6">{item.quantity || 0}</span>
                                </td>
                                <td>
                                  <span className="text-capitalize">{item.unit}</span>
                                </td>
                                <td className="text-end">₹{costPerTub.toFixed(2)}</td>
                                <td className="text-end fw-bold">₹{itemTotal.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan="4" className="text-end fw-bold">Total:</td>
                            <td className="text-end fw-bold fs-5">₹{totals.totalValue}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {order.updatedBy && (
              <div className="mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-clock-history me-2"></i>
                      Last Updated
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="mb-1"><strong>Updated By:</strong> {order.updatedBy.name} ({order.updatedBy.role})</p>
                    <p className="mb-0"><strong>Updated At:</strong> {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'Not available'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes or Comments */}
            {order.notes && (
              <div className="mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-chat-text me-2"></i>
                      Notes
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="mb-0">{order.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-0">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              <i className="bi bi-x-lg me-2"></i>
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-outline-primary" 
              onClick={() => {
                const orderText = `Order #${order._id.slice(-6)}
Date: ${new Date(order.orderDate).toLocaleDateString()}
Status: ${order.status}
Distributor: ${order.distributorId?.distributorName || order.distributorId?.companyName || 'Unknown'}
Items: ${order.items?.map(item => `${item.productId?.name || 'Unknown Product'} ${item.quantity} ${item.unit}`).join(', ')}`;
                
                navigator.clipboard.writeText(orderText).then(() => {
                  // You can add a toast notification here if needed
                  console.log('Order details copied to clipboard!');
                }).catch(() => {
                  console.log('Failed to copy to clipboard');
                });
              }}
            >
              <i className="bi bi-clipboard me-2"></i>
              Copy Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffViewOrderModal;
