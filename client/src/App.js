// client/src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import SmartLandingPage from "./components/SmartLandingPage";

// Login Components
import AdminLogin from "./components/AdminLogin";
import StaffLogin from "./components/StaffLogin";
import DistributorLogin from "./components/Distributorlogin";

// Password Reset Components
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

// Dashboard Components
import AdminDashboard from "./components/AdminDashboard";
import DistributorDashboard from "./components/DistributorDashboard";

// Route Guards / Protected Routes
import ProtectedRoute from "./components/ProtectedRoute";
import DistributorProtectedRoute from "./components/DistributorProtectedRoute";

// Admin Components
import PlaceOrdersManagement from "./components/management/PlaceOrders";
import OrdersHistory from "./components/lists/OrdersHistory";

// Staff Routes (modular import)
import StaffRoutes from "./components/staffpanel/StaffRoutes";
import StaffProtectedRoute from "./components/StaffProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <PWAInstallPrompt />
        <Routes>
          
          {/* 🏠 Smart Landing Page - Root Route */}
          <Route path="/" element={<SmartLandingPage />} />

          {/* 🔑 Redirect /login to home page where login options exist */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* 🔑 Specific Login Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/distributor/login" element={<DistributorLogin />} />

          {/* 🔑 Password Reset Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* 🔑 Dashboard Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/distributor/dashboard" element={
            <DistributorProtectedRoute>
              <DistributorDashboard />
            </DistributorProtectedRoute>
          } />

          {/* ✅ Staff routes grouped in StaffRoutes */}
          <Route path="/staff/*" element={
            <StaffProtectedRoute>
              <StaffRoutes />
            </StaffProtectedRoute>
          } />

          {/* ✅ Admin Orders */}
          <Route path="/admin/place-order/:id" element={
            <ProtectedRoute>
              <PlaceOrdersManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders-history" element={
            <ProtectedRoute>
              <OrdersHistory />
            </ProtectedRoute>
          } />

          {/* Debug route for testing */}
          <Route path="/debug" element={
            <div style={{ padding: '20px', fontFamily: 'monospace' }}>
              <h2>Debug Information</h2>
              <p>Current path: {window.location.pathname}</p>
              <p>Local Storage staffToken: {localStorage.getItem("staffToken") ? "EXISTS" : "NOT_FOUND"}</p>
              <p>Local Storage adminToken: {localStorage.getItem("adminToken") ? "EXISTS" : "NOT_FOUND"}</p>
              <button onClick={() => {
                localStorage.removeItem("staffToken");
                localStorage.removeItem("adminToken");
                window.location.reload();
              }}>Clear All Tokens</button>
            </div>
          } />
          
          {/* Fallback route for debugging */}
          <Route path="*" element={<div>Page not found. Current path: {window.location.pathname}</div>} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
