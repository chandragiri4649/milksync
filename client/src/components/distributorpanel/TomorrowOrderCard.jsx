// src/components/distributorpanel/TomorrowOrderCard.jsx
import React, { useEffect, useState } from "react";
import apiService from "../../utils/apiService";

export default function TomorrowOrderCard({ onClick }) {
  const [tomorrowOrders, setTomorrowOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("distributorToken");

  useEffect(() => {
    const fetchTomorrowOrders = async () => {
      try {
        setLoading(true);
        const data = await apiService.get('/orders/tomorrow');
        setTomorrowOrders(data);
      } catch (err) {
        console.error("Error fetching tomorrow's orders:", err);
        setTomorrowOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTomorrowOrders();
  }, []);

  // Helper function to get status class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'border-warning bg-warning bg-opacity-10';
      case 'confirmed':
        return 'border-success bg-success bg-opacity-10';
      case 'delivered':
        return 'border-primary bg-primary bg-opacity-10';
      default:
        return 'border-secondary bg-light';
    }
  };

  return (
    <div 
      className="mx-3 mx-md-auto my-3 bg-white rounded-4 p-4 shadow cursor-pointer border border-light border-2 position-relative overflow-hidden w-100"
      style={{ 
        maxWidth: '800px',
        fontSize: '1rem',
        lineHeight: '1.6',
        textAlign: 'center'
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    >
      <strong style={{ 
        display: 'block', 
        marginBottom: '20px', 
        fontSize: '1.2rem', 
        textAlign: 'center',
        color: '#333'
      }}>
        Tomorrow Order
      </strong>

      {loading ? (
        <>Loading...</>
      ) : tomorrowOrders.length === 0 ? (
        <>No order placed yet</>
      ) : (
        tomorrowOrders.map((order) => (
          <React.Fragment key={order._id}>
            <span style={{ 
              display: 'inline-block',
              padding: '4px 8px',
              backgroundColor: '#e3f2fd',
              borderLeft: '3px solid #007bff',
              marginRight: '15px',
              marginBottom: '10px',
              borderRadius: '3px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              Order Date: {new Date(order.orderDate).toLocaleDateString("en-GB")}
            </span>
            
            <span style={{ 
              display: 'inline-block',
              padding: '4px 8px',
              backgroundColor: order.status === 'pending' ? '#fff3cd' : '#d4edda',
              borderLeft: order.status === 'pending' ? '3px solid #ffc107' : '3px solid #28a745',
              marginBottom: '15px',
              borderRadius: '3px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              Status: {order.status}
            </span>
            
            <br />
            
            {order.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <strong style={{ fontSize: '1rem' }}>
                  {item.productId?.name}
                </strong>{' '}
                <span style={{ fontSize: '1rem' }}>
                  {item.productId?.quantity}{item.productId?.unit} = {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </React.Fragment>
        ))
      )}
    </div>
  );
}
