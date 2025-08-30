import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SmartLandingPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [userPreference, setUserPreference] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkUserStatus = () => {
      // Check for existing tokens
      const adminToken = localStorage.getItem('adminToken');
      const staffToken = localStorage.getItem('staffToken');
      const distributorToken = localStorage.getItem('distributorToken');
      
      // Check for user preference
      const savedPreference = localStorage.getItem('milksync_user_preference');
      
      if (adminToken) {
        navigate('/admin/dashboard');
      } else if (staffToken) {
        navigate('/staff/dashboard');
      } else if (distributorToken) {
        navigate('/distributor/dashboard');
      } else if (savedPreference) {
        // User has a preference but no active session
        setUserPreference(savedPreference);
        setIsChecking(false);
      } else {
        // No preference or session, show all options
        setIsChecking(false);
      }
    };

    const timer = setTimeout(checkUserStatus, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    checkInstallation();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    }
  };

  const handleRoleSelection = (role) => {
    // Save user preference for future visits
    localStorage.setItem('milksync_user_preference', role);
    setUserPreference(role);
    
    // Navigate to appropriate login
    switch (role) {
      case 'admin':
        navigate('/admin/login');
        break;
      case 'staff':
        navigate('/staff/login');
        break;
      case 'distributor':
        navigate('/distributor/login');
        break;
      default:
        break;
    }
  };

  const handleQuickAccess = () => {
    if (userPreference) {
      handleRoleSelection(userPreference);
    }
  };

  if (isChecking) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top py-2">
        <div className="container">
                     <div className="navbar-brand d-flex align-items-center">
             <img 
               src="/Milksync_logo.png" 
               alt="MilkSync Logo" 
              width="75"
              height="75"
              style={{ objectFit: 'contain', marginTop: '-10px', marginBottom: '-10px' }}
            />
           </div>
          
          <div className="navbar-nav ms-auto">
            {!isInstalled && deferredPrompt && (
            <div className="nav-item">
                <button
                  className="btn btn-primary btn-sm ms-2"
                  onClick={handleInstallApp}
                >
                <i className="bi bi-phone me-1"></i>
                Install App
              </button>
            </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Carousel */}
      <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
        </div>
        
        <div className="carousel-inner">
          <div className="carousel-item active">
            <div className="bg-primary bg-gradient d-flex align-items-center justify-content-center" style={{ height: '260px' }}>
              <div className="text-center text-white">
                <h1 className="display-4 fw-bold mb-3">Seamless Dairy Distribution</h1>
                <p className="lead mb-0">Streamline your dairy business operations with our comprehensive management system</p>
              </div>
            </div>
          </div>
          
          <div className="carousel-item">
            <div className="bg-success bg-gradient d-flex align-items-center justify-content-center" style={{ height: '260px' }}>
              <div className="text-center text-white">
                <h1 className="display-4 fw-bold mb-3">Manage Orders Easily</h1>
                <p className="lead mb-0">Efficient order processing and real-time tracking for better customer satisfaction</p>
              </div>
            </div>
          </div>
          
          <div className="carousel-item">
            <div className="bg-info bg-gradient d-flex align-items-center justify-content-center" style={{ height: '260px' }}>
              <div className="text-center text-white">
                <h1 className="display-4 fw-bold mb-3">Track Deliveries in Real-Time</h1>
                <p className="lead mb-0">Monitor delivery status and optimize distribution routes for maximum efficiency</p>
              </div>
            </div>
          </div>
        </div>
        
        <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>

      {/* About Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-4 text-center mb-4 mb-lg-0 d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                             <img 
                 src="/Milksync_logo.png" 
                 alt="MilkSync Logo" 
                 style={{ width: '180px', height: '180px', borderRadius: '12px', objectFit: 'contain' }}
               />
            </div>
            <div className="col-lg-8">
              <h2 className="display-5 fw-bold text-primary mb-4">About MilkSync</h2>
              <p className="lead text-muted mb-0">
                MilkSync is a comprehensive Dairy Distribution Management System designed to streamline operations, 
                enhance efficiency, and provide real-time insights into your dairy business. Our modern platform 
                combines cutting-edge technology with user-friendly interfaces to deliver exceptional results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold text-primary mb-3">Powerful Features</h2>
              <p className="lead text-muted">Everything you need to manage your dairy distribution business</p>
            </div>
          </div>
          
          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-top border-4 border-primary h-100">
                <div className="bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                    <i className="bi bi-cart-check text-primary fs-2"></i>
                  </div>
                <div>
                  <h5 className="fw-bold mb-2">Order Management</h5>
                  <p className="text-muted mb-0">Streamlined order processing with real-time updates and automated workflows</p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-top border-4 border-success h-100">
                <div className="bg-success bg-opacity-10 rounded-3 p-3 me-3">
                    <i className="bi bi-people text-success fs-2"></i>
                  </div>
                <div>
                  <h5 className="fw-bold mb-2">Staff Panel</h5>
                  <p className="text-muted mb-0">Comprehensive staff management with role-based access and performance tracking</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-top border-4 border-info h-100">
                <div className="bg-info bg-opacity-10 rounded-3 p-3 me-3">
                    <i className="bi bi-wallet2 text-info fs-2"></i>
                  </div>
                <div>
                  <h5 className="fw-bold mb-2">Distributor Wallet</h5>
                  <p className="text-muted mb-0">Secure financial management with automated billing and payment tracking</p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-top border-4 border-warning h-100">
                <div className="bg-warning bg-opacity-10 rounded-3 p-3 me-3">
                    <i className="bi bi-receipt text-warning fs-2"></i>
                  </div>
                <div>
                  <h5 className="fw-bold mb-2">Bill Tracking</h5>
                  <p className="text-muted mb-0">Comprehensive billing system with detailed reports and financial analytics</p>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-top border-4 border-danger h-100">
                <div className="bg-danger bg-opacity-10 rounded-3 p-3 me-3">
                    <i className="bi bi-exclamation-triangle text-danger fs-2"></i>
                  </div>
                <div>
                  <h5 className="fw-bold mb-2">Damage Products Handling</h5>
                  <p className="text-muted mb-0">Efficient management of damaged products with automated cost calculations</p>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-top border-4 border-secondary h-100">
                <div className="bg-secondary bg-opacity-10 rounded-3 p-3 me-3">
                    <i className="bi bi-phone text-secondary fs-2"></i>
                  </div>
                <div>
                  <h5 className="fw-bold mb-2">PWA Offline Access</h5>
                  <p className="text-muted mb-0">Progressive Web App with offline capabilities and mobile-first design</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Application Features Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold text-primary mb-3">Advanced Capabilities</h2>
              <p className="lead text-muted">Discover the comprehensive tools that make MilkSync the ultimate dairy management solution</p>
            </div>
          </div>

          <div className="row g-4">
            {/* Advanced Feature 1 */}
            <div className="col-lg-6">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-start border-4 border-warning">
                <div className="bg-warning bg-opacity-10 rounded-3 p-3 me-3">
                  <i className="bi bi-graph-up text-warning fs-1"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-2">Real-Time Analytics</h5>
                  <p className="text-muted mb-0">Advanced reporting and analytics dashboard with customizable charts, performance metrics, and business intelligence insights to drive data-driven decisions.</p>
                </div>
              </div>
            </div>

            {/* Advanced Feature 2 */}
            <div className="col-lg-6">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-start border-4 border-danger">
                <div className="bg-danger bg-opacity-10 rounded-3 p-3 me-3">
                  <i className="bi bi-shield-check text-danger fs-1"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-2">Multi-Level Security</h5>
                  <p className="text-muted mb-0">Role-based access control, encrypted data transmission, secure authentication, and comprehensive audit trails ensuring your business data remains protected.</p>
                </div>
              </div>
            </div>

            {/* Advanced Feature 3 */}
            <div className="col-lg-6">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-start border-4 border-info">
                <div className="bg-info bg-opacity-10 rounded-3 p-3 me-3">
                  <i className="bi bi-phone-vibrate text-info fs-1"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-2">Mobile-First Design</h5>
                  <p className="text-muted mb-0">Responsive design optimized for all devices with touch-friendly interfaces, ensuring seamless operation on smartphones, tablets, and desktops.</p>
                </div>
              </div>
            </div>

            {/* Advanced Feature 4 */}
            <div className="col-lg-6">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-start border-4 border-success">
                <div className="bg-info bg-opacity-10 rounded-3 p-3 me-3">
                  <i className="bi bi-cloud-arrow-up text-success fs-1"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-2">Cloud Integration</h5>
                  <p className="text-muted mb-0">Seamless cloud storage integration, automatic backups, and multi-device synchronization ensuring your data is always accessible and secure.</p>
                </div>
              </div>
            </div>

            {/* Advanced Feature 5 */}
            <div className="col-lg-6">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-start border-4 border-primary">
                <div className="bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                  <i className="bi bi-headset text-primary fs-1"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-2">24/7 Support</h5>
                  <p className="text-muted mb-0">Round-the-clock customer support with dedicated assistance, comprehensive documentation, and training resources for your team.</p>
                </div>
              </div>
            </div>

            {/* Advanced Feature 6 */}
            <div className="col-lg-6">
              <div className="d-flex align-items-start p-4 bg-white rounded-3 shadow-sm border-start border-4 border-secondary">
                <div className="bg-secondary bg-opacity-10 rounded-3 p-3 me-3">
                  <i className="bi bi-arrow-repeat text-secondary fs-1"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-2">Automated Workflows</h5>
                  <p className="text-muted mb-0">Intelligent automation of repetitive tasks, scheduled operations, and smart notifications to streamline your daily business processes.</p>
                </div>
              </div>
            </div>
                     </div>
         </div>
       </section>

       {/* Cartoon Cows Section */}
       <section className="py-5 bg-light">
         <div className="container">
           <div className="row justify-content-center mb-4">
             <div className="col-lg-8 text-center">
               <h2 className="display-6 fw-bold text-primary mb-3">🐮 Dairy Friends</h2>
               <p className="lead text-muted">Meet our friendly dairy companions</p>
             </div>
           </div>
           
           <div className="row g-4 justify-content-center">
             <div className="col-md-6 col-lg-3 text-center">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-primary h-100">
                 <img 
                   src="/cow1.jpg" 
                   alt="Friendly Cow 1" 
                   className="img-fluid mb-3"
                   style={{ maxHeight: '150px', objectFit: 'contain' }}
                 />
                 <h6 className="fw-bold text-primary mb-2">Happy Cow</h6>
                 <p className="small text-muted mb-0">Always ready to help with dairy operations</p>
               </div>
             </div>

             <div className="col-md-6 col-lg-3 text-center">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-success h-100">
                 <img 
                   src="/cow2.jpg" 
                   alt="Friendly Cow 2" 
                   className="img-fluid mb-3"
                   style={{ maxHeight: '150px', objectFit: 'contain' }}
                 />
                 <h6 className="fw-bold text-success mb-2">Smart Cow</h6>
                 <p className="small text-muted mb-0">Intelligent dairy management solutions</p>
               </div>
             </div>

             <div className="col-md-6 col-lg-3 text-center">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-info h-100">
                 <img 
                   src="/cow3.jpg" 
                   alt="Friendly Cow 3" 
                   className="img-fluid mb-3"
                   style={{ maxHeight: '150px', objectFit: 'contain' }}
                 />
                 <h6 className="fw-bold text-info mb-2">Efficient Cow</h6>
                 <p className="small text-muted mb-0">Streamlined processes for better results</p>
               </div>
             </div>

             <div className="col-md-6 col-lg-3 text-center">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-warning h-100">
                 <img 
                   src="/cow4.jpg" 
                   alt="Friendly Cow 4" 
                   className="img-fluid mb-3"
                   style={{ maxHeight: '150px', objectFit: 'contain' }}
                 />
                 <h6 className="fw-bold text-warning mb-2">Quality Cow</h6>
                 <p className="small text-muted mb-0">Ensuring the best dairy products</p>
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* Order Flow Chart Section */}
       <section className="py-5">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold text-primary mb-3">How MilkSync Works</h2>
              <p className="lead text-muted">Complete order flow from placement to payment</p>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="bg-white rounded-4 shadow-lg p-5">
                <div className="row g-4">
                  {/* Step 1 */}
                  <div className="col-md-6 col-lg-3 text-center">
                    <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-primary h-100">
                      <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-cart-plus text-primary fs-2"></i>
                      </div>
                      <h6 className="fw-bold text-primary mb-2">1. Staff Places Order</h6>
                      <p className="small text-muted mb-0">Staff members create and submit orders through the staff panel with product details, quantities, and delivery requirements.</p>
                    </div>
                  </div>

                  {/* Arrow 1 */}
                  <div className="col-md-6 col-lg-1 d-flex align-items-center justify-content-center">
                    <i className="bi bi-arrow-right text-primary fs-2 d-none d-lg-block"></i>
                    <i className="bi bi-arrow-down text-primary fs-2 d-lg-none"></i>
                  </div>

                  {/* Step 2 */}
                  <div className="col-md-6 col-lg-3 text-center">
                    <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-success h-100">
                      <div className="bg-success bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-truck text-success fs-2"></i>
                      </div>
                      <h6 className="fw-bold text-success mb-2">2. Distributor Accepts Order</h6>
                      <p className="small text-muted mb-0">Distributors receive order notifications, review details, and accept orders through their dashboard.</p>
                    </div>
                  </div>

                  {/* Arrow 2 */}
                  <div className="col-md-6 col-lg-1 d-flex align-items-center justify-content-center">
                    <i className="bi bi-arrow-right text-primary fs-2 d-none d-lg-block"></i>
                    <i className="bi bi-arrow-down text-primary fs-2 d-lg-none"></i>
                  </div>

                  {/* Step 3 */}
                  <div className="col-md-6 col-lg-3 text-center">
                    <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-info h-100">
                      <div className="bg-info bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-box-seam text-info fs-2"></i>
                      </div>
                      <h6 className="fw-bold text-info mb-2">3. Order Processing</h6>
                      <p className="small text-muted mb-0">Distributors process orders, prepare products, and arrange for delivery to the specified locations.</p>
                    </div>
                  </div>
                </div>

                {/* Second Row */}
                <div className="row g-4 mt-4">
                  {/* Step 4 */}
                  <div className="col-md-6 col-lg-3 text-center">
                    <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-warning h-100">
                      <div className="bg-warning bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-truck-flatbed text-warning fs-2"></i>
                      </div>
                      <h6 className="fw-bold text-warning mb-2">4. Delivery & Acceptance</h6>
                      <p className="small text-muted mb-0">Staff receives the delivery, inspects products, and marks the order as delivered in the system.</p>
                    </div>
                  </div>

                  {/* Arrow 4 */}
                  <div className="col-md-6 col-lg-1 d-flex align-items-center justify-content-center">
                    <i className="bi bi-arrow-right text-primary fs-2 d-none d-lg-block"></i>
                    <i className="bi bi-arrow-down text-primary fs-2 d-lg-none"></i>
                  </div>

                  {/* Step 5 */}
                  <div className="col-md-6 col-lg-3 text-center">
                    <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-danger h-100">
                      <div className="bg-danger bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-receipt text-danger fs-2"></i>
                      </div>
                      <h6 className="fw-bold text-danger mb-2">5. Bill Generation</h6>
                      <p className="small text-muted mb-0">System automatically generates bills based on delivered products, pricing, and any additional charges.</p>
                    </div>
                  </div>

                  {/* Arrow 5 */}
                  <div className="col-md-6 col-lg-1 d-flex align-items-center justify-content-center">
                    <i className="bi bi-arrow-right text-primary fs-2 d-none d-lg-block"></i>
                    <i className="bi bi-arrow-down text-primary fs-2 d-lg-none"></i>
                  </div>

                                     {/* Step 6 */}
                   <div className="col-md-6 col-lg-3 text-center">
                     <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-secondary h-100">
                       <div className="bg-secondary bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                         <i className="bi bi-credit-card text-secondary fs-2"></i>
                       </div>
                       <h6 className="fw-bold text-secondary mb-2">6. Admin Payment</h6>
                       <p className="text-muted mb-0">Admin reviews bills, processes payments to distributors, and maintains financial records.</p>
                     </div>
                   </div>
                </div>

                {/* Flow Details */}
                <div className="mt-5 pt-4 border-top">
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        Key Benefits of This Flow
                      </h6>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Transparency:</strong> Complete visibility of order status at every stage
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Accountability:</strong> Clear responsibility assignment for each step
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Efficiency:</strong> Automated processes reduce manual errors
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Financial Control:</strong> Systematic billing and payment tracking
                        </li>
                      </ul>
                    </div>
                    <div className="col-lg-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-gear me-2"></i>
                        System Features
                      </h6>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Real-time Tracking:</strong> Monitor order progress live
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Automated Notifications:</strong> Keep all parties informed
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Digital Documentation:</strong> Paperless record keeping
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <strong>Financial Reports:</strong> Comprehensive business insights
                        </li>
                      </ul>
                    </div>
                  </div>
                                 </div>
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* Image Cards Section */}
       <section className="py-5 bg-light">
         <div className="container">
           <div className="row justify-content-center mb-5">
             <div className="col-lg-8 text-center">
               <h2 className="display-5 fw-bold text-primary mb-3">Visual Insights</h2>
               <p className="lead text-muted">Discover more about our dairy management solutions</p>
             </div>
           </div>
           
           <div className="row g-4 justify-content-center">
             <div className="col-md-6 col-lg-3">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-primary h-100 text-center">
                 <img 
                   src="/card1.jpg" 
                   alt="Card 1" 
                   className="img-fluid rounded-3 mb-3"
                   style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                 />
                 <h6 className="fw-bold text-primary mb-2">Dairy Management</h6>
                 <p className="small text-muted mb-0">Comprehensive dairy business solutions for modern enterprises</p>
               </div>
             </div>

             <div className="col-md-6 col-lg-3">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-success h-100 text-center">
                 <img 
                   src="/card2.jpg" 
                   alt="Card 2" 
                   className="img-fluid rounded-3 mb-3"
                   style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                 />
                 <h6 className="fw-bold text-success mb-2">Order Processing</h6>
                 <p className="small text-muted mb-0">Streamlined order management and processing systems</p>
               </div>
             </div>

             <div className="col-md-6 col-lg-3">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-info h-100 text-center">
                 <img 
                   src="/card3.jpg" 
                   alt="Card 3" 
                   className="img-fluid rounded-3 mb-3"
                   style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                 />
                 <h6 className="fw-bold text-info mb-2">Order Bills</h6>
                 <p className="small text-muted mb-0">Comprehensive billing system for orders with detailed cost breakdown</p>
               </div>
             </div>

             <div className="col-md-6 col-lg-3">
               <div className="p-3 bg-white rounded-3 shadow-sm border-top border-4 border-warning h-100 text-center">
                 <img 
                   src="/card4.jpg" 
                   alt="Card 4" 
                   className="img-fluid rounded-3 mb-3"
                   style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                 />
                 <h6 className="fw-bold text-warning mb-2">Bill Amounts</h6>
                 <p className="small text-muted mb-0">Financial tracking and payment management for all transactions</p>
               </div>
             </div>
           </div>
         </div>
       </section>



       {/* Founders Section */}
       <section className="py-5">
         <div className="container">
           <div className="row justify-content-center mb-5">
             <div className="col-lg-8 text-center">
               <h2 className="display-5 fw-bold text-primary mb-3">Meet Our Founders</h2>
               <p className="lead text-muted">The visionary minds behind MilkSync's success</p>
             </div>
           </div>
           
           <div className="row g-4 justify-content-center">
             {/* Founder 1 */}
            <div className="col-md-6 col-lg-6">
              <div className="p-4 bg-white rounded-3 shadow-sm border-top border-4 border-primary h-100 text-center">
                   <div className="mb-4">
                     <img 
                       src="/founder1.jpg" 
                       alt="Founder 1" 
                       className="rounded-circle mx-auto d-block mb-3"
                       width="120" 
                       height="120"
                       style={{ objectFit: 'cover' }}
                     />
                     </div>
                <div>
                  <h5 className="fw-bold mb-2">Prasad Chandragiri</h5>
                  <p className="text-primary fw-semibold mb-3">Founder of MilkSync</p>
                  <p className="text-muted mb-3">
                    With over 5 years of expertise in dairy business management, Prasad specializes in leveraging technology to create innovative solutions that streamline operations and address industry challenges.
                   </p>
                   <div className="mt-3">
                     <a href="#" className="btn btn-outline-primary btn-sm me-2">
                       <i className="bi bi-linkedin me-1"></i>LinkedIn
                     </a>
                     <a href="#" className="btn btn-outline-info btn-sm">
                       <i className="bi bi-twitter me-1"></i>Twitter
                     </a>
                   </div>
                 </div>
               </div>
             </div>

             {/* Founder 2 */}
            <div className="col-md-6 col-lg-6">
              <div className="p-4 bg-white rounded-3 shadow-sm border-top border-4 border-success h-100 text-center">
                   <div className="mb-4">
                     <img 
                       src="/founder2.jpg" 
                       alt="Founder 2" 
                       className="rounded-circle mx-auto d-block mb-3"
                       width="120" 
                       height="120"
                       style={{ objectFit: 'cover' }}
                     />
                     </div>
                <div>
                  <h5 className="fw-bold mb-2">Srinivas Chandragiri</h5>
                  <p className="text-success fw-semibold mb-3">Founder of SVD Dairy Products</p>
                  <p className="text-muted mb-3">
                    Bringing more than 25 years of experience in managing and growing dairy enterprises, Srinivas has a proven track record of driving sustainable business practices and ensuring operational excellence.
                   </p>
                   <div className="mt-3">
                     <a href="#" className="btn btn-outline-success btn-sm me-2">
                       <i className="bi bi-linkedin me-1"></i>LinkedIn
                     </a>
                     <a href="#" className="btn btn-outline-info btn-sm">
                       <i className="bi bi-github me-1"></i>GitHub
                     </a>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* Quick Access Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Quick Access for Returning Users */}
              {userPreference && (
                <div className="p-4 bg-white rounded-3 shadow-sm border-top border-4 border-primary mb-5 text-center">
                  <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-clock-history text-primary fs-2"></i>
                  </div>
                    <h5 className="text-primary mb-3">
                      Welcome Back!
                    </h5>
                    <p className="text-muted mb-3">
                      Quick access to your {userPreference === 'admin' ? 'Admin' : 
                      userPreference === 'staff' ? 'Staff' : 'Distributor'} panel
                    </p>
                    <button 
                      className="btn btn-primary btn-lg px-4"
                      onClick={handleQuickAccess}
                    >
                      Continue as {userPreference === 'admin' ? 'Admin' : 
                      userPreference === 'staff' ? 'Staff' : 'Distributor'}
                    </button>
                    <div className="mt-3">
                      <button 
                        className="btn btn-link text-muted"
                        onClick={() => setUserPreference(null)}
                      >
                        Choose different role
                      </button>
                  </div>
                </div>
              )}

              {/* Role Selection Cards */}
              <div className="row g-4">
                {/* Admin Panel */}
                <div className="col-md-4">
                  <div className="p-4 bg-white rounded-3 shadow-sm border-top border-4 border-primary h-100 text-center">
                    <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-shield-check text-primary fs-2"></i>
                      </div>
                    <h5 className="fw-bold mb-3">Admin Panel</h5>
                    <p className="text-muted small mb-3">System administration and management</p>
                      <button 
                        className="btn btn-primary w-100"
                        onClick={() => handleRoleSelection('admin')}
                      >
                        Admin Login
                      </button>
                  </div>
                </div>

                {/* Staff Panel */}
                <div className="col-md-4">
                  <div className="p-4 bg-white rounded-3 shadow-sm border-top border-4 border-success h-100 text-center">
                    <div className="bg-success bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-people text-success fs-2"></i>
                      </div>
                    <h5 className="fw-bold mb-3">Staff Panel</h5>
                    <p className="text-muted small mb-3">Staff operations and order management</p>
                      <button 
                        className="btn btn-success w-100"
                        onClick={() => handleRoleSelection('staff')}
                      >
                        Staff Login
                      </button>
                  </div>
                </div>

                {/* Distributor Panel */}
                <div className="col-md-4">
                  <div className="p-4 bg-white rounded-3 shadow-sm border-top border-4 border-info h-100 text-center">
                    <div className="bg-info bg-opacity-10 rounded-3 p-3 mb-3 mx-auto" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-truck text-info fs-2"></i>
                      </div>
                    <h5 className="fw-bold mb-3">Distributor Panel</h5>
                    <p className="text-muted small mb-3">Distribution and order tracking</p>
                      <button 
                        className="btn btn-info w-100"
                        onClick={() => handleRoleSelection('distributor')}
                      >
                        Distributor Login
                      </button>
                  </div>
                </div>
              </div>

              {/* PWA Benefits */}
              <div className="text-center mt-5">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="text-primary">
                      <i className="bi bi-phone fs-4 d-block mb-2"></i>
                      <small className="fw-semibold">Install on Home Screen</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-success">
                      <i className="bi bi-wifi-off fs-4 d-block mb-2"></i>
                      <small className="fw-semibold">Works Offline</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-info">
                      <i className="bi bi-lightning fs-4 d-block mb-2"></i>
                      <small className="fw-semibold">Fast Loading</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-5">
        <div className="container">
          <div className="row g-4">
                                                   <div className="col-lg-4">
                <h5 className="fw-bold mb-3">
                  <img 
                  src="/apple-touch-icon.png"
                    alt="MilkSync Logo" 
                    className="me-2" 
                    width="50" 
                    height="50"
                  style={{ objectFit: 'contain', borderRadius: '8px' }}
                  />
                  MilkSync
                </h5>
              <p className="text-muted mb-0">
                Empowering dairy businesses with modern technology solutions for seamless operations and growth.
              </p>
            </div>
            
            <div className="col-lg-4">
              <h6 className="fw-bold mb-3">Contact Information</h6>
              <div className="mb-2">
                <i className="bi bi-geo-alt text-primary me-2"></i>
                <span className="text-light">Ramalayam street, Bondada, Andhra Pradesh, 534206</span>
              </div>
              <div className="mb-2">
                <i className="bi bi-telephone text-primary me-2"></i>
                <span className="text-light">+91 7207215599</span>
              </div>
              <div className="mb-2">
                <i className="bi bi-envelope text-primary me-2"></i>
                <span className="text-light">svd.dairyproducts@gmail.com</span>
              </div>
            </div>
            
            <div className="col-lg-4">
              <h6 className="fw-bold mb-3">Follow Us</h6>
              <div className="d-flex gap-3">
                <button className="btn btn-link text-white text-decoration-none p-0">
                  <i className="bi bi-facebook fs-4"></i>
                </button>
                <button className="btn btn-link text-white text-decoration-none p-0">
                  <i className="bi bi-twitter fs-4"></i>
                </button>
                <button className="btn btn-link text-white text-decoration-none p-0">
                  <i className="bi bi-linkedin fs-4"></i>
                </button>
                <button className="btn btn-link text-white text-decoration-none p-0">
                  <i className="bi bi-instagram fs-4"></i>
                </button>
              </div>
            </div>
          </div>
          
          <hr className="my-4" />
          
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="text-light mb-0">
                © 2025 MilkSync. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
