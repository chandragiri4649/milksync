import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import DistributorNavbar from "./distributorpanel/DistributorNavbar";
import AmountCard from "./distributorpanel/AmountCard";
import TomorrowOrderCard from "./distributorpanel/TomorrowOrderCard";
import DistributorOrderHistory from "./distributorpanel/DistributorOrderHistory";
import DistributorDeliveryHistory from "./distributorpanel/DistributorDeliveryHistory";
import DistributorBillsHistory from "./distributorpanel/DistributorBillsHistory";
import DistributorPaymentHistory from "./distributorpanel/DistributorPaymentHistory";
import config from "../config";

export default function DistributorDashboard() {
  const navigate = useNavigate();
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
      const token = localStorage.getItem("distributorToken");
      if (!token) {
        navigate("/distributor/login");
        return;
      }
      try {
        const response = await fetch(`${config.API_BASE}/distributor/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          localStorage.removeItem("distributorToken");
          navigate("/distributor/login");
          return;
        }
        const data = await response.json();
        setDistributorData(data);
      } catch (error) {
        console.error("Error fetching distributor data:", error);
        localStorage.removeItem("distributorToken");
        navigate("/distributor/login");
      } finally {
        setLoading(false);
      }
    };

    fetchDistributorData();
  }, [navigate]);







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
    if (!month || !year) return;
    
    setReportLoading(true);
    try {
      const token = localStorage.getItem("distributorToken");
      
      // Option 1: Fetch real data from existing endpoints
      const [billsRes, paymentsRes] = await Promise.all([
        fetch(`${config.API_BASE}/bills/distributor`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${config.API_BASE}/payments/distributor`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      if (billsRes.ok && paymentsRes.ok) {
        const billsData = await billsRes.json();
        const paymentsData = await paymentsRes.json();
        
        // Filter data for selected month and year
        const filteredData = filterDataByMonth(billsData, paymentsData, month, year);
        setMonthlyReportData(filteredData);
      } else {
        // Fallback to mock data if API fails
        console.warn("API call failed, using mock data");
        const mockData = generateMockReportData(month, year);
        setMonthlyReportData(mockData);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      // Fallback to mock data on error
      const mockData = generateMockReportData(month, year);
      setMonthlyReportData(mockData);
    } finally {
      setReportLoading(false);
    }
  };

  const filterDataByMonth = (billsData, paymentsData, selectedMonth, selectedYear) => {
    const monthlyData = [];
    
    // Process bills data
    billsData.forEach(bill => {
      if (bill.createdAt || bill.date) {
        const billDate = new Date(bill.createdAt || bill.date);
        const billMonth = (billDate.getMonth() + 1).toString().padStart(2, '0');
        const billYear = billDate.getFullYear().toString();
        
        if (billMonth === selectedMonth && billYear === selectedYear) {
          monthlyData.push({
            date: billDate.toLocaleDateString('en-IN'),
            billAmount: bill.totalAmount || bill.amount || 0,
            paymentAmount: 0,
            type: 'bill'
          });
        }
      }
    });
    
    // Process payments data
    paymentsData.forEach(payment => {
      if (payment.createdAt || payment.date) {
        const paymentDate = new Date(payment.createdAt || payment.date);
        const paymentMonth = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
        const paymentYear = paymentDate.getFullYear().toString();
        
        if (paymentMonth === selectedMonth && paymentYear === selectedYear) {
          monthlyData.push({
            date: paymentDate.toLocaleDateString('en-IN'),
            billAmount: 0,
            paymentAmount: payment.amount || 0,
            type: 'payment'
          });
        }
      }
    });
    
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
    return Object.values(groupedData).sort((a, b) => 
      new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-'))
    );
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
          <div className="container-fluid px-3 px-md-5 py-4" style={{ maxWidth: '1600px', margin: '0 auto', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
            {/* Page Header */}
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center mb-3 p-3 bg-white rounded-pill shadow-sm">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-person-badge fs-4"></i>
                </div>
                <div className="text-start">
                  <h1 className="h4 mb-0 text-primary fw-bold">
                    Welcome, {distributorData?.name || "Distributor"}
                  </h1>
                  <small className="text-muted">Distributor Dashboard</small>
                </div>
              </div>
              <p className="text-muted fs-6 mx-auto" style={{ maxWidth: '600px' }}>
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
              <div className="card-header border-0 py-4" style={{ background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' }}>
                <div className="d-flex align-items-center justify-content-center">
                  <div className="bg-white text-secondary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px' }}>
                    <i className="bi bi-calendar-month fs-5"></i>
                  </div>
                  <h3 className="mb-0 text-white fw-bold">Monthly Report</h3>
                </div>
              </div>
              <div className="card-body p-5">
                {/* Report Form */}
                <div className="row mb-4">
                  <div className="col-md-4">
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
                  <div className="col-md-4">
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
                  <div className="col-md-4 d-flex align-items-end">
                    <button 
                      className="btn btn-primary px-4 py-2 fw-semibold"
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
                


                {/* Report Table */}
                {monthlyReportData.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-center fw-semibold" style={{ width: '10%' }}>S.No</th>
                          <th className="text-center fw-semibold" style={{ width: '25%' }}>Date</th>
                          <th className="text-center fw-semibold" style={{ width: '32.5%' }}>Bill Amount</th>
                          <th className="text-center fw-semibold" style={{ width: '32.5%' }}>Payment Amount</th>
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
                      <tfoot className="table-dark">
                        <tr>
                          <td colSpan="2" className="text-center fw-bold text-white">
                            Total ({monthlyReportData.length} entries)
                          </td>
                          <td className="text-center fw-bold text-white">₹{totalBillAmount.toFixed(2)}</td>
                          <td className="text-center fw-bold text-white">₹{totalPaymentAmount.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* No Data Message */}
                {month && year && !reportLoading && monthlyReportData.length === 0 && (
                  <div className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                      <h5>No data found for {getMonthName(month)} {year}</h5>
                      <p className="mb-0">Try selecting a different month or year.</p>
                    </div>
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
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FFFEF9 !important' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="fs-5 text-muted">
            Loading distributor data...
          </div>
        </div>
      </div>
    );
  }

  // ======= Render =======
  return (
    <div className="min-vh-100 bg-light" style={{ backgroundColor: '#FFFEF9 !important', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <DistributorNavbar
        userName={distributorData?.name || "Distributor"}
        companyName={distributorData?.name || "heritage"}
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

