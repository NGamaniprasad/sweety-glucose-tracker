
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("sweety_token");
    setUser(null);
  }, []);

  const saveSession = (data) => {
    localStorage.setItem("sweety_token", data.token);
    setUser(data.user);
  };

  const register = async (formData) => {
    const response = await api.post(
      "/auth/register",
      formData
    );

    saveSession(response.data);
    return response.data;
  };

  const login = async (formData) => {
    const response = await api.post(
      "/auth/login",
      formData
    );

    saveSession(response.data);
    return response.data;
  };

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Restore authentication after browser refresh
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = localStorage.getItem("sweety_token");

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (active) {
          setUser(response.data.user);
        }
      } catch (error) {
        if (active) {
          // Only clear credentials if the server rejects them
          if (error.response?.status === 401) {
            clearSession();
          } else {
            setUser(null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
