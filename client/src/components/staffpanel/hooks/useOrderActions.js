import { useState } from 'react';
import apiService from '../../../utils/apiService';
import { toast } from 'react-toastify';

export const useOrderActions = (dependencies) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    setSelectedOrder,
    setShowViewModal,
    setEditingOrder,
    setShowEditModal,
    setSelectedOrderForDelivery,
    setShowDamageModal,
    fetchOrders,
    editingOrder
  } = dependencies;

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder({ ...order });
    setShowEditModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    setIsLoading(true);
    try {
      await apiService.put(`/orders/${editingOrder._id}`, {
        items: editingOrder.items,
        orderDate: editingOrder.orderDate
      });

      toast.success('Order updated successfully!');
      setShowEditModal(false);
      setEditingOrder(null);
      fetchOrders(); // Refresh orders
    } catch (err) {
      console.error('❌ Error updating order:', err);
      toast.error(err.message || 'Failed to update order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDelivered = (order) => {
    console.log('Marking order as delivered:', order);
    console.log('Order items:', order.items);
    console.log('First item product data:', order.items?.[0]?.productId);
    setSelectedOrderForDelivery(order);
    setShowDamageModal(true);
  };

  const handleDeliveryConfirmed = (result) => {
    console.log('Delivery confirmed with result:', result);
    toast.success(`Order marked as delivered successfully! Final bill: ₹${result.finalBillAmount}`);
    setShowDamageModal(false);
    setSelectedOrderForDelivery(null);
    fetchOrders(); // Refresh orders list
  };

  return {
    handleViewOrder,
    handleEditOrder,
    handleUpdateOrder,
    handleMarkDelivered,
    handleDeliveryConfirmed,
    isLoading
  };
};
