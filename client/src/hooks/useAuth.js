import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import apiService from "../utils/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Session-based authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Legacy token support for backward compatibility
  const [adminToken, setAdminToken] = useState(null);
  const [staffToken, setStaffToken] = useState(null);
  const [distributorToken, setDistributorToken] = useState(null);
  const [token, setToken] = useState(null);

  // Check session on app load
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        
        // Check for active session (server will return user info with role)
        const sessionData = await apiService.checkSession();
        if (isMounted && sessionData && sessionData.user) {
          setIsAuthenticated(true);
          setUserType(sessionData.user.role || sessionData.userType);
          setUser(sessionData.user);
          console.log("✅ Session found:", { 
            user: sessionData.user, 
            role: sessionData.user.role || sessionData.userType 
          });
          setIsLoading(false);
          return;
        }

        // If no session found, check for legacy tokens
        const admin = localStorage.getItem("adminToken");
        const staff = localStorage.getItem("staffToken");
        const distributor = localStorage.getItem("distributorToken");
        const legacyToken = admin || staff || distributor;
        
        if (isMounted && legacyToken) {
          console.log("🔐 Checking legacy token...");
          try {
            const decoded = jwtDecode(legacyToken);
            const { exp, role, _id, id, username, name, email } = decoded;
            const now = Date.now() / 1000;
            
            if (exp > now) {
              setIsAuthenticated(true);
              setUserType(role || "staff");
              setUser({
                _id: _id || id,
                username: username || name || email || 'User',
                name: name || username || email || 'User',
                email: email || username || name || 'user@example.com',
                role: role || "staff"
              });
              console.log("✅ Legacy token valid");
            } else {
              console.log("❌ Legacy token expired");
              clearTokens();
            }
          } catch (error) {
            console.log("❌ Legacy token decode error:", error.message);
            clearTokens();
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
        if (isMounted) {
          clearTokens();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const clearTokens = () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("staffToken");
      localStorage.removeItem("distributorToken");
      setAdminToken(null);
      setStaffToken(null);
      setDistributorToken(null);
      setToken(null);
      setUserType(null);
      setIsAuthenticated(false);
      setUser(null);
    };

    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []); // Only run once on component mount

  const login = async (credentials, type = "admin") => {
    try {
      console.log("🔐 useAuth - Login called:", { type });
      
      const response = await apiService.login(type, credentials);
      
      // Store token for backward compatibility
      if (response.token) {
        if (type === "admin") {
          localStorage.setItem("adminToken", response.token);
          setAdminToken(response.token);
        } else if (type === "staff") {
          localStorage.setItem("staffToken", response.token);
          setStaffToken(response.token);
        } else if (type === "distributor") {
          localStorage.setItem("distributorToken", response.token);
          setDistributorToken(response.token);
        }
        setToken(response.token);
      }
      
      // Set user information from response
      if (response.user) {
        setUser(response.user);
        setUserType(type);
        setIsAuthenticated(true);
      }
      
      console.log("✅ Login successful:", { type, user: response.user });
      return response;
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("🔐 useAuth - Logout called");
      
      // Call server logout endpoint
      await apiService.logout();
      
      // Clear local state
      localStorage.removeItem("adminToken");
      localStorage.removeItem("staffToken");
      localStorage.removeItem("distributorToken");
      setAdminToken(null);
      setStaffToken(null);
      setDistributorToken(null);
      setToken(null);
      setUserType(null);
      setIsAuthenticated(false);
      setUser(null);
      
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      // Still clear local state even if server logout fails
      localStorage.removeItem("adminToken");
      localStorage.removeItem("staffToken");
      localStorage.removeItem("distributorToken");
      setAdminToken(null);
      setStaffToken(null);
      setDistributorToken(null);
      setToken(null);
      setUserType(null);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      isAuthenticated, 
      userType,
      user,
      isLoading,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);