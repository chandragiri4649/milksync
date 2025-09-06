import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiService from "../utils/apiService";
import StaffNavbar from "./staffpanel/StaffNavbar";

export default function StaffDashboard() {
  const { token, user } = useAuth();
  const [todayOrders, setTodayOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalAmount: 0,
    thisWeekOrders: 0,
    thisMonthOrders: 0,
    lastMonthOrders: 0,
    monthlyGrowth: 0
  });
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
     const [notifications, setNotifications] = useState([]);
   const [weather, setWeather] = useState(null);
   const [currentTime, setCurrentTime] = useState(new Date());
   const [weatherLoading, setWeatherLoading] = useState(true);

   // Get current month's date range
   const getCurrentMonthRange = () => {
     const now = new Date();
     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
     const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
     return { startOfMonth, endOfMonth };
   };

   // Get last month's date range
   const getLastMonthRange = () => {
     const now = new Date();
     const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
     return { startOfLastMonth, endOfLastMonth };
   };

   // Get today's date in YYYY-MM-DD format
   const getTodayDate = () => {
     const today = new Date();
     return today.toISOString().split('T')[0];
   };

   // Fetch real weather data
   const fetchWeatherData = async () => {
     try {
       setWeatherLoading(true);
               // Using OpenWeatherMap API - you'll need to get a free API key from https://openweathermap.org/api
        const API_KEY = 'd6e1157aebc89ec25bf1a5f911f1343e'; // Replace with your actual API key
       const city = 'Mumbai'; // Default city - you can make this dynamic based on user location
       
       const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
       const data = await response.json();
       
       if (response.ok) {
         setWeather({
           temperature: Math.round(data.main.temp),
           condition: data.weather[0].main,
           description: data.weather[0].description,
           icon: data.weather[0].icon,
           humidity: data.main.humidity,
           windSpeed: data.wind.speed
         });
       } else {
         console.error('Weather API error:', data.message);
         setWeather({
           temperature: 'N/A',
           condition: 'Unknown',
           description: 'Weather data unavailable',
           icon: '01d',
           humidity: 'N/A',
           windSpeed: 'N/A'
         });
       }
     } catch (error) {
       console.error('Error fetching weather:', error);
       setWeather({
         temperature: 'N/A',
         condition: 'Unknown',
         description: 'Weather data unavailable',
         icon: '01d',
         humidity: 'N/A',
         windSpeed: 'N/A'
       });
     } finally {
       setWeatherLoading(false);
     }
   };

   // Get weather icon based on condition
   const getWeatherIcon = (condition) => {
     const iconMap = {
       'Clear': 'bi-sun',
       'Clouds': 'bi-cloud',
       'Rain': 'bi-cloud-rain',
       'Drizzle': 'bi-cloud-drizzle',
       'Thunderstorm': 'bi-cloud-lightning',
       'Snow': 'bi-snow',
       'Mist': 'bi-cloud-fog',
       'Smoke': 'bi-cloud-fog',
       'Haze': 'bi-cloud-fog',
       'Dust': 'bi-cloud-fog',
       'Fog': 'bi-cloud-fog',
       'Sand': 'bi-cloud-fog',
       'Ash': 'bi-cloud-fog',
       'Squall': 'bi-wind',
       'Tornado': 'bi-tornado'
     };
     return iconMap[condition] || 'bi-sun';
   };

   // Update current time every second
   useEffect(() => {
     const timer = setInterval(() => {
       setCurrentTime(new Date());
     }, 1000);
     return () => clearInterval(timer);
   }, []);

   // Fetch weather data on component mount
   useEffect(() => {
     fetchWeatherData();
   }, []);

  // Fetch monthly activities and stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setActivityLoading(true);
        setActivityError("");
        const today = getTodayDate();
        const { startOfMonth, endOfMonth } = getCurrentMonthRange();
        const { startOfLastMonth, endOfLastMonth } = getLastMonthRange();

        // Fetch all orders placed by this staff
        const allOrders = await apiService.get('/orders/my-orders');
        
        // Filter orders for current month
        const currentMonthOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startOfMonth && orderDate <= endOfMonth;
        });

        // Filter orders created today
        const todaysOrders = currentMonthOrders.filter(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          return orderDate === today;
        });
        setTodayOrders(todaysOrders);

        // Filter orders for last month
        const lastMonthOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startOfLastMonth && orderDate <= endOfLastMonth;
        });

        // Calculate monthly stats
        const totalOrders = currentMonthOrders.length;
        const pendingOrders = currentMonthOrders.filter(order => order.status === 'pending').length;
        const deliveredOrders = currentMonthOrders.filter(order => order.status === 'delivered').length;
        const totalAmount = currentMonthOrders.reduce((sum, order) => {
          return sum + (order.items?.reduce((itemSum, item) => 
            itemSum + (item.costPerPacket || 0) * (item.quantity || 0), 0) || 0);
        }, 0);

        // Calculate weekly stats (within current month)
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const thisWeekOrders = currentMonthOrders.filter(order => new Date(order.createdAt) >= weekStart).length;

        // Calculate monthly growth
        const monthlyGrowth = lastMonthOrders.length > 0 
          ? Math.round(((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100)
          : currentMonthOrders.length > 0 ? 100 : 0;

        setStats({
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalAmount,
          thisWeekOrders,
          thisMonthOrders: totalOrders,
          lastMonthOrders: lastMonthOrders.length,
          monthlyGrowth
        });

        // Mock notifications based on monthly data
        setNotifications([
          {
            id: 1,
            type: 'success',
            message: `This month: ${deliveredOrders} orders delivered successfully`,
            time: 'Updated now',
            icon: 'bi-check-circle'
          },
          {
            id: 2,
            type: monthlyGrowth >= 0 ? 'success' : 'warning',
            message: `Monthly growth: ${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth}% compared to last month`,
            time: 'Updated now',
            icon: monthlyGrowth >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'
          },
          {
            id: 3,
            type: 'info',
            message: `Total orders this month: ${totalOrders}`,
            time: 'Updated now',
            icon: 'bi-calendar-month'
          }
                 ]);

               } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setActivityError("Failed to load dashboard data");
        } finally {
         setActivityLoading(false);
       }
     };

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getProgressPercentage = (current, total) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <StaffNavbar />

             <div className="container-fluid px-3 px-md-5" style={{ maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f8f9fa', paddingTop: '100px', paddingBottom: '80px' }}>
        
                 {/* Welcome Header with profile picture */}
         <div className="row mb-5">
           <div className="col-12">
             <div className="card border-0 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)' }}>
               <div className="card-body p-4 p-md-5">
                 <div className="row align-items-center">
                   <div className="col-md-8">
                     <h1 className="display-5 fw-bold mb-2">
                       {getGreeting()}, {user?.username || 'Staff Member'}! 👋
                     </h1>
                     <p className="lead mb-0 opacity-75">
                       Welcome to your MilkSync Staff Dashboard. Monthly overview for.
                     </p>
                     
                   </div>
                   <div className="col-md-4 text-center">
                     <div className="bg-white bg-opacity-20 rounded-circle d-inline-flex align-items-center justify-content-center p-2">
                       {user?.imageUrl ? (
                         <img 
                           src={user.imageUrl} 
                           alt={user.name || user.username}
                           className="rounded-circle"
                           style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                         />
                       ) : (
                         <i className="bi bi-person-badge text-white" style={{ fontSize: '3rem' }}></i>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

         {/* Date, Time & Weather Info */}
         <div className="row mb-5">
           <div className="col-12">
             <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
               <div className="card-body p-4">
                 {/* Top Section - Today's Date and Time */}
                 <div className="row mb-4">
                   <div className="col-12 text-center">
                     <div className="d-flex align-items-center justify-content-center mb-3">
                       <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                         <i className="bi bi-clock text-warning" style={{ fontSize: '2rem' }}></i>
                       </div>
                       <div>
                         <h3 className="fw-bold text-warning mb-1">Today's Date & Time</h3>
                         <p className="mb-0 text-muted" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                           {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                         </p>
                       </div>
                     </div>
                     <div className="bg-light rounded p-3">
                       <h2 className="fw-bold text-primary mb-0" style={{ fontSize: '2.5rem' }}>
                         {currentTime.toLocaleTimeString('en-US', { 
                           hour12: true, 
                           hour: '2-digit', 
                           minute: '2-digit', 
                           second: '2-digit' 
                         })}
                       </h2>
                     </div>
                   </div>
                 </div>

                 {/* Bottom Section - Additional Details */}
                 <div className="row g-4 align-items-center">
                   {/* Current Month */}
                   <div className="col-lg-3 col-md-6 col-sm-6">
                     <div className="d-flex align-items-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                       <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                         <i className="bi bi-calendar-month text-primary" style={{ fontSize: '1.2rem' }}></i>
                       </div>
                       <div>
                         <h6 className="fw-bold text-primary mb-0">This Month</h6>
                         <p className="mb-0 text-muted small">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                       </div>
                     </div>
                   </div>

                   {/* Current Week */}
                   <div className="col-lg-3 col-md-6 col-sm-6">
                     <div className="d-flex align-items-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
                       <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                         <i className="bi bi-calendar-week text-success" style={{ fontSize: '1.2rem' }}></i>
                       </div>
                       <div>
                         <h6 className="fw-bold text-success mb-0">Current Week</h6>
                         <p className="mb-0 text-muted small">Week {Math.ceil(new Date().getDate() / 7)} of {new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
                       </div>
                     </div>
                   </div>

                   {/* Weather */}
                   <div className="col-lg-3 col-md-6 col-sm-6">
                     <div className="d-flex align-items-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e1f5fe 0%, #81d4fa 100%)' }}>
                       <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                         <i className={`bi ${weather ? getWeatherIcon(weather.condition) : 'bi-sun'} text-info`} style={{ fontSize: '1.2rem' }}></i>
                       </div>
                       <div>
                         <h6 className="fw-bold text-info mb-0">Weather</h6>
                         {weatherLoading ? (
                           <div className="d-flex align-items-center">
                             <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                               <span className="visually-hidden">Loading...</span>
                             </div>
                             <span className="text-muted small">Loading...</span>
                           </div>
                         ) : weather ? (
                           <div className="d-flex align-items-center">
                             <span className="fw-bold text-info me-2">{weather.temperature}°C</span>
                             <span className="text-muted small">{weather.description}</span>
                           </div>
                         ) : (
                           <div className="d-flex align-items-center">
                             <span className="text-muted small">Weather unavailable</span>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Day Progress */}
                   <div className="col-lg-3 col-md-6 col-sm-6">
                     <div className="d-flex align-items-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                       <div className="bg-purple bg-opacity-10 rounded-circle p-2 me-3">
                         <i className="bi bi-graph-up text-purple" style={{ fontSize: '1.2rem' }}></i>
                       </div>
                       <div>
                         <h6 className="fw-bold text-purple mb-0">Day Progress</h6>
                         <p className="mb-0 text-muted small">
                           {Math.round((currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60) * 100)}% Complete
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

                          {/* Statistics Cards */}
         <div className="row mb-4">
           <div className="col-12">
             <div className="d-flex align-items-center mb-3">
               <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                 <i className="bi bi-graph-up text-primary"></i>
               </div>
               <h4 className="mb-0 fw-bold">Monthly Progressive Overview</h4>
             </div>
           </div>
         </div>
         <div className="row g-4 mb-5">
           <div className="col-12">
             <div className="card border-0 shadow-sm">
               <div className="card-body p-4">
                 <div className="row g-4 align-items-center">
                   {/* This Month */}
                   <div className="col-lg-2 col-md-4 col-sm-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                       <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                         <i className="bi bi-cart-check text-primary" style={{ fontSize: '2rem' }}></i>
                       </div>
                       <h3 className="fw-bold mb-1 text-primary">{stats.totalOrders}</h3>
                       <p className="text-muted mb-0 small">Total Orders</p>
                       <div className="mt-2">
                         <small className="text-primary fw-bold">This Month</small>
                       </div>
                     </div>
                   </div>

                   {/* Pending */}
                   <div className="col-lg-2 col-md-4 col-sm-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
                       <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                         <i className="bi bi-clock text-warning" style={{ fontSize: '2rem' }}></i>
                       </div>
                       <h3 className="fw-bold mb-1 text-warning">{stats.pendingOrders}</h3>
                       <p className="text-muted mb-0 small">Pending Orders</p>
                       <div className="mt-2">
                         <small className="text-warning fw-bold">Awaiting</small>
                       </div>
                     </div>
                   </div>

                   {/* Delivered */}
                   <div className="col-lg-2 col-md-4 col-sm-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
                       <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                         <i className="bi bi-check-circle text-success" style={{ fontSize: '2rem' }}></i>
                       </div>
                       <h3 className="fw-bold mb-1 text-success">{stats.deliveredOrders}</h3>
                       <p className="text-muted mb-0 small">Delivered Orders</p>
                       <div className="mt-2">
                         <small className="text-success fw-bold">Completed</small>
                       </div>
                     </div>
                   </div>

                   {/* This Week */}
                   <div className="col-lg-2 col-md-4 col-sm-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                       <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                         <i className="bi bi-calendar-week text-secondary" style={{ fontSize: '2rem' }}></i>
                       </div>
                       <h3 className="fw-bold mb-1 text-secondary">{stats.thisWeekOrders}</h3>
                       <p className="text-muted mb-0 small">This Week</p>
                       <div className="mt-2">
                         <small className="text-secondary fw-bold">Current</small>
                       </div>
                     </div>
                   </div>

                   {/* Growth */}
                   <div className="col-lg-2 col-md-4 col-sm-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
                       <div className={`${stats.monthlyGrowth >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3`}>
                         <i className={`bi ${stats.monthlyGrowth >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} ${stats.monthlyGrowth >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '2rem' }}></i>
                       </div>
                       <h3 className={`fw-bold mb-1 ${stats.monthlyGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                         {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%
                       </h3>
                       <p className="text-muted mb-0 small">Growth Rate</p>
                       <div className="mt-2">
                         <small className={`${stats.monthlyGrowth >= 0 ? 'text-success' : 'text-danger'} fw-bold`}>
                           {stats.monthlyGrowth >= 0 ? 'Positive' : 'Negative'}
                         </small>
                       </div>
                     </div>
                   </div>

                   {/* Progress Bar */}
                   <div className="col-lg-2 col-md-4 col-sm-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e1f5fe 0%, #81d4fa 100%)' }}>
                       <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                         <i className="bi bi-graph-up text-info" style={{ fontSize: '2rem' }}></i>
                       </div>
                       <h3 className="fw-bold mb-1 text-info">{getProgressPercentage(stats.deliveredOrders, stats.totalOrders)}%</h3>
                       <p className="text-muted mb-0 small">Success Rate</p>
                       <div className="mt-2">
                         <div className="progress" style={{ height: '6px' }}>
                           <div className="progress-bar bg-info" style={{ width: `${getProgressPercentage(stats.deliveredOrders, stats.totalOrders)}%` }}></div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        {/* Progress Overview */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                    <i className="bi bi-graph-up text-primary"></i>
                  </div>
                  <h4 className="mb-0 fw-bold">Monthly Progress Overview</h4>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="text-center">
                      <h5 className="text-primary mb-3">Monthly Delivery Rate</h5>
                      <div className="position-relative d-inline-block">
                        <div className="progress-circle" style={{ width: '120px', height: '120px' }}>
                          <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e9ecef" strokeWidth="8"/>
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#0d6efd" strokeWidth="8" 
                              strokeDasharray={`${getProgressPercentage(stats.deliveredOrders, stats.totalOrders) * 3.14} 314`}
                              strokeDashoffset="0" transform="rotate(-90 60 60)"/>
                          </svg>
                          <div className="position-absolute top-50 start-50 translate-middle">
                            <h3 className="mb-0">{getProgressPercentage(stats.deliveredOrders, stats.totalOrders)}%</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Pending Orders</span>
                          <span className="fw-bold">{stats.pendingOrders}</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-warning" style={{ width: `${getProgressPercentage(stats.pendingOrders, stats.totalOrders)}%` }}></div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Delivered Orders</span>
                          <span className="fw-bold">{stats.deliveredOrders}</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-success" style={{ width: `${getProgressPercentage(stats.deliveredOrders, stats.totalOrders)}%` }}></div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">This Week</span>
                          <span className="fw-bold">{stats.thisWeekOrders}</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-info" style={{ width: `${getProgressPercentage(stats.thisWeekOrders, stats.totalOrders)}%` }}></div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Monthly Growth</span>
                          <span className="fw-bold">{stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className={`progress-bar ${stats.monthlyGrowth >= 0 ? 'bg-success' : 'bg-danger'}`} style={{ width: `${Math.abs(stats.monthlyGrowth)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="row g-4 mb-5">
          {/* Place Orders Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ transition: 'transform 0.2s ease-in-out' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className="card-body p-4 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                  <i className="bi bi-cart-plus text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Place Orders</h5>
                <p className="text-muted mb-3">Create new orders for distributors with our easy-to-use interface</p>
                <NavLink to="/staff/orders" className="btn btn-primary w-100">
                  <i className="bi bi-plus-circle me-2"></i>
                  Start Ordering
                </NavLink>
              </div>
            </div>
          </div>

          {/* My Orders Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ transition: 'transform 0.2s ease-in-out' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className="card-body p-4 text-center">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                  <i className="bi bi-clipboard-data text-success" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">My Orders</h5>
                <p className="text-muted mb-3">View, track, and manage your complete order history</p>
                <NavLink to="/staff/my-orders" className="btn btn-success w-100">
                  <i className="bi bi-eye me-2"></i>
                  View Orders
                </NavLink>
              </div>
            </div>
          </div>

          {/* Distributor Profiles Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ transition: 'transform 0.2s ease-in-out' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className="card-body p-4 text-center">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                  <i className="bi bi-people-fill text-info" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Distributors</h5>
                <p className="text-muted mb-3">Access distributor profiles and contact information</p>
                <NavLink to="/staff/distributors" className="btn btn-info w-100">
                  <i className="bi bi-person-lines-fill me-2"></i>
                  View Profiles
                </NavLink>
              </div>
            </div>
          </div>

          {/* Reports Card */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ transition: 'transform 0.2s ease-in-out' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className="card-body p-4 text-center">
                <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                  <i className="bi bi-graph-up text-warning" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Reports</h5>
                <p className="text-muted mb-3">Generate reports and analyze your performance</p>
                <NavLink to="/staff/reports" className="btn btn-warning w-100">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  View Reports
                </NavLink>
              </div>
            </div>
          </div>
        </div>

                 {/* Main Content Row */}
         <div className="row g-4">
           {/* Today's Activity Section - Full Width at Top */}
           <div className="col-12">
             <div className="card border-0 shadow-sm">
               <div className="card-header bg-white border-0 py-3">
                 <div className="d-flex align-items-center justify-content-between">
                   <div className="d-flex align-items-center">
                     <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                       <i className="bi bi-clock-history text-primary"></i>
                     </div>
                     <h4 className="mb-0 fw-bold">Today's Activity ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</h4>
                   </div>
                   <span className="badge bg-primary rounded-pill">
                     {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''}
                   </span>
                 </div>
               </div>
               <div className="card-body p-4">
                 {activityLoading ? (
                   <div className="text-center py-5">
                     <div className="spinner-border text-primary" role="status">
                       <span className="visually-hidden">Loading...</span>
                     </div>
                     <p className="mt-3 text-muted">Loading today's activities...</p>
                   </div>
                 ) : activityError ? (
                   <div className="text-center py-5">
                     <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                       <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '2rem' }}></i>
                     </div>
                     <h5 className="text-danger mb-2">Oops! Something went wrong</h5>
                     <p className="text-muted">{activityError}</p>
                     <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
                       <i className="bi bi-arrow-clockwise me-2"></i>
                       Try Again
                     </button>
                   </div>
                 ) : todayOrders.length === 0 ? (
                   <div className="text-center py-5">
                     <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-4">
                       <i className="bi bi-calendar-check text-muted" style={{ fontSize: '3rem' }}></i>
                     </div>
                     <h5 className="text-muted mb-2">No orders placed today</h5>
                     <p className="text-muted mb-4">Your daily order activities will appear here once you start placing orders for distributors.</p>
                     <NavLink to="/staff/orders" className="btn btn-primary">
                       <i className="bi bi-cart-plus me-2"></i>
                       Place Your First Order
                     </NavLink>
                   </div>
                 ) : (
                   <div className="row g-4">
                     {todayOrders.map((order, index) => (
                       <div key={order._id || index} className="col-lg-4 col-md-6 col-sm-12">
                         <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
                           <div className="card-body p-4">
                             <div className="d-flex align-items-center mb-3">
                               <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                 <i className="bi bi-building text-primary"></i>
                               </div>
                               <div>
                                 <h6 className="mb-1 fw-bold">
                                   {order.distributorId?.companyName || order.distributorId?.distributorName || 'Unknown Company'}
                                 </h6>
                                 <p className="text-muted mb-0 small">
                                   Order ID: {order._id?.slice(-8) || 'N/A'}
                                 </p>
                               </div>
                             </div>
                             <div className="mb-3">
                               <div className="d-flex justify-content-between align-items-center mb-2">
                                 <span className="text-muted small">Items:</span>
                                 <span className="fw-bold">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                               </div>
                               <div className="d-flex justify-content-between align-items-center">
                                 <span className="text-muted small">Time:</span>
                                 <span className="fw-bold small">{new Date(order.createdAt).toLocaleTimeString()}</span>
                               </div>
                             </div>
                             <div className="text-center">
                               <span className={`badge ${order.status === 'delivered' ? 'bg-success' : order.status === 'confirmed' ? 'bg-warning' : 'bg-info'} mb-2`}>
                                 <i className={`bi ${order.status === 'delivered' ? 'bi-check-circle' : order.status === 'confirmed' ? 'bi-clock' : 'bi-hourglass'} me-1`}></i>
                                 {order.status === 'delivered' ? 'Delivered' : order.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           </div>

           {/* System Notifications and System Status - Side by Side */}
           <div className="col-lg-6">
             <div className="card border-0 shadow-sm h-100">
               <div className="card-header bg-white border-0 py-3">
                 <div className="d-flex align-items-center justify-content-between">
                   <div className="d-flex align-items-center">
                     <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                       <i className="bi bi-bell text-warning"></i>
                     </div>
                     <h5 className="mb-0 fw-bold">System Notifications</h5>
                   </div>
                   <span className="badge bg-warning rounded-pill">{notifications.length}</span>
                 </div>
               </div>
               <div className="card-body p-0">
                 <div className="list-group list-group-flush">
                   {notifications.map((notification) => (
                     <div key={notification.id} className="list-group-item border-0 py-3">
                       <div className="d-flex align-items-start">
                         <div className={`bg-${notification.type} bg-opacity-10 rounded-circle p-2 me-3`}>
                           <i className={`bi ${notification.icon} text-${notification.type}`}></i>
                         </div>
                         <div className="flex-grow-1">
                           <p className="mb-1 small">{notification.message}</p>
                           <small className="text-muted">{notification.time}</small>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </div>

           <div className="col-lg-6">
             <div className="card border-0 shadow-sm h-100">
               <div className="card-header bg-white border-0 py-3">
                 <div className="d-flex align-items-center">
                   <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                     <i className="bi bi-activity text-info"></i>
                   </div>
                   <h5 className="mb-0 fw-bold">System Status</h5>
                 </div>
               </div>
               <div className="card-body p-3">
                 <div className="row g-3">
                   <div className="col-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
                       <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-2">
                         <i className="bi bi-server text-success"></i>
                       </div>
                       <h6 className="fw-bold text-success mb-1">Server</h6>
                       <span className="badge bg-success">Online</span>
                     </div>
                   </div>
                   <div className="col-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                       <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-2">
                         <i className="bi bi-database text-primary"></i>
                       </div>
                       <h6 className="fw-bold text-primary mb-1">Database</h6>
                       <span className="badge bg-success">Connected</span>
                     </div>
                   </div>
                   <div className="col-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
                       <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-2">
                         <i className="bi bi-clock text-warning"></i>
                       </div>
                       <h6 className="fw-bold text-warning mb-1">Last Sync</h6>
                       <small className="text-muted">2 min ago</small>
                     </div>
                   </div>
                   <div className="col-6">
                     <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                       <div className="bg-purple bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 p-2">
                         <i className="bi bi-graph-up text-purple"></i>
                       </div>
                       <h6 className="fw-bold text-purple mb-1">Uptime</h6>
                       <small className="text-muted">99.9%</small>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        {/* Help Section */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
              <div className="card-body p-4 text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 p-3">
                  <i className="bi bi-question-circle text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Need Help?</h5>
                <p className="text-muted mb-3">Our support team is here to help you with any questions or issues.</p>
                                 <div className="d-flex justify-content-center gap-2">
                   <button className="btn btn-outline-primary">
                     <i className="bi bi-chat-dots me-2"></i>
                     Live Chat
                   </button>
                   <button className="btn btn-outline-secondary">
                     <i className="bi bi-envelope me-2"></i>
                     Email Support
                   </button>
                   <button className="btn btn-outline-info">
                     <i className="bi bi-book me-2"></i>
                     Documentation
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
