import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import config from '../../config';
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

const DistributorsData = () => {
  const { token } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [distributorData, setDistributorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE}/admin/distributors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch distributors');
      }

      const data = await response.json();
      setDistributors(data);
    } catch (err) {
      setError('Failed to fetch distributors: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchDistributorFullData = useCallback(async (distributorId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${config.API_BASE}/admin/distributors/${distributorId}/full-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch distributor data');
      }

      const data = await response.json();
      setDistributorData(data);
    } catch (err) {
      setError('Failed to fetch distributor data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleDistributorClick = (distributor) => {
    setSelectedDistributor(distributor);
    fetchDistributorFullData(distributor._id);
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

  if (loading && !distributors.length) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mx-auto" style={{width: '8rem', height: '8rem'}}></div>
          <p className="mt-4 fs-5 text-muted">Loading distributors...</p>
        </div>
      </div>
    );
  }

  if (error && !distributors.length) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-danger display-1 mb-4"></i>
          <p className="fs-5 text-danger">{error}</p>
          <button 
            onClick={fetchDistributors}
            className="btn btn-primary mt-4 px-4 py-2"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex h-100 bg-light">
      {/* Left Sidebar - Distributors List */}
      <div className="bg-white shadow-sm overflow-auto" style={{width:"260px"}}>
                 <div className="p-4 border-bottom bg-primary text-white">
           <h2 className="h4 fw-bold text-white mb-1">Distributors</h2>
           <p className="small text-white-50 mb-0">Select a distributor to view details</p>
         </div>
        
        <div className="p-3">
          {distributors.length === 0 ? (
            <p className="text-muted text-center py-5">No distributors found</p>
          ) : (
            <div className="d-grid gap-2">
              {distributors.map((distributor) => (
                <div
                  key={distributor._id}
                  onClick={() => handleDistributorClick(distributor)}
                  className={`p-3 rounded cursor-pointer transition-all ${
                    selectedDistributor?._id === distributor._id 
                      ? 'bg-primary bg-opacity-10 border-start border-primary border-3' 
                      : 'bg-light hover-bg-primary hover-bg-opacity-5'
                  }`}
                >
                  <h6 className="fw-semibold text-dark mb-1 text-truncate">{distributor.name}</h6>
                  <p className="small text-muted mb-1 text-truncate">{distributor.email}</p>
                  {distributor.phone && (
                    <p className="small text-muted mb-0 text-truncate">{distributor.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Dashboard */}
      <div className="flex-fill overflow-auto">
                 {!selectedDistributor ? (
           <div className="d-flex align-items-center justify-content-center h-100">
             <div className="text-center">
               <i className="bi bi-arrow-left text-muted display-1 mb-4"></i>
               <h4 className="text-muted">Select a distributor from the left panel</h4>
               <p className="text-muted">to view their detailed information</p>
             </div>
           </div>
        ) : (
          <div className="p-4">
            {/* Header */}
                         <div className="mb-5 bg-primary text-white p-2 rounded">
               <h2 className="display-6 fw-bold text-white mb-3 text-break">
                 {selectedDistributor.name}
               </h2>
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
                 <i className="bi bi-exclamation-triangle text-danger display-4 mb-3"></i>
                 <p className="fs-5 text-danger">{error}</p>
                 <button 
                   onClick={() => fetchDistributorFullData(selectedDistributor._id)}
                   className="btn btn-primary mt-3"
                 >
                   <i className="bi bi-arrow-clockwise me-2"></i>
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
                         icon: 'bi-box-seam',
                         color: 'bg-primary'
                       },
                       {
                         title: 'Total Bills Amount',
                         value: `₹${overview.totalBillsAmount.toLocaleString()}`,
                         icon: 'bi-receipt',
                         color: 'bg-success'
                       },
                       {
                         title: 'Total Payments',
                         value: `₹${overview.totalPayments.toLocaleString()}`,
                         icon: 'bi-credit-card',
                         color: 'bg-info'
                       },
                       {
                         title: 'Wallet Balance',
                         value: `₹${overview.walletBalance.toLocaleString()}`,
                         icon: 'bi-wallet2',
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
                 <i className="bi bi-graph-up text-muted display-4 mb-3"></i>
                 <h5 className="text-muted">Click on a distributor to view their data</h5>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorsData;
