import React from 'react';

const OrderSummaryCards = ({ orders }) => {
  const getCurrentMonthOrders = () => {
    const now = new Date();
    return orders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }).length;
  };

  const summaryData = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: "bi-clipboard-check",
      color: "text-primary",
      subtitle: "All time",
       background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)'
    },
    {
      title: "Pending",
      value: orders.filter(o => o.status === 'pending').length,
      icon: "bi-clock",
      color: "text-warning",
      subtitle: "Awaiting delivery",
      background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
    },
    {
      title: "Delivered",
      value: orders.filter(o => o.status === 'delivered').length,
      icon: "bi-check-circle-fill",
      color: "text-success",
      subtitle: "Completed orders",
      background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
    },
    {
      title: "This Month",
      value: getCurrentMonthOrders(),
      icon: "bi-calendar-week",
      color: "text-info",
      subtitle: "Current month",
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {summaryData.map((card, index) => (
        <div key={index} className="col-md-3">
          <div 
            className="card h-100 border border-light shadow-sm"
            style={card.background ? { background: card.background } : {}}
          >
            <div className="card-body text-center">
              <div className={`${card.color} mb-2`}>
                <i className={`bi ${card.icon}`} style={{ fontSize: '3rem' }}></i>
              </div>
              <h4 className="card-title h6 fw-bold">{card.title}</h4>
              <p className="card-text text-muted small mb-3">{card.subtitle}</p>
              <h3 className={`${card.color} mb-1`}>{card.value}</h3>
              <p className="text-muted small mb-0">Orders</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderSummaryCards;

