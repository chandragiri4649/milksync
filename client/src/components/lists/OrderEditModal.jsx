// src/components/orders/OrderEditModal.jsx
import React, { useEffect, useState, useCallback } from "react";
import config from "../../config";

const OrderEditModal = ({ order, token, onClose, onSave }) => {
  const [editDate, setEditDate] = useState(order.orderDate.split("T")[0]);
  const [items, setItems] = useState([...order.items]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Detect company name properly
  useEffect(() => {
    const companyName = order.distributorId?.company || order.distributorId?.name;
    if (companyName) {
      fetch(`${config.API_BASE}/products/company/${encodeURIComponent(companyName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Product fetch failed");
          return res.json();
        })
        .then(data => setAvailableProducts(data))
        .catch(err => console.error(err));
    }
  }, [order, token]);

  // Change quantity
  const changeQuantity = (index, delta) => {
    setItems(prev => {
      const newItems = [...prev];
      const currentQty = newItems[index].quantity || 1;
      let newQty = currentQty + delta;
      if (newQty < 1) newQty = 1;
      newItems[index].quantity = newQty;
      return newItems;
    });
  };

  // Separate functions for increment and decrement to avoid any state issues
  const incrementQuantity = useCallback((index) => {
    setItems(prev => {
      const newItems = [...prev];
      const currentQty = newItems[index].quantity || 1;
      newItems[index].quantity = currentQty + 1;
      return newItems;
    });
  }, []);

  const decrementQuantity = useCallback((index) => {
    setItems(prev => {
      const newItems = [...prev];
      const currentQty = newItems[index].quantity || 1;
      const newQty = Math.max(1, currentQty - 1);
      newItems[index].quantity = newQty;
      return newItems;
    });
  }, []);

  // Alternative approach - direct state manipulation
  const handleIncrement = (index) => {
    const currentItems = [...items];
    const currentQty = currentItems[index].quantity || 1;
    currentItems[index].quantity = currentQty + 1;
    setItems(currentItems);
  };

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

  const changeUnit = (index, unit) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index].unit = unit;
      return newItems;
    });
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addProductToOrder = (product) => {
    setItems(prev => [
      ...prev,
      { productId: product, quantity: 1, unit: "tub" }
    ]);
  };

  const saveChanges = () => {
    if (order.locked || order.status === "delivered") return;
    const payloadItems = items.map(i => ({
      productId: i.productId._id || i.productId,
      quantity: i.quantity,
      unit: i.unit
    }));

    fetch(`${config.API_BASE}/orders/${order._id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderDate: editDate,
        items: payloadItems
      })
    })
      .then(res => res.json())
      .then(updated => {
        if (!updated.error) {
          onSave(updated);
        }
      })
      .catch(() => {});
  };

  // Filter remaining products
  const remainingProducts = availableProducts.filter(
    prod => !items.some(
      item => (item.productId?._id || item.productId) === prod._id
    )
  );

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: "#0008" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5>Edit Order for {order.distributorId?.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <label>Order Date</label>
            <input
              type="date"
              className="form-control mb-3"
              value={editDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setEditDate(e.target.value)}
            />

            <h6>Items</h6>
            {items.map((item, idx) => (
              <div key={idx} className="d-flex align-items-center mb-2 border p-2 rounded">
                <span className="flex-grow-1">{item.productId?.name || "Unknown Product"}</span>
                <div className="d-flex align-items-center me-2">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleDecrement(idx)}>-</button>
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    className="mx-1"
                    onChange={(e) => handleQuantityInput(idx, e.target.value)}
                    style={{ width: "60px" }}
                  />
                  <button className="btn btn-sm btn-secondary" onClick={() => handleIncrement(idx)}>+</button>
                </div>
                <select
                  className="form-select form-select-sm me-2"
                  value={item.unit}
                  onChange={(e) => changeUnit(idx, e.target.value)}
                  style={{ width: "90px" }}
                >
                  <option value="tub">Tub</option>
                  <option value="bucket">Bucket</option>
                  <option value="kg">kg</option>
                </select>
                <button className="btn btn-sm btn-danger" onClick={() => removeItem(idx)}>Remove</button>
              </div>
            ))}

            <h6 className="mt-3">Add Products</h6>
            <div className="row">
              {remainingProducts.length > 0 ? (
                remainingProducts.map(prod => (
                  <div key={prod._id} className="col-md-4 mb-2">
                    <div className="border p-2 d-flex justify-content-between align-items-center">
                      <span>{prod.name}</span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addProductToOrder(prod)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info">No more products to add</div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={saveChanges} disabled={order.locked || order.status === "delivered"} title={order.locked ? "Order locked" : ""}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
