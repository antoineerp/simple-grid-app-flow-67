
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import { Utilisateur } from '@/types/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  user: Utilisateur | null;
  userId: string | null;
  userRole: string | null;
  setIsLoggedIn: (value: boolean) => void;
  setUser: (user: Utilisateur | null) => void;
}

const defaultAuthContext: AuthContextType = {
  isLoggedIn: false,
  user: null,
  userId: null,
  userRole: null,
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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const checkAuthStatus = () => {
      const loggedIn = getIsLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const currentUserId = getCurrentUser();
        setUserId(currentUserId);
        
        // Récupérer le rôle s'il existe
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole);
          console.log(`Rôle récupéré du localStorage: ${storedRole}`);
        }
        
        // Récupérer l'utilisateur complet s'il existe
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // S'assurer que le rôle est défini si présent dans l'objet utilisateur
            if (parsedUser.role && !storedRole) {
              setUserRole(parsedUser.role);
              localStorage.setItem('userRole', parsedUser.role);
              console.log(`Rôle défini depuis l'objet utilisateur: ${parsedUser.role}`);
            }
          } catch (error) {
            console.error("Erreur lors de l'analyse de l'utilisateur stocké:", error);
          }
        } else {
          // Construire un objet utilisateur minimal avec l'ID
          if (currentUserId) {
            const minimalUser: Utilisateur = { 
              id: currentUserId,
              nom: 'Utilisateur',
              prenom: 'Défaut',
              email: '',
              identifiant_technique: currentUserId,
              role: (storedRole || 'utilisateur') as any
            };
            setUser(minimalUser);
            console.log(`Utilisateur minimal créé avec ID: ${currentUserId}, Rôle: ${storedRole || 'non défini'}`);
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
        setUserId(null);
        setUserRole(null);
      }
    };
    
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, userId, userRole, setIsLoggedIn, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
