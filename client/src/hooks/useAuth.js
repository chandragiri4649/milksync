import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Check for both admin and staff tokens
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("adminToken"));
  const [staffToken, setStaffToken] = useState(() => localStorage.getItem("staffToken"));
  
  // Determine which token to use and user type
  const [token, setToken] = useState(() => {
    const admin = localStorage.getItem("adminToken");
    const staff = localStorage.getItem("staffToken");
    console.log("🔐 useAuth - Initial token check:", { admin: !!admin, staff: !!staff });
    return admin || staff;
  });
  
  const [userType, setUserType] = useState(() => {
    const admin = localStorage.getItem("adminToken");
    const staff = localStorage.getItem("staffToken");
    if (admin) return "admin";
    if (staff) return "staff";
    return null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("🔐 useAuth - useEffect triggered:", { token: !!token, userType });
    
    if (!token) {
      setIsAuthenticated(false);
      setUserType(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const { exp, role, _id, id, username, name, email } = decoded;
      const now = Date.now() / 1000; // in seconds
      console.log("🔐 useAuth - Token decoded:", { exp, role, _id, id, username, name, email, now, isValid: exp > now });
      
      if (exp < now) {
        console.log("❌ useAuth - Token expired, clearing...");
        // Clear expired tokens
        if (userType === "admin") {
          localStorage.removeItem("adminToken");
          setAdminToken(null);
        } else if (userType === "staff") {
          localStorage.removeItem("staffToken");
          setStaffToken(null);
        }
        setToken(null);
        setUserType(null);
        setIsAuthenticated(false);
        setUser(null);
      } else {
        setIsAuthenticated(true);
        // Ensure userType is set correctly
        if (!userType) {
          setUserType(role || "staff");
        }
        
        // Set user information from token
        setUser({
          _id: _id || id,
          username: username || name || email || 'User',
          name: name || username || email || 'User',
          email: email || username || name || 'user@example.com',
          role: role || userType
        });
        
        console.log("✅ useAuth - Token valid, authenticated:", { userType: role || "staff", user: { _id: _id || id, username: username || name || email || 'User' } });
      }
    } catch (error) {
      console.log("❌ useAuth - Token decode error:", error.message);
      // Clear invalid tokens
      if (userType === "admin") {
        localStorage.removeItem("adminToken");
        setAdminToken(null);
      } else if (userType === "staff") {
        localStorage.removeItem("staffToken");
        setStaffToken(null);
      }
      setToken(null);
      setUserType(null);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [token, userType]);

  const login = (newToken, type = "admin") => {
    console.log("🔐 useAuth - Login called:", { type, tokenLength: newToken?.length });
    
    if (type === "admin") {
      // Clear staff token when admin logs in
      localStorage.removeItem("staffToken");
      setStaffToken(null);
      
      localStorage.setItem("adminToken", newToken);
      setAdminToken(newToken);
      console.log("🔐 useAuth - Admin token stored, staff token cleared");
    } else {
      // Clear admin token when staff logs in
      localStorage.removeItem("adminToken");
      setAdminToken(null);
      
      localStorage.setItem("staffToken", newToken);
      setStaffToken(newToken);
      console.log("🔐 useAuth - Staff token stored, admin token cleared");
    }
    setToken(newToken);
    setUserType(type);
    setIsAuthenticated(true);
    
    // Verify token was stored
    const storedToken = localStorage.getItem(type === "admin" ? "adminToken" : "staffToken");
    console.log("🔐 useAuth - Token storage verification:", { 
      type, 
      stored: !!storedToken, 
      storedLength: storedToken?.length,
      isAuthenticated: true 
    });
  };

  const logout = () => {
    console.log("🔐 useAuth - Logout called");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("staffToken");
    setAdminToken(null);
    setStaffToken(null);
    setToken(null);
    setUserType(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      isAuthenticated, 
      userType,
      user,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);