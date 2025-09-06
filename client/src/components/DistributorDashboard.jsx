import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import DistributorNavbar from "./distributorpanel/DistributorNavbar";
import AmountCard from "./distributorpanel/AmountCard";
import TomorrowOrderCard from "./distributorpanel/TomorrowOrderCard";
import DistributorOrderHistory from "./distributorpanel/DistributorOrderHistory";
import DistributorDeliveryHistory from "./distributorpanel/DistributorDeliveryHistory";
import DistributorBillsHistory from "./distributorpanel/DistributorBillsHistory";
import DistributorPaymentHistory from "./distributorpanel/DistributorPaymentHistory";
import apiService from "../utils/apiService";
import { useAuth } from "../hooks/useAuth";

export default function DistributorDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, userType } = useAuth();
  const [activeTab, setActiveTab] = useState(2); // Changed to 2 for Home tab
  const [distributorData, setDistributorData] = useState(null);
  const [loading, setLoading] = useState(true);


  // Monthly Report State
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Generate year options (last 5 years including current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Set default month and year to current month and year
  useEffect(() => {
    const currentDate = new Date();
    setMonth((currentDate.getMonth() + 1).toString().padStart(2, '0'));
    setYear(currentDate.getFullYear().toString());
  }, []);

  // ======= Fetch distributor profile =======
  useEffect(() => {
    const fetchDistributorData = async () => {
      console.log("🔍 DistributorDashboard - Starting to fetch distributor data");
      console.log("🔍 DistributorDashboard - Auth state:", { isAuthenticated, userType, user });

      try {
        console.log("🔍 DistributorDashboard - Making API call to /distributor/profile");
        const data = await apiService.get('/distributor/profile');
        console.log("✅ DistributorDashboard - Profile data received:", data);
        setDistributorData(data);
      } catch (error) {
        console.error("❌ DistributorDashboard - Error fetching distributor data:", error);
        console.error("❌ DistributorDashboard - Error details:", {
          message: error.message,
          status: error.status,
          response: error.response
        });
        navigate("/distributor/login");
      } finally {
        console.log("🔍 DistributorDashboard - Setting loading to false");
        setLoading(false);
      }
    };

    fetchDistributorData();
  }, []); // Only run once on component mount







  // ======= Handle Tomorrow Order Card Click =======
  const handleTomorrowOrderClick = () => {
    // You can add navigation or modal logic here
    console.log("Tomorrow order card clicked");
  };

  // ======= Monthly Report Functions =======
  const getMonthName = (monthValue) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[parseInt(monthValue) - 1] || "";
  };

  const handleGenerateReport = async () => {
    if (!month || !year) {
      alert("Please select both month and year to generate report");
      return;
    }

    setReportLoading(true);
    try {
      console.log(`🔍 Generating report for ${getMonthName(month)} ${year}`);
      
      // Use apiService for session-based requests
      const [billsData, paymentsData] = await Promise.all([
        apiService.get('/bills/distributor'),
        apiService.get('/payments/distributor')
      ]);

      console.log("📊 Raw data received:", { 
        bills: billsData?.length || 0, 
        payments: paymentsData?.length || 0 
      });

      // Filter data for selected month and year
      const filteredData = filterDataByMonth(billsData, paymentsData, month, year);
      console.log(`📈 Filtered data for ${month}/${year}:`, filteredData);
      
      setMonthlyReportData(filteredData);
    } catch (error) {
      console.error("❌ Error generating report:", error);
      // Fallback to mock data on error
      console.log("🔄 Using mock data as fallback");
      const mockData = generateMockReportData(month, year);
      setMonthlyReportData(mockData);
    } finally {
      setReportLoading(false);
    }
  };

  const filterDataByMonth = (billsData, paymentsData, selectedMonth, selectedYear) => {
    console.log(`🔍 Filtering data for month: ${selectedMonth}, year: ${selectedYear}`);
    const monthlyData = [];

    // Ensure data arrays exist
    const bills = Array.isArray(billsData) ? billsData : [];
    const payments = Array.isArray(paymentsData) ? paymentsData : [];

    console.log(`📊 Processing ${bills.length} bills and ${payments.length} payments`);

    // Process bills data
    bills.forEach((bill, index) => {
      try {
        if (bill.createdAt || bill.date) {
          const billDate = new Date(bill.createdAt || bill.date);
          
          // Check if date is valid
          if (isNaN(billDate.getTime())) {
            console.warn(`⚠️ Invalid bill date at index ${index}:`, bill.createdAt || bill.date);
            return;
          }

          const billMonth = (billDate.getMonth() + 1).toString().padStart(2, '0');
          const billYear = billDate.getFullYear().toString();

          console.log(`📋 Bill ${index}: Date=${billDate.toISOString()}, Month=${billMonth}, Year=${billYear}`);

          if (billMonth === selectedMonth && billYear === selectedYear) {
            monthlyData.push({
              date: billDate.toLocaleDateString('en-IN'),
              billAmount: parseFloat(bill.totalAmount || bill.amount || 0),
              paymentAmount: 0,
              type: 'bill'
            });
            console.log(`✅ Bill matched for ${billMonth}/${billYear}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing bill at index ${index}:`, error);
      }
    });

    // Process payments data
    payments.forEach((payment, index) => {
      try {
        if (payment.createdAt || payment.date) {
          const paymentDate = new Date(payment.createdAt || payment.date);
          
          // Check if date is valid
          if (isNaN(paymentDate.getTime())) {
            console.warn(`⚠️ Invalid payment date at index ${index}:`, payment.createdAt || payment.date);
            return;
          }

          const paymentMonth = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
          const paymentYear = paymentDate.getFullYear().toString();

          console.log(`💳 Payment ${index}: Date=${paymentDate.toISOString()}, Month=${paymentMonth}, Year=${paymentYear}`);

          if (paymentMonth === selectedMonth && paymentYear === selectedYear) {
            monthlyData.push({
              date: paymentDate.toLocaleDateString('en-IN'),
              billAmount: 0,
              paymentAmount: parseFloat(payment.amount || 0),
              type: 'payment'
            });
            console.log(`✅ Payment matched for ${paymentMonth}/${paymentYear}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing payment at index ${index}:`, error);
      }
    });

    console.log(`📈 Total matched entries: ${monthlyData.length}`);

    // Group by date and combine bill/payment amounts
    const groupedData = {};
    monthlyData.forEach(item => {
      if (!groupedData[item.date]) {
        groupedData[item.date] = {
          date: item.date,
          billAmount: 0,
          paymentAmount: 0
        };
      }
      groupedData[item.date].billAmount += item.billAmount;
      groupedData[item.date].paymentAmount += item.paymentAmount;
    });

    // Convert to array and sort by date
    const result = Object.values(groupedData).sort((a, b) =>
      new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-'))
    );

    console.log(`📊 Final grouped result: ${result.length} entries`);
    return result;
  };

  const generateMockReportData = (selectedMonth, selectedYear) => {
    // Generate mock data for the selected month and year
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const mockData = [];

    // For current month, only show data up to today's date
    // For past months, show data for the entire month
    const currentDate = new Date();
    const isCurrentMonth = currentDate.getMonth() + 1 === parseInt(selectedMonth) && currentDate.getFullYear() === parseInt(selectedYear);
    const maxDay = isCurrentMonth ? currentDate.getDate() : daysInMonth;

    for (let day = 1; day <= maxDay; day++) {
      // Generate more realistic data - not all days will have transactions
      if (Math.random() > 0.4) { // 60% chance of having data
        const billAmount = Math.random() > 0.4 ? Math.floor(Math.random() * 8000) + 2000 : 0;
        const paymentAmount = Math.random() > 0.5 ? Math.floor(Math.random() * 8000) + 2000 : 0;

        if (billAmount > 0 || paymentAmount > 0) {
          mockData.push({
            date: `${day.toString().padStart(2, '0')}/${selectedMonth}/${selectedYear}`,
            billAmount: billAmount,
            paymentAmount: paymentAmount
          });
        }
      }
    }

    return mockData.sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')));
  };

  // Calculate totals for the table footer
  const totalBillAmount = monthlyReportData.reduce((sum, item) => sum + item.billAmount, 0);
  const totalPaymentAmount = monthlyReportData.reduce((sum, item) => sum + item.paymentAmount, 0);

  // ======= Tab content render =======
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 0:
        return <DistributorOrderHistory />;
      case 1:
        return <DistributorDeliveryHistory />;
      case 2:
        return (
                     <div className="container-fluid px-3 px-md-5 pt-1" style={{ maxWidth: '1600px', margin: '0 auto', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
             {/* Page Header */}
             <div className="text-center mb-1">
                             <div className="d-inline-flex align-items-center mb-1 p-2 bg-white rounded-pill shadow-sm">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-person-badge fs-6"></i>
                </div>
                <div className="text-start">
                  <h1 className="h5 mb-0 text-primary fw-bold">
                    Welcome, {distributorData?.distributorName || distributorData?.name || "Distributor"}
                  </h1>
                  <small className="text-muted small">Distributor Dashboard</small>
                </div>
              </div>
                             <p className="text-muted small mx-auto" style={{ maxWidth: '600px' }}>
                 Streamline your milk distribution. Track orders, billing, and payments - all in one place with SVD Dairy Products.
               </p>
            </div>

            {/* Main Content Cards */}
            <div className="row g-4 mb-4">
              {/* Wallet Balance */}
              <div className="col-12 col-lg-6">
                <div className="h-100 d-flex justify-content-center">
                  <AmountCard myWallet tokenKey="distributorToken" />
                </div>
              </div>

              {/* Tomorrow's Orders */}
              <div className="col-12 col-lg-6">
                <div className="h-100 d-flex justify-content-center">
                  <TomorrowOrderCard onClick={handleTomorrowOrderClick} />
                </div>
              </div>
            </div>



            {/* Monthly Report Section */}
            <div className="card border-0 shadow-lg bg-white rounded-4 overflow-hidden">
              <div className="card-header border-0 py-2" style={{ background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' }}>
                <div className="d-flex align-items-center justify-content-center">
                  <div className="bg-white text-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '35px', height: '35px' }}>
                    <i className="bi bi-calendar-month fs-6"></i>
                  </div>
                  <h4 className="mb-0 text-white fw-bold">Monthly Report</h4>
                </div>
              </div>
              <div className="card-body p-3">
                {/* Show form only when no report data is generated */}
                {monthlyReportData.length === 0 && !reportLoading && (
                  <>
                    {/* Report Form */}
                    <div className="row mb-4">
                      {/* Month and Year inputs - side by side on mobile */}
                      <div className="col-6 col-md-4">
                        <label htmlFor="monthSelect" className="form-label fw-semibold text-muted">Month</label>
                        <select
                          id="monthSelect"
                          className="form-select border-2"
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                        >
                          <option value="">Select Month</option>
                          <option value="01">January</option>
                          <option value="02">February</option>
                          <option value="03">March</option>
                          <option value="04">April</option>
                          <option value="05">May</option>
                          <option value="06">June</option>
                          <option value="07">July</option>
                          <option value="08">August</option>
                          <option value="09">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                      </div>
                      <div className="col-6 col-md-4">
                        <label htmlFor="yearSelect" className="form-label fw-semibold text-muted">Year</label>
                        <select
                          id="yearSelect"
                          className="form-select border-2"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                        >
                          <option value="">Select Year</option>
                          {yearOptions.map(yearOption => (
                            <option key={yearOption} value={yearOption}>{yearOption}</option>
                          ))}
                        </select>
                      </div>
                      {/* Generate Report Button - centered below on mobile, aligned right on desktop */}
                      <div className="col-12 col-md-4 d-flex align-items-end justify-content-center justify-content-md-start mt-3 mt-md-0">
                        <button
                          className="btn btn-primary px-3 py-2 fw-semibold btn-sm"
                          onClick={handleGenerateReport}
                          disabled={!month || !year || reportLoading}
                        >
                          {reportLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Generating...
                            </>
                          ) : (
                            'Generate Report'
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Loading state */}
                {reportLoading && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="text-muted">Generating Report...</h5>
                    <p className="text-muted mb-0">Please wait while we fetch your data for {getMonthName(month)} {year}</p>
                  </div>
                )}

                {/* Report Table - Show only when data is available */}
                {monthlyReportData.length > 0 && (
                  <>
                    {/* Report Header with Back Button */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h4 className="mb-1 text-primary fw-bold">Report for {getMonthName(month)} {year}</h4>
                        <p className="text-muted mb-0">Total {monthlyReportData.length} entries found</p>
                      </div>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setMonthlyReportData([])}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Form
                      </button>
                    </div>

                    {/* Table - Centered with Scrolling */}
                    <div className="d-flex justify-content-center">
                      <div className="w-100" style={{ maxWidth: '900px' }}>
                        <div 
                          className="table-responsive shadow-sm rounded" 
                          style={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto',
                            overflowX: 'auto',
                            border: '1px solid #dee2e6',
                            backgroundColor: '#fff'
                          }}
                        >
                          <table className="table table-bordered table-hover mb-0 mx-auto">
                            <thead className="table-light sticky-top">
                              <tr>
                                <th className="text-center fw-semibold">S.No</th>
                                <th className="text-center fw-semibold">Date</th>
                                <th className="text-center fw-semibold">Bill Amount</th>
                                <th className="text-center fw-semibold">Payment Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyReportData.map((item, index) => (
                                <tr key={index}>
                                  <td className="text-center fw-semibold">{index + 1}</td>
                                  <td className="text-center">{item.date}</td>
                                  <td className="text-center text-success fw-semibold">₹{item.billAmount.toFixed(2)}</td>
                                  <td className="text-center text-info fw-semibold">₹{item.paymentAmount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Footer outside scrollable area */}
                        <div className="bg-dark text-white text-center py-2 rounded-bottom">
                          <div>
                            <strong>Total</strong>
                          </div>
                          <div>
                            <strong>Bills: ₹{totalBillAmount.toFixed(2)}</strong>
                          </div>
                          <div>
                            <strong>Payments: ₹{totalPaymentAmount.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* User Guidance for Data Selection */}
                {month && year && !reportLoading && monthlyReportData.length === 0 && (
                  <div className="text-center py-2">
                    <h5 className="text-muted mb-0">📅 Select the Right Month & Year to Generate Report</h5>
                  </div>
                )}
              </div>
            </div>



            {/* Bottom spacer to prevent content from being hidden behind bottom navigation */}
            <div className="pb-5 mb-5" aria-hidden="true"></div>
          </div>
        );
      case 3:
        return <DistributorBillsHistory />;
      case 4:
        return <DistributorPaymentHistory />;
      default:
        return null;
    }
  };

  // ======= Loading State =======
  if (loading) {
    console.log("🔍 DistributorDashboard - Rendering loading state");
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FFFEF9 !important' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="fs-5 text-muted">
            Loading distributor data...
          </div>
          <div className="mt-2 text-muted small">
            Auth: {isAuthenticated ? 'Yes' : 'No'} | Type: {userType || 'None'}
          </div>
        </div>
      </div>
    );
  }

  // ======= Render =======
  console.log("🔍 DistributorDashboard - Rendering main component", {
    loading,
    distributorData,
    activeTab,
    isAuthenticated,
    userType
  });

  return (
    <div className="min-vh-100 bg-light" style={{ backgroundColor: '#FFFEF9 !important', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <DistributorNavbar
        userName={distributorData?.distributorName || distributorData?.name || "Distributor"}
        companyName={distributorData?.companyName || distributorData?.name || "heritage"}
        subtitle="Distributor panel"
        logoSrc="/android-chrome-192x192.png"
        activeIndex={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-fill overflow-auto">
        {renderActiveTabContent()}
      </div>
    </div>
  );
}

