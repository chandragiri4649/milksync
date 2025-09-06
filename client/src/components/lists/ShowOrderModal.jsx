import React from 'react';

const ShowOrderModal = ({ 
  show, 
  onClose, 
  order 
}) => {
  if (!show || !order) return null;

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

  // Calculate order totals
  const calculateOrderTotal = () => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    
    return order.items.reduce((total, item) => {
      const product = item.productId;
      const costPerTub = product?.costPerTub || (product?.costPerPacket * product?.packetsPerTub) || 0;
      return total + ((item.quantity || 0) * costPerTub);
    }, 0);
  };

  const orderTotal = calculateOrderTotal();

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-eye me-2"></i>
              Order Details for {order.distributorId?.companyName || order.distributorId?.distributorName || 'Unknown Company'}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Order Information */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold text-dark mb-3">
                      <i className="fas fa-info-circle me-2"></i>
                      Order Information
                    </h6>
                    <div className="row">
                      <div className="col-6">
                        <p className="mb-2"><strong>Order ID:</strong></p>
                        <p className="mb-2"><strong>Order Date:</strong></p>
                        <p className="mb-2"><strong>Delivery Date:</strong></p>
                        <p className="mb-2"><strong>Status:</strong></p>
                        <p className="mb-2"><strong>Placed By:</strong></p>
                      </div>
                      <div className="col-6">
                        <p className="mb-2 text-muted">#{order._id.slice(-6)}</p>
                        <p className="mb-2 text-muted">{new Date(order.orderDate).toLocaleDateString()}</p>
                        <p className="mb-2 text-muted">
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}
                        </p>
                        <p className="mb-2">
                          <span className={`badge ${order.status === 'pending' ? 'bg-warning' : 'bg-success'}`}>
                            {order.status}
                          </span>
                        </p>
                        <p className="mb-2 text-muted">
                          {order.userId?.username || order.userId?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold text-dark mb-3">
                      <i className="fas fa-building me-2"></i>
                      Distributor Information
                    </h6>
                    <div className="row">
                      <div className="col-6">
                        <p className="mb-2"><strong>Company:</strong></p>
                        <p className="mb-2"><strong>Distributor:</strong></p>
                        <p className="mb-2"><strong>Contact:</strong></p>
                        <p className="mb-2"><strong>Total Items:</strong></p>
                        <p className="mb-2"><strong>Order Value:</strong></p>
                      </div>
                      <div className="col-6">
                        <p className="mb-2 text-muted">
                          {order.distributorId?.companyName || 'N/A'}
                        </p>
                        <p className="mb-2 text-muted">
                          {order.distributorId?.distributorName || 'N/A'}
                        </p>
                        <p className="mb-2 text-muted">
                          {order.distributorId?.contact || 'N/A'}
                        </p>
                        <p className="mb-2 text-muted">
                          {order.items?.length || 0} items
                        </p>
                        <p className="mb-2 text-muted fw-bold">
                          ₹{orderTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-3">
                <i className="fas fa-shopping-cart me-2"></i>
                Order Items
              </h6>
              
              {!order.items || order.items.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  No items in this order.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Price per Tub</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => {
                        const product = item.productId;
                        const costPerTub = product?.costPerTub || (product?.costPerPacket * product?.packetsPerTub) || 0;
                        const itemTotal = (item.quantity || 0) * costPerTub;
                        
                        return (
                          <tr key={index}>
                            <td className="fw-bold">
                              {formatProductName(product)}
                            </td>
                            <td className="text-center">{item.quantity || 0}</td>
                            <td className="text-center">{item.unit || 'tub'}</td>
                            <td className="text-end">₹{costPerTub.toFixed(2)}</td>
                            <td className="text-end fw-bold">₹{itemTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Total:</td>
                        <td className="text-end fw-bold text-primary">₹{orderTotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Additional Information */}
            {order.updatedBy && (
              <div className="alert alert-info">
                <h6 className="fw-bold mb-2">
                  <i className="fas fa-user-edit me-2"></i>
                  Last Updated
                </h6>
                <p className="mb-1">
                  <strong>Updated By:</strong> {order.updatedBy.role === 'admin' ? 'Admin' : 'Staff'}: {order.updatedBy.name}
                </p>
                {order.updatedAt && (
                  <p className="mb-0">
                    <strong>Updated At:</strong> {new Date(order.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Damaged Products Information */}
            {order.damagedProducts && order.damagedProducts.length > 0 && (
              <div className="alert alert-warning">
                <h6 className="fw-bold mb-2">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Damaged Products
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-warning">
                      <tr>
                        <th>Product</th>
                        <th>Damaged Quantity</th>
                        <th>Unit</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.damagedProducts.map((damaged, index) => (
                        <tr key={index}>
                          <td>{damaged.productName}</td>
                          <td className="text-center">{damaged.quantity}</td>
                          <td className="text-center">{damaged.unit}</td>
                          <td className="text-end">₹{damaged.totalCost?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {order.totalDamagedCost > 0 && (
                  <p className="mb-0 mt-2">
                    <strong>Total Damaged Cost:</strong> ₹{order.totalDamagedCost.toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              <i className="fas fa-times me-2"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowOrderModal;

