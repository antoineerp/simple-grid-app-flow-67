
import React, { createContext, useContext, useState, useEffect } from "react";
import { getIsLoggedIn, getCurrentUser } from "@/services/auth/authService";
import { User as AuthUser } from "@/types/auth"; // Import User from types/auth

export type User = {
  id: string; // Make it required here to match your internal type
  email: string;
  username?: string;
  role: string;
  identifiant_technique?: string;
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const isLoggedIn = getIsLoggedIn();
        const user = getCurrentUser();

        if (isLoggedIn && user) {
          // Convert AuthUser to User (ensure id is not undefined)
          const validUser: User = {
            id: user.id || '',
            email: user.email || '',
            username: user.username,
            role: user.role || 'user',
            identifiant_technique: user.identifiant_technique
          };
          setCurrentUser(validUser);
          setIsAuthenticated(true);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: AuthUser) => {
    // Convert AuthUser to User (ensure id is not undefined)
    const validUser: User = {
      id: userData.id || '',
      email: userData.email || '',
      username: userData.username,
      role: userData.role || 'user',
      identifiant_technique: userData.identifiant_technique
    };
    setCurrentUser(validUser);
    setIsAuthenticated(true);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    localStorage.setItem("isLoggedIn", "true");
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
  };

  const refreshUser = () => {
    try {
      const user = getCurrentUser();
      if (user) {
        // Convert AuthUser to User (ensure id is not undefined)
        const validUser: User = {
          id: user.id || '',
          email: user.email || '',
          username: user.username,
          role: user.role || 'user',
          identifiant_technique: user.identifiant_technique
        };
        setCurrentUser(validUser);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
