import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../utils/apiService';
import DeleteModal from '../DeleteModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import * as XLSX from 'xlsx';

const DistributorsData = ({ showAllDistributors = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if this is being accessed from staff routes
  const isStaffRoute = location.pathname.startsWith('/staff/');

  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [distributorData, setDistributorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDistributorForDelete, setSelectedDistributorForDelete] = useState(null);

  const fetchDistributors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const endpoint = showAllDistributors ? '/distributor' : '/admin/distributors';
      const data = await apiService.get(endpoint);
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setDistributors(data);
      } else if (data && typeof data === 'object') {
        if (data.error) {
          setError(data.error);
          setDistributors([]);
        } else {
          setDistributors([]);
          setError("Unexpected response format from distributors API");
        }
      } else {
        setDistributors([]);
        setError("No distributors data received");
      }
    } catch (err) {
      setError('Failed to fetch distributors: ' + (err.message || 'Unknown error'));
      setDistributors([]);
    } finally {
      setLoading(false);
    }
  }, [showAllDistributors]);

  const fetchDistributorFullData = useCallback(async (distributorId) => {
    try {
      setLoading(true);
      setError('');
      
      const data = await apiService.get(`/admin/distributors/${distributorId}/full-data`);
      setDistributorData(data);
    } catch (err) {
      setError('Failed to fetch distributor data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDistributorClick = (distributor) => {
    setSelectedDistributor(distributor);
    fetchDistributorFullData(distributor._id);
  };

  // Delete a distributor
  const deleteDistributor = async (id) => {
    if (!window.confirm("Delete this distributor?")) return;
    try {
      await apiService.delete(`/distributor/${id}`);
      setDistributors(prev => prev.filter(d => d._id !== id));
      if (selectedDistributor?._id === id) {
        setSelectedDistributor(null);
        setDistributorData(null);
      }
      setMessage("Distributor deleted successfully");
    } catch (error) {
      setMessage(error.message || "Failed to delete distributor");
    }
  };

  // Show delete distributor modal
  const showDeleteDistributorModal = (distributor) => {
    setSelectedDistributorForDelete(distributor);
    setShowDeleteModal(true);
  };

  // Export to Excel functionality
  const exportToExcel = () => {
    if (!selectedDistributor || !distributorData) {
      setMessage("Please select a distributor first");
      return;
    }

    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Overview Data
      const overview = getOverviewData();
      const overviewData = [
        ['Distributor Analytics Report'],
        [''],
        ['Distributor Information'],
        ['Name', selectedDistributor.name || selectedDistributor.distributorName || selectedDistributor.companyName],
        ['Email', selectedDistributor.email],
        ['Phone', selectedDistributor.phone || 'N/A'],
        ['Address', selectedDistributor.address || 'N/A'],
        [''],
        ['Overview Statistics'],
        ['Total Orders', overview.totalOrders],
        ['Total Bills Amount', `₹${overview.totalBillsAmount.toLocaleString()}`],
        ['Total Payments', `₹${overview.totalPayments.toLocaleString()}`],
        ['Wallet Balance', `₹${overview.walletBalance.toLocaleString()}`],
        [''],
        ['Report Generated On', new Date().toLocaleDateString()],
        ['Selected Month', selectedMonth]
      ];
      
      const overviewWS = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWS, 'Overview');

      // Daily Orders Breakdown
      if (distributorData.orders?.length > 0) {
        const dailyOrdersData = [
          ['Date', 'Order ID', 'Products', 'Quantity', 'Unit', 'Status', 'Order Date', 'Created At']
        ];
        
        // Sort orders by date
        const sortedOrders = [...distributorData.orders].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedOrders.forEach(order => {
          // Handle multiple items in an order
          if (order.items && order.items.length > 0) {
            order.items.forEach((item, itemIndex) => {
              dailyOrdersData.push([
                new Date(order.date).toLocaleDateString(),
                `Order #${order._id?.slice(-6)}`,
                item.productId?.name || 'Unknown Product',
                item.quantity || 'N/A',
                item.unit || 'N/A',
                order.status || 'N/A',
                new Date(order.orderDate).toLocaleDateString(),
                order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'
              ]);
            });
          } else {
            // If no items, still show the order
            dailyOrdersData.push([
              new Date(order.date).toLocaleDateString(),
              `Order #${order._id?.slice(-6)}`,
              'No items',
              'N/A',
              'N/A',
              order.status || 'N/A',
              new Date(order.orderDate).toLocaleDateString(),
              order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'
            ]);
          }
        });
        
        const dailyOrdersWS = XLSX.utils.aoa_to_sheet(dailyOrdersData);
        XLSX.utils.book_append_sheet(wb, dailyOrdersWS, 'Daily Orders');
      }

      // Daily Bills Breakdown
      if (distributorData.bills?.length > 0) {
        const dailyBillsData = [
          ['Date', 'Bill ID', 'Serial No', 'Bill Amount', 'Created At', 'Updated At']
        ];
        
        // Sort bills by date
        const sortedBills = [...distributorData.bills].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedBills.forEach((bill, index) => {
          dailyBillsData.push([
            new Date(bill.date).toLocaleDateString(),
            `Bill #${bill._id?.slice(-6).toUpperCase()}`,
            bill.serialNo || `BILL-${index + 1}`,
            `₹${bill.amount?.toLocaleString() || '0'}`,
            bill.createdAt ? new Date(bill.createdAt).toLocaleString() : 'N/A',
            bill.updatedAt ? new Date(bill.updatedAt).toLocaleString() : 'N/A'
          ]);
        });
        
        const dailyBillsWS = XLSX.utils.aoa_to_sheet(dailyBillsData);
        XLSX.utils.book_append_sheet(wb, dailyBillsWS, 'Daily Bills');
      }

      // Daily Payments Breakdown
      if (distributorData.payments?.length > 0) {
        const dailyPaymentsData = [
          ['Date', 'Payment ID', 'Serial No', 'Payment Amount', 'Payment Method', 'Created At', 'Updated At']
        ];
        
        // Sort payments by date
        const sortedPayments = [...distributorData.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedPayments.forEach((payment, index) => {
          dailyPaymentsData.push([
            new Date(payment.date).toLocaleDateString(),
            `Payment #${payment._id?.slice(-6).toUpperCase()}`,
            payment.serialNo || `PAY-${index + 1}`,
            `₹${payment.amount?.toLocaleString() || '0'}`,
            payment.paymentMethod || 'N/A',
            payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A',
            payment.updatedAt ? new Date(payment.updatedAt).toLocaleString() : 'N/A'
          ]);
        });
        
        const dailyPaymentsWS = XLSX.utils.aoa_to_sheet(dailyPaymentsData);
        XLSX.utils.book_append_sheet(wb, dailyPaymentsWS, 'Daily Payments');
      }

      // Daily Summary Sheet
      const dailySummaryData = [
        ['Daily Summary Report'],
        [''],
        ['Date', 'Orders Count', 'Orders Amount', 'Bills Count', 'Bills Amount', 'Payments Count', 'Payments Amount', 'Net Amount']
      ];

      // Get all unique dates from orders, bills, and payments
      const allDates = new Set();
      
      distributorData.orders?.forEach(order => {
        allDates.add(new Date(order.date).toLocaleDateString());
      });
      
      distributorData.bills?.forEach(bill => {
        allDates.add(new Date(bill.date).toLocaleDateString());
      });
      
      distributorData.payments?.forEach(payment => {
        allDates.add(new Date(payment.date).toLocaleDateString());
      });

      // Sort dates
      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

      sortedDates.forEach(date => {
        const ordersForDate = distributorData.orders?.filter(order => 
          new Date(order.date).toLocaleDateString() === date
        ) || [];
        
        const billsForDate = distributorData.bills?.filter(bill => 
          new Date(bill.date).toLocaleDateString() === date
        ) || [];
        
        const paymentsForDate = distributorData.payments?.filter(payment => 
          new Date(payment.date).toLocaleDateString() === date
        ) || [];

        const ordersAmount = ordersForDate.reduce((sum, order) => {
          return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
        }, 0);
        
        const billsAmount = billsForDate.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const paymentsAmount = paymentsForDate.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const netAmount = billsAmount - paymentsAmount;

        dailySummaryData.push([
          date,
          ordersForDate.length,
          ordersAmount,
          billsForDate.length,
          `₹${billsAmount.toLocaleString()}`,
          paymentsForDate.length,
          `₹${paymentsAmount.toLocaleString()}`,
          `₹${netAmount.toLocaleString()}`
        ]);
      });

      const dailySummaryWS = XLSX.utils.aoa_to_sheet(dailySummaryData);
      XLSX.utils.book_append_sheet(wb, dailySummaryWS, 'Daily Summary');

      // Generate filename
      const fileName = `${selectedDistributor.name || selectedDistributor.distributorName || selectedDistributor.companyName}_Daily_Analytics_${selectedMonth}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, fileName);
      setMessage("Daily Excel report exported successfully!");
      
    } catch (error) {
      setMessage("Failed to export Excel report: " + error.message);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedDistributorForDelete) return;
    
    try {
      await apiService.delete(`/distributor/${selectedDistributorForDelete._id}`);
      setDistributors(prev => prev.filter(d => d._id !== selectedDistributorForDelete._id));
      if (selectedDistributor?._id === selectedDistributorForDelete._id) {
        setSelectedDistributor(null);
        setDistributorData(null);
      }
      setMessage("Distributor deleted successfully");
      setShowDeleteModal(false);
      setSelectedDistributorForDelete(null);
    } catch (error) {
      setMessage(error.message || "Failed to delete distributor");
    }
  };

  const getOverviewData = () => {
    if (!distributorData) return {};
    
    const totalOrders = distributorData.orders?.length || 0;
    const totalBillsAmount = distributorData.bills?.reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0;
    const totalPayments = distributorData.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const walletBalance = distributorData.wallet?.balance || 0;

    return { totalOrders, totalBillsAmount, totalPayments, walletBalance };
  };

  const getOrdersTrendData = () => {
    if (!distributorData?.orders) return [];
    
    const ordersByDate = distributorData.orders.reduce((acc, order) => {
      const date = new Date(order.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(ordersByDate).map(([date, count]) => ({
      date,
      orders: count
    }));
  };

  const getBillsVsPaymentsData = () => {
    if (!distributorData) return [];
    
    const billsByDate = distributorData.bills?.reduce((acc, bill) => {
      const date = new Date(bill.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (bill.amount || 0);
      return acc;
    }, {}) || {};

    const paymentsByDate = distributorData.payments?.reduce((acc, payment) => {
      const date = new Date(payment.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (payment.amount || 0);
      return acc;
    }, {}) || {};

    const allDates = [...new Set([...Object.keys(billsByDate), ...Object.keys(paymentsByDate)])];
    
    return allDates.map(date => ({
      date,
      bills: billsByDate[date] || 0,
      payments: paymentsByDate[date] || 0
    }));
  };

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  // Safety check - ensure distributors is always an array
  const safeDistributors = Array.isArray(distributors) ? distributors : [];

  // Get all distributors (no filtering since search is removed)
  const getAllDistributors = () => {
    return safeDistributors;
  };

  if (loading && !safeDistributors.length) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
          <p className="mt-3 text-muted">Loading distributors...</p>
        </div>
      </div>
    );
  }

  if (error && !safeDistributors.length) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
          <h5 className="text-danger">{error}</h5>
          <button 
            onClick={fetchDistributors}
            className="btn btn-primary mt-3"
          >
            <i className="fas fa-redo me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

     return (
     <div className="container-fluid py-4">
       {/* Page Header */}
       <div className="row mb-4">
         <div className="col-12">
           <div className="d-flex align-items-center">
             <div 
               className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
               style={{width: '60px', height: '60px'}}
             >
               <i className="fas fa-users fa-lg text-white"></i>
             </div>
             <div>
               <h3 className="mb-0 fw-bold text-dark">
                 {showAllDistributors ? "All Distributors Data" : "Distributors Analytics"}
               </h3>
               <p className="mb-0 text-muted">
                 {showAllDistributors ? "View and manage all distributor information" : "Comprehensive analytics and insights for distributors"}
               </p>
             </div>
           </div>
         </div>
       </div>

       {/* Feedback Message */}
       {message && (
         <div className="alert alert-info alert-dismissible fade show" role="alert">
           <i className="fas fa-info-circle me-2"></i>
           {message}
           <button type="button" className="btn btn-close" onClick={() => setMessage("")}></button>
         </div>
       )}

       {/* Top Bar - Distributors List */}
       <div className="bg-white shadow-sm border-bottom mb-4">
         <div className="p-3 bg-primary text-white">
           <h4 className="fw-bold text-white mb-1">Select Distributor</h4>
           <p className="small text-white-50 mb-0">Choose a distributor to view analytics</p>
         </div>
         
         <div className="p-3">
           <div className="d-flex gap-2 overflow-auto">
             {getAllDistributors().map((distributor) => (
               <div
                 key={distributor._id}
                 onClick={() => handleDistributorClick(distributor)}
                 className={`p-3 rounded cursor-pointer transition-all flex-shrink-0 ${
                   selectedDistributor?._id === distributor._id 
                     ? 'bg-primary bg-opacity-10 border border-primary' 
                     : 'bg-light hover-bg-primary hover-bg-opacity-5'
                 }`}
                 style={{ minWidth: '200px' }}
               >
                 <h6 className="fw-semibold text-dark mb-1 text-truncate">
                   {distributor.name || distributor.distributorName || distributor.companyName}
                 </h6>
                 <p className="small text-muted mb-1 text-truncate">{distributor.email}</p>
                 {distributor.phone && (
                   <p className="small text-muted mb-0 text-truncate">{distributor.phone}</p>
                 )}
               </div>
             ))}
           </div>
         </div>
               </div>

        {/* Export Controls */}
        {selectedDistributor && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="fas fa-file-excel fa-lg"></i>
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold">Export Daily Analytics Report</h5>
                      <p className="mb-0 small opacity-75">Generate comprehensive daily breakdown reports</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded p-2 me-3">
                          <i className="fas fa-calendar-alt text-primary"></i>
                        </div>
                        <div>
                          <label htmlFor="monthSelect" className="form-label fw-medium mb-1">Select Month:</label>
                          <input
                            type="month"
                            id="monthSelect"
                            className="form-control"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ width: '180px' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 text-md-end">
                      <button
                        type="button"
                        className="btn btn-success btn-lg px-4"
                        onClick={exportToExcel}
                        disabled={!distributorData}
                      >
                        <i className="fas fa-download me-2"></i>
                        Export Daily Report
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-top">
                    <div className="row text-center">
                      <div className="col-md-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="fas fa-shopping-cart text-primary me-2"></i>
                          <span className="small fw-medium">Daily Orders</span>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="fas fa-receipt text-success me-2"></i>
                          <span className="small fw-medium">Daily Bills</span>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="fas fa-credit-card text-info me-2"></i>
                          <span className="small fw-medium">Daily Payments</span>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-flex align-items-center justify-content-center">
                          <i className="fas fa-chart-line text-warning me-2"></i>
                          <span className="small fw-medium">Summary Report</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

                 {/* Analytics Content */}
         {getAllDistributors().length === 0 ? (
           <div className="text-center py-5">
             <i className="fas fa-users fa-3x text-muted mb-3"></i>
             <h6 className="text-muted">No Distributors Found</h6>
             <p className="text-muted">
               {safeDistributors.length === 0 ? "No distributors are currently available" : "No distributors match your search criteria"}
             </p>
           </div>
         ) : (
           <div className="bg-light">
             {/* Main Content Area */}
             <div className="p-4">
               {!selectedDistributor ? (
                 <div className="d-flex align-items-center justify-content-center py-5">
                   <div className="text-center">
                     <i className="fas fa-arrow-up text-muted display-1 mb-4"></i>
                     <h4 className="text-muted">Select a distributor from the top bar</h4>
                     <p className="text-muted">to view their detailed information</p>
                   </div>
                 </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="mb-5 bg-primary text-white p-2 rounded">
                      <h4 className="fw-bold text-white mb-3 text-break">
                        {selectedDistributor.name || selectedDistributor.distributorName || selectedDistributor.companyName}
                      </h4>
                      <div className="d-flex align-items-center gap-4 text-white-50 flex-wrap">
                        <span className="text-truncate">{selectedDistributor.email}</span>
                        {selectedDistributor.phone && <span className="text-truncate">{selectedDistributor.phone}</span>}
                        {selectedDistributor.address && <span className="text-truncate">{selectedDistributor.address}</span>}
                      </div>
                    </div>

                    {loading ? (
                      <div className="d-flex align-items-center justify-content-center py-5">
                        <div className="text-center">
                          <div className="spinner-border text-primary mx-auto" style={{width: '4rem', height: '4rem'}}></div>
                          <p className="mt-3 fs-5 text-muted">Loading distributor data...</p>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-5">
                        <i className="fas fa-exclamation-triangle text-danger display-4 mb-3"></i>
                        <p className="fs-5 text-danger">{error}</p>
                        <button 
                          onClick={() => fetchDistributorFullData(selectedDistributor._id)}
                          className="btn btn-primary mt-3"
                        >
                          <i className="fas fa-redo me-2"></i>
                          Retry
                        </button>
                      </div>
                    ) : distributorData ? (
                      <>
                        {/* Overview Cards */}
                        <div className="row g-3 mb-5">
                          {(() => {
                            const overview = getOverviewData();
                            return [
                              {
                                title: 'Total Orders',
                                value: overview.totalOrders,
                                icon: 'fas fa-shopping-cart',
                                color: 'bg-primary'
                              },
                              {
                                title: 'Total Bills Amount',
                                value: `₹${overview.totalBillsAmount.toLocaleString()}`,
                                icon: 'fas fa-receipt',
                                color: 'bg-success'
                              },
                              {
                                title: 'Total Payments',
                                value: `₹${overview.totalPayments.toLocaleString()}`,
                                icon: 'fas fa-credit-card',
                                color: 'bg-info'
                              },
                              {
                                title: 'Wallet Balance',
                                value: `₹${overview.walletBalance.toLocaleString()}`,
                                icon: 'fas fa-wallet',
                                color: 'bg-warning'
                              }
                            ].map((card, index) => (
                              <div key={index} className="col-12 col-md-6 col-lg-3">
                                <div className="card border-0 shadow-sm h-100">
                                  <div className="card-body">
                                    <div className="d-flex align-items-center">
                                      <div className={`${card.color} rounded p-2 me-3 flex-shrink-0`}>
                                        <i className={`${card.icon} text-white fs-3`}></i>
                                      </div>
                                      <div className="flex-grow-1 min-w-0">
                                        <p className="small fw-medium text-muted mb-1 text-truncate">{card.title}</p>
                                        <p className="h3 fw-bold text-dark mb-0 text-break">{card.value}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Charts Section */}
                        <div className="row g-4 mb-5">
                          {/* Orders Trend Chart */}
                          <div className="col-12 col-lg-6">
                            <div className="card border-0 shadow-sm">
                              <div className="card-header bg-primary text-white">
                                <h5 className="card-title fw-semibold text-white mb-0">Orders Trend</h5>
                              </div>
                              <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                  <LineChart data={getOrdersTrendData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                      type="monotone" 
                                      dataKey="orders" 
                                      stroke="#0d6efd" 
                                      strokeWidth={2}
                                      dot={{ fill: '#0d6efd', strokeWidth: 2, r: 4 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          {/* Bills vs Payments Chart */}
                          <div className="col-12 col-lg-6">
                            <div className="card border-0 shadow-sm">
                              <div className="card-header bg-primary text-white">
                                <h5 className="card-title fw-semibold text-white mb-0">Bills vs Payments</h5>
                              </div>
                              <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                  <BarChart data={getBillsVsPaymentsData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="bills" fill="#198754" />
                                    <Bar dataKey="payments" fill="#0dcaf0" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Tables Section */}
                        <div className="d-grid gap-4">
                          {/* Orders Table */}
                          <div className="card border-0 shadow-sm">
                            <div className="card-header bg-primary text-white border-bottom">
                              <h5 className="card-title fw-semibold text-white mb-0">Orders Details</h5>
                            </div>
                            <div className="card-body p-0">
                              <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Order ID</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Date</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Products</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Quantity</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {distributorData.orders?.length > 0 ? (
                                      distributorData.orders.map((order, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            <code className="text-primary">Order #{order._id?.slice(-6)}</code>
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            {new Date(order.date).toLocaleDateString()}
                                          </td>
                                          <td className="px-4 py-3 small text-dark">
                                            {order.products?.map(p => p.name).join(', ') || 'N/A'}
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            {order.quantity || 'N/A'}
                                          </td>
                                          <td className="px-4 py-3 text-nowrap">
                                            <span className={`badge ${
                                              order.status === 'delivered' ? 'bg-success' :
                                              order.status === 'pending' ? 'bg-warning' :
                                              'bg-secondary'
                                            }`}>
                                              {order.status || 'N/A'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="5" className="px-4 py-4 text-center text-muted">
                                          No orders found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                  {distributorData.orders?.length > 0 && (
                                    <tfoot className="table-light">
                                      <tr>
                                        <td colSpan="4" className="px-4 py-3 text-end fw-medium text-dark">
                                          Total Orders:
                                        </td>
                                        <td className="px-4 py-3 fw-medium text-dark">
                                          {distributorData.orders.length}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  )}
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* Bills Table */}
                          <div className="card border-0 shadow-sm">
                            <div className="card-header bg-primary text-white border-bottom">
                              <h5 className="card-title fw-semibold text-white mb-0">Bills Details</h5>
                            </div>
                            <div className="card-body p-0">
                              <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Bill ID</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Serial No</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Date</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Bill Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {distributorData.bills?.length > 0 ? (
                                      distributorData.bills.map((bill, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            <code className="text-primary">Bill #{bill._id?.slice(-6).toUpperCase()}</code>
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            {bill.serialNo || `BILL-${index + 1}`}
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            {new Date(bill.date).toLocaleDateString()}
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small fw-medium text-dark">
                                            ₹{bill.amount?.toLocaleString() || '0'}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center text-muted">
                                          No bills found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                  {distributorData.bills?.length > 0 && (
                                    <tfoot className="table-light">
                                      <tr>
                                        <td colSpan="3" className="px-4 py-3 text-end fw-medium text-dark">
                                          Total Bills Amount:
                                        </td>
                                        <td className="px-4 py-3 fw-medium text-dark">
                                          ₹{distributorData.bills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString()}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  )}
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* Payments Table */}
                          <div className="card border-0 shadow-sm">
                            <div className="card-header bg-primary text-white border-bottom">
                              <h5 className="card-title fw-semibold text-white mb-0">Payments Details</h5>
                            </div>
                            <div className="card-body p-0">
                              <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Payment ID</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Serial No</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Date</th>
                                      <th className="border-0 px-4 py-3 small text-uppercase fw-medium text-muted">Payment Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {distributorData.payments?.length > 0 ? (
                                      distributorData.payments.map((payment, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            <code className="text-primary">Payment #{payment._id?.slice(-6).toUpperCase()}</code>
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            {payment.serialNo || `PAY-${index + 1}`}
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small text-dark">
                                            {new Date(payment.date).toLocaleDateString()}
                                          </td>
                                          <td className="px-4 py-3 text-nowrap small fw-medium text-dark">
                                            ₹{payment.amount?.toLocaleString() || '0'}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center text-muted">
                                          No payments found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                  {distributorData.payments?.length > 0 && (
                                    <tfoot className="table-light">
                                      <tr>
                                        <td colSpan="3" className="px-4 py-3 text-end fw-medium text-dark">
                                          Total Payments:
                                        </td>
                                        <td className="px-4 py-3 fw-medium text-dark">
                                          ₹{distributorData.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toLocaleString()}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  )}
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-chart-line text-muted display-4 mb-3"></i>
                        <h5 className="text-muted">Click on a distributor to view their data</h5>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

      {/* Delete Distributor Modal */}
      {showDeleteModal && selectedDistributorForDelete && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedDistributorForDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Distributor"
          message="Are you sure you want to delete this distributor?"
          itemName={`Distributor ${selectedDistributorForDelete.name || selectedDistributorForDelete.distributorName || selectedDistributorForDelete.companyName}`}
          itemDetails={`Email: ${selectedDistributorForDelete.email || 'N/A'} | Phone: ${selectedDistributorForDelete.phone || 'N/A'}`}
          confirmText="Delete Distributor"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default DistributorsData;
