
import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { getAuthToken, getCurrentUser, verifyUserSession } from '@/services/auth/authService';
import { getApiUrl } from '@/config/apiConfig';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Vérifier la session avec le serveur au montage du composant
  useEffect(() => {
    const verifySession = async () => {
      try {
        setIsLoading(true);
        setIsVerifying(true);
        
        // Vérifier le token avec le serveur
        const tokenValid = await verifyUserSession();
        
        if (tokenValid) {
          // Si le token est valide, récupérer les données utilisateur depuis le serveur ou le localStorage
          const currentUser = getCurrentUser();
          setUser(currentUser);
          
          // Stocker le rôle dans localStorage pour accès facile (tout en conservant la vérification serveur)
          if (currentUser?.role) {
            // Pour la compatibilité, normaliser les rôles admin/administrateur
            if (currentUser.role === 'admin' || currentUser.role === 'administrateur') {
              localStorage.setItem('userRole', currentUser.role);
              localStorage.setItem('isAdministrator', 'true');
            } else {
              localStorage.setItem('userRole', currentUser.role);
              localStorage.removeItem('isAdministrator');
            }
          }

          // Stocker également l'identifiant utilisateur pour garantir l'isolation des données
          if (currentUser?.id) {
            localStorage.setItem('currentUserId', currentUser.id);
            console.log(`Utilisateur identifié: ${currentUser.id} (${currentUser?.prenom} ${currentUser?.nom})`);
          }
        } else {
          // Si le token n'est pas valide, déconnecter l'utilisateur
          console.error("Session expirée ou invalide");
          setUser(null);
          localStorage.removeItem('userRole');
          localStorage.removeItem('isAdministrator');
          localStorage.removeItem('currentUserId');
        }
      } catch (error) {
        console.error("Error verifying session:", error);
        setUser(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('isAdministrator');
        localStorage.removeItem('currentUserId');
      } finally {
        setIsLoading(false);
        setIsVerifying(false);
      }
    };

    verifySession();
  }, []);

  const isAuthenticated = (): boolean => {
    const token = getAuthToken();
    return !!token && !!user;
  };

  const getUserId = (): string | undefined => {
    return user?.id || localStorage.getItem('currentUserId') || undefined;
  };

  const getRole = (): string | undefined => {
    return user?.role || localStorage.getItem('userRole') || undefined;
  };

  const isAdmin = (): boolean => {
    const role = getRole();
    return role === 'admin' || role === 'administrateur' || localStorage.getItem('isAdministrator') === 'true';
  };

  const getUserName = (): string => {
    return user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';
  };

  const logout = () => {
    // Déconnecter l'utilisateur du serveur
    const API_URL = getApiUrl();
    if (API_URL) {
      fetch(`${API_URL}/logout.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }).catch(err => console.error("Erreur lors de la déconnexion:", err));
    }
    
    // Nettoyer le localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAdministrator');
    localStorage.removeItem('currentUserId');
    sessionStorage.removeItem('authToken');
    
    // Rediriger vers la page d'accueil
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isVerifying,
    isAuthenticated,
    getUserId,
    getRole,
    isAdmin,
    getUserName,
    logout
  };
};
