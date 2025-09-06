import React from 'react';

const OrderTableView = ({ 
  groupedPendingOrders,
  groupedDeliveredOrders,
  onViewOrder,
  onEditOrder,
  onMarkDelivered,
  onCopyDetails,
  onPrintReceipt,
  selectedOrders = [],
  onToggleSelection,
  onSelectAll
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

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return { background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' };
      case 'delivered':
        return { background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' };
      case 'cancelled':
        return { background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' };
      default:
        return { background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)' };
    }
  };

  // Helper function to render table rows
  const renderTableRows = (orders, isPending = false) => {
    return orders.map(order => (
      <tr key={order._id} className={selectedOrders.includes(order._id) ? 'table-primary' : ''}>
        {onToggleSelection && (
          <td>
            <input
              type="checkbox"
              checked={selectedOrders.includes(order._id)}
              onChange={() => onToggleSelection(order._id)}
              className="form-check-input"
            />
          </td>
        )}
        <td>#{order._id.slice(-6)}</td>
        <td>{getDistributorName(order.distributorId)}</td>
        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
        <td>{order.items?.length || 0}</td>
        <td>
          <div className="d-flex align-items-center">
            <i className="bi bi-person me-2"></i>
            {order.userId?.name || order.userId?.username || "Unknown"}
          </div>
        </td>
        <td>
          {order.status === 'delivered' && order.updatedBy ? (
            <div className="d-flex align-items-center">
              <i className="bi bi-person-check me-2 text-success"></i>
              <span className="text-success small">
                {order.updatedBy.role === 'admin' ? 'Admin' : 'Staff'}: {order.updatedBy.name}
              </span>
            </div>
          ) : order.status === 'delivered' ? (
            <span className="text-muted small">Unknown</span>
          ) : (
            <span className="text-muted small">Not delivered</span>
          )}
        </td>
        <td>
          {order.damagedProducts && order.damagedProducts.length > 0 ? (
            <div className="damaged-products-summary">
              {order.damagedProducts.slice(0, 2).map((item, idx) => (
                <div key={idx} className="mb-1">
                  <i className="bi bi-exclamation-triangle me-1 text-danger"></i>
                  {item.productName} - {item.damagedPackets || item.quantity || 0} pkts
                </div>
              ))}
              {order.damagedProducts.length > 2 && (
                <small className="text-danger">+{order.damagedProducts.length - 2} more</small>
              )}
            </div>
          ) : (
            <span className="text-muted small">None</span>
          )}
        </td>
        <td>
          {order.damagedProducts && order.damagedProducts.length > 0 ? (
            <span className="badge bg-danger fs-6">
              {order.damagedProducts.reduce((sum, item) => sum + (item.damagedPackets || item.quantity || 0), 0)} packets
            </span>
          ) : (
            <span className="badge bg-secondary fs-6">0 packets</span>
          )}
        </td>
        <td>
          <span 
            className="badge"
            style={{
              ...getStatusBadgeStyle(order.status),
              color: 'white'
            }}
          >
            {order.status}
          </span>
        </td>
        <td>
          <div className="d-flex gap-1">
            <button 
              className="btn btn-outline-info btn-sm"
              onClick={() => onViewOrder(order)}
              title="View order details"
            >
              <i className="bi bi-eye"></i>
            </button>
            {isPending && (
              <>
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => onEditOrder(order)}
                  title="Edit order"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button 
                  className="btn btn-outline-success btn-sm"
                  onClick={() => onMarkDelivered(order)}
                  title="Mark as delivered"
                >
                  <i className="bi bi-check-circle"></i>
                </button>
              </>
            )}
            {!isPending && (
              <button 
                className="btn btn-outline-warning btn-sm"
                onClick={() => onPrintReceipt(order)}
                title="Print receipt"
              >
                <i className="bi bi-printer"></i>
              </button>
            )}
            {onCopyDetails && (
              <button 
                className="btn btn-outline-dark btn-sm"
                onClick={() => onCopyDetails(order)}
                title="Copy details"
              >
                <i className="bi bi-clipboard"></i>
              </button>
            )}
          </div>
        </td>
      </tr>
    ));
  };

  // Helper function to render table headers
  const renderTableHeaders = () => (
    <thead>
      <tr>
        {onToggleSelection && (
          <th width="50">
            <input
              type="checkbox"
              checked={false}
              onChange={() => {}}
              className="form-check-input"
              disabled
            />
          </th>
        )}
        <th>Order ID</th>
        <th>Distributor</th>
        <th>Date</th>
        <th>Items</th>
        <th>Placed By</th>
        <th>Delivered By</th>
        <th>Damaged Products</th>
        <th>Total Damaged</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
  );

  return (
    <div>
      {/* Pending Orders Table */}
      {Object.keys(groupedPendingOrders).length > 0 && (
        <div className="mb-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-warning text-dark border-0 py-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="bg-warning bg-opacity-20 rounded-circle p-3 me-3">
                    <i className="bi bi-clock text-dark" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h4 className="mb-1 fw-bold">Pending Orders</h4>
                    <p className="mb-0 opacity-75">Orders awaiting delivery - Action Required</p>
                  </div>
                </div>
                <span className="badge bg-dark rounded-pill fs-5 px-3 py-2">
                  {Object.values(groupedPendingOrders).flat().length}
                </span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  {renderTableHeaders()}
                  <tbody>
                    {Object.keys(groupedPendingOrders).map(distName =>
                      groupedPendingOrders[distName].map(order => 
                        renderTableRows([order], true)
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivered Orders - Separated by Distributor */}
      {Object.keys(groupedDeliveredOrders).length > 0 && (
        <div className="mb-5">
          {/* Main Delivered Orders Header */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-success text-white border-0 py-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-20 rounded-circle p-3 me-3">
                    <i className="bi bi-check-circle text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <h4 className="mb-1 fw-bold">Delivered Orders</h4>
                    <p className="mb-0 opacity-75">Successfully completed orders - Grouped by Distributor</p>
                  </div>
                </div>
                <span className="badge bg-light text-success rounded-pill fs-5 px-3 py-2">
                  {Object.values(groupedDeliveredOrders).flat().length}
                </span>
              </div>
            </div>
          </div>

          {/* Distributor Tables */}
          {Object.keys(groupedDeliveredOrders).map((distName) => (
            <div key={distName} className="mb-4">
              <div className="card border-0 shadow-sm">
                {/* Distributor Header */}
                <div className="card-header bg-primary text-white border-0 py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-20 rounded-circle p-2 me-3">
                        <i className="bi bi-truck text-white" style={{ fontSize: '1.2rem' }}></i>
                      </div>
                      <div>
                        <h5 className="mb-0 fw-bold">{distName}</h5>
                        <small className="opacity-75">Distributor Orders</small>
                      </div>
                    </div>
                    <span className="badge bg-light text-primary rounded-pill px-3 py-1">
                      {groupedDeliveredOrders[distName].length} orders
                    </span>
                  </div>
                </div>
                
                {/* Distributor Orders Table */}
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      {renderTableHeaders()}
                      <tbody>
                        {renderTableRows(groupedDeliveredOrders[distName], false)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {Object.keys(groupedPendingOrders).length === 0 && Object.keys(groupedDeliveredOrders).length === 0 && (
        <div className="text-center py-5">
          <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4 p-5">
            <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
          </div>
          <h4 className="text-muted mb-2">No Orders Found</h4>
          <p className="text-muted">No orders match your current filters or no orders have been placed yet.</p>
        </div>
      )}
    </div>
  );
};

export default OrderTableView;

