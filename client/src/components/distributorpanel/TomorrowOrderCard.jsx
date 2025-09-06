// src/components/distributorpanel/TomorrowOrderCard.jsx
import React, { useEffect, useState } from "react";
import apiService from "../../utils/apiService";

export default function TomorrowOrderCard({ onClick }) {
  const [tomorrowOrders, setTomorrowOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTomorrowOrders = async () => {
      try {
        setLoading(true);
        const data = await apiService.get('/orders/tomorrow');
        
        if (Array.isArray(data)) {
          setTomorrowOrders(data);
        } else {
          setTomorrowOrders([]);
        }
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
              Delivery Date: {new Date(order.deliveryDate || order.orderDate).toLocaleDateString("en-GB")}
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
            
            <div style={{ marginTop: '15px' }}>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#666', 
                marginBottom: '10px' 
              }}>
                Order Items ({order.items?.length || 0}):
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  marginBottom: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      marginRight: '8px'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.85rem',
                        color: '#333'
                      }}>
                        {item.productId?.name}
                      </div>
                      {item.productId?.productQuantity && item.productId?.productUnit && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#666' 
                        }}>
                          {item.productId.productQuantity}{item.productId.productUnit} pack
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '0.85rem',
                      color: '#007bff'
                    }}>
                      {item.quantity} {item.unit}
                    </div>
                    {item.costPerUnit && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#666' 
                      }}>
                        ₹{item.costPerUnit} each
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        ))
      )}
    </div>
  );
}
