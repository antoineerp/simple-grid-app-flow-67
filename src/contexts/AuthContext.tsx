
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { Utilisateur } from '@/types/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  user: Utilisateur | null;
  userId: string | null;
  setIsLoggedIn: (value: boolean) => void;
  setUser: (user: Utilisateur | null) => void;
}

const defaultAuthContext: AuthContextType = {
  isLoggedIn: false,
  user: null,
  userId: null,
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
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const checkAuthStatus = () => {
      const loggedIn = getIsLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const currentUserId = getCurrentUser();
        setUserId(currentUserId);
        
        // Construire un objet utilisateur minimal avec l'ID
        if (currentUserId) {
          setUser({ 
            id: currentUserId,
            username: currentUserId
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
        setUserId(null);
      }
    };
    
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, userId, setIsLoggedIn, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
