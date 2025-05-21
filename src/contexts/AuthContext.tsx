
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { User } from '@/types/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  setIsLoggedIn: (value: boolean) => void;
  setUser: (user: User | null) => void;
}

const defaultAuthContext: AuthContextType = {
  isLoggedIn: false,
  user: null,
  setIsLoggedIn: () => {},
  setUser: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getIsLoggedIn());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const checkAuthStatus = () => {
      const loggedIn = getIsLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };
    
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, setIsLoggedIn, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
