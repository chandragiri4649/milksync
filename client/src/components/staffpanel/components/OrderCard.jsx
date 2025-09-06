import React from 'react';

const OrderCard = ({ 
  order,
  isPending,
  onViewOrder,
  onEditOrder,
  onMarkDelivered,
  onCopyDetails,
  onResendNotification,
  onPrintReceipt
}) => {
  const getDistributorName = (distributorId) => {
    if (!distributorId) return "Unknown Distributor";
    
    if (typeof distributorId === 'string') {
      return "Unknown Distributor";
    } else if (distributorId && typeof distributorId === 'object') {
      return distributorId.name || distributorId.distributorName || distributorId.company || "Unknown Distributor";
    }
    
    return "Unknown Distributor";
  };

  return (
    <div className="card h-100 border-0 shadow-sm" 
         style={{ transition: 'all 0.2s ease-in-out' }}>
      
      <div className={`card-header ${isPending ? 'bg-success text-dark' : 'bg-primary text-white'} d-flex align-items-center`}>
        <span className="me-2">
          <i className={`bi ${isPending ? 'bi-clock text-white' : 'bi-check-circle text-white'}`}></i>
        </span>
        <div>
          <h4 className="card-title h6 mb-1 text-white">
            Order #{order._id.slice(-6)}
          </h4>
          <p className={`${isPending ? 'text-white' : 'text-white'} small mb-0`}>
            {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="card-body">
        <h6 className="fw-bold mb-3">
          <i className="bi bi-box-seam me-2"></i>
          Order Items
        </h6>
        <div>
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
            <p className="text-muted fst-italic">No items found</p>
          )}
        </div>
        
        {/* Order Information */}
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <i className="bi bi-person me-2 text-muted"></i>
            <span className="fw-semibold small text-muted">Placed by:</span>
            <span className="ms-2 small">
              {order.userId?.name || order.userId?.username || "Unknown"}
            </span>
          </div>
          
          {/* Delivered By Information for delivered orders */}
          {!isPending && order.updatedBy && (
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-person-check me-2 text-success"></i>
              <span className="fw-semibold small text-primary">Delivered by:</span>
              <span className="ms-2 small text-primary">
                {order.updatedBy.role === 'admin' ? 'Admin' : 'Staff'}: {order.updatedBy.name}
              </span>
            </div>
          )}
        </div>
        
        {/* Damaged Products Information */}
        {order.damagedProducts && order.damagedProducts.length > 0 ? (
          <div className="mt-3">
            <h6 className="fw-bold mb-2 text-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Damaged Products
            </h6>
            <div className="mb-2">
              <div className="d-flex align-items-center mb-1">
                <i className="bi bi-dash-circle me-2 text-danger"></i>
                <span className="fw-semibold small text-danger">Total Damaged:</span>
                <span className="ms-2 small text-danger fw-bold">
                  {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
                </span>
              </div>
            </div>
            <div>
              {order.damagedProducts.map((item, idx) => (
                <div key={idx} className="small text-danger mb-1">
                  • {item.productName} - {item.damagedPackets || item.quantity || 0} packets
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <div className="alert alert-success py-2">
              <i className="bi bi-check-circle me-2"></i>
              <strong>No Damaged Products</strong>
            </div>
          </div>
        )}
      </div>
      
      <div className="card-footer bg-transparent d-flex gap-2 justify-content-center">
        {isPending ? (
          <>
            <button 
              className="btn btn-primary btn-sm fw-bold"
              onClick={() => onMarkDelivered(order)}
              title="Mark as Delivered"
              style={{ 
                background: 'linear-gradient(45deg, #28a745, #20c997)',
                border: 'none',
                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.4)',
                transform: 'translateY(-2px)'
              }}
            >
              <i className="bi bi-check-circle-fill me-1"></i>
              Mark Delivered
            </button>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => onViewOrder(order)}
              title="View Order Details"
            >
              <i className="bi bi-eye me-1"></i>
              View
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onEditOrder(order)}
              title="Edit Order"
            >
              <i className="bi bi-pencil me-1"></i>
              Edit
            </button>
          </>
        ) : (
          <>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => onViewOrder(order)}
              title="View Order Details"
            >
              <i className="bi bi-eye me-1"></i>
              View
            </button>
            <button 
              className="btn btn-outline-dark btn-sm"
              onClick={() => onPrintReceipt(order)}
              title="Print Receipt"
            >
              🖨️ Print
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderCard;

