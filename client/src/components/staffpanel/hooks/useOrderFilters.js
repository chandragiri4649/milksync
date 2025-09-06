import { useState, useMemo } from 'react';

export const useOrderFilters = (orders) => {
  // Get current month and year as default
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  // Safety check - ensure orders is always an array
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Filter orders based on selected criteria
  const filteredOrders = useMemo(() => {
    let filtered = [...safeOrders];

    // Filter by distributor
    if (selectedDistributor) {
      filtered = filtered.filter(order => {
        const distributorName = order.distributorId?.name || order.distributorId?.distributorName || order.distributorId?.company || '';
        return distributorName === selectedDistributor;
      });
    }

    // Always filter by month and year (default to current month/year)
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.orderDate);
      const orderMonth = orderDate.getMonth() + 1;
      const orderYear = orderDate.getFullYear();
      
      return orderMonth === parseInt(selectedMonth) && orderYear === parseInt(selectedYear);
    });

    // Enhanced search filter
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const orderId = order._id?.toString() || '';
        const distributorName = order.distributorId?.name || order.distributorId?.distributorName || order.distributorId?.company || '';
        const status = order.status || '';
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        
        const searchText = `${orderId} ${distributorName} ${status} ${orderDate}`.toLowerCase();
        return searchText.includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  }, [safeOrders, selectedDistributor, selectedMonth, selectedYear, searchTerm]);

  // Separate pending and delivered orders
  const pendingOrders = useMemo(() => 
    filteredOrders.filter(order => order.status === 'pending'), 
    [filteredOrders]
  );

  const deliveredOrders = useMemo(() => 
    filteredOrders.filter(order => order.status === 'delivered'), 
    [filteredOrders]
  );

  // Group orders by distributor for better organization
  const groupOrdersByDistributor = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const distributorName = order.distributorId?.name || order.distributorId?.distributorName || order.distributorId?.company || 'Unknown Distributor';
      if (!grouped[distributorName]) {
        grouped[distributorName] = [];
      }
      grouped[distributorName].push(order);
    });
    return grouped;
  };

  const groupedPendingOrders = useMemo(() => 
    groupOrdersByDistributor(pendingOrders), 
    [pendingOrders]
  );

  const groupedDeliveredOrders = useMemo(() => 
    groupOrdersByDistributor(deliveredOrders), 
    [deliveredOrders]
  );

  return {
    filteredOrders,
    pendingOrders,
    deliveredOrders,
    groupedPendingOrders,
    groupedDeliveredOrders,
    searchTerm,
    setSearchTerm,
    selectedDistributor,
    setSelectedDistributor,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear
  };
};

