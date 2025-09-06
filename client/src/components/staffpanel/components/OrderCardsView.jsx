import React from 'react';
import OrderCard from './OrderCard';

const OrderCardsView = ({ 
  groupedPendingOrders, 
  groupedDeliveredOrders,
  onViewOrder,
  onEditOrder,
  onMarkDelivered,
  onPrintReceipt
}) => {
  return (
    <>
      {/* Pending Orders Section */}
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
            <div className="card-body p-4 bg-light">
              <div className="row g-3">
                {Object.keys(groupedPendingOrders).map((distName) =>
                  groupedPendingOrders[distName].map((order) => (
                    <div key={order._id} className="col-lg-6 col-md-12">
                      <div className="position-relative">
                        {/* Distributor Label */}
                        <div className="position-absolute top-0 start-0" style={{ zIndex: 10 }}>
                          <span className="badge bg-warning text-dark rounded-pill px-2 py-1 small fw-bold">
                            <i className="bi bi-truck me-1"></i>
                            {distName}
                          </span>
                        </div>
                        <div style={{ paddingTop: '2rem' }}>
                          <OrderCard
                            order={order}
                            isPending={true}
                            onViewOrder={onViewOrder}
                            onEditOrder={onEditOrder}
                            onMarkDelivered={onMarkDelivered}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivered Orders Section */}
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

          {/* Distributor Sections */}
          {Object.keys(groupedDeliveredOrders).map((distName, index) => (
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
                
                {/* Distributor Orders */}
                <div className="card-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="row g-3">
                    {groupedDeliveredOrders[distName].map((order) => (
                      <div key={order._id} className="col-lg-4 col-md-6">
                        <OrderCard
                          order={order}
                          isPending={false}
                          onViewOrder={onViewOrder}
                          onPrintReceipt={onPrintReceipt}
                        />
                      </div>
                    ))}
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
    </>
  );
};

export default OrderCardsView;

