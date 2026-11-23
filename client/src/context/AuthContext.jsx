
import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("ecoloop-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (userData) => {
    setLoading(true);

    try {
      const data = await loginUser(userData);

      localStorage.setItem("ecoloop-token", data.token);
      localStorage.setItem("ecoloop-user", JSON.stringify(data.user));

      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);

    try {
      const data = await registerUser(userData);

      localStorage.setItem("ecoloop-token", data.token);
      localStorage.setItem("ecoloop-user", JSON.stringify(data.user));

      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("ecoloop-token");
    localStorage.removeItem("ecoloop-user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
