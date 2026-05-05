import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const loginWithTokens = (userData, tokens) => {
    if (tokens && tokens.access) {
      localStorage.setItem("access_token",  tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const response = await api.post("/api/users/login/", { email, password });
    const data = response.data;
    if (data.mfa_required) {
      return {
        mfa_required: true,
        mfa_type:     data.mfa_type,
        user_id:      data.user_id,
        email:        data.email,
        message:      data.message,
      };
    }
    const { user, tokens } = data;
    loginWithTokens(user, tokens);
    return { mfa_required: false, user };
  };

  const register = async (userData) => {
    const response = await api.post("/api/users/register/", userData);
    const { user, tokens } = response.data;
    loginWithTokens(user, tokens);
    return user;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      await api.post("/api/users/logout/", { refresh: refreshToken });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const toggleMFA = async (userId = null) => {
    const body     = userId ? { user_id: userId } : {};
    const response = await api.post("/api/users/toggle-mfa/", body);
    if (!userId) {
      const updatedUser = {
        ...user,
        mfa_enabled: response.data.mfa_enabled,
        mfa_type:    response.data.mfa_type,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    return response.data;
  };

  const adminDisableMFA = async (userId) => {
    const response = await api.post(
      "/api/users/admin/users/" + userId + "/disable-mfa/"
    );
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithTokens,
        toggleMFA,
        adminDisableMFA,
        isAdmin:          user?.role === "ADMIN",
        isManager:        user?.role === "MANAGER",
        isTravelAgent:    user?.role === "TRAVEL_AGENT",
        isCustomer:       user?.role === "CUSTOMER",
        isLoggedIn:       !!user,
        canViewDashboard: user?.role === "ADMIN" || user?.role === "MANAGER",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};