
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getIsLoggedIn, getCurrentUser, login, logout } from '@/services/auth/authService';

type User = string | null;

type AuthContextType = {
  isAuthenticated: boolean;
  user: User;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getIsLoggedIn());
  const [user, setUser] = useState<User>(getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Vérifier l'état d'authentification au démarrage
    const checkAuth = async () => {
      const isLoggedIn = getIsLoggedIn();
      setIsAuthenticated(isLoggedIn);
      setUser(getCurrentUser());
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await login(username, password);
      setIsAuthenticated(!!result);
      setUser(getCurrentUser());
      return !!result;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: handleLogin,
        logout: handleLogout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
